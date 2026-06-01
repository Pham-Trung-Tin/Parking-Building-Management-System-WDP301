import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage/HomePage';
import LoginPage from './pages/HomePage/LoginPage';
import RegisterPage from './pages/HomePage/RegisterPage';
import ParkingSpotPage from './pages/Customer/ParkingSpotPage';
import BookingPage from './pages/Customer/BookingPage';
import SessionPage from './pages/Customer/SessionPage';
import CheckoutPage from './pages/Customer/CheckoutPage';
import CheckoutSuccessPage from './pages/Customer/CheckoutSuccessPage';
import AdminPortal from './pages/Admin/AdminPortal';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/find-parking" element={<ParkingSpotPage />} />
                <Route path="/booking" element={<BookingPage />} />
                <Route path="/session" element={<SessionPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/checkoutsuccess" element={<CheckoutSuccessPage />} />
                <Route path="/admin" element={<AdminPortal />} />
            </Routes>
        </Router>
    );
}

export default App;

