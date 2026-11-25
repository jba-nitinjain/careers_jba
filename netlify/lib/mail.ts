/**
 * Application emails, sent through Gmail (Google Workspace) SMTP.
 * 1. Confirmation to the applicant.
 * 2. New-application alert to the firm (MAIL_ALERT_TO).
 * Sending never blocks or fails a submission; errors are only logged.
 */
import nodemailer from 'nodemailer';
import type { MappedApplication, Position } from './application';

const POSITION_LABELS: Record<Position, string> = {
  article: 'Article Clerk',
  paid_assistant: 'Paid Assistant',
  audit_manager: 'Audit Manager',
};

const SITE_URL = 'https://career.jainbafna.com';

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** dd/mm/yyyy at h:mm AM, in India time. */
export function formatIst(date: Date): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    }).formatToParts(date).map((p) => [p.type, p.value]),
  );
  return `${parts.day}/${parts.month}/${parts.year} at ${parts.hour}:${parts.minute} ${String(parts.dayPeriod).toUpperCase()}`;
}

/** Short code shown in the internal alert, e.g. JBA-2611-3F9A. */
export function referenceNo(id: string, date: Date): string {
  const ist = new Date(date.getTime() + 5.5 * 3600_000);
  const yy = String(ist.getUTCFullYear()).slice(-2);
  const mm = String(ist.getUTCMonth() + 1).padStart(2, '0');
  return `JBA-${yy}${mm}-${id.replace(/-/g, '').slice(0, 4).toUpperCase()}`;
}

function shell(title: string, tag: string, body: string, footer: string): string {
  return `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#f6f7fa;font-family:Arial,Helvetica,sans-serif;color:#1d2433">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:6px;overflow:hidden">
<tr><td style="background:#0d2b55;padding:20px 26px;color:#ffffff">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:bold">${title}</div>
<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#c9d6ea;margin-top:2px">${tag}</div>
</td></tr>
<tr><td style="height:3px;background:#a8843a;line-height:3px;font-size:0">&nbsp;</td></tr>
<tr><td style="padding:26px;font-size:15px;line-height:1.6">${body}</td></tr>
<tr><td style="border-top:1px solid #e6eaf1;padding:14px 26px;font-size:12px;color:#616b7d">${footer}</td></tr>
</table></td></tr></table></body></html>`;
}

function detailsTable(rows: Array<[string, string]>): string {
  const tr = rows
    .map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#4a5872;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:4px 0;font-weight:bold">${esc(v)}</td></tr>`)
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#eef3fa;border-radius:6px;margin:4px 0 18px"><tr><td style="padding:12px 16px"><table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px">${tr}</table></td></tr></table>`;
}

export function applicantEmail(app: MappedApplication, submittedAt: Date) {
  const position = POSITION_LABELS[app.position];
  const subject = `Application received – ${position} | Jain Bafna & Associates`;
  const when = formatIst(submittedAt);
  const html = shell(
    'Jain Bafna &amp; Associates',
    'Chartered Accountants · Chennai',
    `<p style="margin:0 0 14px">Dear ${esc(app.fullName)},</p>
<p style="margin:0 0 14px">Thank you for applying for the position of <strong>${esc(position)}</strong> at Jain Bafna &amp; Associates, Chennai.</p>
<p style="margin:0 0 14px">We have received your application and resume. Please keep these details for your reference:</p>
${detailsTable([['Position', position], ['Received on', when]])}
<p style="margin:0 0 14px">Our team will review your profile. If it matches our current requirements, we will contact you by phone or email to schedule an interview.</p>
<p style="margin:0 0 14px">You do not need to apply again. If you want to update your details, simply reply to this email.</p>
<p style="margin:20px 0 0">Warm regards,<br><strong style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#0d2b55">Team Jain Bafna &amp; Associates</strong><br>Chartered Accountants, Chennai<br><a href="https://www.jainbafna.com" style="color:#0d2b55">www.jainbafna.com</a></p>`,
    'This is an automated confirmation of your application to Jain Bafna &amp; Associates.',
  );
  const text = `Dear ${app.fullName},

Thank you for applying for the position of ${position} at Jain Bafna & Associates, Chennai.

We have received your application and resume.
Position: ${position}
Received on: ${when}

Our team will review your profile. If it matches our current requirements, we will contact you by phone or email to schedule an interview.

You do not need to apply again. If you want to update your details, simply reply to this email.

Warm regards,
Team Jain Bafna & Associates
Chartered Accountants, Chennai
www.jainbafna.com`;
  return { subject, html, text };
}

export function alertEmail(app: MappedApplication, id: string, submittedAt: Date) {
  const position = POSITION_LABELS[app.position];
  const d = app.data;
  const qualification = app.position === 'article' ? `CA Inter: ${d.caStatus ?? ''}` : String(d.highestQualification ?? '');
  const experience = app.position === 'article' ? String(d.priorExperience ?? '') : `${d.yearsExperience ?? 0} years`;
  const rows: Array<[string, string]> = [
    ['Name', app.fullName],
    ['Position', position],
    ['Mobile', app.mobileNumber],
    ['Email', app.email],
    ['Qualification', qualification],
    ['Experience', experience],
    ['Location', String(d.currentLocation ?? '')],
    ['Received on', formatIst(submittedAt)],
    ['Reference no.', referenceNo(id, submittedAt)],
  ];
  const subject = `New application: ${app.fullName} – ${position}`;
  const html = shell(
    'New application received',
    'career.jainbafna.com',
    `<p style="margin:0 0 14px">A new application has been received on the careers portal.</p>
${detailsTable(rows)}
<p style="margin:4px 0 16px"><a href="${SITE_URL}/admin" style="display:inline-block;background:#0d2b55;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:5px;font-weight:bold;font-size:14px">Open in dashboard</a></p>
<p style="margin:0;font-size:13px;color:#616b7d">The resume is not attached, so it stays private. Open it from the dashboard after signing in.</p>`,
    'Automatic alert from the Jain Bafna &amp; Associates careers portal.',
  );
  const text = `A new application has been received on the careers portal.

${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}

Open in dashboard: ${SITE_URL}/admin
The resume is not attached, so it stays private. Open it from the dashboard after signing in.`;
  return { subject, html, text };
}

function transport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  const port = Number(process.env.SMTP_PORT ?? 465);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 8000,
    socketTimeout: 8000,
  });
}

/** Sends both emails. Never throws. */
export async function sendApplicationEmails(app: MappedApplication, id: string, submittedAt: Date): Promise<void> {
  const mailer = transport();
  if (!mailer) {
    console.warn('Application emails skipped: SMTP_USER / SMTP_PASS not set');
    return;
  }
  const sender = process.env.SMTP_USER as string;
  const from = { name: process.env.MAIL_FROM_NAME || 'Jain Bafna & Associates', address: sender };
  const alertTo = process.env.MAIL_ALERT_TO || sender;

  const applicant = applicantEmail(app, submittedAt);
  const alert = alertEmail(app, id, submittedAt);
  const results = await Promise.allSettled([
    mailer.sendMail({ from, to: app.email, replyTo: sender, ...applicant }),
    mailer.sendMail({ from: { name: 'Careers Portal', address: sender }, to: alertTo, replyTo: app.email, ...alert }),
  ]);
  results.forEach((r, i) => {
    if (r.status === 'rejected') console.error(`Application email ${i === 0 ? 'to applicant' : 'alert'} failed`, r.reason);
  });
}
