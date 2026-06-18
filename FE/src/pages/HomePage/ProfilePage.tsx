import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import useProfile from '../../hooks/useProfile';
import { authService } from '../../services/api';
import { LogIn, LogOut, Eye, AlertTriangle, User, Users } from 'lucide-react';

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

  // Change password state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [cpCurrentPassword, setCpCurrentPassword] = useState('');
  const [cpNewPassword, setCpNewPassword] = useState('');
  const [cpConfirmPassword, setCpConfirmPassword] = useState('');
  const [cpError, setCpError] = useState<string | null>(null);
  const [cpSuccess, setCpSuccess] = useState<string | null>(null);
  const [cpLoading, setCpLoading] = useState(false);
  const [showCpCurrent, setShowCpCurrent] = useState(false);
  const [showCpNew, setShowCpNew] = useState(false);
  const [showCpConfirm, setShowCpConfirm] = useState(false);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpError(null);
    setCpSuccess(null);

    if (cpNewPassword !== cpConfirmPassword) {
      setCpError('Mật khẩu mới và xác nhận không khớp.');
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(cpNewPassword)) {
      setCpError('Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.');
      return;
    }

    setCpLoading(true);
    try {
      await authService.changePassword(cpCurrentPassword, cpNewPassword);
      setCpSuccess('Đổi mật khẩu thành công!');
      setCpCurrentPassword('');
      setCpNewPassword('');
      setCpConfirmPassword('');
      setIsChangingPassword(false);
    } catch (err: any) {
      if (err.status === 400) {
        setCpError('Mật khẩu hiện tại không đúng.');
      } else {
        setCpError(err.message || 'Đã xảy ra lỗi, vui lòng thử lại.');
      }
    } finally {
      setCpLoading(false);
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

  const isStaffOrManager = user?.role === 'parking_staff' || user?.role === 'parking_manager';
  const isManager = user?.role === 'parking_manager' || user?.role === 'system_admin';

  const profileContent = (
    <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-md duration-300">

          {/* Cover Header */}
          <div className="h-44 bg-gradient-to-r from-blue-600 via-indigo-600 to-primary-600 relative">
            <Link
              to={isManager ? '/admin' : isStaffOrManager ? '/staff' : '/'}
              className="absolute top-6 left-6 text-white/90 hover:text-white flex items-center gap-1.5 font-semibold text-sm no-underline bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-lg transition-all"
            >
              &larr; {isManager ? 'Back to Admin Portal' : isStaffOrManager ? 'Back to Staff Suite' : 'Back to Home'}
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

            {/* Assigned Workplace Section (for staff) */}
            {user.role === 'parking_staff' && (
              <div className="mt-8 border-t border-slate-100 pt-8">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                    fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                    <path d="M10 6h4" />
                    <path d="M10 10h4" />
                    <path d="M10 14h4" />
                    <path d="M10 18h4" />
                  </svg>
                  Assigned Workplace
                </h2>

                {user.assignedParkingLot && typeof user.assignedParkingLot === 'object' ? (
                  <div className="p-5 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-100 rounded-xl">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                          fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                          <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                          <path d="M10 6h4" />
                          <path d="M10 10h4" />
                          <path d="M10 14h4" />
                          <path d="M10 18h4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {(user.assignedParkingLot as any).name}
                        </h3>
                        <span className="inline-block text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md mt-1 border border-blue-200">
                          {(user.assignedParkingLot as any).code}
                        </span>
                        {(user.assignedParkingLot as any).address && (
                          <p className="text-sm text-slate-500 mt-2 flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            {[(user.assignedParkingLot as any).address.street,
                              (user.assignedParkingLot as any).address.district,
                              (user.assignedParkingLot as any).address.city,
                            ].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : user.assignedParkingLot && typeof user.assignedParkingLot === 'string' ? (
                  <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                        fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                        <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                        <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Parking Lot ID</span>
                      <span className="text-sm font-bold text-slate-800">{user.assignedParkingLot}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                      fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span className="text-sm text-amber-700 font-medium">
                      You have not been assigned to any parking lot yet. Please contact your manager.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Change Password Section */}
            <div className="mt-8 border-t border-slate-100 pt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900">Security</h2>
                <button
                  onClick={() => {
                    setIsChangingPassword(!isChangingPassword);
                    setCpError(null);
                    setCpSuccess(null);
                    setCpCurrentPassword('');
                    setCpNewPassword('');
                    setCpConfirmPassword('');
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer"
                >
                  {isChangingPassword ? 'Cancel' : 'Change Password'}
                </button>
              </div>

              {/* Change password success */}
              {cpSuccess && !isChangingPassword && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-sm font-medium">
                  {cpSuccess}
                </div>
              )}

              {isChangingPassword ? (
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  {cpError && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
                      {cpError}
                    </div>
                  )}

                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Mật khẩu hiện tại
                    </label>
                    <div className="relative">
                      <input
                        type={showCpCurrent ? 'text' : 'password'}
                        id="cp-current"
                        value={cpCurrentPassword}
                        onChange={(e) => setCpCurrentPassword(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white text-slate-800 font-medium"
                        placeholder="Nhập mật khẩu hiện tại"
                        required
                        autoComplete="current-password"
                      />
                      <button type="button" onClick={() => setShowCpCurrent(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                        {showCpCurrent
                          ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                          : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        }
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Mật khẩu mới
                    </label>
                    <div className="relative">
                      <input
                        type={showCpNew ? 'text' : 'password'}
                        id="cp-new"
                        value={cpNewPassword}
                        onChange={(e) => setCpNewPassword(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white text-slate-800 font-medium"
                        placeholder="Ít nhất 8 ký tự, chữ hoa, chữ thường, số"
                        required
                        autoComplete="new-password"
                      />
                      <button type="button" onClick={() => setShowCpNew(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                        {showCpNew
                          ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                          : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        }
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Xác nhận mật khẩu mới
                    </label>
                    <div className="relative">
                      <input
                        type={showCpConfirm ? 'text' : 'password'}
                        id="cp-confirm"
                        value={cpConfirmPassword}
                        onChange={(e) => setCpConfirmPassword(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white text-slate-800 font-medium"
                        placeholder="Nhập lại mật khẩu mới"
                        required
                        autoComplete="new-password"
                      />
                      <button type="button" onClick={() => setShowCpConfirm(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                        {showCpConfirm
                          ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                          : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        }
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      id="btn-change-password"
                      disabled={cpLoading}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer shadow-sm disabled:opacity-70"
                    >
                      {cpLoading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                    fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span className="text-sm text-slate-600">Password is secured. Click <strong>Change Password</strong> to change password.</span>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    );

  if (isStaffOrManager) {
    const isActive = (path: string) => window.location.pathname === path;
    const linkClass = (path: string) => 
      `flex items-center px-6 py-3 transition-colors w-full text-left ${isActive(path) ? 'bg-gray-50 border-r-4 border-gray-900 text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`;
    const iconClass = (path: string) => 
      `w-5 h-5 mr-3 ${isActive(path) ? 'text-gray-700' : 'text-gray-400'}`;

    return (
      <div className="flex h-screen bg-gray-50 font-sans text-gray-800">
        {/* --- STAFF SIDEBAR --- */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 z-20">
          <div>
            <div className="p-6">
              <h1 className="text-xl font-bold tracking-tight text-gray-900">ParkingOps</h1>
              <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Staff Suite</p>
            </div>

            <nav className="mt-6 flex flex-col space-y-1">
              <Link to="/staff" className={linkClass('/staff')}>
                <LogIn className={iconClass('/staff')} />
                Entry
              </Link>
              <Link to="/staff/exit" className={linkClass('/staff/exit')}>
                <LogOut className={iconClass('/staff/exit')} />
                Exit
              </Link>
              <Link to="/staff/live-view" className={linkClass('/staff/live-view')}>
                <Eye className={iconClass('/staff/live-view')} />
                Live View
              </Link>
              <Link to="/staff/exceptions" className={linkClass('/staff/exceptions')}>
                <AlertTriangle className={iconClass('/staff/exceptions')} />
                Exceptions
              </Link>
              <Link to="/staff/profile" className={linkClass('/staff/profile')}>
                <User className={iconClass('/staff/profile')} />
                My Profile
              </Link>
              {user?.role === 'parking_manager' && (
                <Link to="/admin/staff-assignment" className={linkClass('/admin/staff-assignment')}>
                  <Users className={iconClass('/admin/staff-assignment')} />
                  Staff Assignment
                </Link>
              )}
            </nav>
          </div>

          <div className="p-6 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white mr-3 shrink-0 overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  <User size={20} />
                )}
              </div>
              <div className="overflow-hidden pr-2">
                <p className="text-sm font-semibold text-gray-900 truncate" title={user?.fullName}>{user?.fullName || 'Loading...'}</p>
                <p className="text-[10px] text-gray-500 uppercase truncate">{user?.role ? user.role.replace('_', ' ') : 'Staff'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-md transition-colors shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* --- PROFILE CONTENT --- */}
        <div className="flex-1 overflow-auto">
          {profileContent}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans flex flex-col bg-slate-50">
      <Header />
      {profileContent}
      <Footer />
    </div>
  );
};

export default ProfilePage;
