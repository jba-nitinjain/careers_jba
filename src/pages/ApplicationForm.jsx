import React, { useState } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { apiUpload, errorMessage } from '../lib/api';

const MAX_RESUME_BYTES = 4 * 1024 * 1024;

const EXPERIENCED_POSITIONS = ['paid_assistant', 'audit_manager'];

const EMPTY_FORM = {
  full_name: '', email: '', mobile_number: '', address: '', hometown_address: '', same_address: false,
  dob: '', current_location: '', linkedin_url: '', willing_to_travel: '',
  position: '', ca_status: '', ca_attempts: '', itt_oc_status: '', availability_to_join: '', degree_status: '',
  highest_qualification: '', other_qualifications: '', notice_period: '', domain_expertise: [],
  current_employer: '', years_experience: '', current_salary: '', expected_salary: '', audit_team_size: '',
  expected_stipend: '', prior_experience: '',
  platforms: [], other_platform: '',
  excel_skill: '', word_skill: '', powerpoint_skill: '',
  strengths_weaknesses: '', contribution: '',
  how_heard: '', how_heard_other: '',
  ref1_name: '', ref1_relationship: '', ref1_contact: '', ref1_email: '',
  ref2_name: '', ref2_relationship: '', ref2_contact: '', ref2_email: '',
};

// Latest acceptable date of birth (applicant at least 16 years old), as yyyy-mm-dd for the date picker.
const MAX_DOB = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 16);
  return d.toISOString().slice(0, 10);
})();

/** Capitalises the first letter of each word, leaving the rest as typed (keeps "McDonald", "R.K."). */
const capitaliseWords = (value) => value.replace(/(^|\s)(\S)/g, (_, space, ch) => space + ch.toUpperCase());

