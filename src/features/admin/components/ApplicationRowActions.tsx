import type { ApplicationRecord, ApplicationStatus } from '../../../types/admin';

interface ApplicationRowActionsProps {
  application: ApplicationRecord;
  pending: boolean;
  onStatusChange: (application: ApplicationRecord, status: ApplicationStatus) => Promise<void>;
  onDelete: (application: ApplicationRecord) => Promise<void>;
}

const STATUS_OPTIONS: Array<{ label: string; value: ApplicationStatus }> = [
  { label: 'New', value: 'new' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Called for Interview', value: 'called_for_interview' },
  { label: 'Selected', value: 'selected' },
];

export function ApplicationRowActions({ application, pending, onStatusChange, onDelete }: ApplicationRowActionsProps) {
  return (
    <div className="flex w-full md:w-auto items-center justify-end gap-2">
      <select
        value={application.adminStatus ?? 'new'}
        disabled={pending}
        onChange={(event) => void onStatusChange(application, event.target.value as ApplicationStatus)}
        aria-label="Application status"
        className="flex-1 md:flex-none min-w-0 rounded-md border border-gray-300 px-2 py-2 md:py-1.5 text-base md:text-xs text-gray-700 bg-white"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        disabled={pending}
        onClick={() => void onDelete(application)}
        className="text-sm md:text-xs bg-red-50 text-red-700 border border-red-200 px-4 py-2.5 md:px-2 md:py-1.5 rounded-md hover:bg-red-100 disabled:opacity-60"
      >
        Delete
      </button>
    </div>
  );
}
