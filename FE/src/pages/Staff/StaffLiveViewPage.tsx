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
  Clock,
  Users,
  RefreshCw,
  LayoutGrid,
  Calendar
} from 'lucide-react';
import useProfile from '../../hooks/useProfile';
import parkingSessionService from '../../services/api/parkingSessionService';

const StaffLiveViewPage = () => {
  const { profile } = useProfile();
  const navigate = useNavigate();
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('Just now');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [stats, setStats] = useState({ total: 0, entering: 0, exiting: 0, overstayed: 0 });

  const buildingName = Array.isArray(profile?.assignedParkingLot) 
      ? profile?.assignedParkingLot[0]?.name 
      : (profile?.assignedParkingLot as any)?.name || 'Main Street Garage';

  const fetchSessions = async () => {
    setIsRefreshing(true);
    try {
      const lotId = Array.isArray(profile?.assignedParkingLot)
          ? profile?.assignedParkingLot[0]?._id
          : (profile?.assignedParkingLot as any)?._id || profile?.assignedParkingLot;
      const res = await parkingSessionService.getSessions({ limit: 100, parkingLot: lotId });
      const allSessions = res.data?.docs || res.data || [];
      setSessions(allSessions);
      setLastUpdated(new Date().toLocaleTimeString());
      
      const activeSessions = allSessions.filter((s: any) => s.status === 'active');
      
      setStats({
        total: activeSessions.length,
        entering: activeSessions.length, // All active are 'parked'/entering since we don't have a specific entering state
        exiting: allSessions.filter((s: any) => s.status === 'completed').length,
        overstayed: activeSessions.filter((s: any) => s.isOvertime).length,
      });
    } catch (error) {
      console.error('Failed to fetch sessions', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchSessions();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredSessions = sessions.filter(session => {
    const rawPlate = session.vehicleInfo?.licensePlate || '';
    const cleanPlate = rawPlate.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const cleanQuery = searchQuery.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const matchesSearch = cleanPlate.includes(cleanQuery);
    const sessionStatus = session.status === 'active' ? 'Parked' : (session.status === 'completed' ? 'Exited' : session.status);
    const matchesStatus = filterStatus === 'All' || sessionStatus.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const timeA = a.exitTime ? new Date(a.exitTime).getTime() : new Date(a.entryTime).getTime();
    const timeB = b.exitTime ? new Date(b.exitTime).getTime() : new Date(b.entryTime).getTime();
    return timeB - timeA;
  });

  const handleRefresh = () => {
    fetchSessions();
  };

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
            {(profile?.role === 'parking_manager' || (profile?.role === 'parking_staff' && profile?.assignedParkingLot)) && (
              <>
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
                <Link to="/staff/manage-slots" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
                  <LayoutGrid className="w-5 h-5 mr-3 text-gray-400" />
                  Manage Slots
                </Link>
                <Link to="/staff/exceptions" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
                  <AlertTriangle className="w-5 h-5 mr-3 text-gray-400" />
                  Exceptions
                </Link>
                <Link to="/staff/schedule" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
                  <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                  My Schedule
                </Link>
              </>
            )}
            {profile?.role !== 'parking_manager' && (
              <Link to="/staff/profile" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
                <User className="w-5 h-5 mr-3 text-gray-400" />
                My Profile
              </Link>
            )}
            {profile?.role === 'parking_manager' && (
              <Link to="/admin/staff-assignment" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
                <Users className="w-5 h-5 mr-3 text-gray-400" />
                Staff Assignment
              </Link>
            )}
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
            <h2 className="text-2xl font-bold text-gray-900 mr-6">{buildingName}</h2>
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
                  <input 
                    type="text" 
                    placeholder="Search plates..." 
                    className="outline-none text-sm w-48" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="relative">
                  <button 
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="h-full bg-white border border-gray-200 px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    <Filter className="w-4 h-4 mr-2 text-gray-500" />
                    {filterStatus === 'All' ? 'Filter' : filterStatus}
                  </button>
                  
                  {showFilterDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg z-10 py-1">
                      {['All', 'Parked', 'Exited', 'Overstayed'].map(status => (
                        <button
                          key={status}
                          onClick={() => { setFilterStatus(status); setShowFilterDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${filterStatus === status ? 'font-bold text-gray-900 bg-gray-50' : 'text-gray-700'}`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleRefresh}
                  className="bg-white border border-gray-200 px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center shadow-sm hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              <div className="bg-white border border-gray-200 p-6 shadow-sm border-t-4 border-t-blue-500">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Active</h3>
                <p className="text-3xl font-black text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-white border border-gray-200 p-6 shadow-sm border-t-4 border-t-green-500">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Entering</h3>
                <p className="text-3xl font-black text-gray-900">{stats.entering}</p>
              </div>
              <div className="bg-white border border-gray-200 p-6 shadow-sm border-t-4 border-t-orange-500">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Exiting</h3>
                <p className="text-3xl font-black text-gray-900">{stats.exiting}</p>
              </div>
              <div className="bg-white border border-gray-200 p-6 shadow-sm border-t-4 border-t-purple-500">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Overstayed</h3>
                <p className="text-3xl font-black text-gray-900">{stats.overstayed}</p>
              </div>
            </div>

            {/* Active Sessions Table */}
            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Current Active Sessions</h3>
                <span className="text-xs font-medium text-gray-500 flex items-center">
                  <Clock className="w-3 h-3 mr-1" /> Last updated: {lastUpdated}
                </span>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-gray-400 uppercase tracking-wider font-bold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-bold">Session ID</th>
                    <th className="px-6 py-4 font-bold">Plate Number</th>
                    <th className="px-6 py-4 font-bold">Type</th>
                    <th className="px-6 py-4 font-bold">Entry Time</th>
                    <th className="px-6 py-4 font-bold">Exit Time</th>
                    <th className="px-6 py-4 font-bold">Zone/Location</th>
                    <th className="px-6 py-4 font-bold">Duration</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredSessions.length > 0 ? (
                    filteredSessions.map((session, index) => {
                      const displayStatus = session.status === 'active' ? 'Parked' : (session.status === 'completed' ? 'Exited' : session.status);
                      return (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-500">{session.sessionCode}</td>
                          <td className="px-6 py-4 font-bold text-gray-900">{session.vehicleInfo?.licensePlate}</td>
                          <td className="px-6 py-4">{session.vehicleType?.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs">{new Date(session.entryTime).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap text-xs">{session.exitTime ? new Date(session.exitTime).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '--/--/---- --:--'}</td>
                          <td className="px-6 py-4">
                            {session.zone?.name ? `${session.zone.name}${session.slot?.slotCode ? ` - Slot ${session.slot.slotCode}` : ''}` : (session.slot?.slotCode ? `Slot ${session.slot.slotCode}` : 'Unassigned')}
                          </td>
                          <td className="px-6 py-4 font-medium">{
                            (() => {
                              const diff = new Date().getTime() - new Date(session.entryTime).getTime();
                              const hours = Math.floor(diff / (1000 * 60 * 60));
                              const minutes = Math.floor((diff / (1000 * 60)) % 60);
                              return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
                            })()
                          }</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                              displayStatus === 'Parked' ? 'bg-blue-50 text-blue-600' :
                              displayStatus === 'Exiting' ? 'bg-orange-50 text-orange-600' :
                              'bg-green-50 text-green-600'
                            }`}>
                              {displayStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        No sessions found matching your criteria.
                      </td>
                    </tr>
                  )}
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
