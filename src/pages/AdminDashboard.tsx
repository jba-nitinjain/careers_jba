import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { AdminSortKey, ApplicationRecord, ApplicationStatus } from '../types/admin';
import { ApplicationDetailsModal } from '../features/admin/components/ApplicationDetailsModal';
import { ApplicationsTable } from '../features/admin/components/ApplicationsTable';
import { AdminFilters } from '../features/admin/components/AdminFilters';
import { AdminSignInCard } from '../features/admin/components/AdminSignInCard';
import { AdminTopBar } from '../features/admin/components/AdminTopBar';
import { useAdminApplications } from '../features/admin/hooks/useAdminApplications';
import { useApplicationMutations } from '../features/admin/hooks/useApplicationMutations';

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
    counts,
    sortConfig,
    searchTerm,
    positionFilter,
    statusFilter,
    setSortConfig,
    setSearchTerm,
    setPositionFilter,
    setStatusFilter,
    signInWithGoogle,
    signInWithCredentials,
    signOutAdmin,
    refreshApplications,
  } = useAdminApplications();

  const { pendingApplicationId, mutationError, mutationWarning, handleStatusChange, handleDeleteApplication } = useApplicationMutations();

  const handleSortChange = (key: AdminSortKey) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key ? nextSortDirection(sortConfig.direction) : 'asc',
    });
  };

  const onStatusChange = async (application: ApplicationRecord, status: ApplicationStatus) => {
    await handleStatusChange(application, status, refreshApplications);
  };

  const onDeleteApplication = async (application: ApplicationRecord) => {
    await handleDeleteApplication(application, refreshApplications);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <AdminSignInCard
        error={error}
        onGoogleSignIn={signInWithGoogle}
        onCredentialSignIn={signInWithCredentials}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminTopBar user={user} onSignOut={signOutAdmin} onRefresh={refreshApplications} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Application Management</h1>
          {error ? <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div> : null}
          {mutationError ? <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-md text-sm">{mutationError}</div> : null}
          {mutationWarning ? <div className="mt-3 p-3 bg-amber-50 text-amber-800 rounded-md text-sm">{mutationWarning}</div> : null}
        </header>

        <AdminFilters
          searchTerm={searchTerm}
          positionFilter={positionFilter}
          statusFilter={statusFilter}
          sortConfig={sortConfig}
          counts={counts}
          onSearchChange={setSearchTerm}
          onPositionChange={setPositionFilter}
          onStatusChange={setStatusFilter}
          onSortChange={handleSortChange}
        />
        <ApplicationsTable
          applications={applications}
          pendingApplicationId={pendingApplicationId}
          onView={setSelectedApplication}
          onStatusChange={onStatusChange}
          onDelete={onDeleteApplication}
        />
      </main>

      {selectedApplication ? (
        <ApplicationDetailsModal application={selectedApplication} onClose={() => setSelectedApplication(null)} />
      ) : null}
    </div>
  );
}
