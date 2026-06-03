import axiosClient from './axiosClient';
import {
  User,
  ActivityLog,
  ApiResponse,
  PaginatedResponse,
  UpdateProfileInput,
  CreateUserInput,
  AdminUpdateUserInput,
  UserFilterParams,
} from '../../types/user';

const userService = {
  /**
   * Get my profile
   * GET /users/profile
   */
  getProfile: (): Promise<ApiResponse<User>> => {
    return axiosClient.get('/users/profile');
  },

  /**
   * Update my profile (self)
   * PUT /users/profile
   */
  updateProfile: (data: UpdateProfileInput): Promise<ApiResponse<User>> => {
    return axiosClient.put('/users/profile', data);
  },

  /**
   * Update profile avatar (self)
   * PUT /users/avatar
   */
  updateAvatar: (avatarFile: File): Promise<ApiResponse<{ avatar: string }>> => {
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    return axiosClient.put('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Get my activity logs
   * GET /users/my-activity
   */
  getActivityLogs: (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<ActivityLog>> => {
    return axiosClient.get('/users/my-activity', { params });
  },

  /**
   * Get all users (admin only)
   * GET /users
   */
  getUsers: (params?: UserFilterParams): Promise<PaginatedResponse<User>> => {
    return axiosClient.get('/users', { params });
  },

  /**
   * Create user (admin only)
   * POST /users
   */
  createUser: (data: CreateUserInput): Promise<ApiResponse<User>> => {
    return axiosClient.post('/users', data);
  },

  /**
   * Get user by ID (admin only)
   * GET /users/:id
   */
  getUserById: (id: string): Promise<ApiResponse<User>> => {
    return axiosClient.get(`/users/${id}`);
  },

  /**
   * Update user (admin only)
   * PUT /users/:id
   */
  adminUpdateUser: (id: string, data: AdminUpdateUserInput): Promise<ApiResponse<User>> => {
    return axiosClient.put(`/users/${id}`, data);
  },

  /**
   * Delete user (admin only)
   * DELETE /users/:id
   */
  deleteUser: (id: string): Promise<ApiResponse<null>> => {
    return axiosClient.delete(`/users/${id}`);
  },

  /**
   * Block user (admin only)
   * PATCH /users/:id/block
   */
  blockUser: (id: string): Promise<ApiResponse<{ status: string }>> => {
    return axiosClient.patch(`/users/${id}/block`);
  },

  /**
   * Unblock user (admin only)
   * PATCH /users/:id/unblock
   */
  unblockUser: (id: string): Promise<ApiResponse<{ status: string }>> => {
    return axiosClient.patch(`/users/${id}/unblock`);
  },

  /**
   * Get user activity logs (admin only)
   * GET /users/:id/activity-logs
   */
  getUserActivityLogs: (
    id: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<ActivityLog>> => {
    return axiosClient.get(`/users/${id}/activity-logs`, { params });
  },
};

export default userService;
