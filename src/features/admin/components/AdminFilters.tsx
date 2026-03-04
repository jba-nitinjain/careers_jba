import type { AdminSortKey, ApplicationStatus, SortConfig } from '../../../types/admin';
import type { ApplicationCounts } from '../hooks/useAdminApplications';

interface AdminFiltersProps {
  searchTerm: string;
  positionFilter: 'all' | 'article' | 'paid_assistant';
  statusFilter: ApplicationStatus | 'all';
  sortConfig: SortConfig;
  counts: ApplicationCounts;
  onSearchChange: (value: string) => void;
  onPositionChange: (value: 'all' | 'article' | 'paid_assistant') => void;
  onStatusChange: (value: ApplicationStatus | 'all') => void;
  onSortChange: (key: AdminSortKey) => void;
}

export function AdminFilters({
  searchTerm,
  positionFilter,
  statusFilter,
  sortConfig,
  counts,
  onSearchChange,
  onPositionChange,
  onStatusChange,
  onSortChange,
}: AdminFiltersProps) {
  return (
    <div className="mb-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8" aria-label="Position Tabs">
          {[
            { id: 'all', label: 'All Positions', count: counts.positions.all },
            { id: 'article', label: 'Article Assistant', count: counts.positions.article },
            { id: 'paid_assistant', label: 'Paid Assistant', count: counts.positions.paid_assistant },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onPositionChange(tab.id as 'all' | 'article' | 'paid_assistant')}
              className={`
                group flex items-center whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${positionFilter === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
              <span className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${positionFilter === tab.id
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Status Tabs">
          {[
            { id: 'all', label: 'All Statuses', count: counts.statuses.all },
            { id: 'new', label: 'New', count: counts.statuses.new },
            { id: 'called_for_interview', label: 'Interviewing', count: counts.statuses.called_for_interview },
            { id: 'selected', label: 'Selected', count: counts.statuses.selected },
            { id: 'rejected', label: 'Rejected', count: counts.statuses.rejected },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onStatusChange(tab.id as ApplicationStatus | 'all')}
              className={`
                group flex items-center whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${statusFilter === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
              <span className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusFilter === tab.id
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Search and Sort controls */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by name, email, position"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <div className="flex justify-end">
          <button
            onClick={() => onSortChange(sortConfig.key)}
            className="rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 px-4 py-2 text-sm font-medium hover:bg-indigo-100 transition-colors"
          >
            Sort by: {sortConfig.key === 'submittedAt' ? 'Date' : sortConfig.key} ({sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'})
          </button>
        </div>
      </div>
    </div>
  );
}
