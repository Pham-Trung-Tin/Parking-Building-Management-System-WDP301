import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage/HomePage';
import LoginPage from './pages/HomePage/LoginPage';
import RegisterPage from './pages/HomePage/RegisterPage';
import ParkingSpotPage from './pages/Customer/ParkingSpotPage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/find-parking" element={<ParkingSpotPage />} />
            </Routes>
        </Router>
    );
}

export default App;

