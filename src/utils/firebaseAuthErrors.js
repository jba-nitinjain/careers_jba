/**
 * Builds a user-facing message for Firebase authentication errors.
 * Includes targeted guidance for OAuth domain authorization and
 * third-party cookie restrictions in modern browsers.
 *
 * @param {unknown} error - Error thrown by Firebase auth APIs.
 * @param {string} currentHost - Browser host where auth flow is running.
 * @returns {string} Human-readable message with remediation steps.
 */
export function getFirebaseAuthErrorMessage(error, currentHost) {
  const fallbackMessage = 'Sign-in failed. Please try again.';

  if (!error || typeof error !== 'object') {
    return fallbackMessage;
  }

  const maybeError = /** @type {{ code?: string; message?: string }} */ (error);
  const code = maybeError.code ?? '';
  const message = maybeError.message ?? '';

  if (code === 'auth/unauthorized-domain') {
    return [
      'This domain is not allowed for Google sign-in.',
      `Add "${currentHost}" in Firebase Console → Authentication → Settings → Authorized domains.`,
      'After saving, refresh this page and try again.'
    ].join(' ');
  }

  if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
    return [
      'Google sign-in popup was blocked or closed.',
      'Enable popups for this site and retry.'
    ].join(' ');
  }

  if (code === 'auth/web-storage-unsupported' || /third-party cookie/i.test(message)) {
    return [
      'Your browser is blocking storage/cookies required for OAuth.',
      'Allow third-party cookies for this site (or temporarily disable strict tracking prevention), then retry.'
    ].join(' ');
  }

  return `Sign-in Error: ${message || fallbackMessage}`;
}
