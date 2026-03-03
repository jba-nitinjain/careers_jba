import { ExternalLink } from 'lucide-react';
import type { ApplicationRecord, ApplicationStatus } from '../../../types/admin';
import { getPositionLabel, getSubmissionDate } from '../utils/applicationFormatting';
import { ApplicationRowActions } from './ApplicationRowActions';

interface ApplicationsTableProps {
  applications: ApplicationRecord[];
  pendingApplicationId: string | null;
  onView: (application: ApplicationRecord) => void;
  onStatusChange: (application: ApplicationRecord, status: ApplicationStatus) => Promise<void>;
  onDelete: (application: ApplicationRecord) => Promise<void>;
}

function toStatusLabel(status: ApplicationStatus | undefined): string {
  if (!status) return 'New';
  if (status === 'called_for_interview') return 'Called for Interview';
  return status.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ApplicationsTable({ applications, pendingApplicationId, onView, onStatusChange, onDelete }: ApplicationsTableProps) {
  if (applications.length === 0) {
    return <div className="text-center py-10 bg-white border border-gray-200 rounded-xl text-gray-500">No matching applications found.</div>;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resume</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {applications.map((application) => {
              const isPending = pendingApplicationId === application.id;
              return (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">{getSubmissionDate(application)}</td>
                  <td className="px-4 py-3 text-sm">
                    <p className="font-medium text-gray-900">{application.fullName ?? 'Unknown'}</p>
                    <p className="text-gray-500">{application.email ?? 'N/A'}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{getPositionLabel(application.position)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{toStatusLabel(application.adminStatus)}</td>
                  <td className="px-4 py-3 text-sm">
                    {application.dynamicResumeUrl ? (
                      <a href={application.dynamicResumeUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1">
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => onView(application)} className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-md hover:bg-indigo-100">
                        View details
                      </button>
                      <ApplicationRowActions
                        application={application}
                        pending={isPending}
                        onStatusChange={onStatusChange}
                        onDelete={onDelete}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
