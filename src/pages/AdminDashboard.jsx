import React, { useState, useEffect } from 'react';
import { db, auth, storage, googleProvider } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { ShieldAlert, LogOut, ArrowUpDown, ExternalLink, X, Loader2 } from 'lucide-react';

const ADMIN_EMAIL = 'nitinjain@jainbafna.com';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'submittedAt', direction: 'desc' });
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.email === ADMIN_EMAIL) {
        setUser(currentUser);
        fetchApplications();
      } else {
        setUser(null);
        setLoading(false);
        if (currentUser) {
          setError('Access Denied. Please sign in with the authorized admin account.');
          signOut(auth);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(`Sign-in Error: ${err.message}`);
    }
  };

  const handleSignOut = () => signOut(auth);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "applications"), orderBy("submittedAt", "desc"));
      const querySnapshot = await getDocs(q);

      const appsData = await Promise.all(querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        let downloadUrl = null;

        // Backwards compatibility: if resumeUrl exists, use it.
        // Otherwise, fetch it dynamically using the resumePath.
        if (data.resumeUrl) {
          downloadUrl = data.resumeUrl;
        } else if (data.resumePath) {
          try {
            downloadUrl = await getDownloadURL(ref(storage, data.resumePath));
          } catch (e) {
            console.error("Could not fetch resume URL for", data.resumePath, e);
          }
        }

        return { id: doc.id, ...data, dynamicResumeUrl: downloadUrl };
      }));

      setApplications(appsData);
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError('Could not fetch applications. You may not have permission.');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedApplications = React.useMemo(() => {
    let sortableApps = [...applications];
    if (sortConfig.key) {
      sortableApps.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'submittedAt') {
          aValue = aValue?.toMillis() || 0;
          bValue = bValue?.toMillis() || 0;
        } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableApps;
  }, [applications, sortConfig]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md text-center">
          <ShieldAlert className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
          <p className="text-gray-500 mb-6">Please sign in with your authorized Google account to view applications.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm text-left">
              {error}
            </div>
          )}

          <button
            onClick={handleSignIn}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign in as Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <ShieldAlert className="w-6 h-6 text-indigo-400 mr-2" />
              <span className="text-white font-bold text-lg tracking-wide">Admin Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300 text-sm hidden sm:block">Welcome, {user.displayName}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center text-sm font-medium text-gray-300 hover:text-white px-3 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Received Applications</h1>
            <p className="mt-2 text-sm text-gray-700">A list of all candidates who have applied.</p>
          </div>
          <div className="mt-4 sm:mt-0">
             <button
               onClick={fetchApplications}
               className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
             >
               Refresh Data
             </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
            {error}
          </div>
        )}

        {sortedApplications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <p className="text-gray-500 text-lg">No applications found.</p>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('submittedAt')}>
                      <div className="flex items-center">Date <ArrowUpDown className="ml-1 w-3 h-3" /></div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('fullName')}>
                      <div className="flex items-center">Name <ArrowUpDown className="ml-1 w-3 h-3" /></div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('position')}>
                      <div className="flex items-center">Position <ArrowUpDown className="ml-1 w-3 h-3" /></div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resume
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {app.submittedAt ? app.submittedAt.toDate().toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {app.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${app.position === 'article' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                          {app.position === 'article' ? 'Article Assistant' : 'Paid Assistant'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {app.dynamicResumeUrl ? (
                          <a href={app.dynamicResumeUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900 inline-flex items-center">
                            View <ExternalLink className="ml-1 w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setSelectedApp(null)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start border-b border-gray-200 pb-4 mb-5">
                  <h3 className="text-xl leading-6 font-semibold text-gray-900" id="modal-title">
                    Application Details
                  </h3>
                  <button onClick={() => setSelectedApp(null)} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Personal Info */}
                  <div>
                    <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3">Personal Information</h4>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                      <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Full Name</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.fullName}</dd></div>
                      <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Date of Birth</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.dob || 'N/A'}</dd></div>
                      <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Email</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.email}</dd></div>
                      <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Mobile</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.mobileNumber}</dd></div>
                      <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Current Area</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.currentLocation || 'N/A'}</dd></div>
                      <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">LinkedIn</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.linkedinUrl ? <a href={selectedApp.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 break-all">{selectedApp.linkedinUrl}</a> : 'N/A'}</dd></div>
                      <div className="sm:col-span-2"><dt className="text-sm font-medium text-gray-500">Current Address</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.address}</dd></div>
                      <div className="sm:col-span-2"><dt className="text-sm font-medium text-gray-500">Hometown Address</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.hometownAddress || 'N/A'}</dd></div>
                      <div className="sm:col-span-2"><dt className="text-sm font-medium text-gray-500">Willing to Travel</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.willingToTravel || 'N/A'}</dd></div>
                    </dl>
                  </div>

                  {/* Experience Info */}
                  <div className="border-t border-gray-200 pt-5">
                    <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3">
                      {selectedApp.position === 'paid_assistant' ? 'Professional Experience' : 'Articleship Details'}
                    </h4>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                      {selectedApp.position === 'paid_assistant' ? (
                        <>
                          <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Highest Qualification</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.highestQualification || 'N/A'}</dd></div>
                          <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Domain Expertise</dt><dd className="mt-1 text-sm text-gray-900">{(selectedApp.domainExpertise || []).join(', ') || 'N/A'}</dd></div>
                          <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Current/Last Employer</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.currentEmployer || 'N/A'}</dd></div>
                          <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Years of Experience</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.yearsExperience || '0'}</dd></div>
                          <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Current CTC</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.currentSalary || 'N/A'}</dd></div>
                          <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Expected CTC</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.expectedSalary || 'N/A'}</dd></div>
                          <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Notice Period</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.noticePeriod || 'N/A'}</dd></div>
                        </>
                      ) : (
                        <>
                          <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">CA Inter Status</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.caStatus || 'N/A'}</dd></div>
                          <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">CA Inter Attempts</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.caAttempts || 'N/A'}</dd></div>
                          <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">ITT & OC Status</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.ittOcStatus || 'N/A'}</dd></div>
                          <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">B.Com/Degree Status</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.degreeStatus || 'N/A'}</dd></div>
                          <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Expected Stipend</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.expectedStipend || 'N/A'}</dd></div>
                          <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Availability to Join</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.availabilityToJoin || 'N/A'}</dd></div>
                          <div className="sm:col-span-2"><dt className="text-sm font-medium text-gray-500">Prior Experience</dt><dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedApp.priorExperience || 'N/A'}</dd></div>
                        </>
                      )}
                    </dl>
                  </div>

                  {/* Skills */}
                  <div className="border-t border-gray-200 pt-5">
                    <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3">Skills & Qualifications</h4>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                      <div className="sm:col-span-2"><dt className="text-sm font-medium text-gray-500">Additional Qualifications / Certifications</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.qualifications || 'N/A'}</dd></div>
                      <div className="sm:col-span-2"><dt className="text-sm font-medium text-gray-500">Accounting Platforms</dt><dd className="mt-1 text-sm text-gray-900">{(selectedApp.platforms || []).join(', ') || 'None'}</dd></div>
                      <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">MS Excel</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.excelSkill}</dd></div>
                      <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">MS Word</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.wordSkill}</dd></div>
                      <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">MS PowerPoint</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.powerpointSkill}</dd></div>
                      <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">How Heard</dt><dd className="mt-1 text-sm text-gray-900">{selectedApp.howHeard || 'N/A'}</dd></div>
                    </dl>
                  </div>

                  {/* Motivation */}
                  <div className="border-t border-gray-200 pt-5">
                    <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3">Motivation</h4>
                    <div className="space-y-4">
                      <div><h5 className="text-sm font-medium text-gray-500">Strengths & Weaknesses</h5><p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded">{selectedApp.strengthsWeaknesses}</p></div>
                      <div><h5 className="text-sm font-medium text-gray-500">Contribution</h5><p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded">{selectedApp.contribution}</p></div>
                    </div>
                  </div>

                  {/* References */}
                  <div className="border-t border-gray-200 pt-5">
                    <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3">References</h4>
                    {(!selectedApp.references || selectedApp.references.length === 0) ? (
                      <p className="text-sm text-gray-500">None provided.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {selectedApp.references.map((ref, idx) => (
                          <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Reference {idx + 1}</h5>
                            <dl className="space-y-1 text-sm">
                              <div className="flex justify-between"><dt className="text-gray-500">Name:</dt><dd className="text-gray-900 font-medium">{ref.name || 'N/A'}</dd></div>
                              <div className="flex justify-between"><dt className="text-gray-500">Relationship:</dt><dd className="text-gray-900">{ref.relationship || 'N/A'}</dd></div>
                              <div className="flex justify-between"><dt className="text-gray-500">Contact:</dt><dd className="text-gray-900">{ref.contact || 'N/A'}</dd></div>
                              <div className="flex justify-between"><dt className="text-gray-500">Email:</dt><dd className="text-gray-900">{ref.email || 'N/A'}</dd></div>
                            </dl>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
