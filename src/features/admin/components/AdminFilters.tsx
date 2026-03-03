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
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <input
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by name, email, position"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
      <select
        value={positionFilter}
        onChange={(event) => onPositionChange(event.target.value as 'all' | 'article' | 'paid_assistant')}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="all">All positions</option>
        <option value="article">Article Assistant</option>
        <option value="paid_assistant">Paid Assistant</option>
      </select>
      <button
        onClick={() => onSortChange(sortConfig.key)}
        className="rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 px-3 py-2 text-sm"
      >
        Sort: {sortConfig.key} ({sortConfig.direction})
      </button>
    </div>
  );
}
