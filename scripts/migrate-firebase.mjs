// One-off copy of applications + resumes from Firebase into eAccountsApp (+ Netlify Blobs for files).
// Safe to re-run: records already copied (matched on Firestore id = legacy_id) are skipped.
//
// Needs: `gcloud auth application-default login` (Firebase project owner),
//        EACCOUNTS_DB / EACCOUNTS_APP_KEY / EACCOUNTS_HMAC_SECRET in .env.local,
//        and the Netlify CLI linked to the jba-career site (resumes go up with `netlify blobs:set`).
// Usage: node scripts/migrate-firebase.mjs [--dry-run]
import { mkdtempSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const PROJECT_ID = 'jba-website-8a244';
const BUCKET = 'jba-website-8a244.firebasestorage.app';
const BASE_URL = 'https://api.eaccountsapp.com';
const DRY_RUN = process.argv.includes('--dry-run');
const STATUSES = new Set(['new', 'rejected', 'called_for_interview', 'selected']);
const CORE_KEYS = new Set(['fullName', 'email', 'mobileNumber', 'position', 'submittedAt', 'adminStatus', 'resumePath', 'resumeUrl']);

// Load .env.local (KEY=value lines) without printing anything from it.
const envFile = new URL('../.env.local', import.meta.url);
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match && match[2] && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}
const DB = process.env.EACCOUNTS_DB;
if (!DB || !process.env.EACCOUNTS_APP_KEY) throw new Error('EACCOUNTS_DB and EACCOUNTS_APP_KEY must be set in .env.local');

async function gateway(method, path, body, idempotencyKey) {
  const text = body === undefined ? '' : JSON.stringify(body);
  const timestamp = new Date().toISOString(); // gateway expects ISO 8601
  const nonce = randomUUID();
  const headers = { 'X-App-Key': process.env.EACCOUNTS_APP_KEY, 'X-Timestamp': timestamp, 'X-Nonce': nonce, 'X-Date-Format': 'stored', 'X-On-Behalf-Of': 'firebase-migration' };
  const secret = process.env.EACCOUNTS_HMAC_SECRET;
  if (secret) headers['X-Signature'] = createHmac('sha256', secret).update([method, path, text, timestamp, nonce, 'firebase-migration'].join('\n')).digest('base64');
  if (text) headers['Content-Type'] = 'application/json';
  if (method !== 'GET') headers['Idempotency-Key'] = idempotencyKey ?? randomUUID();
  const res = await fetch(BASE_URL + path, { method, headers, body: text || undefined });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path.split('?')[0]} -> ${res.status} ${json.detail ?? json.title ?? ''} (request ${res.headers.get('x-request-id')})`);
  return json;
}

async function existingLegacyIds() {
  const ids = new Set();
  let cursor = null;
  do {
    const params = new URLSearchParams({ 'filter[legacy_id][notnull]': 'true', sort: 'id', fields: 'id,legacy_id', limit: '500' });
    if (cursor) params.set('cursor', cursor);
    const page = await gateway('GET', `/v1/${DB}/applications?${params}`);
    for (const row of page.data) ids.add(row.legacy_id);
    cursor = page.meta?.hasMore ? page.meta.nextCursor : null;
  } while (cursor);
  return ids;
}

function plain(value) {
  if (value && typeof value.toDate === 'function') return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plain(v)]));
  return value;
}

const stored = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

function typeFromName(name) {
  const ext = name.toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'doc') return 'application/msword';
  if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return 'application/octet-stream';
}

initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID, storageBucket: BUCKET });
const firestore = getFirestore();
const bucket = getStorage().bucket();

async function fetchResume(doc) {
  if (typeof doc.resumePath === 'string' && doc.resumePath.trim()) {
    const file = bucket.file(doc.resumePath);
    const [exists] = await file.exists();
    if (!exists) return null;
    const [bytes] = await file.download();
    return { bytes, name: doc.resumePath.split('/').pop() };
  }
  if (typeof doc.resumeUrl === 'string' && doc.resumeUrl.startsWith('https://')) {
    const res = await fetch(doc.resumeUrl);
    if (!res.ok) return null;
    const name = decodeURIComponent(new URL(doc.resumeUrl).pathname).split('/').pop() || 'resume';
    return { bytes: Buffer.from(await res.arrayBuffer()), name };
  }
  return null;
}

const snapshot = await firestore.collection('applications').get();
const existing = await existingLegacyIds();
console.log(`Firebase: ${snapshot.size} applications. Already copied: ${existing.size}.${DRY_RUN ? ' (dry run — nothing is written)' : ''}`);

const tmp = mkdtempSync(join(tmpdir(), 'jba-resumes-'));
let copied = 0;
let missingResume = 0;
const failures = [];

for (const docSnap of snapshot.docs) {
  if (existing.has(docSnap.id)) continue;
  const doc = docSnap.data();
  try {
    // Deterministic id, so a re-run after a partial failure reuses the same row and file names.
    const hex = createHash('sha256').update(`firestore:${docSnap.id}`).digest('hex');
    const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
    const data = plain(Object.fromEntries(Object.entries(doc).filter(([k]) => !CORE_KEYS.has(k))));
    const submittedAt = doc.submittedAt?.toDate?.() ?? docSnap.createTime.toDate();

    const resume = await fetchResume(doc);
    let resumeKey = null;
    let resumeName = null;
    if (resume) {
      resumeName = resume.name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(-120);
      resumeKey = `${id}/${resumeName}`;
      if (!DRY_RUN) {
        const filePath = join(tmp, `${id}.bin`);
        writeFileSync(filePath, resume.bytes);
        execFileSync('netlify', ['blobs:set', 'resumes', resumeKey, '--input', filePath], { stdio: 'pipe', shell: process.platform === 'win32' });
      }
    } else {
      missingResume++;
    }

    if (!DRY_RUN) {
      await gateway('POST', `/bl/${DB}/applications`, {
        id,
        submitted_at: stored(submittedAt),
        position: doc.position ?? 'unknown',
        full_name: doc.fullName ?? 'Unknown',
        email: String(doc.email ?? '').toLowerCase(),
        mobile_number: doc.mobileNumber ?? null,
        admin_status: STATUSES.has(doc.adminStatus) ? doc.adminStatus : 'new',
        data: JSON.stringify(data),
        resume_key: resumeKey,
        resume_name: resumeName,
        resume_type: resumeName ? typeFromName(resumeName) : null,
        resume_size: resume ? resume.bytes.length : null,
        legacy_id: docSnap.id,
      }, id);
    }
    copied++;
    console.log(`  ok  ${submittedAt.toISOString().slice(0, 10)}  ${doc.position ?? '?'}${resume ? '' : '  (no resume file found)'}`);
  } catch (error) {
    failures.push(docSnap.id);
    console.error(`  FAILED ${docSnap.id}: ${error.message}`);
  }
}

rmSync(tmp, { recursive: true, force: true });
console.log(`\nCopied ${copied}. Without resume: ${missingResume}. Failed: ${failures.length}${failures.length ? ` (${failures.join(', ')})` : ''}.`);
if (failures.length) process.exitCode = 1;
