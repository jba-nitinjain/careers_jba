import type { Config, Context } from '@netlify/functions';
import { errorResponse, json } from '../lib/http';
import { clearSessionCookie, createSessionCookie, getSession, isJsonRequest } from '../lib/auth';
import { GatewayError, gatewayCall, gatewayDb } from '../lib/eaccounts';

// eAccountsApp roles allowed into the careers dashboard (comma-separated), e.g. "admin,hr".
const allowedRoles = (): string[] =>
  (process.env.CAREERS_ADMIN_ROLES ?? 'admin').split(',').map((r) => r.trim().toLowerCase()).filter(Boolean);

interface LoginResponse {
  data: { token: string; user: { id: string; role?: string } };
}

/** Checks the password with eAccountsApp, then issues this portal's own short session cookie. */
async function login(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  if (!email || !password) return errorResponse('Email and password are required.', 400);

  let result: LoginResponse;
  try {
    result = await gatewayCall<LoginResponse>('POST', '/v1/auth/login', { body: { db: gatewayDb(), username: email, password } });
  } catch (error) {
    if (error instanceof GatewayError) {
      if (error.status === 401 || error.status === 422) return errorResponse('Incorrect email or password.', 401);
      if (error.status === 403) return errorResponse('This account is not allowed to sign in.', 403);
      if (error.status === 429) return errorResponse('Too many attempts. Please wait a few minutes and try again.', 429);
    }
    throw error;
  }

  // The portal keeps its own session, so end the gateway session straight away.
  await fetch(`${process.env.EACCOUNTS_BASE_URL ?? 'https://api.eaccountsapp.com'}/v1/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${result.data.token}`, 'X-App-Key': process.env.EACCOUNTS_APP_KEY ?? '' },
  }).catch(() => undefined);

  const role = (result.data.user.role ?? '').toLowerCase();
  if (!allowedRoles().includes(role)) return errorResponse('This account does not have access to the careers dashboard.', 403);

  const cookie = await createSessionCookie({ userId: String(result.data.user.id), email });
  return json({ email }, 200, { 'set-cookie': cookie });
}

const GATEWAY_URL = (process.env.EACCOUNTS_BASE_URL ?? 'https://api.eaccountsapp.com').replace(/\/$/, '');
const MIN_PASSWORD_LENGTH = 8;

/**
 * Changes the signed-in staff member's own eAccountsApp password.
 * The current password is re-checked by logging in to the gateway, and the
 * gateway's own-password route checks it again before saving the new one.
 */
async function changePassword(req: Request): Promise<Response> {
  const session = await getSession(req);
  if (!session) return errorResponse('Your session has ended. Please sign in again.', 401);

  const body = (await req.json().catch(() => ({}))) as { currentPassword?: string; newPassword?: string };
  const currentPassword = String(body.currentPassword ?? '');
  const newPassword = String(body.newPassword ?? '');
  if (!currentPassword || !newPassword) return errorResponse('Enter your current password and a new password.', 400);
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return errorResponse(`The new password must be at least ${MIN_PASSWORD_LENGTH} characters.`, 422);
  }
  if (newPassword === currentPassword) return errorResponse('The new password must be different from the current one.', 422);

  let token: string;
  try {
    const result = await gatewayCall<LoginResponse>('POST', '/v1/auth/login', {
      body: { db: gatewayDb(), username: session.email, password: currentPassword },
    });
    token = result.data.token;
  } catch (error) {
    if (error instanceof GatewayError) {
      if (error.status === 401 || error.status === 422) return errorResponse('Your current password is incorrect.', 400);
      if (error.status === 429) return errorResponse('Too many attempts. Please wait a few minutes and try again.', 429);
    }
    throw error;
  }

  const headers = { Authorization: `Bearer ${token}`, 'X-App-Key': process.env.EACCOUNTS_APP_KEY ?? '' };
  try {
    const response = await fetch(`${GATEWAY_URL}/admin/me/password`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (response.status === 401) return errorResponse('Your current password is incorrect.', 400);
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error('change-password rejected by gateway', response.status, detail.slice(0, 300));
      if (response.status === 400 || response.status === 422) {
        return errorResponse('That password was not accepted. Please choose a different one.', 422);
      }
      throw new Error(`Gateway returned ${response.status}`);
    }
  } finally {
    await fetch(`${GATEWAY_URL}/v1/auth/logout`, { method: 'POST', headers }).catch(() => undefined);
  }

  return json({ ok: true });
}

export default async (req: Request, context: Context): Promise<Response> => {
  try {
    const action = context.params.action;

    if (action === 'me' && req.method === 'GET') {
      const session = await getSession(req);
      return session ? json({ email: session.email }) : errorResponse('Not signed in', 401);
    }

    if (req.method !== 'POST' || !isJsonRequest(req)) return errorResponse('Not found', 404);
    if (action === 'login') return await login(req);
    if (action === 'logout') return json({ ok: true }, 200, { 'set-cookie': clearSessionCookie() });
    if (action === 'change-password') return await changePassword(req);
    return errorResponse('Not found', 404);
  } catch (error) {
    console.error('auth failed', error);
    return errorResponse('Sign-in is unavailable right now. Please try again shortly.', 500);
  }
};

export const config: Config = { path: '/api/auth/:action' };
