import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * GuestRoute: Allows only unauthenticated users.
 * If logged in: redirects admins to /admin, and customers to /
 */
export const GuestRoute: React.FC = () => {
  const token = localStorage.getItem('accessToken');
  const userJson = localStorage.getItem('user');

  if (token && userJson) {
    try {
      const user = JSON.parse(userJson);
      if (['system_admin', 'parking_manager', 'parking_staff'].includes(user.role)) {
        return <Navigate to="/admin" replace />;
      }
      return <Navigate to="/" replace />;
    } catch {
      // If parsing fails, treat as guest
    }
  }

  return <Outlet />;
};

/**
 * CustomerRoute: Allows guests and standard users (drivers).
 * If logged in as admin/staff/manager: redirects them to /admin
 */
export const CustomerRoute: React.FC = () => {
  const userJson = localStorage.getItem('user');

  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (['system_admin', 'parking_manager', 'parking_staff'].includes(user.role)) {
        return <Navigate to="/admin" replace />;
      }
    } catch {
      // Ignore
    }
  }

  return <Outlet />;
};

/**
 * RequireAuthRoute: Enforces authentication (user must be logged in).
 * If not logged in: redirects to /login
 */
export const RequireAuthRoute: React.FC = () => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

/**
 * AdminRoute: Enforces administrative authentication.
 * If not logged in: redirects to /login
 * If logged in but not admin/staff/manager: redirects to /
 */
export const AdminRoute: React.FC = () => {
  const token = localStorage.getItem('accessToken');
  const userJson = localStorage.getItem('user');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (!['system_admin', 'parking_manager', 'parking_staff'].includes(user.role)) {
        return <Navigate to="/" replace />;
      }
    } catch {
      return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
};
