import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { deleteObject, ref, type StorageError } from 'firebase/storage';
import { db, storage } from '../../../firebase';
import type { ApplicationRecord, ApplicationStatus } from '../../../types/admin';

/**
 * Updates an application's admin workflow status in Firestore.
 */
export async function updateApplicationStatus(applicationId: string, status: ApplicationStatus): Promise<void> {
  const applicationRef = doc(db, 'applications', applicationId);
  await updateDoc(applicationRef, { adminStatus: status });
}

/**
 * Deletes an application document and attempts to delete its associated resume file.
 * If the document has no resume path, only the Firestore document is deleted.
 */
export async function deleteApplicationAndResume(application: ApplicationRecord): Promise<void> {
  if (!application.id) {
    throw new Error('Application id is required for deletion.');
  }

  if (typeof application.resumePath === 'string' && application.resumePath.trim()) {
    const resumeRef = ref(storage, application.resumePath);
    try {
      await deleteObject(resumeRef);
    } catch (error) {
      const storageError = error as StorageError;
      if (storageError.code !== 'storage/object-not-found') {
        throw error;
      }
    }
  }

  const applicationRef = doc(db, 'applications', application.id);
  await deleteDoc(applicationRef);
}
