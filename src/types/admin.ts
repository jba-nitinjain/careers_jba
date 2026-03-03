import type { Timestamp } from 'firebase/firestore';

export type AdminSortKey = 'submittedAt' | 'fullName' | 'position';

export type SortDirection = 'asc' | 'desc';

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
  resumeUrl?: string;
  resumePath?: string;
  dynamicResumeUrl?: string | null;
  references?: ApplicationReference[];
  [key: string]: unknown;
}
