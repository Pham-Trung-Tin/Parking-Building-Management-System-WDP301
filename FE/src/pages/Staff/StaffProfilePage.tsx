import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LogIn, 
  LogOut, 
  Eye, 
  AlertTriangle, 
  Bell, 
  User, 
  Save,
  Camera,
  MapPin,
  Phone,
  Mail,
  ShieldCheck
} from 'lucide-react';
import useProfile from '../../hooks/useProfile';
import parkingLotService from '../../services/api/parkingLotService';

const StaffProfilePage = () => {
  const { profile, updateProfile, uploadAvatar, logout } = useProfile();
  const navigate = useNavigate();
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [parkingLotName, setParkingLotName] = useState('Not Assigned');
  
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ show: boolean, message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setPhone(profile.phone || '');
      
      // Fetch parking lot name if assignedParkingLot is an ID
      const lotId = (profile as any).assignedParkingLot?._id || (profile as any).assignedParkingLot;
      if (lotId) {
        parkingLotService.getParkingLotById(lotId)
          .then(res => setParkingLotName(res.name))
          .catch(() => setParkingLotName('Unknown Lot'));
      }
    }
  }, [profile]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({ fullName, phone });
      showNotification('Profile updated successfully!', 'success');
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      await uploadAvatar(file);
      showNotification('Avatar updated successfully!', 'success');
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update avatar.', 'error');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">ParkingOps</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Staff Suite</p>
          </div>
          
          <nav className="mt-6 flex flex-col space-y-1">
            <Link to="/staff" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
              <LogIn className="w-5 h-5 mr-3 text-gray-400" />
              Entry
            </Link>
            <Link to="/staff/exit" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
              <LogOut className="w-5 h-5 mr-3 text-gray-400" />
              Exit
            </Link>
            <Link to="/staff/live-view" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
              <Eye className="w-5 h-5 mr-3 text-gray-400" />
              Live View
            </Link>
            <Link to="/staff/exceptions" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
              <AlertTriangle className="w-5 h-5 mr-3 text-gray-400" />
              Exceptions
            </Link>
            <Link to="/staff/profile" className="flex items-center px-6 py-3 bg-gray-50 border-r-4 border-gray-900 text-gray-900 font-medium w-full text-left">
              <User className="w-5 h-5 mr-3 text-gray-700" />
              Profile
            </Link>
          </nav>
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white mr-3 shrink-0 overflow-hidden">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
              ) : (
                <User size={20} />
              )}
            </div>
            <div className="overflow-hidden pr-2">
              <p className="text-sm font-semibold text-gray-900 truncate" title={profile?.fullName}>{profile?.fullName || 'Loading...'}</p>
              <p className="text-[10px] text-gray-500 uppercase truncate">{profile?.role ? profile.role.replace('_', ' ') : 'Staff'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-md transition-colors shrink-0"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold text-gray-900 mr-6">Profile Settings</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Notifications */}
        {notification && (
          <div className={`absolute top-24 right-8 px-4 py-3 rounded shadow-lg flex items-center z-50 animate-fade-in ${
            notification.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
            'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <span className="font-medium text-sm">{notification.message}</span>
          </div>
        )}

        {/* Scrollable Content */}
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-3xl mx-auto">
            
            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden mb-8">
              {/* Header Cover */}
              <div className="h-32 bg-gray-900 w-full relative">
                 <div className="absolute -bottom-12 left-8 flex items-end">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-sm">
                        {profile?.avatarUrl ? (
                          <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <User className="w-10 h-10 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 bg-gray-900 text-white p-2 rounded-full cursor-pointer hover:bg-gray-800 transition-colors shadow-sm">
                        <Camera className="w-4 h-4" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                      </label>
                    </div>
                    <div className="ml-4 mb-2">
                       <h2 className="text-xl font-bold text-gray-900">{profile?.fullName}</h2>
                       <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{profile?.role?.replace('_', ' ')}</p>
                    </div>
                 </div>
              </div>
              
              <div className="pt-20 px-8 pb-8">
                <form onSubmit={handleSaveProfile}>
                  <div className="grid grid-cols-2 gap-8">
                    
                    {/* Left Column */}
                    <div className="space-y-6">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">Personal Info</h3>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 outline-none focus:border-gray-900 transition-colors text-sm"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 outline-none focus:border-gray-900 transition-colors text-sm"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">Account Details</h3>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input 
                            type="email" 
                            className="w-full pl-10 pr-4 py-3 border border-gray-100 bg-gray-50 text-gray-500 outline-none text-sm cursor-not-allowed"
                            value={profile?.email || ''}
                            disabled
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Assigned Parking Lot</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-3 border border-gray-100 bg-gray-50 text-gray-500 outline-none text-sm cursor-not-allowed"
                            value={parkingLotName}
                            disabled
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-2 flex items-center">
                          <ShieldCheck className="w-3 h-3 mr-1" /> Contact admin to change assignment
                        </p>
                      </div>
                    </div>

                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className="bg-gray-900 text-white px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors flex items-center shadow-sm disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>Saving...</>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default StaffProfilePage;
