/**
 * Server-side validation and mapping of the public application form.
 * The client sends the raw form state (snake_case keys); only whitelisted
 * fields are kept, so nobody can inject arbitrary data into the database.
 */

export const POSITIONS = ['article', 'paid_assistant', 'audit_manager'] as const;
export type Position = (typeof POSITIONS)[number];

export const MAX_RESUME_BYTES = 4 * 1024 * 1024;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[6-9]\d{9}$/;
const MAX_TEXT = 4000;

type Raw = Record<string, unknown>;

function str(raw: Raw, key: string): string {
  const value = raw[key];
  return typeof value === 'string' ? value.trim().slice(0, MAX_TEXT) : '';
}

function list(raw: Raw, key: string): string[] {
  const value = raw[key];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string').map((s) => s.trim().slice(0, 200)).slice(0, 20);
}

export interface MappedApplication {
  position: Position;
  fullName: string;
  email: string;
  mobileNumber: string;
  data: Record<string, unknown>;
}

export function mapApplication(raw: Raw, today = new Date()): { value?: MappedApplication; errors: string[] } {
  const errors: string[] = [];
  const position = str(raw, 'position') as Position;
  if (!POSITIONS.includes(position)) errors.push('Please choose a position.');

  const fullName = str(raw, 'full_name');
  const email = str(raw, 'email').toLowerCase();
  const mobileNumber = str(raw, 'mobile_number');
  const dob = str(raw, 'dob');

  const required: Array<[string, string]> = [
    ['full_name', 'Full name'], ['dob', 'Date of birth'], ['address', 'Current address'],
    ['current_location', 'Current area/locality'], ['willing_to_travel', 'Willingness to travel'],
    ['other_qualifications', 'Additional qualifications'], ['excel_skill', 'Excel skill'],
    ['word_skill', 'Word skill'], ['powerpoint_skill', 'PowerPoint skill'],
    ['strengths_weaknesses', 'Strengths & weaknesses'], ['contribution', 'Contribution'], ['how_heard', 'How you heard about us'],
  ];
  if (position === 'article') {
    required.push(['ca_status', 'CA Intermediate status'], ['ca_attempts', 'Attempts'], ['itt_oc_status', 'ITT/OC status'],
      ['degree_status', 'Degree status'], ['availability_to_join', 'Availability to join'],
      ['expected_stipend', 'Expected stipend'], ['prior_experience', 'Prior experience']);
  } else if (position) {
    required.push(['highest_qualification', 'Highest qualification'], ['current_employer', 'Current employer'],
      ['years_experience', 'Years of experience'], ['notice_period', 'Notice period'],
      ['current_salary', 'Current CTC'], ['expected_salary', 'Expected CTC']);
  }
  for (const [key, label] of required) {
    if (!str(raw, key)) errors.push(`${label} is required.`);
  }

  if (!EMAIL_RE.test(email)) errors.push('Please enter a valid email address.');
  if (!MOBILE_RE.test(mobileNumber)) errors.push('Mobile number must be 10 digits starting with 6, 7, 8 or 9.');

  if (dob) {
    const birth = new Date(`${dob}T00:00:00Z`);
    const age = (today.getTime() - birth.getTime()) / (365.25 * 24 * 3600 * 1000);
    if (Number.isNaN(age) || age < 16 || age > 80) errors.push('Please enter a valid date of birth.');
  }

  const platformsRaw = list(raw, 'platforms');
  if (platformsRaw.length === 0) errors.push('Please select at least one accounting platform.');
  const otherPlatform = str(raw, 'other_platform');
  const platforms = platformsRaw.map((p) => (p === 'Other' ? otherPlatform || 'Other' : p));
  const howHeard = str(raw, 'how_heard') === 'Other' ? str(raw, 'how_heard_other') || 'Other' : str(raw, 'how_heard');

  const references = [1, 2]
    .map((n) => ({
      name: str(raw, `ref${n}_name`),
      relationship: str(raw, `ref${n}_relationship`),
      contact: str(raw, `ref${n}_contact`),
      email: str(raw, `ref${n}_email`),
    }))
    .filter((ref) => ref.name);

  if (errors.length > 0) return { errors };

  const data: Record<string, unknown> = {
    dob,
    address: str(raw, 'address'),
    hometownAddress: str(raw, 'hometown_address'),
    currentLocation: str(raw, 'current_location'),
    linkedinUrl: str(raw, 'linkedin_url'),
    willingToTravel: str(raw, 'willing_to_travel'),
    qualifications: str(raw, 'other_qualifications'),
    platforms,
    excelSkill: str(raw, 'excel_skill'),
    wordSkill: str(raw, 'word_skill'),
    powerpointSkill: str(raw, 'powerpoint_skill'),
    strengthsWeaknesses: str(raw, 'strengths_weaknesses'),
    contribution: str(raw, 'contribution'),
    howHeard,
    references,
  };

  if (position === 'article') {
    Object.assign(data, {
      caStatus: str(raw, 'ca_status'),
      caAttempts: str(raw, 'ca_attempts'),
      ittOcStatus: str(raw, 'itt_oc_status'),
      availabilityToJoin: str(raw, 'availability_to_join'),
      degreeStatus: str(raw, 'degree_status'),
      expectedStipend: str(raw, 'expected_stipend'),
      priorExperience: str(raw, 'prior_experience'),
    });
  } else {
    Object.assign(data, {
      highestQualification: str(raw, 'highest_qualification'),
      domainExpertise: list(raw, 'domain_expertise'),
      noticePeriod: str(raw, 'notice_period'),
      currentEmployer: str(raw, 'current_employer'),
      yearsExperience: Number.parseFloat(str(raw, 'years_experience')) || 0,
      currentSalary: str(raw, 'current_salary'),
      expectedSalary: str(raw, 'expected_salary'),
    });
    if (position === 'audit_manager') data.auditTeamSize = str(raw, 'audit_team_size');
  }

  return { value: { position, fullName, email, mobileNumber, data }, errors };
}

const RESUME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/** Checks the file's real content (magic bytes), not just its name. */
export function detectResumeType(fileName: string, bytes: Uint8Array): string | null {
  const ext = fileName.toLowerCase().split('.').pop() ?? '';
  const startsWith = (sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (ext === 'pdf' && startsWith([0x25, 0x50, 0x44, 0x46])) return RESUME_TYPES.pdf;
  if (ext === 'doc' && startsWith([0xd0, 0xcf, 0x11, 0xe0])) return RESUME_TYPES.doc;
  if (ext === 'docx' && startsWith([0x50, 0x4b, 0x03, 0x04])) return RESUME_TYPES.docx;
  return null;
}

export function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(-120);
}
