import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { db, storage } from '../../../firebase';
import type { ApplicationRecord, ApplicationStatus } from '../../../types/admin';
import { getStorageDeleteWarningMessage } from './firebaseOperationErrors';

export interface DeleteApplicationResult {
  warningMessage: string | null;
}

/**
 * Updates an application's admin workflow status in Firestore.
 */
export async function updateApplicationStatus(applicationId: string, status: ApplicationStatus): Promise<void> {
  const applicationRef = doc(db, 'applications', applicationId);
  await updateDoc(applicationRef, { adminStatus: status });
}

/**
 * Deletes an application document and attempts to delete its associated resume file.
 * Firestore deletion is still attempted even if Storage deletion fails.
 */
export async function deleteApplicationAndResume(application: ApplicationRecord): Promise<DeleteApplicationResult> {
  if (!application.id) {
    throw new Error('Application id is required for deletion.');
  }

  let storageWarningMessage: string | null = null;

  if (typeof application.resumePath === 'string' && application.resumePath.trim()) {
    const resumeRef = ref(storage, application.resumePath);
    try {
      await deleteObject(resumeRef);
    } catch (error) {
      storageWarningMessage = getStorageDeleteWarningMessage(error);
    }
  }

  const applicationRef = doc(db, 'applications', application.id);
  await deleteDoc(applicationRef);

  return { warningMessage: storageWarningMessage };
}
