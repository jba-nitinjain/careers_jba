import type { AdminSortKey, SortConfig } from '../../../types/admin';

interface AdminFiltersProps {
  searchTerm: string;
  positionFilter: 'all' | 'article' | 'paid_assistant';
  sortConfig: SortConfig;
  onSearchChange: (value: string) => void;
  onPositionChange: (value: 'all' | 'article' | 'paid_assistant') => void;
  onSortChange: (key: AdminSortKey) => void;
}

export function AdminFilters({
  searchTerm,
  positionFilter,
  sortConfig,
  onSearchChange,
  onPositionChange,
  onSortChange,
}: AdminFiltersProps) {
  return (
    <div className="mb-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            { id: 'all', label: 'All Resumes' },
            { id: 'article', label: 'Article Assistant' },
            { id: 'paid_assistant', label: 'Paid Assistant' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onPositionChange(tab.id as 'all' | 'article' | 'paid_assistant')}
              className={`
                whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${positionFilter === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
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
