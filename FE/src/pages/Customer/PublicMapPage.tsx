import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, LogIn, LogOut, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Header from '../../components/Header/Header';
import floorService, { Floor } from '../../services/api/floorService';
import zoneService, { Zone } from '../../services/api/zoneService';
import parkingSlotService, { ParkingSlot } from '../../services/api/parkingSlotService';
import { useSocket } from '../../contexts/SocketContext';

// ─── Isometric Building ─────────────────────────────────────────────
const IsoBuilding = ({ floors, selectedFloor, onSelect }: {
    floors: Floor[];
    selectedFloor: Floor | null;
    onSelect: (f: Floor) => void;
}) => {
    const sorted = [...floors].sort((a, b) => b.floorNumber - a.floorNumber);
    const W = 200, H = 48, D = 28, startX = 60, startY = 20, gap = 22;
    const face = (f: Floor) => selectedFloor?._id === f._id ? '#1e40af' : '#ffffff';
    const side = (f: Floor) => selectedFloor?._id === f._id ? '#1d4ed8' : '#f1f5f9';
    const top = (f: Floor) => selectedFloor?._id === f._id ? '#93c5fd' : '#ffffff';
    const stroke = (f: Floor) => selectedFloor?._id === f._id ? '#1e40af' : '#cbd5e1';
    if (sorted.length === 0) return (
        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13, flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 32 }}>🏗️</span>
            No floors available
        </div>
    );
    const totalH = sorted.length * (H + gap) + D + 30;
    return (
        <svg viewBox={`0 0 ${startX + W + D + 20} ${totalH}`} width="100%" style={{ maxWidth: 320 }}>
            {sorted.map((f, idx) => {
                const baseY = startY + idx * (H + gap);
                const sel = selectedFloor?._id === f._id;
                const frontPts = `${startX},${baseY + D} ${startX + W},${baseY + D} ${startX + W},${baseY + D + H} ${startX},${baseY + D + H}`;
                const topPts = `${startX},${baseY + D} ${startX + W},${baseY + D} ${startX + W + D},${baseY} ${startX + D},${baseY}`;
                const sidePts = `${startX + W},${baseY + D} ${startX + W + D},${baseY} ${startX + W + D},${baseY + H} ${startX + W},${baseY + D + H}`;
                const floorLabel = f.name || `Floor ${f.floorNumber < 0 ? 'B' + Math.abs(f.floorNumber) : f.floorNumber}`;
                return (
                    <g key={f._id} onClick={() => onSelect(f)} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
                        <polygon points={topPts} fill={top(f)} stroke={stroke(f)} strokeWidth="1.2" />
                        <polygon points={frontPts} fill={face(f)} stroke={stroke(f)} strokeWidth="1.2" />
                        <polygon points={sidePts} fill={side(f)} stroke={stroke(f)} strokeWidth="1.2" />
                        {[0, 1, 2].map(w => (
                            <rect key={w} x={startX + 20 + w * 58} y={baseY + D + 12} width={36} height={22} rx="3"
                                fill={sel ? 'rgba(255,255,255,0.2)' : 'rgba(241,245,249,0.9)'}
                                stroke={sel ? 'rgba(255,255,255,0.4)' : '#e2e8f0'} strokeWidth="0.8" />
                        ))}
                        <text x={startX + W / 2} y={baseY + D + H / 2 + 5} textAnchor="middle" fontSize="12" fontWeight="700" fill={sel ? '#ffffff' : '#475569'}>
                            {floorLabel}
                        </text>
                        {sel && <text x={startX + W - 16} y={baseY + D + H / 2 + 5} textAnchor="middle" fontSize="14" fill="#ffffff">✓</text>}
                    </g>
                );
            })}
            <ellipse cx={startX + W / 2 + D / 2} cy={startY + sorted.length * (H + gap) + D + 10} rx={W / 2 + 18} ry="9" fill="rgba(0,0,0,0.06)" />
        </svg>
    );
};

