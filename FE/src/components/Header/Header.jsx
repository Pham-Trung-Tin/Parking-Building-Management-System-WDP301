import React from 'react';
import { Link } from 'react-router-dom';

// SVG Icons
const SmartphoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
    <path d="M12 18h.01" />
  </svg>
);

const Header = () => {
  return (
    <header className="flex justify-between items-center py-5 px-10 bg-white shadow-sm sticky top-0 z-50 animate-fade-in-down">
      <Link to="/" className="text-2xl font-extrabold text-primary-500 cursor-pointer tracking-tight no-underline">Parking Building</Link>
      <nav className="hidden md:flex gap-8 items-center">
        <a href="#how-it-works" className="text-slate-800 font-semibold text-sm hover:text-primary-500 transition-colors">How It Works</a>
        <a href="#business" className="text-slate-800 font-semibold text-sm hover:text-primary-500 transition-colors">Business</a>
        <a href="#get-app" className="flex items-center gap-1 text-slate-800 font-semibold text-sm hover:text-primary-500 transition-colors">
          <SmartphoneIcon /> Get The App
        </a>
      </nav>
      <div className="flex gap-5 items-center">
        <Link to="/login" className="text-slate-800 font-semibold text-sm hover:text-primary-500 no-underline">Log In</Link>
        <Link to="/register" className="bg-primary-500 text-white px-6 py-2.5 rounded-md font-bold text-sm hover:bg-primary-600 transition-colors no-underline">Sign Up</Link>
      </div>
    </header>
  );
};

export default Header;

