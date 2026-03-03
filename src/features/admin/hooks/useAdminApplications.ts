import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { auth, db, googleProvider, storage } from '../../../firebase';
import type { ApplicationRecord, SortConfig } from '../../../types/admin';
import { getFirebaseAuthErrorMessage } from '../../../utils/firebaseAuthErrors';
import { normalizeText } from '../utils/applicationFormatting';

interface UseAdminApplicationsResult {
  user: User | null;
  loading: boolean;
  error: string | null;
  sortConfig: SortConfig;
  searchTerm: string;
  positionFilter: 'all' | 'article' | 'paid_assistant';
  applications: ApplicationRecord[];
  setSearchTerm: (value: string) => void;
  setPositionFilter: (value: 'all' | 'article' | 'paid_assistant') => void;
  setSortConfig: (value: SortConfig) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithCredentials: (email: string, password: string) => Promise<void>;
  signOutAdmin: () => Promise<void>;
  refreshApplications: () => Promise<void>;
}

const ADMIN_EMAIL = 'nitinjain@jainbafna.com';

/**
 * Handles admin authentication, data loading and dashboard filtering state.
 */
export function useAdminApplications(): UseAdminApplicationsResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [positionFilter, setPositionFilter] = useState<'all' | 'article' | 'paid_assistant'>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'submittedAt', direction: 'desc' });

  const refreshApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const recordsQuery = query(collection(db, 'applications'), orderBy('submittedAt', 'desc'));
      const querySnapshot = await getDocs(recordsQuery);

      const hydrated = await Promise.all(
        querySnapshot.docs.map(async (document) => {
          const data = document.data() as Omit<ApplicationRecord, 'id'>;
          let dynamicResumeUrl: string | null = null;

          if (data.resumeUrl && typeof data.resumeUrl === 'string') {
            dynamicResumeUrl = data.resumeUrl;
          } else if (data.resumePath && typeof data.resumePath === 'string') {
            try {
              dynamicResumeUrl = await getDownloadURL(ref(storage, data.resumePath));
            } catch (resumeError) {
              console.error('Could not fetch resume URL', data.resumePath, resumeError);
            }
          }

          return {
            id: document.id,
            ...data,
            dynamicResumeUrl,
          } satisfies ApplicationRecord;
        }),
      );

      setApplications(hydrated);
    } catch (fetchError) {
      console.error('Error fetching applications', fetchError);
      setError('Could not fetch applications. You may not have permission.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && currentUser.email === ADMIN_EMAIL) {
        setUser(currentUser);
        await refreshApplications();
        return;
      }

      setUser(null);
      setLoading(false);

      if (currentUser) {
        setError('Access denied. Please sign in with the authorized admin account.');
        await signOut(auth);
      }
    });

    return () => unsubscribe();
  }, [refreshApplications]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (signInError) {
      const host = typeof window === 'undefined' ? 'this domain' : window.location.hostname;
      setError(getFirebaseAuthErrorMessage(signInError, host));
    }
  }, []);

  const signInWithCredentials = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError('Username/email and password are required.');
      return;
    }

    setError(null);
    try {
      await signInWithEmailAndPassword(auth, normalizedEmail, password);
    } catch (signInError) {
      const host = typeof window === 'undefined' ? 'this domain' : window.location.hostname;
      setError(getFirebaseAuthErrorMessage(signInError, host));
    }
  }, []);

  const signOutAdmin = useCallback(async () => {
    await signOut(auth);
  }, []);

  const filteredApplications = useMemo(() => {
    const queryText = normalizeText(searchTerm);
    const searched = applications.filter((application) => {
      const name = normalizeText(application.fullName);
      const email = normalizeText(application.email);
      const position = normalizeText(application.position);
      const matchesSearch = !queryText || name.includes(queryText) || email.includes(queryText) || position.includes(queryText);
      const matchesPosition = positionFilter === 'all' || application.position === positionFilter;
      return matchesSearch && matchesPosition;
    });

    return [...searched].sort((left, right) => {
      const leftValue = left[sortConfig.key];
      const rightValue = right[sortConfig.key];

      const mapValue = (value: unknown): string | number => {
        if (sortConfig.key === 'submittedAt') {
          return value && typeof (value as { toMillis?: () => number }).toMillis === 'function'
            ? (value as { toMillis: () => number }).toMillis()
            : 0;
        }
        if (typeof value === 'string') return value.toLowerCase();
        return '';
      };

      const normalizedLeft = mapValue(leftValue);
      const normalizedRight = mapValue(rightValue);

      if (normalizedLeft < normalizedRight) return sortConfig.direction === 'asc' ? -1 : 1;
      if (normalizedLeft > normalizedRight) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [applications, positionFilter, searchTerm, sortConfig]);

  return {
    user,
    loading,
    error,
    sortConfig,
    searchTerm,
    positionFilter,
    applications: filteredApplications,
    setSearchTerm,
    setPositionFilter,
    setSortConfig,
    signInWithGoogle,
    signInWithCredentials,
    signOutAdmin,
    refreshApplications,
  };
}
