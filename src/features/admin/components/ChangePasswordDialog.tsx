import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CheckCircle2, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { apiSend, errorMessage } from '../../../lib/api';

const MIN_LENGTH = 8;

interface ChangePasswordDialogProps {
  email: string;
  onClose: () => void;
}

export function ChangePasswordDialog({ email, onClose }: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstField.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (newPassword.length < MIN_LENGTH) {
      setError(`The new password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The two new passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('The new password must be different from the current one.');
      return;
    }
    setSaving(true);
    try {
      await apiSend('/api/auth/change-password', 'POST', { currentPassword, newPassword });
      setDone(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const inputType = showPasswords ? 'text' : 'password';
  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="change-password-title" className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
          <div className="min-w-0">
            <h2 id="change-password-title" className="font-serif text-2xl font-bold text-indigo-600">Change password</h2>
            <p className="text-sm text-gray-500 break-all">{email}</p>
          </div>
          <button onClick={onClose} disabled={saving} aria-label="Close" className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="px-6 py-8 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-600" />
            <p className="font-medium text-gray-900">Password changed</p>
            <p className="mt-1 text-sm text-gray-600">Use your new password the next time you sign in.</p>
            <button onClick={onClose} className="mt-6 w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
            {/* Lets password managers save the new password against the right account. */}
            <input type="text" name="username" autoComplete="username" value={email} readOnly hidden />
            <div>
              <label htmlFor="current-password" className="mb-1 block text-sm font-medium text-gray-700">Current password</label>
              <input
                ref={firstField}
                id="current-password"
                type={inputType}
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-gray-700">New password</label>
              <input
                id="new-password"
                type={inputType}
                autoComplete="new-password"
                required
                minLength={MIN_LENGTH}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-gray-500">At least {MIN_LENGTH} characters.</p>
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-gray-700">Confirm new password</label>
              <input
                id="confirm-password"
                type={inputType}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={inputClass}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowPasswords((value) => !value)}
              className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800"
            >
              {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPasswords ? 'Hide passwords' : 'Show passwords'}
            </button>

            {error ? <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} disabled={saving} className="rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-70"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {saving ? 'Saving...' : 'Change password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
