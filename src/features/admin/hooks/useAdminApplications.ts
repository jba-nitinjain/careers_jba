import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, apiGet, apiSend, errorMessage } from '../../../lib/api';
import type { AdminUser, ApplicationRecord, ApplicationStatus, PositionFilter, SortConfig } from '../../../types/admin';
import { normalizeText } from '../utils/applicationFormatting';

export interface ApplicationCounts {
  positions: Record<PositionFilter, number>;
  statuses: Record<ApplicationStatus | 'all', number>;
}

interface UseAdminApplicationsResult {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  sortConfig: SortConfig;
  searchTerm: string;
  positionFilter: PositionFilter;
  statusFilter: ApplicationStatus | 'all';
  applications: ApplicationRecord[];
  counts: ApplicationCounts;
  setSearchTerm: (value: string) => void;
  setPositionFilter: (value: PositionFilter) => void;
  setStatusFilter: (value: ApplicationStatus | 'all') => void;
  setSortConfig: (value: SortConfig) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOutAdmin: () => Promise<void>;
  refreshApplications: () => Promise<void>;
}

/**
 * Handles admin sign-in (checked by eAccountsApp on the server), data loading and dashboard filtering state.
 */
export function useAdminApplications(): UseAdminApplicationsResult {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [positionFilter, setPositionFilter] = useState<PositionFilter>('all');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'submittedAt', direction: 'desc' });

  const refreshApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiGet<{ applications: ApplicationRecord[] }>('/api/admin/applications');
      setApplications(result.applications);
    } catch (fetchError) {
      if (fetchError instanceof ApiError && fetchError.status === 401) {
        setUser(null);
        setError('Your session has ended. Please sign in again.');
      } else {
        setError(`Could not load applications. ${errorMessage(fetchError)}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiGet<AdminUser>('/api/auth/me')
      .then(async (me) => {
        if (cancelled) return;
        setUser(me);
        await refreshApplications();
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshApplications]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setError(null);
      try {
        const me = await apiSend<AdminUser>('/api/auth/login', 'POST', { email: email.trim().toLowerCase(), password });
        setUser(me);
        await refreshApplications();
      } catch (signInError) {
        setError(errorMessage(signInError));
      }
    },
    [refreshApplications],
  );

  const signOutAdmin = useCallback(async () => {
    await apiSend('/api/auth/logout', 'POST', {}).catch(() => undefined);
    setUser(null);
    setApplications([]);
  }, []);

  const { filteredList, counts } = useMemo(() => {
    const queryText = normalizeText(searchTerm);

    const positions: Record<PositionFilter, number> = { all: 0, article: 0, paid_assistant: 0, audit_manager: 0 };
    const statuses: Record<ApplicationStatus | 'all', number> = { all: 0, new: 0, called_for_interview: 0, selected: 0, rejected: 0 };
    const searched: ApplicationRecord[] = [];

    applications.forEach((application) => {
      const name = normalizeText(application.fullName);
      const email = normalizeText(application.email);
      const position = normalizeText(application.position);
      const matchesSearch = !queryText || name.includes(queryText) || email.includes(queryText) || position.includes(queryText);

      if (!matchesSearch) return;

      const appStatus = application.adminStatus || 'new';
      const isCurrentStatus = statusFilter === 'all' || appStatus === statusFilter;
      const isCurrentPosition = positionFilter === 'all' || application.position === positionFilter;

      if (isCurrentStatus) {
        positions.all++;
        if (application.position === 'article') positions.article++;
        if (application.position === 'paid_assistant') positions.paid_assistant++;
        if (application.position === 'audit_manager') positions.audit_manager++;
      }

      if (isCurrentPosition) {
        statuses.all++;
        if (appStatus === 'new') statuses.new++;
        if (appStatus === 'called_for_interview') statuses.called_for_interview++;
        if (appStatus === 'selected') statuses.selected++;
        if (appStatus === 'rejected') statuses.rejected++;
      }

      if (isCurrentPosition && isCurrentStatus) {
        searched.push(application);
      }
    });

    const sortedList = [...searched].sort((left, right) => {
      const leftValue = left[sortConfig.key];
      const rightValue = right[sortConfig.key];

      const mapValue = (value: unknown): string | number => {
        if (sortConfig.key === 'submittedAt') {
          return typeof value === 'string' ? Date.parse(value) || 0 : 0;
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

    return { filteredList: sortedList, counts: { positions, statuses } };
  }, [applications, positionFilter, statusFilter, searchTerm, sortConfig]);

  return {
    user,
    loading,
    error,
    sortConfig,
    searchTerm,
    positionFilter,
    statusFilter,
    applications: filteredList,
    counts,
    setSearchTerm,
    setPositionFilter,
    setStatusFilter,
    setSortConfig,
    signIn,
    signOutAdmin,
    refreshApplications,
  };
}
