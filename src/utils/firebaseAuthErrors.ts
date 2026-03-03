/**
 * Builds a user-facing message for Firebase authentication errors.
 */
export function getFirebaseAuthErrorMessage(error: unknown, currentHost: string): string {
  const fallbackMessage = 'Sign-in failed. Please try again.';

  if (!error || typeof error !== 'object') {
    return fallbackMessage;
  }

  const maybeError = error as { code?: string; message?: string };
  const code = maybeError.code ?? '';
  const message = maybeError.message ?? '';

  if (code === 'auth/unauthorized-domain') {
    return [
      'This domain is not allowed for Google sign-in.',
      `Add "${currentHost}" in Firebase Console → Authentication → Settings → Authorized domains.`,
      'After saving, refresh this page and try again.',
    ].join(' ');
  }

  if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
    return 'Google sign-in popup was blocked or closed. Enable popups for this site and retry.';
  }

  if (code === 'auth/web-storage-unsupported' || /third-party cookie/i.test(message)) {
    return [
      'Your browser is blocking storage/cookies required for OAuth.',
      'Allow third-party cookies for this site (or temporarily disable strict tracking prevention), then retry.',
    ].join(' ');
  }

  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Invalid username/email or password. Please verify your credentials and try again.';
  }

  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address for username/email sign-in.';
  }

  if (code === 'auth/too-many-requests') {
    return 'Too many failed attempts. Please wait a few minutes before trying again.';
  }

  return `Sign-in Error: ${message || fallbackMessage}`;
}
