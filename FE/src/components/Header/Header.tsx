import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
    <header className="sticky top-0 left-0 right-0 z-50 flex justify-between items-center px-[5%] py-4 bg-white/90 backdrop-blur-md shadow-sm text-black border-b border-slate-100 font-sans">
      <Link to="/" className="text-[18px] font-bold tracking-tight no-underline text-black">
        PARKING<span className="text-blue-600">BUILDING</span>
      </Link>
      
      <nav className="hidden md:flex items-center gap-8 lg:gap-12 text-[15px] font-bold text-slate-700">
        <Link to="/find-parking" className="hover:text-blue-600 transition-colors no-underline text-inherit py-2">Find Parking</Link>
        <Link to="/booking" className="hover:text-blue-600 transition-colors no-underline text-inherit py-2">Book a Slot</Link>
        <Link to="/contact" className="hover:text-blue-600 transition-colors no-underline text-inherit py-2">Support & Feedback</Link>
      </nav>

      <div className="flex items-center gap-6 text-[15px] font-bold">
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 border rounded-full py-1.5 pl-2 pr-4 transition-all duration-200 cursor-pointer bg-slate-50 hover:bg-slate-100 border-slate-100"
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
              <span className="font-semibold text-sm hidden sm:inline text-slate-800">
                {user.fullName}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-slate-500 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2.5 w-52 bg-white border border-slate-100 rounded-xl shadow-lg py-2 z-50 text-slate-800 text-left font-medium">
                <div className="px-4 py-2 border-b border-slate-50">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Signed in as</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{user.fullName}</p>
                </div>
                
                <Link
                  to="/profile"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors no-underline font-semibold"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  My Profile
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left border-none bg-transparent cursor-pointer font-semibold"
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
            <Link to="/login" className="hover:text-blue-600 transition-colors no-underline text-slate-800 text-[15px] font-bold">Login</Link>
            <Link to="/register" className="bg-blue-600 text-white px-5 py-2.5 rounded-sm hover:bg-blue-700 transition-colors no-underline shadow-lg hover:shadow-blue-500/30 text-[15px] font-bold">Sign Up</Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