// ─── SlotMapGrid ─────────────────────────────────────────────────────────────
const SlotMapGrid = ({ slots, isGroundFloor, hasLower, hasUpper }: { slots: ParkingSlot[], isGroundFloor: boolean, hasLower: boolean, hasUpper: boolean }) => {
    const sorted = [...slots].sort((a, b) => {
        const rA = a.position?.row ?? '';
        const rB = b.position?.row ?? '';
        const rowCmp = String(rA).localeCompare(String(rB));
        if (rowCmp !== 0) return rowCmp;
        return (a.position?.column ?? 0) - (b.position?.column ?? 0);
    });
    const byRow = sorted.reduce((acc: Record<string, ParkingSlot[]>, s) => {
        const r = String(s.position?.row ?? '0');
        if (!acc[r]) acc[r] = [];
        acc[r].push(s);
        return acc;
    }, {});

    const rows: [string, ParkingSlot[]][] = [];
    const MAX_SLOTS_PER_LANE = 20;

    Object.entries(byRow)
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
        .forEach(([r, rSlots]) => {
            for (let i = 0; i < rSlots.length; i += MAX_SLOTS_PER_LANE) {
                const chunk = rSlots.slice(i, i + MAX_SLOTS_PER_LANE);
                rows.push([`${r}-${i}`, chunk]);
            }
        });

    const statusStyle = (s: ParkingSlot) => {
        switch (s.status) {
            case 'available': return { bg: '#ffffff', border: '#22c55e', text: '#16a34a', label: 'Available' };
            case 'occupied': return { bg: '#ffffff', border: '#ef4444', text: '#ef4444', label: 'Occupied' };
            case 'reserved': return { bg: '#ede9fe', border: '#8b5cf6', text: '#7c3aed', label: 'Reserved' };
            case 'maintenance': return { bg: '#f8fafc', border: '#94a3b8', text: '#64748b', label: 'Maintenance' };
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
        <div className="w-full flex flex-col items-center">
            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginBottom: 24, padding: '16px 0', borderBottom: '1px solid #e2e8f0' }}>
                {[
                    { label: 'Available', bg: '#ffffff', border: '#22c55e', text: '#16a34a' },
                    { label: 'Occupied', bg: '#ffffff', border: '#ef4444', text: '#ef4444' },
                    { label: 'Reserved', bg: '#ede9fe', border: '#8b5cf6', text: '#7c3aed' },
                    { label: 'Maintenance / Locked', bg: '#f8fafc', border: '#94a3b8', text: '#64748b' },
                ].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                        <div style={{ width: 16, height: 16, borderRadius: 4, background: l.bg, border: `1.5px solid ${l.border}` }} />
                        {l.label}
                    </div>
                ))}
            </div>

            {/* Map Layout: Left Gate -> Slots Grid -> Right Gate */}
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '900px', gap: 12 }}>
                {/* Left Gate */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#ecfdf5', padding: '12px 8px', borderRadius: '10px', border: '2px dashed #10b981', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)', minWidth: '70px' }}>
                    <LogIn size={20} color="#047857" strokeWidth={2.5} style={{ marginBottom: 4 }} />
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#047857', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>
                        {isGroundFloor ? 'Entry' : 'Ramp In'}
                    </span>
                    {isGroundFloor && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginTop: 8, background: '#10b981', padding: '4px 6px', borderRadius: '8px' }}>
                            <MapPin size={14} strokeWidth={3} color="#ffffff" style={{ animation: 'bounce 2s infinite' }} />
                            <span style={{ fontSize: 9, fontWeight: 700, color: '#ffffff', textAlign: 'center', lineHeight: 1.1 }}>You are<br/>here</span>
                        </div>
                    )}
                </div>

                {/* Grid */}
                <div style={{ flex: 1, overflowX: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 8 }}>
                    {rows.map(([rowKey, rowSlots]) => {
                        const mid = Math.ceil(rowSlots.length / 2);
                        const top = rowSlots.slice(0, mid);
                        const bot = rowSlots.slice(mid);
                        return (
                            <div key={rowKey} style={{ marginBottom: 16, width: '100%' }}>
                                <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
                                    {/* Top row */}
                                    <div style={{ display: 'flex', gap: 6, marginBottom: 6, minWidth: 'max-content', justifyContent: 'center' }}>
                                        {top.map(slot => {
                                            const style = statusStyle(slot);
                                            return (
                                                <div key={slot._id}
                                                    title={`${slot.slotCode} — ${style.label}`}
                                                    style={{
                                                        width: 56, height: 82, borderRadius: 10, border: `1.5px solid ${style.border}`,
                                                        background: style.bg, display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                        justifyContent: 'center', gap: 2, padding: '4px 2px',
                                                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                                                    }}>
                                                    <span style={{ fontSize: 10, fontWeight: 700, color: style.text, letterSpacing: 0.2, textAlign: 'center', lineHeight: 1.2 }}>
                                                        {slot.slotCode}
                                                    </span>
                                                    {slot.features?.hasEVCharger && <span style={{ fontSize: 10 }}>⚡</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/* Road stripe */}
                                    <div style={{ display: 'flex', alignItems: 'center', margin: '0 2px' }}>
                                        <div style={{ flex: 1, height: 18, background: 'repeating-linear-gradient(90deg,#f59e0b 0,#f59e0b 20px,transparent 20px,transparent 40px)', borderRadius: 4, opacity: 0.25 }} />
                                    </div>
                                    {/* Bottom row */}
                                    {bot.length > 0 && (
                                        <div style={{ display: 'flex', gap: 6, marginTop: 6, minWidth: 'max-content', justifyContent: 'center' }}>
                                            {bot.map(slot => {
                                                const style = statusStyle(slot);
                                                return (
                                                    <div key={slot._id}
                                                        title={`${slot.slotCode} — ${style.label}`}
                                                        style={{
                                                            width: 56, height: 82, borderRadius: 10, border: `1.5px solid ${style.border}`,
                                                            background: style.bg, display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                            justifyContent: 'center', gap: 2, padding: '4px 2px',
                                                            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                                                        }}>
                                                        <span style={{ fontSize: 10, fontWeight: 700, color: style.text, letterSpacing: 0.2, textAlign: 'center', lineHeight: 1.2 }}>
                                                            {slot.slotCode}
                                                        </span>
                                                        {slot.features?.hasEVCharger && <span style={{ fontSize: 10 }}>⚡</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Right Gate (Exit / Ramps) */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', minWidth: '70px' }}>
                    {isGroundFloor && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fef2f2', padding: '12px 8px', borderRadius: '10px', border: '2px dashed #ef4444', justifyContent: 'center', width: '100%' }}>
                            <LogOut size={20} color="#b91c1c" strokeWidth={2.5} style={{ marginBottom: 4 }} />
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#b91c1c', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>
                                Exit
                            </span>
                        </div>
                    )}
                    {(hasLower || hasUpper) && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#eff6ff', padding: '8px', borderRadius: '10px', border: '1.5px dashed #3b82f6', justifyContent: 'center', width: '100%', opacity: 0.9 }}>
                            <span style={{ fontSize: 9, fontWeight: 800, color: '#1d4ed8', letterSpacing: 0.5, textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 }}>
                                Next Floor
                            </span>
                            <div style={{ display: 'flex', gap: 4 }}>
                                {hasUpper && (
                                    <div style={{ background: '#dbeafe', padding: '4px', borderRadius: '6px' }} title="Ramp Up">
                                        <ArrowUpRight size={14} color="#1d4ed8" strokeWidth={3} />
                                    </div>
                                )}
                                {hasLower && (
                                    <div style={{ background: '#dbeafe', padding: '4px', borderRadius: '6px' }} title="Ramp Down">
                                        <ArrowDownRight size={14} color="#1d4ed8" strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Main Page ─────────────────────────────────────────────────────────────
const PublicMapPage = () => {
    const { lotId } = useParams();
    const { isConnected, joinParkingLot, leaveParkingLot, onSlotUpdate } = useSocket();

    const [floors, setFloors] = useState<Floor[]>([]);
    const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);

    const [zones, setZones] = useState<Zone[]>([]);
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

    const [floorSlots, setFloorSlots] = useState<ParkingSlot[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!lotId) return;
        floorService.getFloors({ parkingLot: lotId }).then((res: any) => {
            const list = Array.isArray(res) ? res : (res?.data?.docs || res?.data || []);
            if (list && list.length > 0) {
                setFloors(list);
                setSelectedFloor(list[0]);
            }
        });
    }, [lotId]);

    useEffect(() => {
        if (!selectedFloor || !lotId) {
            setZones([]);
            setFloorSlots([]);
            return;
        }
        setLoading(true);
        Promise.all([
            zoneService.getZones({ parkingLot: lotId, floor: selectedFloor._id }),
            parkingSlotService.getFloorMap(selectedFloor._id)
        ]).then(([zonesRes, slotsRes]: [any, any]) => {
            const zonesList = Array.isArray(zonesRes) ? zonesRes : (zonesRes?.data?.docs || zonesRes?.data || []);
            setZones(zonesList || []);
            if (zonesList && zonesList.length > 0) {
                setSelectedZone(zonesList[0]);
            } else {
                setSelectedZone(null);
            }

            const slotsList = Array.isArray(slotsRes) ? slotsRes : (slotsRes?.data?.docs || slotsRes?.data || []);
            setFloorSlots((slotsList || []).filter((s: ParkingSlot) => !s.isDeleted));
        }).catch(console.error).finally(() => setLoading(false));
    }, [selectedFloor, lotId]);

    const displaySlots = useMemo(() => {
        if (!selectedZone) return floorSlots;
        return floorSlots.filter(s => {
            const zId = typeof s.zone === 'string' ? s.zone : (s.zone as any)?._id;
            return zId === selectedZone._id;
        });
    }, [floorSlots, selectedZone]);

    useEffect(() => {
        if (!lotId || !isConnected) return;
        joinParkingLot(lotId);
        return () => leaveParkingLot(lotId);
    }, [lotId, isConnected, joinParkingLot, leaveParkingLot]);

    useEffect(() => {
        if (!isConnected) return;
        const unsubscribe = onSlotUpdate((payload) => {
            setFloorSlots(prev => prev.map(s =>
                s._id === payload.slotId ? { ...s, status: payload.status as any } : s
            ));
        });
        return unsubscribe;
    }, [isConnected, onSlotUpdate]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Header />
            <div className="flex-1 max-w-7xl mx-auto w-full p-4 flex flex-col lg:flex-row gap-6 mt-4 pb-12">
                <div className="lg:w-1/3 flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="text-xl font-bold mb-4 text-slate-800">Select Floor</h2>
                        <div className="flex justify-center">
                            <IsoBuilding floors={floors} selectedFloor={selectedFloor} onSelect={setSelectedFloor} />
                        </div>
                    </div>
                    {zones.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="text-xl font-bold mb-4 text-slate-800">Select Zone</h2>
                            <div className="flex flex-wrap gap-2">
                                {zones.map(z => (
                                    <button
                                        key={z._id}
                                        onClick={() => setSelectedZone(z)}
                                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${selectedZone?._id === z._id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                    >
                                        {z.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="lg:w-2/3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Live Map View</h2>
                        <span className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Live Realtime
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                            <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
                            <span className="font-semibold text-sm">Loading parking slots...</span>
                        </div>
                    ) : (
                        <SlotMapGrid 
                            slots={displaySlots} 
                            isGroundFloor={selectedFloor?.floorType === 'ground' || selectedFloor?.floorNumber === 1}
                            hasLower={floors.some(f => f.floorNumber < (selectedFloor?.floorNumber ?? 0))}
                            hasUpper={floors.some(f => f.floorNumber > (selectedFloor?.floorNumber ?? 0))}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublicMapPage;
