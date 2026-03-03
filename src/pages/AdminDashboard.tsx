import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { AdminSortKey, ApplicationRecord } from '../types/admin';
import { ApplicationDetailsModal } from '../features/admin/components/ApplicationDetailsModal';
import { ApplicationsTable } from '../features/admin/components/ApplicationsTable';
import { AdminFilters } from '../features/admin/components/AdminFilters';
import { AdminSignInCard } from '../features/admin/components/AdminSignInCard';
import { AdminStats } from '../features/admin/components/AdminStats';
import { AdminTopBar } from '../features/admin/components/AdminTopBar';
import { useAdminApplications } from '../features/admin/hooks/useAdminApplications';

function nextSortDirection(current: 'asc' | 'desc'): 'asc' | 'desc' {
  return current === 'asc' ? 'desc' : 'asc';
}

export default function AdminDashboard() {
  const [selectedApplication, setSelectedApplication] = useState<ApplicationRecord | null>(null);
  const {
    user,
    loading,
    error,
    applications,
    sortConfig,
    searchTerm,
    positionFilter,
    setSortConfig,
    setSearchTerm,
    setPositionFilter,
    signIn,
    signOutAdmin,
    refreshApplications,
  } = useAdminApplications();

  const handleSortChange = (key: AdminSortKey) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key ? nextSortDirection(sortConfig.direction) : 'asc',
    });
  };

  const headerDescription = useMemo(
    () => `Showing ${applications.length} application${applications.length === 1 ? '' : 's'}.`,
    [applications.length],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AdminSignInCard error={error} onSignIn={signIn} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminTopBar user={user} onSignOut={signOutAdmin} onRefresh={refreshApplications} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Application Management</h1>
          <p className="text-sm text-gray-600 mt-1">{headerDescription}</p>
          {error ? <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div> : null}
        </header>

        <AdminStats applications={applications} />
        <AdminFilters
          searchTerm={searchTerm}
          positionFilter={positionFilter}
          sortConfig={sortConfig}
          onSearchChange={setSearchTerm}
          onPositionChange={setPositionFilter}
          onSortChange={handleSortChange}
        />
        <ApplicationsTable applications={applications} onView={setSelectedApplication} />
      </main>

      {selectedApplication ? (
        <ApplicationDetailsModal application={selectedApplication} onClose={() => setSelectedApplication(null)} />
      ) : null}
    </div>
  );
}
