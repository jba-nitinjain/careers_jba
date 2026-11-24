export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new ApiError(body.error ?? 'Something went wrong. Please try again.', response.status);
  }
  return body as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  return parse<T>(await fetch(path, { credentials: 'same-origin' }));
}

export async function apiSend<T>(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<T> {
  return parse<T>(
    await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
}

export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  return parse<T>(await fetch(path, { method: 'POST', body: form, credentials: 'same-origin' }));
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
