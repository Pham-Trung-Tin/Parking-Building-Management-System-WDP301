import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Users,
  Search,
  Plus,
  X,
  MapPin,
  UserPlus,
  UserMinus,
  Building2,
  ChevronDown,
  Check,
  LogOut,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  LogIn,
  Eye,
  AlertTriangle,
  User,
  Key,
  Settings,
  LayoutGrid
} from 'lucide-react';
import { parkingLotService } from '../../services/api';
import axiosClient from '../../services/api/axiosClient';
import type { StaffMember } from '../../services/api/parkingLotService';

/* ─────────────────── Toast ─────────────────── */
function Toast({ message, type = 'success' }: { message: string; type?: 'success' | 'error' }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 text-sm px-5 py-3.5 rounded-2xl shadow-xl animate-slide-up ${type === 'success'
        ? 'bg-gray-900 text-white'
        : 'bg-red-600 text-white'
        }`}
    >
      {type === 'success' ? (
        <Check className="w-4 h-4 text-emerald-400" />
      ) : (
        <AlertCircle className="w-4 h-4 text-red-200" />
      )}
      {message}
    </div>
  );
}

/* ─────────────────── Assign Staff Modal ─────────────────── */
function AssignStaffModal({
  lotId,
  lotName,
  onClose,
  onAssigned,
}: {
  lotId: string;
  lotName: string;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchAvailable = useCallback(async () => {
    setLoading(true);
    try {
      const res = await parkingLotService.getAvailableStaff(search || undefined);
      setAvailableStaff(res.data || res || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load available staff');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchAvailable, 300);
    return () => clearTimeout(timer);
  }, [fetchAvailable]);

  const handleAssign = async (staffId: string) => {
    setAssigning(staffId);
    setError(null);
    try {
      await parkingLotService.assignStaff(lotId, staffId);
      onAssigned();
    } catch (err: any) {
      setError(err.message || 'Failed to assign staff');
    } finally {
      setAssigning(null);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-fade-in max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                Assign Staff
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                to <span className="font-semibold text-gray-600">{lotName}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-sm font-medium"
            >
              Close
            </button>
          </div>
          {/* Search */}
          <div className="mt-4 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or phone..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition bg-white"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Staff List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-400">Loading available staff...</div>
          ) : availableStaff.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400 font-medium">No available staff found</p>
              <p className="text-xs text-gray-400 mt-1">All staff may already be assigned</p>
            </div>
          ) : (
            availableStaff.map((staff) => (
              <div
                key={staff._id}
                className="flex items-center justify-between p-3.5 bg-gray-50/80 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {staff.avatar?.url || staff.avatarUrl ? (
                    <img
                      src={staff.avatar?.url || staff.avatarUrl}
                      alt={staff.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center text-xs font-bold text-blue-700 border border-blue-200">
                      {getInitials(staff.fullName)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{staff.fullName}</p>
                    <p className="text-xs text-gray-400 truncate">{staff.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleAssign(staff._id)}
                  disabled={assigning === staff._id}
                  className="shrink-0 px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {assigning === staff._id ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Assign Manager Modal ─────────────────── */
function AssignManagerModal({
  lotId,
  lotName,
  currentManagerId,
  onClose,
  onAssigned,
}: {
  lotId: string;
  lotName: string;
  currentManagerId?: string;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [managers, setManagers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchManagers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/users', {
        params: { role: 'parking_manager', status: 'active', limit: 100, search: search || undefined }
      });
      const available = (res.data || (res as any).docs || []).filter((m: any) => m._id !== currentManagerId);
      setManagers(available);
    } catch (err: any) {
      setError(err.message || 'Failed to load managers');
    } finally {
      setLoading(false);
    }
  }, [search, currentManagerId]);

  useEffect(() => {
    const timer = setTimeout(fetchManagers, 300);
    return () => clearTimeout(timer);
  }, [fetchManagers]);

  const handleAssign = async (managerId: string) => {
    setAssigning(managerId);
    setError(null);
    try {
      await parkingLotService.updateManager(lotId, managerId);
      onAssigned();
    } catch (err: any) {
      setError(err.message || 'Failed to assign manager');
    } finally {
      setAssigning(null);
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-fade-in max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Assign Manager
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                to <span className="font-semibold text-gray-600">{lotName}</span>
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-sm font-medium">
              Close
            </button>
          </div>
          {/* Search */}
          <div className="mt-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or phone..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition bg-white"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-400">Loading managers...</div>
          ) : managers.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400 font-medium">No available managers found</div>
          ) : (
            managers.map((m) => (
              <div
                key={m._id}
                className="flex items-center justify-between p-3.5 bg-gray-50/80 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {m.avatar?.url || m.avatarUrl ? (
                    <img
                      src={m.avatar?.url || m.avatarUrl}
                      alt={m.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center text-xs font-bold text-blue-700 border border-blue-200">
                      {getInitials(m.fullName)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{m.fullName}</p>
                    <p className="text-xs text-gray-400 truncate">{m.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleAssign(m._id)}
                  disabled={assigning === m._id}
                  className="shrink-0 px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {assigning === m._id ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Main Component ─────────────────── */
export default function StaffAssignmentPage() {
  const navigate = useNavigate();

  const [parkingLots, setParkingLots] = useState<any[]>([]);
  const [selectedLot, setSelectedLot] = useState<any | null>(null);
  const [assignedStaff, setAssignedStaff] = useState<StaffMember[]>([]);
  const [loadingLots, setLoadingLots] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [removingStaff, setRemovingStaff] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [lotDropdownOpen, setLotDropdownOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; staffId: string; staffName: string } | null>(null);
  const [removingManager, setRemovingManager] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Get current user
  const getCurrentUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  };

  // Fetch parking lots
  const fetchLots = useCallback(async (preserveSelected?: string) => {
    setLoadingLots(true);
    try {
      const user = getCurrentUser();
      const params: any = { limit: 100, status: 'active' };
      if (user.role === 'parking_manager' && user._id) {
        params.manager = user._id;
      }
      const res = await parkingLotService.getParkingLots(params);
      const lots = res.data || res || [];
      setParkingLots(lots);
      if (lots.length > 0) {
        if (preserveSelected) {
          const found = lots.find((l: any) => l._id === preserveSelected);
          if (found) setSelectedLot(found);
        } else {
          setSelectedLot(lots[0]);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load parking lots', 'error');
    } finally {
      setLoadingLots(false);
    }
  }, []);

  useEffect(() => {
    fetchLots();
  }, [fetchLots]);

  // Fetch staff for selected lot
  const fetchStaff = useCallback(async () => {
    if (!selectedLot) return;
    setLoadingStaff(true);
    try {
      const res = await parkingLotService.getStaff(selectedLot._id);
      setAssignedStaff(res.data || res || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load staff', 'error');
    } finally {
      setLoadingStaff(false);
    }
  }, [selectedLot]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleRemoveStaff = (staffId: string, staffName: string) => {
    if (!selectedLot) return;
    setConfirmModal({ isOpen: true, staffId, staffName });
  };

  const confirmRemoveStaff = async () => {
    if (!selectedLot || !confirmModal) return;
    setRemovingStaff(confirmModal.staffId);
    const name = confirmModal.staffName;
    setConfirmModal(null);
    try {
      await parkingLotService.removeStaff(selectedLot._id, confirmModal.staffId);
      showToast(`${name} removed successfully`);
      fetchStaff();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove staff', 'error');
    } finally {
      setRemovingStaff(null);
    }
  };

  const handleStaffAssigned = () => {
    setShowAssignModal(false);
    showToast('Staff assigned successfully');
    fetchStaff();
  };

  const handleManagerAssigned = () => {
    setShowManagerModal(false);
    showToast('Manager assigned successfully');
    fetchLots(selectedLot?._id);
  };

  const handleRemoveManager = async () => {
    if (!selectedLot) return;
    if (!window.confirm(`Are you sure you want to remove the manager from ${selectedLot.name}?`)) return;
    setRemovingManager(true);
    try {
      await parkingLotService.updateManager(selectedLot._id, null);
      showToast('Manager removed successfully');
      fetchLots(selectedLot._id);
    } catch (err: any) {
      showToast(err.message || 'Failed to remove manager', 'error');
    } finally {
      setRemovingManager(false);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

  const user = getCurrentUser();
  const isAdmin = user.role === 'system_admin';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in  { animation: fade-in  0.2s ease-out; }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
      `}</style>

      <div className="min-h-screen bg-[#F8F8F6] flex">
        {/* ── Sidebar ── */}
        {isAdmin ? (
          <div className="w-[72px] bg-white border-r border-gray-100 flex flex-col items-center py-7 gap-0 sticky top-0 h-screen z-10 shrink-0">
            <div className="mb-10">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
            </div>

            <nav className="flex-1 flex flex-col items-center gap-2">
              <button
                onClick={() => navigate('/admin', { state: { activeNav: 'users' } })}
                title="Users"
                className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-all duration-150"
              >
                <Users className="w-[18px] h-[18px]" />
              </button>
              <button
                onClick={() => navigate('/admin', { state: { activeNav: 'permissions' } })}
                title="Permissions"
                className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-all duration-150"
              >
                <Key className="w-[18px] h-[18px]" />
              </button>
              <button
                onClick={() => navigate('/admin', { state: { activeNav: 'config' } })}
                title="Configuration"
                className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-all duration-150"
              >
                <Settings className="w-[18px] h-[18px]" />
              </button>
              <button
                title="Personnel Management"
                className="w-11 h-11 rounded-xl flex items-center justify-center bg-gray-900 text-white shadow-sm transition-all duration-150"
              >
                <Building2 className="w-[18px] h-[18px]" />
              </button>
            </nav>

            <div className="flex flex-col items-center gap-3">
              <button
                onClick={handleLogout}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 z-20 h-screen sticky top-0">
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
                <Link to="/staff/manage-slots" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
                  <LayoutGrid className="w-5 h-5 mr-3 text-gray-400" />
                  Manage Slots
                </Link>
                <Link to="/staff/exceptions" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
                  <AlertTriangle className="w-5 h-5 mr-3 text-gray-400" />
                  Exceptions
                </Link>
                <div className="flex items-center px-6 py-3 bg-gray-50 border-r-4 border-gray-900 text-gray-900 font-medium w-full text-left mt-2 whitespace-nowrap">
                  <Users className="w-5 h-5 mr-3 text-gray-700 shrink-0" />
                  <span className="truncate">Staff Assignment</span>
                </div>
                {user?.role !== 'parking_manager' && (
                  <Link to="/staff/profile" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
                    <User className="w-5 h-5 mr-3 text-gray-400" />
                    My Profile
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
                onClick={handleLogout}
                className="p-2 text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-md transition-colors shrink-0"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Main ── */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-12 py-10">

            {/* Header */}
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">
                  {isAdmin ? 'System Admin' : 'Parking Manager'}
                </p>
                <h1 className="text-3xl font-semibold text-gray-900 leading-tight flex items-center gap-3">
                  {isAdmin ? 'Personnel Management' : 'Staff Assignment'}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Manage personnel assignments across parking locations
                </p>
              </div>
            </div>

            {/* Parking Lot Selector */}
            <div className="mb-8">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                Select Parking Lot
              </label>
              <div className="relative">
                <button
                  onClick={() => setLotDropdownOpen(!lotDropdownOpen)}
                  className="w-full max-w-md flex items-center justify-between px-5 py-3.5 bg-white border border-gray-200 rounded-xl text-left hover:border-gray-300 transition-colors shadow-sm"
                >
                  {loadingLots ? (
                    <span className="text-sm text-gray-400 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading parking lots...
                    </span>
                  ) : selectedLot ? (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                        <Building2 className="w-4.5 h-4.5 text-blue-700" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{selectedLot.name}</p>
                        <p className="text-xs text-gray-400">{selectedLot.code} • {selectedLot.address?.district}, {selectedLot.address?.city}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">No parking lots available</span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${lotDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {lotDropdownOpen && parkingLots.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {parkingLots.map((lot) => (
                      <button
                        key={lot._id}
                        onClick={() => {
                          setSelectedLot(lot);
                          setLotDropdownOpen(false);
                        }}
                        className={`w-full px-5 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${selectedLot?._id === lot._id ? 'bg-gray-50' : ''
                          }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{lot.name}</p>
                          <p className="text-xs text-gray-400 truncate">{lot.code} • {lot.address?.district}</p>
                        </div>
                        {selectedLot?._id === lot._id && (
                          <Check className="w-4 h-4 text-gray-900 ml-auto shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Manager Section (Only for Admin) */}
            {isAdmin && selectedLot && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-8">
                {/* Section Header */}
                <div className="px-7 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-indigo-700" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">Parking Manager</h2>
                      <p className="text-xs text-gray-400">{selectedLot.manager ? '1' : '0'} manager assigned</p>
                    </div>
                  </div>
                  {!selectedLot.manager ? (
                    <button
                      onClick={() => setShowManagerModal(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors shadow-sm"
                    >
                      Assign Manager
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowManagerModal(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors shadow-sm"
                    >
                      Change Manager
                    </button>
                  )}
                </div>

                {/* Manager List */}
                <div className="divide-y divide-gray-50">
                  {!selectedLot.manager ? (
                    <div className="py-16 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">No manager assigned yet</p>
                      <p className="text-xs text-gray-400 mt-1 mb-5">Click "Assign Manager" to assign a manager to this parking lot</p>
                      <button
                        onClick={() => setShowManagerModal(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors"
                      >
                        Assign Manager
                      </button>
                    </div>
                  ) : (
                    <div className="px-7 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                      <div className="flex items-center gap-4 min-w-0">
                        {selectedLot.manager.avatar?.url || selectedLot.manager.avatarUrl ? (
                          <img
                            src={selectedLot.manager.avatar?.url || selectedLot.manager.avatarUrl}
                            alt={selectedLot.manager.fullName}
                            className="w-11 h-11 rounded-full object-cover border-2 border-gray-100"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-100 to-blue-200 flex items-center justify-center text-sm font-bold text-blue-700 border-2 border-blue-100">
                            {getInitials(selectedLot.manager.fullName || 'M')}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{selectedLot.manager.fullName}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-gray-400 flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 shrink-0" />
                              {selectedLot.manager.email}
                            </span>
                            {selectedLot.manager.phone && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Phone className="w-3 h-3 shrink-0" />
                                {selectedLot.manager.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-indigo-100 uppercase tracking-wider">
                          Manager
                        </span>
                        <button
                          onClick={handleRemoveManager}
                          disabled={removingManager}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 text-xs font-medium rounded-lg transition-all disabled:opacity-50"
                        >
                          {removingManager ? 'Removing...' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Staff Section */}
            {selectedLot && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                {/* Section Header */}
                <div className="px-7 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-violet-700" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">Assigned Staff</h2>
                      <p className="text-xs text-gray-400">{assignedStaff.length} member{assignedStaff.length !== 1 ? 's' : ''} assigned</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Staff
                  </button>
                </div>

                {/* Staff List */}
                <div className="divide-y divide-gray-50">
                  {loadingStaff ? (
                    <div className="py-16 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400 mb-3" />
                      <span className="text-sm text-gray-400">Loading staff...</span>
                    </div>
                  ) : assignedStaff.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">No staff assigned yet</p>
                      <p className="text-xs text-gray-400 mt-1 mb-5">Click "Add Staff" to assign staff to this parking lot</p>
                      <button
                        onClick={() => setShowAssignModal(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        Add Staff
                      </button>
                    </div>
                  ) : (
                    assignedStaff.map((staff) => (
                      <div
                        key={staff._id}
                        className="px-7 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors group"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          {staff.avatar?.url || staff.avatarUrl ? (
                            <img
                              src={staff.avatar?.url || staff.avatarUrl}
                              alt={staff.fullName}
                              className="w-11 h-11 rounded-full object-cover border-2 border-gray-100"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-100 to-blue-200 flex items-center justify-center text-sm font-bold text-blue-700 border-2 border-blue-100">
                              {getInitials(staff.fullName)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{staff.fullName}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-gray-400 flex items-center gap-1 truncate">
                                <Mail className="w-3 h-3 shrink-0" />
                                {staff.email}
                              </span>
                              {staff.phone && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <Phone className="w-3 h-3 shrink-0" />
                                  {staff.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="bg-sky-50 text-sky-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-sky-100 uppercase tracking-wider">
                            Staff
                          </span>
                          <button
                            onClick={() => handleRemoveStaff(staff._id, staff.fullName)}
                            disabled={removingStaff === staff._id}
                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 text-xs font-medium rounded-lg transition-all disabled:opacity-50"
                          >
                            {removingStaff === staff._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <UserMinus className="w-3.5 h-3.5" />
                            )}
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign Staff Modal */}
      {showAssignModal && selectedLot && (
        <AssignStaffModal
          lotId={selectedLot._id}
          lotName={selectedLot.name}
          onClose={() => setShowAssignModal(false)}
          onAssigned={handleStaffAssigned}
        />
      )}

      {/* Assign Manager Modal */}
      {showManagerModal && selectedLot && (
        <AssignManagerModal
          lotId={selectedLot._id}
          lotName={selectedLot.name}
          currentManagerId={selectedLot.manager?._id || selectedLot.manager}
          onClose={() => setShowManagerModal(false)}
          onAssigned={handleManagerAssigned}
        />
      )}

      {/* ── Confirm Remove Modal ── */}
      {confirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-fade-in text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Remove Staff</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to remove <span className="font-semibold text-gray-800">{confirmModal.staffName}</span> from <span className="font-semibold text-gray-800">{selectedLot?.name}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveStaff}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  );
}
