import { useState } from 'react';
import { KeyRound, LogOut, RefreshCw } from 'lucide-react';
import type { AdminUser } from '../../../types/admin';
import { ChangePasswordDialog } from './ChangePasswordDialog';

interface AdminTopBarProps {
  user: AdminUser;
  onSignOut: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

const buttonClass = 'flex items-center gap-1.5 text-sm text-gray-200 hover:text-white px-2.5 sm:px-3 py-2 rounded-md hover:bg-indigo-700';

export function AdminTopBar({ user, onSignOut, onRefresh }: AdminTopBarProps) {
  const [changingPassword, setChangingPassword] = useState(false);

  return (
    <nav className="bg-indigo-600 border-b border-indigo-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-3">
          <div className="flex items-center min-w-0">
            <img src="/images/ca_logo.png" alt="" className="h-8 w-auto mr-3 bg-white rounded p-0.5" />
            <span className="text-white font-serif font-bold text-xl tracking-wide truncate">
              JBA Careers<span className="hidden sm:inline"> · Admin</span>
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <span className="text-gray-300 text-sm hidden md:block">{user.email}</span>
            <button onClick={() => void onRefresh()} className={buttonClass} aria-label="Refresh">
              <RefreshCw className="w-4 h-4" /> <span className="hidden sm:inline">Refresh</span>
            </button>
            <button onClick={() => setChangingPassword(true)} className={buttonClass} aria-label="Change password">
              <KeyRound className="w-4 h-4" /> <span className="hidden sm:inline">Change password</span>
            </button>
            <button onClick={() => void onSignOut()} className={buttonClass} aria-label="Sign out">
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>
      {changingPassword ? <ChangePasswordDialog email={user.email} onClose={() => setChangingPassword(false)} /> : null}
    </nav>
  );
}
