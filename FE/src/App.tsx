import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage/HomePage';
import LoginPage from './pages/HomePage/LoginPage';
import RegisterPage from './pages/HomePage/RegisterPage';
import VerifyEmailPage from './pages/HomePage/VerifyEmailPage';
import ForgotPasswordPage from './pages/HomePage/ForgotPasswordPage';
import ResetPasswordPage from './pages/HomePage/ResetPasswordPage';
import ProfilePage from './pages/HomePage/ProfilePage';
import ParkingSpotPage from './pages/Customer/ParkingSpotPage';
import BookingPage from './pages/Customer/BookingPage';
import SessionPage from './pages/Customer/SessionPage';
import CheckoutPage from './pages/Customer/CheckoutPage';
import CheckoutSuccessPage from './pages/Customer/CheckoutSuccessPage';
import MyTicketsPage from './pages/Customer/MyTicketsPage';
import MyVehiclesPage from './pages/Customer/MyVehiclesPage';
import AdminPortal from './pages/Admin/AdminPortal';
import StaffAssignmentPage from './pages/Staff/StaffAssignmentPage';
import StaffPage from './pages/Staff/StaffPage';
import StaffExitPage from './pages/Staff/StaffExitPage';
import StaffExceptionsPage from './pages/Staff/StaffExceptionsPage';
import StaffLiveViewPage from './pages/Staff/StaffLiveViewPage';
import { GuestRoute, CustomerRoute, RequireAuthRoute, AdminRoute } from './router/ProtectedRoute';

function App() {
    return (
        <Router>
            <Routes>
                {/* 1. Guest-only Routes (Redirects logged-in users out) */}
                <Route element={<GuestRoute />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                </Route>

                {/* 2. Customer-facing Routes (Blocks Admin/Staff/Manager from visiting) */}
                <Route element={<CustomerRoute />}>
                    {/* Public customer pages */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/find-parking" element={<ParkingSpotPage />} />

                    {/* Authenticated customer pages */}
                    <Route element={<RequireAuthRoute />}>
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/booking" element={<BookingPage />} />
                        <Route path="/session" element={<SessionPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/checkoutsuccess" element={<CheckoutSuccessPage />} />
                        <Route path="/tickets" element={<MyTicketsPage />} />
                        <Route path="/my-vehicles" element={<MyVehiclesPage />} />
                    </Route>
                </Route>

                {/* 3. Admin-only Management Routes */}
                <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<AdminPortal />} />
                    <Route path="/admin/staff-assignment" element={<StaffAssignmentPage />} />
                    <Route path="/staff" element={<StaffPage />} />
                    <Route path="/staff/exit" element={<StaffExitPage />} />
                    <Route path="/staff/live-view" element={<StaffLiveViewPage />} />
                    <Route path="/staff/exceptions" element={<StaffExceptionsPage />} />
                    <Route path="/staff/profile" element={<ProfilePage />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
