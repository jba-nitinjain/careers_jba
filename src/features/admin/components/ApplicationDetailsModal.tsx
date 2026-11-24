import { ExternalLink, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ApplicationRecord, ApplicationReference } from '../../../types/admin';
import { formatPlainDate, getPositionLabel, getSubmissionDate, resumeUrl } from '../utils/applicationFormatting';

interface ApplicationDetailsModalProps {
  application: ApplicationRecord;
  onClose: () => void;
}

function readString(value: unknown): string {
  if (typeof value === 'number') return String(value);
  return typeof value === 'string' && value.trim() ? value : 'N/A';
}

function toList(value: unknown): string {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string').join(', ') || 'N/A' : 'N/A';
}

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <p className={wide ? 'md:col-span-2' : undefined}>
      <span className="text-gray-500">{label}:</span> <span className="whitespace-pre-line">{children}</span>
    </p>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h4 className="text-sm font-semibold text-indigo-600 uppercase mb-2">{title}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">{children}</div>
    </section>
  );
}

export function ApplicationDetailsModal({ application: a, onClose }: ApplicationDetailsModalProps) {
  const references = Array.isArray(a.references) ? (a.references as ApplicationReference[]) : [];
  const isArticle = a.position === 'article';
  const resume = resumeUrl(a);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{readString(a.fullName)}</h3>
            <p className="text-sm text-gray-500">
              {getPositionLabel(a.position)} • Applied {getSubmissionDate(a)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {resume ? (
              <a href={resume} target="_blank" rel="noreferrer" className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 inline-flex items-center gap-1">
                Resume <ExternalLink className="w-3 h-3" />
              </a>
            ) : null}
            <button onClick={onClose} aria-label="Close" className="p-2 rounded-md hover:bg-gray-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <Section title="Contact">
            <Field label="Email">{readString(a.email)}</Field>
            <Field label="Mobile">{readString(a.mobileNumber)}</Field>
            <Field label="Date of birth">{formatPlainDate(a.dob)}</Field>
            <Field label="Current location">{readString(a.currentLocation)}</Field>
            <Field label="Address" wide>{readString(a.address)}</Field>
            <Field label="Hometown address" wide>{readString(a.hometownAddress)}</Field>
            <Field label="LinkedIn">{readString(a.linkedinUrl)}</Field>
            <Field label="Willing to travel">{readString(a.willingToTravel)}</Field>
          </Section>

          {isArticle ? (
            <Section title="Articleship">
              <Field label="CA Inter status">{readString(a.caStatus)}</Field>
              <Field label="Attempts">{readString(a.caAttempts)}</Field>
              <Field label="ITT / OC">{readString(a.ittOcStatus)}</Field>
              <Field label="Degree">{readString(a.degreeStatus)}</Field>
              <Field label="Availability to join">{readString(a.availabilityToJoin)}</Field>
              <Field label="Expected stipend (per month)">{readString(a.expectedStipend)}</Field>
              <Field label="Prior experience" wide>{readString(a.priorExperience)}</Field>
            </Section>
          ) : (
            <Section title="Experience">
              <Field label="Qualification">{readString(a.highestQualification)}</Field>
              <Field label="Domain expertise">{toList(a.domainExpertise)}</Field>
              <Field label="Current employer">{readString(a.currentEmployer)}</Field>
              <Field label="Experience (years)">{readString(a.yearsExperience)}</Field>
              <Field label="Current CTC">{readString(a.currentSalary)}</Field>
              <Field label="Expected CTC">{readString(a.expectedSalary)}</Field>
              <Field label="Notice period">{readString(a.noticePeriod)}</Field>
              {a.position === 'audit_manager' ? <Field label="Largest team led">{readString(a.auditTeamSize)}</Field> : null}
            </Section>
          )}

          <Section title="Skills & motivation">
            <Field label="Certifications" wide>{readString(a.qualifications)}</Field>
            <Field label="Accounting platforms" wide>{toList(a.platforms)}</Field>
            <Field label="Excel">{readString(a.excelSkill)}</Field>
            <Field label="Word">{readString(a.wordSkill)}</Field>
            <Field label="PowerPoint">{readString(a.powerpointSkill)}</Field>
            <Field label="Heard about us via">{readString(a.howHeard)}</Field>
            <Field label="Strengths & weaknesses" wide>{readString(a.strengthsWeaknesses)}</Field>
            <Field label="Contribution" wide>{readString(a.contribution)}</Field>
          </Section>

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
