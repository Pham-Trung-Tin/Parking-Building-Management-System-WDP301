import { useState, useEffect, useCallback } from 'react';
import { userService } from '../services/api';
import { User, PaginationInfo, CreateUserInput, AdminUpdateUserInput, UserFilterParams } from '../types/user';

export const useUsers = (initialLimit = 10) => {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Overall stats state
  const [stats, setStats] = useState({
    activeCount: 0,
    suspendedCount: 0,
    totalRoles: 0,
  });

  const [filters, setFilters] = useState<UserFilterParams>({
    page: 1,
    limit: initialLimit,
    search: '',
    role: '',
    status: '',
  });

  const fetchStats = useCallback(async () => {
    try {
      const res = await userService.getUsers({ limit: 1000 });
      if (res.success) {
        const active = res.data.filter((u) => u.status === 'active').length;
        const suspended = res.data.filter((u) => u.status === 'blocked').length;
        const roles = new Set(res.data.map((u) => u.role)).size;
        setStats({
          activeCount: active,
          suspendedCount: suspended,
          totalRoles: roles,
        });
      }
    } catch (err: any) {
      console.log(err)
    }
  }, []);

  const fetchUsers = useCallback(async (customFilters?: UserFilterParams) => {
    setLoading(true);
    setError(null);
    try {
      const activeFilters = customFilters || filters;
      const res = await userService.getUsers(activeFilters);
      if (res.success) {
        setUsers(res.data);
        setPagination(res.meta?.pagination || null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = useCallback((newFilters: Partial<UserFilterParams>) => {
    setFilters((prev) => {
      const updated = { ...prev, ...newFilters };
      // If page isn't explicitly set, reset to page 1 on filter changes
      if (!newFilters.page) {
        updated.page = 1;
      }
      return updated;
    });
  }, []);

  const createUser = useCallback(async (data: CreateUserInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.createUser(data);
      if (res.success && res.data) {
        await fetchUsers();
        await fetchStats(); // Refresh stats on create
        return res.data;
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create user.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, fetchStats]);

  const updateUser = useCallback(async (id: string, data: AdminUpdateUserInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.adminUpdateUser(id, data);
      if (res.success && res.data) {
        setUsers((prev) => prev.map((u) => (u.id === id || u._id === id ? res.data : u)));
        await fetchStats(); // Refresh stats on update
        return res.data;
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update user.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchStats]);

  const deleteUser = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.deleteUser(id);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== id && u._id !== id));
        await fetchStats(); // Refresh stats on delete
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to delete user.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchStats]);

  const toggleBlockUser = useCallback(async (id: string, isBlocked: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const res = isBlocked
        ? await userService.unblockUser(id)
        : await userService.blockUser(id);

      if (res.success && res.data) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === id || u._id === id
              ? { ...u, status: res.data.status as any }
              : u
          )
        );
        await fetchStats(); // Refresh stats on block status change
        return res.data;
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to change user block status.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchStats]);

  // Fetch stats once on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Fetch users automatically when filters change
  useEffect(() => {
    fetchUsers(filters);
  }, [filters, fetchUsers]);

  return {
    users,
    pagination,
    loading,
    error,
    filters,
    stats,
    fetchUsers,
    updateFilters,
    createUser,
    updateUser,
    deleteUser,
    toggleBlockUser,
  };
};

export default useUsers;
