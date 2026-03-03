import { useCallback, useState } from 'react';
import type { ApplicationRecord, ApplicationStatus } from '../../../types/admin';
import { deleteApplicationAndResume, updateApplicationStatus } from '../utils/applicationActions';
import { getAdminFirestoreActionErrorMessage } from '../utils/firebaseOperationErrors';

interface UseApplicationMutationsResult {
  pendingApplicationId: string | null;
  mutationError: string | null;
  mutationWarning: string | null;
  handleStatusChange: (
    application: ApplicationRecord,
    status: ApplicationStatus,
    onRefresh: () => Promise<void>,
  ) => Promise<void>;
  handleDeleteApplication: (application: ApplicationRecord, onRefresh: () => Promise<void>) => Promise<void>;
}

/**
 * Handles mutation actions for admin applications, including status updates and deletes.
 */
export function useApplicationMutations(): UseApplicationMutationsResult {
  const [pendingApplicationId, setPendingApplicationId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationWarning, setMutationWarning] = useState<string | null>(null);

  const handleStatusChange = useCallback(
    async (application: ApplicationRecord, status: ApplicationStatus, onRefresh: () => Promise<void>) => {
      if (!application.id) return;
      setMutationError(null);
      setMutationWarning(null);
      setPendingApplicationId(application.id);
      try {
        await updateApplicationStatus(application.id, status);
        await onRefresh();
      } catch (error) {
        console.error('Failed to update application status', error);
        setMutationError(getAdminFirestoreActionErrorMessage(error, 'status'));
      } finally {
        setPendingApplicationId(null);
      }
    },
    [],
  );

  const handleDeleteApplication = useCallback(
    async (application: ApplicationRecord, onRefresh: () => Promise<void>) => {
      if (!application.id) return;
      const confirmed = typeof window !== 'undefined' ? window.confirm('Delete this application and resume file?') : true;
      if (!confirmed) return;

      setMutationError(null);
      setMutationWarning(null);
      setPendingApplicationId(application.id);
      try {
        const { warningMessage } = await deleteApplicationAndResume(application);
        await onRefresh();
        setMutationWarning(warningMessage);
      } catch (error) {
        console.error('Failed to delete application', error);
        setMutationError(getAdminFirestoreActionErrorMessage(error, 'delete'));
      } finally {
        setPendingApplicationId(null);
      }
    },
    [],
  );

  return {
    pendingApplicationId,
    mutationError,
    mutationWarning,
    handleStatusChange,
    handleDeleteApplication,
  };
}
