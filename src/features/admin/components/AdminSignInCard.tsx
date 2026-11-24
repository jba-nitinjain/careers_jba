import { type FormEvent, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface AdminSignInCardProps {
  error: string | null;
  onSignIn: (email: string, password: string) => Promise<void>;
}

export function AdminSignInCard({ error, onSignIn }: AdminSignInCardProps) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSignIn(email, password);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md">
        <div className="text-center mb-6">
          <img src="/images/ca_logo.png" alt="CA India logo" className="h-14 w-auto mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-indigo-600 mb-1">Careers Admin</h2>
          <p className="text-gray-500 text-sm">Sign in with your eAccountsApp email and password.</p>
        </div>

        {error ? <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div> : null}

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="name@jainbafna.com"
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
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
