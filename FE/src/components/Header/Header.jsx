import React from 'react';
import './Header.css';

// SVG Icons
const SmartphoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
    <path d="M12 18h.01" />
  </svg>
);

const Header = () => {
  return (
    <header className="header animate-fade-in-down">
      <div className="header-logo">Parking Building</div>
      <nav className="header-nav">
        <a href="#how-it-works" className="nav-link">How It Works</a>
        <a href="#business" className="nav-link">Business</a>
        <a href="#get-app" className="app-link">
          <SmartphoneIcon /> Get The App
        </a>
      </nav>
      <div className="header-auth">
        <a href="#login" className="login-link">Log In</a>
        <a href="#signup" className="btn-signup">Sign Up</a>
      </div>
    </header>
  );
};

export default Header;
