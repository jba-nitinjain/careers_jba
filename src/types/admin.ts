export type AdminSortKey = 'submittedAt' | 'fullName' | 'position';

export type SortDirection = 'asc' | 'desc';

export type ApplicationStatus = 'new' | 'rejected' | 'called_for_interview' | 'selected';

export const APPLICATION_STATUSES: ApplicationStatus[] = ['new', 'rejected', 'called_for_interview', 'selected'];

export type PositionKey = 'article' | 'paid_assistant' | 'audit_manager';

export type PositionFilter = 'all' | PositionKey;

export interface SortConfig {
  key: AdminSortKey;
  direction: SortDirection;
}

export interface ApplicationReference {
  name?: string;
  relationship?: string;
  contact?: string;
  email?: string;
}

export interface AdminUser {
  email: string;
}

export interface ApplicationRecord {
  id: string;
  fullName?: string;
  email?: string;
  position?: string;
  /** ISO 8601 timestamp. */
  submittedAt?: string;
  adminStatus?: ApplicationStatus;
  hasResume?: boolean;
  references?: ApplicationReference[];
  [key: string]: unknown;
}
