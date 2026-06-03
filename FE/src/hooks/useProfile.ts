import { useState, useEffect, useCallback } from 'react';
import { userService } from '../services/api';
import { User, ActivityLog, PaginationInfo, UpdateProfileInput } from '../types/user';

export const useProfile = () => {
  const [profile, setProfile] = useState<User | null>(() => {
    const local = localStorage.getItem('user');
    try {
      return local ? JSON.parse(local) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityPagination, setActivityPagination] = useState<PaginationInfo | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.getProfile();
      if (res.success && res.data) {
        setProfile(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: UpdateProfileInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.updateProfile(data);
      if (res.success && res.data) {
        setProfile(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
        return res.data;
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.updateAvatar(file);
      if (res.success && res.data) {
        // Fetch profile to get fully updated fields
        await fetchProfile();
        return res.data;
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to upload avatar.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  const fetchActivityLogs = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.getActivityLogs({ page, limit });
      if (res.success) {
        setActivityLogs(res.data);
        setActivityPagination(res.meta?.pagination || null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch activity logs.');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setProfile(null);
  }, []);

  // Fetch profile automatically on mount if authenticated
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchProfile();
    }
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    activityLogs,
    activityPagination,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    fetchActivityLogs,
    logout,
  };
};

export default useProfile;
