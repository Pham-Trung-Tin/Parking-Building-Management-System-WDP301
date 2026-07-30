import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    LogIn,
    LogOut,
    Eye,
    AlertTriangle,
    Bell,
    User,
    Users,
    LayoutGrid,
    Search,
    RefreshCw,
    Filter,
    Calendar
} from 'lucide-react';
import useProfile from '../../hooks/useProfile';
import floorService, { Floor } from '../../services/api/floorService';
import zoneService, { Zone } from '../../services/api/zoneService';
import parkingSlotService, { ParkingSlot } from '../../services/api/parkingSlotService';

// ─── SlotMapGrid (reused from BookingPage) ───────────────────────────────────
const SlotMapGrid = ({ slots, selectedSlot, onSelect }: {
    slots: ParkingSlot[]; selectedSlot: ParkingSlot | null;
    onSelect: (s: ParkingSlot) => void;
}) => {
    const sorted = [...slots].sort((a, b) => {
        const rA = a.position?.row ?? '';
        const rB = b.position?.row ?? '';
        const rowCmp = String(rA).localeCompare(String(rB));
        if (rowCmp !== 0) return rowCmp;
        return (a.position?.column ?? 0) - (b.position?.column ?? 0);
    });
    const byRow = sorted.reduce((acc: Record<number, ParkingSlot[]>, s) => {
        const r = s.position?.row ?? 0;
        if (!acc[r]) acc[r] = [];
        acc[r].push(s);
        return acc;
    }, {});
    const rows = Object.entries(byRow).sort(([a], [b]) => Number(a) - Number(b));

    const statusStyle = (s: ParkingSlot, isSelected: boolean) => {
        if (isSelected) return { bg: '#2563eb', border: '#1d4ed8', text: '#fff', label: 'Selected' };
        switch (s.status) {
            case 'available': return { bg: '#f0fdf4', border: '#86efac', text: '#15803d', label: 'Available' };
            case 'occupied': return { bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c', label: 'Occupied' };
            case 'reserved': return { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8', label: 'Reserved' };
            case 'maintenance': return { bg: '#fefce8', border: '#fde047', text: '#854d0e', label: 'Maintenance' };
            case 'locked': return { bg: '#f8fafc', border: '#cbd5e1', text: '#94a3b8', label: 'Locked' };
            default: return { bg: '#f8fafc', border: '#e2e8f0', text: '#94a3b8', label: s.status };
        }
    };

    if (slots.length === 0) return (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🅿️</div>
            <div style={{ fontWeight: 600 }}>No slots in this zone/floor</div>
        </div>
    );

    return (
        <div>
            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20, padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                {[
                    { label: 'Available', bg: '#f0fdf4', border: '#86efac', text: '#15803d' },
                    { label: 'Selected', bg: '#2563eb', border: '#1d4ed8', text: '#fff' },
                    { label: 'Occupied', bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c' },
                    { label: 'Reserved', bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' },
                    { label: 'Maintenance', bg: '#fefce8', border: '#fde047', text: '#854d0e' },
                    { label: 'Locked', bg: '#f8fafc', border: '#cbd5e1', text: '#94a3b8' },
                ].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#475569' }}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: l.bg, border: `1.5px solid ${l.border}` }} />
                        {l.label}
                    </div>
                ))}
            </div>
            {/* Road lanes */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, padding: '0 8px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', letterSpacing: 1, textTransform: 'uppercase' }}>← Entry</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', letterSpacing: 1, textTransform: 'uppercase' }}>Exit →</span>
            </div>
            {rows.map(([rowKey, rowSlots]) => {
                const mid = Math.ceil(rowSlots.length / 2);
                const top = rowSlots.slice(0, mid);
                const bot = rowSlots.slice(mid);
                return (
                    <div key={rowKey} style={{ marginBottom: 16 }}>
                        <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
                            {/* Top row */}
                            <div style={{ display: 'flex', gap: 6, marginBottom: 6, minWidth: 'max-content' }}>
                                {top.map(slot => {
                                    const isSelected = selectedSlot?._id === slot._id;
                                    const vtName = typeof slot.vehicleType === 'string' ? '' : (slot.vehicleType as any)?.name ?? '';
                                    const style = statusStyle(slot, isSelected);
                                    return (
                                        <button key={slot._id}
                                            onClick={() => onSelect(slot)}
                                            title={`${slot.slotCode} — ${style.label}${vtName ? ' · ' + vtName : ''}`}
                                            style={{
                                                width: 52, height: 80, borderRadius: 8, border: `2px solid ${style.border}`,
                                                background: style.bg, cursor: 'pointer',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                justifyContent: 'center', gap: 3, padding: '4px 2px',
                                                transition: 'all 0.15s', transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                                boxShadow: isSelected ? '0 4px 16px rgba(37,99,235,0.4)' : '0 1px 4px rgba(0,0,0,0.06)',
                                            }}>
                                            <span style={{ fontSize: 9, fontWeight: 800, color: style.text, letterSpacing: 0.3, textAlign: 'center', lineHeight: 1.2 }}>
                                                {slot.slotCode}
                                            </span>
                                            {slot.features?.hasEVCharger && <span style={{ fontSize: 11 }}>⚡</span>}
                                            {slot.status === 'locked' && <span style={{ fontSize: 10 }}>🔒</span>}
                                            {isSelected && <span style={{ fontSize: 13 }}>✓</span>}
                                        </button>
                                    );
                                })}
                            </div>
                            {/* Road stripe */}
                            <div style={{ height: 18, background: 'repeating-linear-gradient(90deg,#f59e0b 0,#f59e0b 20px,transparent 20px,transparent 40px)', borderRadius: 4, opacity: 0.25, margin: '0 2px' }} />
                            {/* Bottom row */}
                            {bot.length > 0 && (
                                <div style={{ display: 'flex', gap: 6, marginTop: 6, minWidth: 'max-content' }}>
                                    {bot.map(slot => {
                                        const isSelected = selectedSlot?._id === slot._id;
                                        const style = statusStyle(slot, isSelected);
                                        return (
                                            <button key={slot._id}
                                                onClick={() => onSelect(slot)}
                                                title={`${slot.slotCode} — ${style.label}`}
                                                style={{
                                                    width: 52, height: 80, borderRadius: 8, border: `2px solid ${style.border}`,
                                                    background: style.bg, cursor: 'pointer',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                    justifyContent: 'center', gap: 3, padding: '4px 2px',
                                                    transition: 'all 0.15s', transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                                    boxShadow: isSelected ? '0 4px 16px rgba(37,99,235,0.4)' : '0 1px 4px rgba(0,0,0,0.06)',
                                                }}>
                                                <span style={{ fontSize: 9, fontWeight: 800, color: style.text, letterSpacing: 0.3, textAlign: 'center', lineHeight: 1.2 }}>
                                                    {slot.slotCode}
                                                </span>
                                                {slot.features?.hasEVCharger && <span style={{ fontSize: 11 }}>⚡</span>}
                                                {isSelected && <span style={{ fontSize: 13 }}>✓</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const StaffManageSlotPage = () => {
    const { profile } = useProfile();
    const navigate = useNavigate();

    const buildingName = (profile?.assignedParkingLot as any)?.name || 'Main Street Garage';
    const parkingLotId = (profile?.assignedParkingLot as any)?._id || profile?.assignedParkingLot;

    const [floors, setFloors] = useState<Floor[]>([]);
    const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);

    const [zones, setZones] = useState<Zone[]>([]);
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

    const [floorSlots, setFloorSlots] = useState<ParkingSlot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);

    const [loading, setLoading] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch floors
            const floorsRes = await floorService.getFloors({ status: 'active', parkingLot: parkingLotId });
            const floorsList = Array.isArray(floorsRes) ? floorsRes : (floorsRes as any)?.data ?? [];
            setFloors(floorsList);

            if (floorsList.length > 0) {
                const firstFloor = floorsList[0];
                setSelectedFloor(firstFloor);

                // Fetch zones for first floor
                const zonesRes = await zoneService.getZones({ floor: firstFloor._id, parkingLot: parkingLotId });
                const zonesList = Array.isArray(zonesRes) ? zonesRes : (zonesRes as any)?.data ?? [];
                setZones(zonesList.filter((z: any) => !z.isDeleted && z.status === 'active'));
                
                if (zonesList.length > 0) {
                    setSelectedZone(zonesList[0]);
                }

                // Fetch slots for first floor
                const slotsRes = await parkingSlotService.getFloorMap(firstFloor._id);
                setFloorSlots((Array.isArray(slotsRes) ? slotsRes : (slotsRes as any)?.data ?? []).filter((s: ParkingSlot) => !s.isDeleted));
            }
        } catch (error) {
            console.error('Failed to load parking layout data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (parkingLotId) {
            fetchData();
        }
    }, [parkingLotId]);

    const handleFloorSelect = async (floor: Floor) => {
        setSelectedFloor(floor);
        setSelectedZone(null);
        setSelectedSlot(null);
        setLoading(true);
        try {
            const zonesRes = await zoneService.getZones({ floor: floor._id, parkingLot: parkingLotId });
            const zonesList = Array.isArray(zonesRes) ? zonesRes : (zonesRes as any)?.data ?? [];
            const activeZones = zonesList.filter((z: any) => !z.isDeleted && z.status === 'active');
            setZones(activeZones);

            if (activeZones.length > 0) {
                setSelectedZone(activeZones[0]);
            }

            const slotsRes = await parkingSlotService.getFloorMap(floor._id);
            setFloorSlots((Array.isArray(slotsRes) ? slotsRes : (slotsRes as any)?.data ?? []).filter((s: ParkingSlot) => !s.isDeleted));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const displaySlots = useMemo(() => {
        if (!selectedZone) return floorSlots;
        return floorSlots.filter(s => {
            const zId = typeof s.zone === 'string' ? s.zone : (s.zone as any)?._id;
            return zId === selectedZone._id;
        });
    }, [floorSlots, selectedZone]);

    const stats = useMemo(() => {
        const total = displaySlots.length;
        const available = displaySlots.filter(s => s.status === 'available').length;
        const occupied = displaySlots.filter(s => s.status === 'occupied').length;
        return { total, available, occupied };
    }, [displaySlots]);

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
                                <Link to="/staff/live-view" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
                                    <Eye className="w-5 h-5 mr-3 text-gray-400" />
                                    Live View
                                </Link>
                                <Link to="/staff/manage-slots" className="flex items-center px-6 py-3 bg-gray-50 border-r-4 border-gray-900 text-gray-900 font-medium w-full text-left">
                                    <LayoutGrid className="w-5 h-5 mr-3 text-gray-700" />
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
                            <Link to="/admin/staff-assignment" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left whitespace-nowrap">
                                <Users className="w-5 h-5 mr-3 text-gray-400 shrink-0" />
                                <span className="truncate">Staff Assignment</span>
                            </Link>
                        )}
                    </nav>
                </div>

                <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 mr-3 shrink-0 overflow-hidden">
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
                    <div className="max-w-6xl mx-auto">
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Manage Slots</h1>
                                <p className="text-gray-500 text-sm mt-1">View available parking slots and monitor current occupancies in real-time.</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={fetchData}
                                    className="bg-white border border-gray-200 px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center shadow-sm hover:bg-gray-50 transition-colors"
                                >
                                    <RefreshCw className={`w-4 h-4 mr-2 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                            </div>
                        </div>

                        {/* Top Stats Cards */}
                        <div className="grid grid-cols-3 gap-6 mb-8">
                            <div className="bg-white border border-gray-200 p-6 shadow-sm border-t-4 border-t-blue-500 rounded-lg flex items-center justify-between">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Slots</h3>
                                    <p className="text-4xl font-black text-gray-900">{stats.total}</p>
                                </div>
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                    <LayoutGrid className="w-6 h-6 text-gray-500" />
                                </div>
                            </div>
                            <div className="bg-white border border-gray-200 p-6 shadow-sm border-t-4 border-t-green-500 rounded-lg flex items-center justify-between">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Available</h3>
                                    <div className="flex items-center">
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2"></div>
                                        <p className="text-4xl font-black text-gray-900">{stats.available}</p>
                                    </div>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <div className="w-6 h-6 text-green-600 flex items-center justify-center">✓</div>
                                </div>
                            </div>
                            <div className="bg-white border border-gray-200 p-6 shadow-sm border-t-4 border-t-red-500 rounded-lg flex items-center justify-between">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Occupied</h3>
                                    <p className="text-4xl font-black text-gray-900">{stats.occupied}</p>
                                </div>
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Map Area */}
                        <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
                            {/* Floor Tabs */}
                            <div className="flex border-b border-gray-200 overflow-x-auto">
                                {floors.map(floor => {
                                    const floorLabel = floor.name || `Floor ${floor.floorNumber < 0 ? 'B' + Math.abs(floor.floorNumber) : floor.floorNumber}`;
                                    const isSelected = selectedFloor?._id === floor._id;
                                    return (
                                        <button
                                            key={floor._id}
                                            onClick={() => handleFloorSelect(floor)}
                                            className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors ${isSelected ? 'bg-gray-50 text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                                        >
                                            {floorLabel}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Zone Tabs */}
                            {zones.length > 0 && (
                                <div className="flex border-b border-gray-100 bg-gray-50 overflow-x-auto px-4 py-2">
                                    {zones.map(zone => {
                                        const isSelected = selectedZone?._id === zone._id;
                                        return (
                                            <button
                                                key={zone._id}
                                                onClick={() => setSelectedZone(zone)}
                                                className={`px-4 py-2 text-xs font-bold rounded-full mr-2 transition-colors ${isSelected ? 'bg-white shadow-sm text-blue-700 ring-1 ring-gray-200' : 'text-gray-500 hover:bg-gray-100'}`}
                                            >
                                                {zone.name}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Grid Map and Side Panel */}
                            <div className="flex">
                                <div className="flex-1 p-8 overflow-x-auto bg-[#fafafa]">
                                    {loading ? (
                                        <div className="flex justify-center items-center h-64 text-gray-400">
                                            <RefreshCw className="w-8 h-8 animate-spin" />
                                        </div>
                                    ) : (
                                        <SlotMapGrid
                                            slots={displaySlots}
                                            selectedSlot={selectedSlot}
                                            onSelect={setSelectedSlot}
                                        />
                                    )}
                                </div>

                                {/* Slot Details Panel */}
                                {selectedSlot && (
                                    <div className="w-80 border-l border-gray-200 bg-white p-6 shrink-0 flex flex-col">
                                       <div className="flex justify-between items-center mb-6">
                                           <h3 className="text-lg font-bold text-gray-900">Slot {selectedSlot.slotCode}</h3>
                                           <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                                               selectedSlot.status === 'available' ? 'bg-green-100 text-green-700' :
                                               selectedSlot.status === 'occupied' ? 'bg-red-100 text-red-700' :
                                               'bg-gray-100 text-gray-700'
                                           }`}>
                                               {selectedSlot.status}
                                           </span>
                                       </div>
                                       
                                       {selectedSlot.status === 'occupied' && selectedSlot.currentSession ? (
                                           <div className="flex flex-col space-y-4 text-sm">
                                               <div>
                                                   <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Vehicle Info</p>
                                                   <p className="font-bold text-gray-900 text-lg">
                                                       {(selectedSlot.currentSession as any)?.vehicleInfo?.licensePlate || 'N/A'}
                                                   </p>
                                                   <p className="text-gray-600 mt-1">
                                                       {(selectedSlot.currentSession as any)?.vehicleInfo?.vehicleModel || (selectedSlot.vehicleType as any)?.name || 'Unknown'} 
                                                       {(selectedSlot.currentSession as any)?.vehicleInfo?.vehicleColor ? ` - ${(selectedSlot.currentSession as any).vehicleInfo.vehicleColor}` : ''}
                                                   </p>
                                               </div>
                                               
                                               <div className="pt-4 border-t border-gray-100">
                                                   <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wider">Owner / Driver Info</p>
                                                   {(selectedSlot.currentSession as any)?.user ? (
                                                       <>
                                                           <p className="font-semibold text-gray-900 flex items-center gap-2">
                                                               <User className="w-4 h-4 text-gray-400" />
                                                               {(selectedSlot.currentSession as any).user.fullName}
                                                           </p>
                                                           <p className="text-gray-600 mt-2 flex items-center gap-2">
                                                               <span className="text-gray-400">📞</span>
                                                               {(selectedSlot.currentSession as any).user.phone || 'N/A'}
                                                           </p>
                                                       </>
                                                   ) : (
                                                       <p className="text-gray-500 italic">Guest (No info available)</p>
                                                   )}
                                               </div>
                                               
                                               <div className="pt-4 border-t border-gray-100">
                                                   <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wider">Entry Time</p>
                                                   <p className="text-gray-900">
                                                       {new Date((selectedSlot.currentSession as any)?.entryTime).toLocaleString()}
                                                   </p>
                                               </div>
                                           </div>
                                       ) : selectedSlot.status === 'reserved' && selectedSlot.currentBooking ? (
                                           <div className="flex flex-col space-y-4 text-sm">
                                               <div>
                                                   <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Booking Info</p>
                                                   <p className="font-bold text-gray-900 text-lg">
                                                       {(selectedSlot.currentBooking as any)?.vehicleInfo?.licensePlate || 'N/A'}
                                                   </p>
                                                   <p className="text-gray-600 mt-1">
                                                       {(selectedSlot.currentBooking as any)?.vehicleInfo?.vehicleModel || (selectedSlot.vehicleType as any)?.name || 'Unknown'} 
                                                       {(selectedSlot.currentBooking as any)?.vehicleInfo?.vehicleColor ? ` - ${(selectedSlot.currentBooking as any).vehicleInfo.vehicleColor}` : ''}
                                                   </p>
                                                   {(selectedSlot.currentBooking as any)?.bookingCode && (
                                                       <p className="text-blue-600 mt-2 font-mono text-xs">
                                                           Ref: {(selectedSlot.currentBooking as any).bookingCode}
                                                       </p>
                                                   )}
                                               </div>
                                               
                                               <div className="pt-4 border-t border-gray-100">
                                                   <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wider">Customer Info</p>
                                                   {(selectedSlot.currentBooking as any)?.user ? (
                                                       <>
                                                           <p className="font-semibold text-gray-900 flex items-center gap-2">
                                                               <User className="w-4 h-4 text-gray-400" />
                                                               {(selectedSlot.currentBooking as any).user.fullName}
                                                           </p>
                                                           <p className="text-gray-600 mt-2 flex items-center gap-2">
                                                               <span className="text-gray-400">📞</span>
                                                               {(selectedSlot.currentBooking as any).user.phone || 'N/A'}
                                                           </p>
                                                       </>
                                                   ) : (
                                                       <p className="text-gray-500 italic">No user info available</p>
                                                   )}
                                               </div>
                                               
                                               <div className="pt-4 border-t border-gray-100">
                                                   <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wider">Scheduled Time</p>
                                                   <p className="text-gray-900 font-medium">
                                                       {new Date((selectedSlot.currentBooking as any)?.scheduledDate).toLocaleDateString()}
                                                   </p>
                                                   <p className="text-gray-600">
                                                       {(selectedSlot.currentBooking as any)?.startTime} - {(selectedSlot.currentBooking as any)?.endTime}
                                                   </p>
                                               </div>
                                           </div>
                                       ) : (
                                           <div className="text-sm text-gray-500 italic mt-2">
                                               {selectedSlot.status === 'available' ? 'This slot is currently empty.' : 'No session details available.'}
                                           </div>
                                       )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StaffManageSlotPage;
