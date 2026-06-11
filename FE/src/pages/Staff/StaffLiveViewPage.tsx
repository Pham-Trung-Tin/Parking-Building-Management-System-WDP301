import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LogIn, 
  LogOut, 
  Eye, 
  AlertTriangle, 
  Bell, 
  User, 
  Search,
  Filter,
  Clock
} from 'lucide-react';
import useProfile from '../../hooks/useProfile';

const StaffLiveViewPage = () => {
  const { profile } = useProfile();
  const navigate = useNavigate();
  
  const mockSessions = [
    { id: 'S-901', plate: 'ABC-1234', type: 'SUV', entry: '08:14 AM', zone: 'North - Level 3', duration: '06h 42m', status: 'Parked' },
    { id: 'S-902', plate: 'GHI-5542', type: 'CAR', entry: '09:30 AM', zone: 'South - Level 1', duration: '05h 26m', status: 'Exiting' },
    { id: 'S-903', plate: 'LMN-4567', type: 'TRUCK', entry: '10:15 AM', zone: 'Ground Floor', duration: '04h 41m', status: 'Parked' },
    { id: 'S-904', plate: 'XYZ-9876', type: 'MOTORCYCLE', entry: '11:05 AM', zone: 'East - Level 2', duration: '03h 51m', status: 'Parked' },
    { id: 'S-905', plate: 'DEF-1122', type: 'CAR', entry: '01:20 PM', zone: 'West - Level 1', duration: '01h 36m', status: 'Entering' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
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
            <Link to="/staff/live-view" className="flex items-center px-6 py-3 bg-gray-50 border-r-4 border-gray-900 text-gray-900 font-medium w-full text-left">
              <Eye className="w-5 h-5 mr-3 text-gray-700" />
              Live View
            </Link>
            <Link to="/staff/exceptions" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
              <AlertTriangle className="w-5 h-5 mr-3 text-gray-400" />
              Exceptions
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold text-gray-900 mr-6">Main Street Garage</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <User className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Live View</h1>
                <p className="text-gray-500 text-sm mt-1">Monitor all vehicles currently in active sessions.</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-white border border-gray-200 px-4 py-2 flex items-center shadow-sm">
                  <Search className="w-4 h-4 text-gray-400 mr-2" />
                  <input type="text" placeholder="Search plates..." className="outline-none text-sm w-48" />
                </div>
                <button className="bg-white border border-gray-200 px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center shadow-sm hover:bg-gray-50 transition-colors">
                  <Filter className="w-4 h-4 mr-2 text-gray-500" />
                  Filter
                </button>
              </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              <div className="bg-white border border-gray-200 p-6 shadow-sm border-t-4 border-t-blue-500">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Active</h3>
                <p className="text-3xl font-black text-gray-900">142</p>
              </div>
              <div className="bg-white border border-gray-200 p-6 shadow-sm border-t-4 border-t-green-500">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Entering</h3>
                <p className="text-3xl font-black text-gray-900">3</p>
              </div>
              <div className="bg-white border border-gray-200 p-6 shadow-sm border-t-4 border-t-orange-500">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Exiting</h3>
                <p className="text-3xl font-black text-gray-900">5</p>
              </div>
              <div className="bg-white border border-gray-200 p-6 shadow-sm border-t-4 border-t-purple-500">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Overstayed</h3>
                <p className="text-3xl font-black text-gray-900">2</p>
              </div>
            </div>

            {/* Active Sessions Table */}
            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Current Active Sessions</h3>
                <span className="text-xs font-medium text-gray-500 flex items-center">
                  <Clock className="w-3 h-3 mr-1" /> Last updated: Just now
                </span>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-gray-400 uppercase tracking-wider font-bold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-bold">Session ID</th>
                    <th className="px-6 py-4 font-bold">Plate Number</th>
                    <th className="px-6 py-4 font-bold">Type</th>
                    <th className="px-6 py-4 font-bold">Entry Time</th>
                    <th className="px-6 py-4 font-bold">Zone/Location</th>
                    <th className="px-6 py-4 font-bold">Duration</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {mockSessions.map((session, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-500">{session.id}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{session.plate}</td>
                      <td className="px-6 py-4">{session.type}</td>
                      <td className="px-6 py-4">{session.entry}</td>
                      <td className="px-6 py-4">{session.zone}</td>
                      <td className="px-6 py-4 font-medium">{session.duration}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                          session.status === 'Parked' ? 'bg-blue-50 text-blue-600' :
                          session.status === 'Exiting' ? 'bg-orange-50 text-orange-600' :
                          'bg-green-50 text-green-600'
                        }`}>
                          {session.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default StaffLiveViewPage;
