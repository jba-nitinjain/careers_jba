import { SignJWT, jwtVerify } from 'jose';
import { errorResponse } from './http';

const COOKIE_NAME = 'jba_admin';
const SESSION_HOURS = 4;

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET is missing or too short');
  }
  return new TextEncoder().encode(secret);
}

/** A staff member whose password was checked by eAccountsApp. */
export interface AdminSession {
  userId: string;
  email: string;
}

export async function createSessionCookie(session: AdminSession): Promise<string> {
  const token = await new SignJWT({ email: session.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secretKey());
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get('cookie') ?? '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
}

export async function getSession(req: Request): Promise<AdminSession | null> {
  const token = readCookie(req, COOKIE_NAME);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    if (!payload.sub || typeof payload.email !== 'string') return null;
    return { userId: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

/** Returns the session, or a 401 Response the caller should return as-is. */
export async function requireAdmin(req: Request): Promise<AdminSession | Response> {
  const session = await getSession(req);
  return session ?? errorResponse('Please sign in again.', 401);
}

/**
 * Blocks cross-site form posts: state-changing admin calls must be JSON,
 * which a plain HTML form on another site cannot send.
 */
export function isJsonRequest(req: Request): boolean {
  return (req.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json');
}
