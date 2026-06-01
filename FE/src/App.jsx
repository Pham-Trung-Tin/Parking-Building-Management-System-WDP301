import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage/HomePage';
import LoginPage from './pages/HomePage/LoginPage';
import RegisterPage from './pages/HomePage/RegisterPage';
import VerifyEmailPage from './pages/HomePage/VerifyEmailPage';
import ParkingSpotPage from './pages/Customer/ParkingSpotPage';
import BookingPage from './pages/Customer/BookingPage';
import SessionPage from './pages/Customer/SessionPage';
import CheckoutPage from './pages/Customer/CheckoutPage';
import CheckoutSuccessPage from './pages/Customer/CheckoutSuccessPage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/find-parking" element={<ParkingSpotPage />} />
                <Route path="/booking" element={<BookingPage />} />
                <Route path="/session" element={<SessionPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/checkoutsuccess" element={<CheckoutSuccessPage />} />
            </Routes>
        </Router>
    );
}

export default App;

