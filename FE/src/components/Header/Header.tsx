import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const checkBooking = () => {
      const b = localStorage.getItem('activeBooking');
      setActiveBooking(b ? JSON.parse(b) : null);
    };

    checkBooking();

    window.addEventListener('bookingUpdated', checkBooking);
    window.addEventListener('storage', checkBooking);

    // Close dropdown on click outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('bookingUpdated', checkBooking);
      window.removeEventListener('storage', checkBooking);
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
        {activeBooking && (
          <button
            onClick={() => setShowQRModal(true)}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all duration-200 cursor-pointer border border-blue-100"
          >
            <span>🎟️ My Ticket</span>
          </button>
        )}
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

      {/* ── Active Parking Ticket QR Modal ── */}
      {showQRModal && activeBooking && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowQRModal(false); }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in"
        >
          <style>{`
            @keyframes qrFadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes qrScaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            .animate-fade-in { animation: qrFadeIn 0.2s ease-out forwards; }
            .animate-scale-up { animation: qrScaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
          `}</style>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center border border-slate-100 relative animate-scale-up">
            <button 
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold bg-transparent border-none cursor-pointer"
            >
              ×
            </button>
            <h3 className="text-lg font-bold text-slate-800 mb-1 font-sans">🎫 Parking Ticket</h3>
            <p className="text-xs text-slate-400 mb-5 font-sans">Scan at the entrance or exit booth</p>
            
            <div className="bg-slate-50 p-4 rounded-xl inline-block mb-5 border border-slate-100">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  JSON.stringify({
                    receiptId: activeBooking.receiptId,
                    licensePlate: activeBooking.licensePlate,
                    slotCode: activeBooking.slotCode,
                    facility: activeBooking.spot?.title,
                    entryDate: activeBooking.entryDate
                  })
                )}`} 
                alt="Parking QR Code"
                className="w-[180px] h-[180px]"
              />
            </div>
            
            <div className="text-left bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs text-slate-600 space-y-2 mb-5 font-sans">
              <div className="flex justify-between border-b border-slate-100/80 pb-1.5">
                <span className="font-medium text-slate-400">License Plate</span>
                <span className="font-bold text-slate-800">{activeBooking.licensePlate}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100/80 pb-1.5">
                <span className="font-medium text-slate-400">Location</span>
                <span className="font-bold text-slate-800 truncate max-w-[200px]">{activeBooking.spot?.title}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100/80 pb-1.5">
                <span className="font-medium text-slate-400">Floor / Slot</span>
                <span className="font-bold text-blue-600">{activeBooking.floorName} — {activeBooking.slotCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-400">Entry Time</span>
                <span className="font-bold text-slate-800">
                  {new Date(activeBooking.entryDate).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (window.confirm("Do you want to clear/complete this ticket?")) {
                  localStorage.removeItem('activeBooking');
                  setActiveBooking(null);
                  setShowQRModal(false);
                  window.dispatchEvent(new Event('bookingUpdated'));
                }
              }}
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer font-sans"
            >
              Clear / Complete Ticket
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
