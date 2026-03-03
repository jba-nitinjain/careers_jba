interface FirebaseLikeError {
  code?: string;
  message?: string;
}

function asFirebaseLikeError(error: unknown): FirebaseLikeError {
  if (!error || typeof error !== 'object') {
    return {};
  }
  return error as FirebaseLikeError;
}

/**
 * Maps Firestore update/delete errors to actionable admin UI text.
 */
export function getAdminFirestoreActionErrorMessage(error: unknown, actionLabel: 'status' | 'delete'): string {
  const defaultMessage =
    actionLabel === 'status'
      ? 'Could not update application status. Please retry.'
      : 'Could not delete application record. Please retry.';

  const { code } = asFirebaseLikeError(error);

  if (code === 'permission-denied') {
    return [
      actionLabel === 'status'
        ? 'Status update failed due to missing Firestore permissions.'
        : 'Delete failed due to missing Firestore permissions.',
      'Update Firestore security rules to allow the authenticated admin to modify application documents.',
    ].join(' ');
  }

  if (code === 'unauthenticated') {
    return 'Your admin session is no longer authenticated. Please sign in again and retry.';
  }

  return defaultMessage;
}

/**
 * Maps Firebase Storage deletion errors to actionable admin UI text.
 */
export function getStorageDeleteWarningMessage(error: unknown): string | null {
  const { code } = asFirebaseLikeError(error);

  if (code === 'storage/object-not-found') {
    return null;
  }

  if (code === 'storage/unauthorized') {
    return 'Resume file could not be deleted due to Storage permissions, but the application record was removed.';
  }

  if (code === 'storage/unauthenticated') {
    return 'Resume file could not be deleted because the admin session is not authenticated.';
  }

  return 'Resume file could not be deleted, but the application record was removed.';
}
