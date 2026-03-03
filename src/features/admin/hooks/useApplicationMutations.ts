import { useCallback, useState } from 'react';
import type { ApplicationRecord, ApplicationStatus } from '../../../types/admin';
import { deleteApplicationAndResume, updateApplicationStatus } from '../utils/applicationActions';

interface UseApplicationMutationsResult {
  pendingApplicationId: string | null;
  mutationError: string | null;
  setMutationError: (value: string | null) => void;
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

  const handleStatusChange = useCallback(
    async (application: ApplicationRecord, status: ApplicationStatus, onRefresh: () => Promise<void>) => {
      if (!application.id) return;
      setMutationError(null);
      setPendingApplicationId(application.id);
      try {
        await updateApplicationStatus(application.id, status);
        await onRefresh();
      } catch (error) {
        console.error('Failed to update application status', error);
        setMutationError('Could not update application status. Please retry.');
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
      setPendingApplicationId(application.id);
      try {
        await deleteApplicationAndResume(application);
        await onRefresh();
      } catch (error) {
        console.error('Failed to delete application', error);
        setMutationError('Could not delete application or associated file. Please retry.');
      } finally {
        setPendingApplicationId(null);
      }
    },
    [],
  );

  return {
    pendingApplicationId,
    mutationError,
    setMutationError,
    handleStatusChange,
    handleDeleteApplication,
  };
}
