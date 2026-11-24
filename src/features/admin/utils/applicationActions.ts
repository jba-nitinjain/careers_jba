import { apiSend } from '../../../lib/api';
import type { ApplicationRecord, ApplicationStatus } from '../../../types/admin';

export interface DeleteApplicationResult {
  warningMessage: string | null;
}

/**
 * Updates an application's admin workflow status.
 */
export async function updateApplicationStatus(applicationId: string, status: ApplicationStatus): Promise<void> {
  await apiSend(`/api/admin/applications/${applicationId}`, 'PATCH', { adminStatus: status });
}

/**
 * Deletes an application and its resume file.
 */
export async function deleteApplicationAndResume(application: ApplicationRecord): Promise<DeleteApplicationResult> {
  const result = await apiSend<{ warning: string | null }>(`/api/admin/applications/${application.id}`, 'DELETE');
  return { warningMessage: result.warning };
}
