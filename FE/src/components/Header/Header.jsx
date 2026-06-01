import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// SVG Icons
const SmartphoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
    <path d="M12 18h.01" />
  </svg>
);

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Close dropdown on click outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
    setShowDropdown(false);
    navigate('/');
    window.location.reload(); // Reload to refresh state on other components
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="flex justify-between items-center py-5 px-10 bg-white shadow-sm sticky top-0 z-50 animate-fade-in-down">
      <Link to="/" className="text-2xl font-extrabold text-primary-500 cursor-pointer tracking-tight no-underline">
        Parking Building
      </Link>
      
      <nav className="hidden md:flex gap-8 items-center">
        <a href="#how-it-works" className="text-slate-800 font-semibold text-sm hover:text-primary-500 transition-colors no-underline">How It Works</a>
        <a href="#business" className="text-slate-800 font-semibold text-sm hover:text-primary-500 transition-colors no-underline">Business</a>
        <a href="#get-app" className="flex items-center gap-1 text-slate-800 font-semibold text-sm hover:text-primary-500 transition-colors no-underline">
          <SmartphoneIcon /> Get The App
        </a>
      </nav>

      <div className="flex gap-5 items-center">
        {user ? (
          <div className="relative" ref={dropdownRef}>
            {/* User Info & Avatar Button */}
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-full py-1.5 pl-2 pr-4 transition-all duration-200 cursor-pointer"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullName}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  {getInitials(user.fullName)}
                </div>
              )}
              <span className="text-slate-800 font-semibold text-sm hidden sm:inline">
                {user.fullName}
              </span>
              {/* Arrow Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-slate-500 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2.5 w-52 bg-white border border-slate-100 rounded-xl shadow-lg py-2 z-50 animate-fade-in origin-top-right">
                <div className="px-4 py-2 border-b border-slate-50">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Signed in as</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{user.fullName}</p>
                </div>
                
                <Link
                  to="/profile"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors no-underline"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  My Profile
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left border-none bg-transparent cursor-pointer font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Log Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login" className="text-slate-800 font-semibold text-sm hover:text-primary-500 no-underline">Log In</Link>
            <Link to="/register" className="bg-primary-500 text-white px-6 py-2.5 rounded-md font-bold text-sm hover:bg-primary-600 transition-colors no-underline">Sign Up</Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
