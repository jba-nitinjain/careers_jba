import type { Config, Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { RESUME_STORE } from '../lib/storage';
import { errorResponse } from '../lib/http';
import { requireAdmin } from '../lib/auth';
import { GatewayError, gatewayCall, gatewayDb } from '../lib/eaccounts';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ResumeRow {
  resume_key: string | null;
  resume_name: string | null;
  resume_type: string | null;
}

/** Streams a resume to a signed-in admin. Files are never publicly reachable. */
export default async (req: Request, context: Context): Promise<Response> => {
  try {
    const session = await requireAdmin(req);
    if (session instanceof Response) return session;

    const id = context.params.id;
    if (!id || !UUID_RE.test(id)) return errorResponse('Resume not found.', 404);

    const { data: row } = await gatewayCall<{ data: ResumeRow }>(
      'GET',
      `/v1/${gatewayDb()}/applications/${id}?fields=resume_key,resume_name,resume_type`,
      { onBehalfOf: session.email },
    );
    if (!row?.resume_key) return errorResponse('Resume not found.', 404);

    const stream = await getStore({ name: RESUME_STORE }).get(row.resume_key, { type: 'stream' });
    if (!stream) return errorResponse('Resume file is missing.', 404);

    const fileName = (row.resume_name ?? 'resume').replace(/"/g, '');
    const isPdf = row.resume_type === 'application/pdf';
    return new Response(stream, {
      headers: {
        'content-type': row.resume_type ?? 'application/octet-stream',
        'content-disposition': `${isPdf ? 'inline' : 'attachment'}; filename="${fileName}"`,
        'cache-control': 'private, no-store',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch (error) {
    if (error instanceof GatewayError && error.status === 404) return errorResponse('Resume not found.', 404);
    console.error('admin-resume failed', error);
    return errorResponse('Something went wrong. Please try again.', 500);
  }
};

export const config: Config = { path: '/api/admin/applications/:id/resume', method: 'GET' };
