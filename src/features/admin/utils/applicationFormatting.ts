import type { ApplicationRecord } from '../../../types/admin';

/**
 * Returns a user-facing position label from stored application value.
 */
export function getPositionLabel(position?: string): string {
  if (!position) return 'Unknown';
  if (position === 'article') return 'Article Assistant';
  if (position === 'paid_assistant') return 'Paid Assistant';
  return position.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Safely converts a Firestore timestamp to a localized date string.
 */
export function getSubmissionDate(application: ApplicationRecord): string {
  const submittedAt = application.submittedAt;
  if (!submittedAt || typeof submittedAt.toDate !== 'function') return 'N/A';

  const date = submittedAt.toDate();
  const day = String(date.getDate()).padStart(2, '0');
  const monthInfo = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();

  return `${day}/${monthInfo}/${year}`;
}

/**
 * Returns a normalized lowercase string for robust search/filter matching.
 */
export function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}
