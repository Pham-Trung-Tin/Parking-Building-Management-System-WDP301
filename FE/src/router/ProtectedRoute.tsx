import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

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
      if (user.role === 'system_admin') {
        return <Navigate to="/admin" replace />;
      }
      if (['parking_manager', 'parking_staff'].includes(user.role)) {
        if (user.role === 'parking_manager') return <Navigate to="/manager" replace />;
        if (user.role === 'parking_staff' && !user.assignedParkingLot) {
          return <Navigate to="/staff/profile" replace />;
        }
        return <Navigate to="/staff" replace />;
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
  const location = useLocation();

  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      
      // Allow viewing public map without redirection
      if (location.pathname.startsWith('/public-map') || location.pathname.startsWith('/find-parking')) {
          return <Outlet />;
      }

      if (user.role === 'system_admin') {
        return <Navigate to="/admin" replace />;
      }
      if (['parking_manager', 'parking_staff'].includes(user.role)) {
        if (user.role === 'parking_manager') return <Navigate to="/manager" replace />;
        if (user.role === 'parking_staff' && !user.assignedParkingLot) {
          return <Navigate to="/staff/profile" replace />;
        }
        return <Navigate to="/staff" replace />;
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
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (!['system_admin', 'parking_manager', 'parking_staff'].includes(user.role)) {
        return <Navigate to="/" replace />;
      }
      // If staff tries to access exactly /admin, kick them to /staff
      if (user.role === 'parking_staff' && location.pathname === '/admin') {
        return <Navigate to="/staff" replace />;
      }
      
      // If staff is unassigned, restrict access to profile page only
      if (user.role === 'parking_staff' && !user.assignedParkingLot && location.pathname !== '/staff/profile') {
        return <Navigate to="/staff/profile" replace />;
      }



      // If manager tries to access staff or admin pages, kick them to /manager
      if (user.role === 'parking_manager' && (location.pathname === '/admin' || location.pathname.startsWith('/staff'))) {
        return <Navigate to="/manager" replace />;
      }
    } catch {
      return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
};
