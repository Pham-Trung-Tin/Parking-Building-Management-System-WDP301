import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-logo">SpotHero</div>
      <nav className="header-nav">
        <a href="#how-it-works">How It Works</a>
        <a href="#business">Business</a>
        <a href="#get-app" className="app-link">
          <span className="icon-mobile">📱</span> Get The App
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
