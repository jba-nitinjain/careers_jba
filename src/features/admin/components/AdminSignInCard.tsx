import { type FormEvent, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

interface AdminSignInCardProps {
  error: string | null;
  onGoogleSignIn: () => Promise<void>;
  onCredentialSignIn: (email: string, password: string) => Promise<void>;
}

export function AdminSignInCard({ error, onGoogleSignIn, onCredentialSignIn }: AdminSignInCardProps) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleCredentialSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onCredentialSignIn(email, password);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md">
        <div className="text-center">
          <ShieldAlert className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
          <p className="text-gray-500 mb-6">Sign in with Google or use admin username/email + password.</p>
        </div>

        {error ? <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div> : null}

        <button
          onClick={() => void onGoogleSignIn()}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Continue with Google
        </button>

        <div className="my-4 text-center text-xs text-gray-400 uppercase tracking-wider">or</div>

        <form onSubmit={(event) => void handleCredentialSubmit(event)} className="space-y-3">
          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1">
              Username / Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Continue with Username & Password
          </button>
        </form>
      </div>
    </div>
  );
}
