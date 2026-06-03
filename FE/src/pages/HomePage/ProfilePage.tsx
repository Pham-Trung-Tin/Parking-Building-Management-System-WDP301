import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import useProfile from '../../hooks/useProfile';

const ProfilePage = () => {
  const navigate = useNavigate();
  const {
    profile: user,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    logout,
  } = useProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when user profile is loaded
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
    } else {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
      }
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError(null);
    setUpdateSuccess(null);
    try {
      await updateProfile({ fullName, phone });
      setUpdateSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to update profile.');
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUpdateError(null);
    setUpdateSuccess(null);
    try {
      await uploadAvatar(file);
      setUpdateSuccess('Avatar uploaded successfully!');
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to upload avatar.');
    }
  };

  if (!user && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Get user avatar initials if avatar is not set
  const getInitials = (name: string) => {
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
            <div className="absolute -top-16 left-8 group cursor-pointer" onClick={handleAvatarClick}>
              {user.avatar?.url || user.avatarUrl ? (
                <img 
                  src={user.avatar?.url || user.avatarUrl} 
                  alt={user.fullName} 
                  className="w-32 h-32 rounded-full border-4 border-white object-cover bg-white shadow-md group-hover:opacity-85 transition-opacity"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-extrabold text-3xl flex items-center justify-center shadow-md group-hover:opacity-85 transition-opacity">
                  {getInitials(user.fullName)}
                </div>
              )}
              <div className="absolute inset-0 w-32 h-32 rounded-full border-4 border-transparent bg-black/30 text-white text-xs font-semibold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                Change Photo
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* Header Text & Action Buttons */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pt-20 gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{user.fullName}</h1>
                <p className="text-slate-500 font-medium">{user.email}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer"
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                </button>
                <button 
                  onClick={handleLogout}
                  className="px-5 py-2.5 border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-all cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            </div>

            {/* Error and Success alerts */}
            {(error || updateError) && (
              <div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
                {error || updateError}
              </div>
            )}
            {updateSuccess && (
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-sm font-medium">
                {updateSuccess}
              </div>
            )}

            {/* Details Section */}
            <div className="mt-10 border-t border-slate-100 pt-8">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Account Information</h2>
              
              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white text-slate-800 font-bold"
                        required
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white text-slate-800 font-bold"
                        placeholder="Not provided"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-blue-750 hover:to-indigo-750 transition-all cursor-pointer shadow-sm disabled:opacity-70"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
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
              )}
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
