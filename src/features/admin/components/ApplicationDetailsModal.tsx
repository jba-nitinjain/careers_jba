import { X } from 'lucide-react';
import type { ApplicationRecord, ApplicationReference } from '../../../types/admin';
import { getPositionLabel, getSubmissionDate } from '../utils/applicationFormatting';

interface ApplicationDetailsModalProps {
  application: ApplicationRecord;
  onClose: () => void;
}

function readString(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value : 'N/A';
}

function toList(value: unknown): string {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string').join(', ') || 'N/A' : 'N/A';
}

export function ApplicationDetailsModal({ application, onClose }: ApplicationDetailsModalProps) {
  const references = Array.isArray(application.references) ? (application.references as ApplicationReference[]) : [];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{readString(application.fullName)}</h3>
            <p className="text-sm text-gray-500">{getPositionLabel(application.position)} • {getSubmissionDate(application)}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <h4 className="text-sm font-semibold text-indigo-600 uppercase mb-2">Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <p><span className="text-gray-500">Email:</span> {readString(application.email)}</p>
              <p><span className="text-gray-500">Mobile:</span> {readString(application.mobileNumber)}</p>
              <p><span className="text-gray-500">DOB:</span> {readString(application.dob)}</p>
              <p><span className="text-gray-500">Current location:</span> {readString(application.currentLocation)}</p>
              <p className="md:col-span-2"><span className="text-gray-500">Address:</span> {readString(application.address)}</p>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-indigo-600 uppercase mb-2">Experience</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <p><span className="text-gray-500">Qualification:</span> {readString(application.highestQualification)}</p>
              <p><span className="text-gray-500">Domain expertise:</span> {toList(application.domainExpertise)}</p>
              <p><span className="text-gray-500">Current employer:</span> {readString(application.currentEmployer)}</p>
              <p><span className="text-gray-500">Experience:</span> {readString(application.yearsExperience)}</p>
              <p><span className="text-gray-500">Expected CTC:</span> {readString(application.expectedSalary)}</p>
              <p><span className="text-gray-500">Notice period:</span> {readString(application.noticePeriod)}</p>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-indigo-600 uppercase mb-2">Skills</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <p className="md:col-span-2"><span className="text-gray-500">Certifications:</span> {readString(application.qualifications)}</p>
              <p className="md:col-span-2"><span className="text-gray-500">Accounting platforms:</span> {toList(application.platforms)}</p>
              <p><span className="text-gray-500">Excel:</span> {readString(application.excelSkill)}</p>
              <p><span className="text-gray-500">Word:</span> {readString(application.wordSkill)}</p>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-indigo-600 uppercase mb-2">References</h4>
            {references.length === 0 ? (
              <p className="text-sm text-gray-500">No references provided.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {references.map((reference, index) => (
                  <div key={`${reference.email ?? 'ref'}-${index}`} className="border border-gray-200 rounded-lg p-3 text-sm">
                    <p className="font-medium text-gray-900">Reference {index + 1}</p>
                    <p className="text-gray-600">{readString(reference.name)} • {readString(reference.relationship)}</p>
                    <p className="text-gray-600">{readString(reference.contact)} • {readString(reference.email)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
