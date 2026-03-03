import type { User } from 'firebase/auth';
import { LogOut, ShieldCheck } from 'lucide-react';

interface AdminTopBarProps {
  user: User;
  onSignOut: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function AdminTopBar({ user, onSignOut, onRefresh }: AdminTopBarProps) {
  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-3">
          <div className="flex items-center">
            <ShieldCheck className="w-6 h-6 text-indigo-400 mr-2" />
            <span className="text-white font-bold text-lg tracking-wide">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-gray-300 text-sm hidden md:block">{user.displayName ?? user.email ?? 'Admin'}</span>
            <button onClick={() => void onRefresh()} className="text-sm text-gray-200 hover:text-white px-3 py-2 rounded-md hover:bg-gray-800">
              Refresh
            </button>
            <button onClick={() => void onSignOut()} className="flex items-center text-sm text-gray-200 hover:text-white px-3 py-2 rounded-md hover:bg-gray-800">
              <LogOut className="w-4 h-4 mr-1" /> Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
