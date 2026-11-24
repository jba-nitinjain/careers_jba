import type { ApplicationRecord } from '../../../types/admin';

export const POSITION_LABELS: Record<string, string> = {
  article: 'Article Clerk',
  paid_assistant: 'Paid Assistant',
  audit_manager: 'Audit Manager',
};

/**
 * Returns a user-facing position label from stored application value.
 */
export function getPositionLabel(position?: string): string {
  if (!position) return 'Unknown';
  return POSITION_LABELS[position] ?? position.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Formats a date as dd/mm/yyyy (Indian local time).
 */
export function formatDate(value: string | Date | undefined | null): string {
  if (!value) return 'N/A';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(date);
}

/**
 * Formats a plain yyyy-mm-dd date (e.g. date of birth) as dd/mm/yyyy without timezone shifts.
 */
export function formatPlainDate(value: unknown): string {
  if (typeof value !== 'string') return 'N/A';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value || 'N/A';
}

export function getSubmissionDate(application: ApplicationRecord): string {
  return formatDate(application.submittedAt);
}

export function resumeUrl(application: ApplicationRecord): string | null {
  return application.hasResume ? `/api/admin/applications/${application.id}/resume` : null;
}

/**
 * Returns a normalized lowercase string for robust search/filter matching.
 */
export function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}
