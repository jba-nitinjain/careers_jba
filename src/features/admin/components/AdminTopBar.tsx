import { LogOut } from 'lucide-react';
import type { AdminUser } from '../../../types/admin';

interface AdminTopBarProps {
  user: AdminUser;
  onSignOut: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function AdminTopBar({ user, onSignOut, onRefresh }: AdminTopBarProps) {
  return (
    <nav className="bg-indigo-600 border-b border-indigo-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-3">
          <div className="flex items-center">
            <img src="/images/ca_logo.png" alt="" className="h-8 w-auto mr-3 bg-white rounded p-0.5" />
            <span className="text-white font-serif font-bold text-xl tracking-wide">JBA Careers · Admin</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-gray-300 text-sm hidden md:block">{user.email}</span>
            <button onClick={() => void onRefresh()} className="text-sm text-gray-200 hover:text-white px-3 py-2 rounded-md hover:bg-indigo-700">
              Refresh
            </button>
            <button onClick={() => void onSignOut()} className="flex items-center text-sm text-gray-200 hover:text-white px-3 py-2 rounded-md hover:bg-indigo-700">
              <LogOut className="w-4 h-4 mr-1" /> Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
