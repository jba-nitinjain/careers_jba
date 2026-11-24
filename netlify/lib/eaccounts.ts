/**
 * Minimal client for the eAccountsApp Data Gateway (https://api.eaccountsapp.com).
 * Every call is HMAC-signed with the portal's app secret, which never leaves the server.
 * Reads go to /v1, writes to /bl (the business layer), as the gateway requires.
 */
import { createHmac, randomUUID } from 'node:crypto';

const BASE_URL = (process.env.EACCOUNTS_BASE_URL ?? 'https://api.eaccountsapp.com').replace(/\/$/, '');

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export const gatewayDb = (): string => env('EACCOUNTS_DB');

export class GatewayError extends Error {
  readonly status: number;
  readonly requestId: string | null;

  constructor(message: string, status: number, requestId: string | null) {
    super(message);
    this.status = status;
    this.requestId = requestId;
  }
}

export interface GatewayCallOptions {
  body?: unknown;
  /** Staff member the server is acting for; recorded in the gateway's audit trail. */
  onBehalfOf?: string;
  idempotencyKey?: string;
}

export async function gatewayCall<T = unknown>(method: string, path: string, options: GatewayCallOptions = {}): Promise<T> {
  const body = options.body === undefined ? '' : JSON.stringify(options.body);
  // The gateway expects an ISO 8601 timestamp; the signed PATH includes the query string.
  const timestamp = new Date().toISOString();
  const nonce = randomUUID();
  const lines = [method, path, body, timestamp, nonce];
  if (options.onBehalfOf) lines.push(options.onBehalfOf);

  const headers: Record<string, string> = {
    'X-App-Key': env('EACCOUNTS_APP_KEY'),
    'X-Timestamp': timestamp,
    'X-Nonce': nonce,
    'X-Date-Format': 'stored',
  };
  const secret = process.env.EACCOUNTS_HMAC_SECRET;
  if (secret) headers['X-Signature'] = createHmac('sha256', secret).update(lines.join('\n')).digest('base64');
  if (options.onBehalfOf) headers['X-On-Behalf-Of'] = options.onBehalfOf;
  if (body) headers['Content-Type'] = 'application/json';
  if (method !== 'GET') headers['Idempotency-Key'] = options.idempotencyKey ?? randomUUID();

  const response = await fetch(`${BASE_URL}${path}`, { method, headers, body: body || undefined });
  const text = await response.text();
  const json = text ? (JSON.parse(text) as Record<string, unknown>) : {};

  if (!response.ok) {
    const detail = (json.detail ?? json.title ?? json.error ?? response.statusText) as string;
    throw new GatewayError(String(detail), response.status, response.headers.get('x-request-id'));
  }
  return json as T;
}

/** Reads every row of a list endpoint, following the cursor. `query` must include a sort. */
export async function gatewayListAll<T>(table: string, query: URLSearchParams, onBehalfOf?: string): Promise<T[]> {
  const rows: T[] = [];
  let cursor: string | null = null;
  do {
    const params = new URLSearchParams(query);
    params.set('limit', '500');
    if (cursor) params.set('cursor', cursor);
    const page: { data: T[]; meta?: { nextCursor?: string | null; hasMore?: boolean } } = await gatewayCall(
      'GET',
      `/v1/${gatewayDb()}/${table}?${params.toString()}`,
      { onBehalfOf },
    );
    rows.push(...page.data);
    cursor = page.meta?.hasMore ? page.meta.nextCursor ?? null : null;
  } while (cursor);
  return rows;
}

/** Formats a Date as the stored UTC 'yyyy-mm-dd HH:MM:SS' value the gateway expects. */
export function toStoredUtc(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}
