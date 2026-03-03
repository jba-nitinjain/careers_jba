import type { Timestamp } from 'firebase/firestore';

export type AdminSortKey = 'submittedAt' | 'fullName' | 'position';

export type SortDirection = 'asc' | 'desc';

export type ApplicationStatus = 'new' | 'rejected' | 'called_for_interview' | 'selected';

export const APPLICATION_STATUSES: ApplicationStatus[] = ['new', 'rejected', 'called_for_interview', 'selected'];

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

export interface ApplicationRecord {
  id: string;
  fullName?: string;
  email?: string;
  position?: string;
  submittedAt?: Timestamp;
  adminStatus?: ApplicationStatus;
  resumeUrl?: string;
  resumePath?: string;
  dynamicResumeUrl?: string | null;
  references?: ApplicationReference[];
  [key: string]: unknown;
}