const InputField = ({ label, id, type = 'text', required, pattern, value, onChange, onBlur, placeholder, error, max }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      id={id}
      name={id}
      required={required}
      pattern={pattern}
      max={max}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
    />
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

const SelectField = ({ label, id, required, options, value, onChange }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      id={id}
      name={id}
      required={required}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
    >
      <option value="" disabled>Select...</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const TextAreaField = ({ label, id, required, rows = 3, value, onChange, placeholder, disabled }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      id={id}
      name={id}
      required={required}
      rows={rows}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
    />
  </div>
);

const ApplicationForm = () => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [honeypot, setHoneypot] = useState('');

  const [resumeFile, setResumeFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'current_salary' || name === 'expected_salary' || name === 'expected_stipend') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else if (name === 'mobile_number' || name === 'ref1_contact' || name === 'ref2_contact') {
      const numericValue = value.replace(/[^0-9]/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else if (type === 'checkbox' && name === 'platforms') {
      if (checked) {
        setFormData(prev => ({ ...prev, platforms: [...prev.platforms, value] }));
      } else {
        setFormData(prev => ({ ...prev, platforms: prev.platforms.filter(p => p !== value) }));
      }
    } else if (type === 'checkbox' && name === 'same_address') {
      setFormData(prev => ({
        ...prev,
        same_address: checked,
        hometown_address: checked ? prev.address : ''
      }));
    } else if (name === 'address') {
      setFormData(prev => ({
        ...prev,
        address: value,
        hometown_address: prev.same_address ? value : prev.hometown_address
      }));
    } else if (type === 'checkbox' && name === 'domain_expertise') {
      if (checked) {
        setFormData(prev => ({ ...prev, domain_expertise: [...prev.domain_expertise, value] }));
      } else {
        setFormData(prev => ({ ...prev, domain_expertise: prev.domain_expertise.filter(d => d !== value) }));
      }
    } else if (name === 'full_name') {
      setFormData(prev => ({ ...prev, [name]: capitaliseWords(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEmailBlur = (e) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (e.target.value && !emailRegex.test(e.target.value)) {
      setEmailError('Please enter a valid email address.');
    } else {
      setEmailError('');
    }
  };

  const handleMobileBlur = (e) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    if (e.target.value && !mobileRegex.test(e.target.value)) {
      setMobileError('Mobile number must be 10 digits starting with 6, 7, 8, or 9.');
    } else {
      setMobileError('');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > MAX_RESUME_BYTES) {
        setFileError('File size must be less than 4 MB');
        setResumeFile(null);
        e.target.value = ''; // Reset input
      } else {
        setFileError('');
        setResumeFile(file);
      }
    }
  };

  const performSubmission = async () => {
    try {
      // The server validates and maps these fields; only the raw form state is sent.
      const form = new FormData();
      form.append('payload', JSON.stringify(formData));
      form.append('resume', resumeFile);
      form.append('website', honeypot);
      await apiUpload('/api/applications', form);

      setFormData(EMPTY_FORM);
      setResumeFile(null);
      setFileError('');
      setEmailError('');
      setMobileError('');
      const resumeInput = document.getElementById('resume');
      if (resumeInput) resumeInput.value = '';

      setShowSuccessPopup(true);
    } catch (error) {
      setSubmitStatus({ type: 'error', message: errorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (emailError || mobileError) {
      setSubmitStatus({ type: 'error', message: 'Please fix the errors before submitting.' });
      return;
    }

    if (formData.platforms.length === 0) {
      setSubmitStatus({ type: 'error', message: 'Please select at least one accounting platform.' });
      return;
    }
    if (!resumeFile) {
      setSubmitStatus({ type: 'error', message: 'Please upload your resume.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: '', message: '' });

    await performSubmission();
  };

  const platformsList = ["Tally", "QuickBooks", "Zoho Books", "SAP", "Busy", "Other", "None yet"];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <a href="https://jainbafna.com" className="inline-flex items-center gap-3 mb-6">
            <img src="/images/ca_logo.png" alt="CA India logo" className="h-12 w-auto" />
            <span className="text-left leading-tight">
              <span className="block font-serif text-xl font-bold text-indigo-600">Jain Bafna &amp; Associates</span>
              <span className="block text-xs uppercase tracking-widest text-gray-500">Chartered Accountants · Est. 1982</span>
            </span>
          </a>
          <h1 className="text-4xl font-bold text-indigo-600 sm:text-5xl text-balance">
            Build Your CA Career With Us
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            A Chennai firm of Chartered Accountants since 1982, led by six partners. We are hiring Article Clerks, Paid Assistants and Audit Managers at our Chennai Head Office.
          </p>
        </div>

        {/* Why join */}
        <section aria-labelledby="why-join" className="mb-10 space-y-6">
          <div className="bg-white px-6 py-8 shadow sm:rounded-lg">
            <h2 id="why-join" className="text-2xl font-bold text-indigo-600 mb-5">Why join Jain Bafna &amp; Associates</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <dt className="text-sm font-semibold text-gray-900">Over 40 years in practice</dt>
                <dd className="mt-1 text-sm text-gray-600">Established in 1982, with a steady client base built over four decades.</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-gray-900">Learn directly from six partners</dt>
                <dd className="mt-1 text-sm text-gray-600">Work alongside experienced partners and get guidance on real client work from day one.</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-gray-900">Broad practical exposure</dt>
                <dd className="mt-1 text-sm text-gray-600">Statutory audit, tax audit, income tax, GST and accounting work, all under one roof.</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-gray-900">Clear working hours</dt>
                <dd className="mt-1 text-sm text-gray-600">09:30 AM to 06:00 PM, Monday to Saturday, at our Chennai Head Office.</dd>
              </div>
            </dl>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white px-5 py-6 shadow sm:rounded-lg">
              <h3 className="font-serif text-xl font-bold text-indigo-600">Article Clerk</h3>
              <p className="mt-2 text-sm text-gray-600">Two-year articleship for CA Intermediate students who have completed their exams.</p>
              <p className="mt-2 text-sm text-gray-600">Stipend as per industry standards, with an increase in the second year.</p>
            </div>
            <div className="bg-white px-5 py-6 shadow sm:rounded-lg">
              <h3 className="font-serif text-xl font-bold text-indigo-600">Paid Assistant</h3>
              <p className="mt-2 text-sm text-gray-600">For candidates with accounting, audit or tax experience who want to grow in a practising firm.</p>
              <p className="mt-2 text-sm text-gray-600">Salary based on experience.</p>
            </div>
            <div className="bg-white px-5 py-6 shadow sm:rounded-lg">
              <h3 className="font-serif text-xl font-bold text-indigo-600">Audit Manager</h3>
              <p className="mt-2 text-sm text-gray-600">For qualified or semi-qualified professionals ready to lead audit teams and handle client engagements.</p>
              <p className="mt-2 text-sm text-gray-600">Salary based on experience.</p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500">Applying takes about 5 minutes. Keep your resume (PDF or Word, under 4 MB) ready.</p>
        </section>

        {submitStatus.message && (
          <div className={`mb-6 p-4 rounded-md flex items-start ${submitStatus.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {submitStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" /> : <XCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />}
            <p className="text-sm font-medium">{submitStatus.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hidden from people; bots that fill every field are silently ignored. */}
          <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
            <label htmlFor="website">Website</label>
            <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </div>

          {/* Section 1: Personal Info */}
          <div className="bg-white px-6 py-8 shadow sm:rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-6">1. Personal Information</h2>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <InputField label="Full Name" id="full_name" required value={formData.full_name} onChange={handleChange} />
              <InputField label="Date of Birth" id="dob" type="date" required max={MAX_DOB} value={formData.dob} onChange={handleChange} />
              <InputField
                label="Email Address"
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                onBlur={handleEmailBlur}
                error={emailError}
              />
              <InputField
                label="Mobile Number"
                id="mobile_number"
                type="tel"
                required
                pattern="[6-9][0-9]{9}"
                placeholder="10-digit number"
                value={formData.mobile_number}
                onChange={handleChange}
                onBlur={handleMobileBlur}
                error={mobileError}
              />

              <InputField label="Current Area/Locality in Chennai (e.g., T. Nagar, Adyar)" id="current_location" required value={formData.current_location} onChange={handleChange} />
              <InputField label="LinkedIn Profile URL" id="linkedin_url" type="url" value={formData.linkedin_url} onChange={handleChange} />

              <div className="sm:col-span-2">
                <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-1">Upload Resume <span className="text-red-500">*</span></label>
                <input type="file" id="resume" accept=".pdf,.doc,.docx" required onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-gray-300 rounded-md shadow-sm" />
                <p className="mt-1 text-xs text-gray-500">PDF or Word, under 4 MB.</p>
                {fileError && <p className="mt-2 text-sm text-red-600">{fileError}</p>}
              </div>

              <div className="sm:col-span-2">
                <span className="block text-sm font-medium text-gray-700 mb-2">Willingness to Travel for Outstation Audits <span className="text-red-500">*</span></span>
                <div className="flex space-x-6">
                  <label className="flex items-center">
                    <input type="radio" name="willing_to_travel" value="Yes" required checked={formData.willing_to_travel === 'Yes'} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="willing_to_travel" value="No" required checked={formData.willing_to_travel === 'No'} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                    <span className="ml-2 text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Position & Education */}
          <div className="bg-white px-6 py-8 shadow sm:rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-6">2. Position & Education</h2>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <SelectField
                label="Position Applied For"
                id="position"
                required
                value={formData.position}
                onChange={handleChange}
                options={[
                  { value: 'article', label: 'Article Clerk (Articleship)' },
                  { value: 'paid_assistant', label: 'Paid Assistant' },
                  { value: 'audit_manager', label: 'Audit Manager' }
                ]}
              />

              {formData.position === 'article' && (
                <>
                  <SelectField
                    label="CA Intermediate Status"
                    id="ca_status"
                    required
                    value={formData.ca_status}
                    onChange={handleChange}
                    options={[
                      { value: 'Both Groups Cleared', label: 'Both Groups Cleared' },
                      { value: 'Group 1 Cleared', label: 'Group 1 Cleared' },
                      { value: 'Group 2 Cleared', label: 'Group 2 Cleared' },
                      { value: 'Pursuing', label: 'Pursuing' }
                    ]}
                  />
                  <SelectField
                    label="Number of Attempts in CA Intermediate"
                    id="ca_attempts"
                    required
                    value={formData.ca_attempts}
                    onChange={handleChange}
                    options={[
                      { value: '1', label: '1' },
                      { value: '2', label: '2' },
                      { value: '3', label: '3' },
                      { value: '4+', label: '4+' }
                    ]}
                  />
                  <SelectField
                    label="ICITSS (ITT & OC) Status"
                    id="itt_oc_status"
                    required
                    value={formData.itt_oc_status}
                    onChange={handleChange}
                    options={[
                      { value: 'Completed', label: 'Completed' },
                      { value: 'Ongoing', label: 'Ongoing' },
                      { value: 'Pending', label: 'Pending' }
                    ]}
                  />
                  <SelectField
                    label="B.Com / Degree Status"
                    id="degree_status"
                    required
                    value={formData.degree_status}
                    onChange={handleChange}
                    options={[
                      { value: 'Pursuing Regular', label: 'Pursuing Regular' },
                      { value: 'Pursuing Correspondence', label: 'Pursuing Correspondence' },
                      { value: 'Completed', label: 'Completed' },
                      { value: 'Not Pursuing', label: 'Not Pursuing' }
                    ]}
                  />
                  <SelectField
                    label="Availability to Join"
                    id="availability_to_join"
                    required
                    value={formData.availability_to_join}
                    onChange={handleChange}
                    options={[
                      { value: 'Immediate', label: 'Immediate' },
                      { value: 'Within 15 days', label: 'Within 15 days' },
                      { value: 'Within 1 month', label: 'Within 1 month' }
                    ]}
                  />
                </>
              )}

              {EXPERIENCED_POSITIONS.includes(formData.position) && (
                <SelectField
                  label="Highest Qualification"
                  id="highest_qualification"
                  required
                  value={formData.highest_qualification}
                  onChange={handleChange}
                  options={[
                    { value: 'CA Qualified', label: 'CA Qualified' },
                    { value: 'CA Semi-Qualified / Finalist', label: 'CA Semi-Qualified / Finalist' },
                    { value: 'CA Intermediate', label: 'CA Intermediate' },
                    { value: 'CMA', label: 'CMA' },
                    { value: 'CS', label: 'CS' },
                    { value: 'MBA', label: 'MBA' },
                    { value: 'M.Com', label: 'M.Com' },
                    { value: 'B.Com', label: 'B.Com' }
                  ]}
                />
              )}

              <div className="sm:col-span-2">
                <TextAreaField label="Additional Qualifications / Certifications (optional)" id="other_qualifications" rows={2} value={formData.other_qualifications} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Section 3: Conditional Experience */}
          {EXPERIENCED_POSITIONS.includes(formData.position) && (
            <div className="bg-white px-6 py-8 shadow sm:rounded-lg transition-all duration-300">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-6">3. Professional Experience</h2>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Core Domain Expertise <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {['Statutory Audit', 'Tax Audit', 'Internal Audit', 'Bank Audit', 'Direct Tax', 'GST', 'TDS / Payroll', 'Transfer Pricing', 'ROC/Secretarial', 'Accounting'].map(domain => (
                      <label key={domain} className="inline-flex items-center">
                        <input type="checkbox" name="domain_expertise" value={domain} checked={formData.domain_expertise.includes(domain)} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                        <span className="ml-2 text-sm text-gray-700">{domain}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <InputField label="Current / Last Employer" id="current_employer" required value={formData.current_employer} onChange={handleChange} />
                <InputField label="Total Years of Experience" id="years_experience" type="number" required value={formData.years_experience} onChange={handleChange} />

                <SelectField
                  label="Notice Period"
                  id="notice_period"
                  required
                  value={formData.notice_period}
                  onChange={handleChange}
                  options={[
                    { value: 'Immediate', label: 'Immediate' },
                    { value: '15 Days', label: '15 Days' },
                    { value: '30 Days', label: '30 Days' },
                    { value: '60 Days', label: '60 Days' },
                    { value: '90 Days', label: '90 Days' }
                  ]}
                />
                <InputField label="Current CTC (Per Annum)" id="current_salary" required value={formData.current_salary} onChange={handleChange} />
                <InputField label="Expected CTC (Per Annum)" id="expected_salary" required value={formData.expected_salary} onChange={handleChange} />
                {formData.position === 'audit_manager' && (
                  <InputField label="Largest audit team you have led (number of people)" id="audit_team_size" type="number" value={formData.audit_team_size} onChange={handleChange} />
                )}
              </div>
            </div>
          )}

          {formData.position === 'article' && (
            <div className="bg-white px-6 py-8 shadow sm:rounded-lg transition-all duration-300">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-6">3. Articleship Details</h2>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <TextAreaField label="Any prior internship experience? (If none, write 'N/A')" id="prior_experience" required rows={3} value={formData.prior_experience} onChange={handleChange} />
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Skills & Motivation */}
          <div className="bg-white px-6 py-8 shadow sm:rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-6">4. Core Skills & Motivation</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Proficient accounting platforms? <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {platformsList.map(platform => (
                  <label key={platform} className="inline-flex items-center">
                    <input type="checkbox" name="platforms" value={platform} checked={formData.platforms.includes(platform)} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                    <span className="ml-2 text-sm text-gray-700">{platform}</span>
                  </label>
                ))}
              </div>
              {formData.platforms.includes('Other') && (
                <div className="mt-3">
                  <InputField label="Please specify:" id="other_platform" required value={formData.other_platform} onChange={handleChange} />
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">MS Office Proficiency <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {['excel_skill', 'word_skill', 'powerpoint_skill'].map((skillType, idx) => {
                  const labels = ['MS Excel', 'MS Word', 'MS PowerPoint'];
                  return (
                    <div key={skillType}>
                      <span className="block text-sm font-medium text-gray-600 mb-2">{labels[idx]}</span>
                      <div className="space-y-2">
                        {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                          <label key={level} className="flex items-center">
                            <input type="radio" name={skillType} value={level} required checked={formData[skillType] === level} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                            <span className="ml-2 text-sm text-gray-700">{level}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <TextAreaField label="Strengths & Weaknesses (optional)" id="strengths_weaknesses" rows={4} value={formData.strengths_weaknesses} onChange={handleChange} />
              <TextAreaField label="How will you contribute to the organisation? (optional)" id="contribution" rows={4} value={formData.contribution} onChange={handleChange} />

              <div>
                <SelectField
                  label="Where did you get to know about us from?"
                  id="how_heard"
                  required
                  value={formData.how_heard}
                  onChange={handleChange}
                  options={[
                    { value: 'LinkedIn', label: 'LinkedIn' },
                    { value: 'Firm Website', label: 'Firm Website' },
                    { value: 'ICAI / BOS Portal', label: 'ICAI / BOS Portal' },
                    { value: 'Naukri / Indeed', label: 'Naukri / Indeed' },
                    { value: 'College / Coaching Institute', label: 'College / Coaching Institute' },
                    { value: 'Current Employee', label: 'Current Employee' },
                    { value: 'Social Media', label: 'Social Media' },
                    { value: 'Friends', label: 'Friends' },
                    { value: 'Family', label: 'Family' },
                    { value: 'Other', label: 'Other' }
                  ]}
                />
                {formData.how_heard === 'Other' && (
                  <div className="mt-3">
                    <InputField label="Please specify:" id="how_heard_other" required value={formData.how_heard_other} onChange={handleChange} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 5: References */}
          <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <details className="group">
              <summary className="flex justify-between items-center font-semibold cursor-pointer list-none px-6 py-5 hover:bg-gray-50 text-gray-900 text-xl">
                <span>5. References (Optional)</span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="text-neutral-600 mt-3 group-open:animate-fadeIn px-6 pb-8">
                <p className="text-sm text-gray-500 mb-4">Please provide up to two professional or academic references.</p>

                <div className="mb-6">
                  <h6 className="text-md font-medium text-gray-800 mb-3 border-b pb-1">Reference 1</h6>
                  <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                    <InputField label="Name" id="ref1_name" value={formData.ref1_name} onChange={handleChange} />
                    <InputField label="Relationship" id="ref1_relationship" value={formData.ref1_relationship} onChange={handleChange} />
                    <InputField label="Contact Number" id="ref1_contact" type="tel" pattern="[6-9][0-9]{9}" value={formData.ref1_contact} onChange={handleChange} />
                    <InputField label="Email" id="ref1_email" type="email" value={formData.ref1_email} onChange={handleChange} />
                  </div>
                </div>

                <div>
                  <h6 className="text-md font-medium text-gray-800 mb-3 border-b pb-1">Reference 2</h6>
                  <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                    <InputField label="Name" id="ref2_name" value={formData.ref2_name} onChange={handleChange} />
                    <InputField label="Relationship" id="ref2_relationship" value={formData.ref2_relationship} onChange={handleChange} />
                    <InputField label="Contact Number" id="ref2_contact" type="tel" pattern="[6-9][0-9]{9}" value={formData.ref2_contact} onChange={handleChange} />
                    <InputField label="Email" id="ref2_email" type="email" value={formData.ref2_email} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </details>
          </div>

          <p className="text-xs text-gray-500">
            By submitting, you agree that Jain Bafna &amp; Associates may store and use the details and resume you provide only to consider you for roles at the firm. To ask for your data to be deleted, email nitinjain@jainbafna.com.
          </p>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Processing...
                </>
              ) : 'Submit Application'}
            </button>
          </div>

        </form>
      </div>

      {/* Success Popup Overlay */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50 transition-opacity">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center transform transition-all animate-fadeIn">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Application Submitted!</h3>
            <p className="text-gray-600 mb-3">
              Thank you for applying to Jain Bafna & Associates. We have received your application successfully and will get back to you shortly.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              A confirmation has been sent to your email. If you don't see it, please check your Spam folder.
            </p>
            <button
              onClick={() => setShowSuccessPopup(false)}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationForm;
