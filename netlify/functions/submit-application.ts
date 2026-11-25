import type { Config, Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { createHash, randomUUID } from 'node:crypto';
import { RESUME_STORE } from '../lib/storage';
import { errorResponse, json } from '../lib/http';
import { gatewayCall, gatewayDb, toStoredUtc } from '../lib/eaccounts';
import { MAX_RESUME_BYTES, detectResumeType, mapApplication, safeFileName } from '../lib/application';
import { sendApplicationEmails } from '../lib/mail';

const MAX_PER_IP_PER_HOUR = 5;

async function recentSubmissions(ipHash: string): Promise<number> {
  const params = new URLSearchParams({
    'filter[client_ip_hash][eq]': ipHash,
    'filter[submitted_at][gte]': toStoredUtc(new Date(Date.now() - 3600_000)),
    sort: '-submitted_at',
    fields: 'id',
    limit: '1',
    count: 'true',
  });
  const result = await gatewayCall<{ meta?: { total?: number } }>('GET', `/v1/${gatewayDb()}/applications?${params}`);
  return result.meta?.total ?? 0;
}

export default async (req: Request, context: Context): Promise<Response> => {
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return errorResponse('The form could not be read. Please try again.', 400);
    }

    // Honeypot: real visitors never see or fill this field. Pretend success to bots.
    if (String(form.get('website') ?? '').trim()) return json({ ok: true }, 201);

    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(String(form.get('payload') ?? '{}'));
    } catch {
      return errorResponse('The form could not be read. Please try again.', 400);
    }

    const { value, errors } = mapApplication(raw);
    if (!value) return errorResponse(errors.join(' '), 422);

    const resume = form.get('resume');
    if (!(resume instanceof File) || resume.size === 0) return errorResponse('Please upload your resume.', 422);
    if (resume.size > MAX_RESUME_BYTES) return errorResponse('Resume must be smaller than 4 MB.', 422);
    const bytes = new Uint8Array(await resume.arrayBuffer());
    const contentType = detectResumeType(resume.name, bytes);
    if (!contentType) return errorResponse('Resume must be a PDF or Word (.doc/.docx) file.', 422);

    const ipHash = createHash('sha256').update(`${context.ip ?? 'unknown'}|${process.env.JWT_SECRET ?? ''}`).digest('hex');
    if ((await recentSubmissions(ipHash)) >= MAX_PER_IP_PER_HOUR) {
      return errorResponse('Too many applications from this connection. Please try again in an hour.', 429);
    }

    const id = randomUUID();
    const submittedAt = new Date();
    const resumeName = safeFileName(resume.name);
    const resumeKey = `${id}/${resumeName}`;
    const store = getStore({ name: RESUME_STORE, consistency: 'strong' });
    await store.set(resumeKey, bytes.buffer as ArrayBuffer, { metadata: { contentType, fileName: resumeName } });

    try {
      await gatewayCall('POST', `/bl/${gatewayDb()}/applications`, {
        idempotencyKey: id,
        body: {
          id,
          submitted_at: toStoredUtc(submittedAt),
          position: value.position,
          full_name: value.fullName,
          email: value.email,
          mobile_number: value.mobileNumber,
          admin_status: 'new',
          data: JSON.stringify(value.data),
          resume_key: resumeKey,
          resume_name: resumeName,
          resume_type: contentType,
          resume_size: resume.size,
          client_ip_hash: ipHash,
        },
      });
    } catch (saveError) {
      await store.delete(resumeKey).catch(() => undefined);
      throw saveError;
    }

    // Application is saved; emails are best-effort and never fail the submission.
    await sendApplicationEmails(value, id, submittedAt);

    return json({ ok: true }, 201);
  } catch (error) {
    console.error('submit-application failed', error);
    return errorResponse('We could not submit your application. Please try again.', 500);
  }
};

export const config: Config = { path: '/api/applications', method: 'POST' };
