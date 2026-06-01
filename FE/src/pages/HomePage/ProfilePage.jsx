import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
    } else {
      setUser(JSON.parse(userData));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Get user avatar initials if avatar is not set
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-md duration-300">
          
          {/* Cover Header */}
          <div className="h-44 bg-gradient-to-r from-blue-600 via-indigo-600 to-primary-600 relative">
            <Link 
              to="/" 
              className="absolute top-6 left-6 text-white/90 hover:text-white flex items-center gap-1.5 font-semibold text-sm no-underline bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-lg transition-all"
            >
              &larr; Back to Home
            </Link>
          </div>

          {/* Profile Content Container */}
          <div className="px-8 pb-10 relative">
            
            {/* Avatar Circle */}
            <div className="absolute -top-16 left-8">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.fullName} 
                  className="w-32 h-32 rounded-full border-4 border-white object-cover bg-white shadow-md"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-extrabold text-3xl flex items-center justify-center shadow-md">
                  {getInitials(user.fullName)}
                </div>
              )}
            </div>

            {/* Header Text & Action Buttons */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pt-20 gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{user.fullName}</h1>
                <p className="text-slate-500 font-medium">{user.email}</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleLogout}
                  className="px-5 py-2.5 border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-all cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            </div>

            {/* Details Section */}
            <div className="mt-10 border-t border-slate-100 pt-8">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Account Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Full Name Card */}
                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Full Name</span>
                  <span className="text-base font-bold text-slate-800">{user.fullName}</span>
                </div>

                {/* Email Card */}
                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Email Address</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-800">{user.email}</span>
                    {user.isEmailVerified ? (
                      <span className="bg-emerald-50 text-emerald-600 text-xs px-2 py-0.5 rounded-full font-bold border border-emerald-100">
                        Verified
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-600 text-xs px-2 py-0.5 rounded-full font-bold border border-amber-100">
                        Unverified
                      </span>
                    )}
                  </div>
                </div>

                {/* Phone Card */}
                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Phone Number</span>
                  <span className="text-base font-bold text-slate-800">{user.phone || 'Not provided'}</span>
                </div>

                {/* Role Card */}
                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Account Role</span>
                  <span className="text-base font-bold text-blue-600 uppercase tracking-wide">
                    {user.role?.replace('_', ' ') || 'User'}
                  </span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
