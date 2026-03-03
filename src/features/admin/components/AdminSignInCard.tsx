import { ShieldAlert } from 'lucide-react';

interface AdminSignInCardProps {
  error: string | null;
  onSignIn: () => Promise<void>;
}

export function AdminSignInCard({ error, onSignIn }: AdminSignInCardProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md text-center">
        <ShieldAlert className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
        <p className="text-gray-500 mb-6">Sign in with the authorized Google account to manage applications.</p>

        {error ? <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm text-left">{error}</div> : null}

        <button
          onClick={() => void onSignIn()}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Sign in as Admin
        </button>
      </div>
    </div>
  );
}
