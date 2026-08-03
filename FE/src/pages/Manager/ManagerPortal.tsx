import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Car, Layers, MapPin, Users, LogOut, Shield, DollarSign, ChevronDown } from 'lucide-react';
import BuildingsTab from './BuildingsTab';
import VehicleTypesTab from './VehicleTypesTab';
import FloorsTab from './FloorsTab';
import SlotsTab from './SlotsTab';
import StaffAssignmentTab from './StaffAssignmentTab';
import RevenueTab from './RevenueTab';
import ManagerWorkScheduleTab from './ManagerWorkScheduleTab';
import { Calendar } from 'lucide-react';
import parkingLotService from '../../services/api/parkingLotService';

const NAV = [
  { id: 'buildings', label: 'Buildings', icon: Building },
  { id: 'vehicleTypes', label: 'Vehicle Types', icon: Car },
  { id: 'floors', label: 'Floors & Zones', icon: Layers },
  { id: 'slots', label: 'Parking Slots', icon: MapPin },
  { id: 'staff', label: 'Staff Assignment', icon: Users },
  { id: 'schedules', label: 'Work Schedules', icon: Calendar },
  { id: 'revenue', label: 'Revenue', icon: DollarSign },
];

export default function ManagerPortal() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('buildings');
  const user = useMemo(() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } }, []);

  // assignedParkingLot can be string (legacy), string[], or populated objects [{_id, name}]
  const assignedIds: string[] = useMemo(() => {
    const raw = user?.assignedParkingLot;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map((v: any) => v?._id?.toString?.() || v?.toString?.() || '').filter(Boolean);
    return [(raw as any)?._id?.toString?.() || raw?.toString?.() || ''].filter(Boolean);
  }, [user]);

  const [assignedLots, setAssignedLots] = useState<any[]>([]);
  const [globalLotId, setGlobalLotId] = useState('');

  // Fetch the actual lot objects for the assigned IDs
  useEffect(() => {
    if (!assignedIds.length) return;
    parkingLotService.getParkingLots({ limit: 100 }).then((res) => {
      const all: any[] = res.data || res.docs || (Array.isArray(res) ? res : []);
      const filtered = all.filter((l: any) => assignedIds.includes(l._id));
      setAssignedLots(filtered);
      // Default to first lot if none selected yet
      if (!globalLotId && filtered.length > 0) {
        setGlobalLotId(filtered[0]._id);
      }
    }).catch(() => {});
  }, [assignedIds.join(',')]);

  const isManager = user?.role === 'parking_manager';
  const multiLot = isManager && assignedLots.length > 1;
  const activeLot = assignedLots.find(l => l._id === globalLotId);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Manager without assigned building: show profile-only empty state
  const hasNoBuilding = isManager && assignedIds.length === 0;

  if (hasNoBuilding) {
    return (
      <div className="min-h-screen bg-[#F8F8F6] flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">No Building Assigned</h2>
          <p className="text-sm text-gray-400 mb-6">You haven't been assigned to manage any parking lot yet. Please contact your system administrator.</p>
          <div className="border border-gray-100 rounded-xl p-4 text-left mb-6">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Logged in as</p>
            <p className="text-sm font-semibold text-gray-900">{user?.fullName || 'Manager'}</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-100">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F6] flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen z-10">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Manager Portal</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Parking Management</p>
            </div>
          </div>

          {/* Multi-lot selector */}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === id
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-100 to-purple-200 flex items-center justify-center text-xs font-bold text-violet-700 shrink-0">
              {(user?.fullName || 'M').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName || 'Manager'}</p>
              <p className="text-[10px] text-gray-400 uppercase">Parking Manager</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-10 py-8">
          {tab === 'buildings' && <BuildingsTab globalLotId={globalLotId} setGlobalLotId={setGlobalLotId} setTab={setTab} />}
          {tab === 'vehicleTypes' && <VehicleTypesTab globalLotId={globalLotId} setGlobalLotId={setGlobalLotId} />}
          {tab === 'floors' && <FloorsTab globalLotId={globalLotId} setGlobalLotId={setGlobalLotId} />}
          {tab === 'slots' && <SlotsTab globalLotId={globalLotId} setGlobalLotId={setGlobalLotId} />}
          {tab === 'staff' && <StaffAssignmentTab globalLotId={globalLotId} setGlobalLotId={setGlobalLotId} />}
          {tab === 'schedules' && <ManagerWorkScheduleTab globalLotId={globalLotId} setGlobalLotId={setGlobalLotId} />}
          {tab === 'revenue' && <RevenueTab globalLotId={globalLotId} setGlobalLotId={setGlobalLotId} />}
        </div>
      </div>
    </div>
  );
}
