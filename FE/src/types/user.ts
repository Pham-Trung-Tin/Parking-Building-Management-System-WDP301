export type UserRole = 'system_admin' | 'parking_manager' | 'parking_staff' | 'parking_user';

export type UserStatus = 'active' | 'inactive' | 'blocked' | 'pending';

export interface UserAvatar {
  url: string;
  publicId: string;
}

export interface User {
  id: string;
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: UserAvatar;
  avatarUrl: string;
  isEmailVerified: boolean;
  status: UserStatus;
  assignedParkingLot?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta?: {
    pagination: PaginationInfo;
  };
}

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  password?: string;
  role: string; // Will allow string for flexible select binding
  phone?: string;
  assignedParkingLot?: string;
}

export interface AdminUpdateUserInput {
  fullName?: string;
  role?: string;
  phone?: string;
  assignedParkingLot?: string;
  status?: string;
}

export interface UserFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface ActivityLog {
  id: string;
  _id: string;
  user: string;
  action: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
