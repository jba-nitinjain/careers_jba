import { ExternalLink } from 'lucide-react';
import type { ApplicationRecord, ApplicationStatus } from '../../../types/admin';
import { getPositionLabel, getSubmissionDate, resumeUrl } from '../utils/applicationFormatting';
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
    <>
    {/* Phones: one card per application, all actions visible */}
    <ul className="md:hidden space-y-3">
      {applications.map((application) => {
        const isPending = pendingApplicationId === application.id;
        const url = resumeUrl(application);
        return (
          <li key={application.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-900">{application.fullName ?? 'Unknown'}</p>
                <p className="text-sm text-gray-500 break-all">{application.email ?? 'N/A'}</p>
              </div>
              <span className="shrink-0 text-xs text-gray-500">{getSubmissionDate(application)}</span>
            </div>
            <p className="text-sm text-gray-700">
              {getPositionLabel(application.position)} · {toStatusLabel(application.adminStatus)}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => onView(application)} className="text-sm bg-indigo-50 text-indigo-700 px-3 py-2.5 rounded-md hover:bg-indigo-100">
                View details
              </button>
              {url ? (
                <a href={url} target="_blank" rel="noreferrer" className="text-sm text-center border border-indigo-200 text-indigo-700 px-3 py-2.5 rounded-md inline-flex items-center justify-center gap-1">
                  Resume <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-sm text-center text-gray-400 px-3 py-2.5">No resume</span>
              )}
            </div>
            <ApplicationRowActions application={application} pending={isPending} onStatusChange={onStatusChange} onDelete={onDelete} />
          </li>
        );
      })}
    </ul>

    <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
                    {resumeUrl(application) ? (
                      <a href={resumeUrl(application) ?? undefined} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1">
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
    </>
  );
}
