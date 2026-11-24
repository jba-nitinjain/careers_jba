import type { Config, Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { RESUME_STORE } from '../lib/storage';
import { errorResponse, json } from '../lib/http';
import { isJsonRequest, requireAdmin } from '../lib/auth';
import { GatewayError, gatewayCall, gatewayDb, gatewayListAll, toStoredUtc } from '../lib/eaccounts';

const STATUSES = ['new', 'rejected', 'called_for_interview', 'selected'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LIST_FIELDS = 'id,submitted_at,position,full_name,email,mobile_number,admin_status,data,resume_key';

interface ApplicationRow {
  id: string;
  submitted_at: string;
  position: string;
  full_name: string;
  email: string;
  mobile_number: string | null;
  admin_status: string;
  data: string | Record<string, unknown> | null;
  resume_key: string | null;
}

function parseData(value: ApplicationRow['data']): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Stored values are UTC 'yyyy-mm-dd HH:MM:SS'; return an ISO instant. */
function storedUtcToIso(value: string): string {
  const iso = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function toRecord(row: ApplicationRow) {
  return {
    ...parseData(row.data),
    id: row.id,
    submittedAt: storedUtcToIso(row.submitted_at),
    position: row.position,
    fullName: row.full_name,
    email: row.email,
    mobileNumber: row.mobile_number,
    adminStatus: row.admin_status,
    hasResume: Boolean(row.resume_key),
  };
}

export default async (req: Request, context: Context): Promise<Response> => {
  try {
    const session = await requireAdmin(req);
    if (session instanceof Response) return session;
    const actor = session.email;
    const id = context.params.id;

    if (!id) {
      if (req.method !== 'GET') return errorResponse('Method not allowed', 405);
      const rows = await gatewayListAll<ApplicationRow>(
        'applications',
        new URLSearchParams({ sort: '-submitted_at,id', fields: LIST_FIELDS }),
        actor,
      );
      return json({ applications: rows.map(toRecord) });
    }

    if (!UUID_RE.test(id)) return errorResponse('Application not found.', 404);
    const rowPath = `/bl/${gatewayDb()}/applications/${id}`;

    if (req.method === 'PATCH') {
      if (!isJsonRequest(req)) return errorResponse('Unsupported request', 415);
      const body = (await req.json().catch(() => ({}))) as { adminStatus?: string };
      if (!body.adminStatus || !STATUSES.includes(body.adminStatus)) return errorResponse('Invalid status.', 400);
      await gatewayCall('PATCH', rowPath, {
        onBehalfOf: actor,
        body: { admin_status: body.adminStatus, status_updated_at: toStoredUtc(new Date()) },
      });
      return json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const existing = await gatewayCall<{ data: ApplicationRow }>('GET', `/v1/${gatewayDb()}/applications/${id}?fields=id,resume_key`, {
        onBehalfOf: actor,
      });
      await gatewayCall('DELETE', rowPath, { onBehalfOf: actor });
      let warning: string | null = null;
      if (existing.data.resume_key) {
        try {
          await getStore({ name: RESUME_STORE }).delete(existing.data.resume_key);
        } catch (blobError) {
          console.error('Resume delete failed', blobError);
          warning = 'Application deleted, but its resume file could not be removed.';
        }
      }
      return json({ ok: true, warning });
    }

    return errorResponse('Method not allowed', 405);
  } catch (error) {
    if (error instanceof GatewayError && error.status === 404) return errorResponse('Application not found.', 404);
    console.error('admin-applications failed', error);
    return errorResponse('Something went wrong. Please try again.', 500);
  }
};

export const config: Config = { path: ['/api/admin/applications', '/api/admin/applications/:id'] };
