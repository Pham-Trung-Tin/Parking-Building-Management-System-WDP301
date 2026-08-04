import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header/Header';
import floorService, { Floor } from '../../services/api/floorService';
import zoneService, { Zone } from '../../services/api/zoneService';
import parkingSlotService, { ParkingSlot } from '../../services/api/parkingSlotService';
import vehicleTypeService, { VehicleType } from '../../services/api/vehicleTypeService';
import { vehicleService } from '../../services/api';
import type { Vehicle } from '../../services/api/vehicleService';
import bookingService from '../../services/api/bookingService';
import paymentService from '../../services/api/paymentService';
import parkingLotService from '../../services/api/parkingLotService';
import monthlyPassService, { MonthlyPass } from '../../services/api/monthlyPassService';
import parkingSessionService from '../../services/api/parkingSessionService';
import { useSocket } from '../../contexts/SocketContext';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getZoneId = (z: ParkingSlot['zone']): string =>
    typeof z === 'string' ? z : (z as any)?._id ?? '';

const getCalendarDays = (year: number, month: number) => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const currentMonthDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // Prev month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        days.push({
            day: prevMonthDays - i,
            month: month === 0 ? 11 : month - 1,
            year: month === 0 ? year - 1 : year,
            isCurrentMonth: false,
        });
    }

    // Current month days
    for (let i = 1; i <= currentMonthDays; i++) {
        days.push({
            day: i,
            month: month,
            year: year,
            isCurrentMonth: true,
        });
    }

    // Next month days to fill 42 cells
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
        days.push({
            day: i,
            month: month === 11 ? 0 : month + 1,
            year: month === 11 ? year + 1 : year,
            isCurrentMonth: false,
        });
    }

    return days;
};

const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
};

const isBeforeDay = (d1: Date, d2: Date) => {
    const t1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime();
    const t2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime();
    return t1 < t2;
};

const isAfterDay = (d1: Date, d2: Date) => {
    const t1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime();
    const t2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime();
    return t1 > t2;
};

// Vietnamese license plate validation
const LP_REGEX = /^[0-9]{2}[A-Z]{1,2}-[0-9]{4,5}$|^[0-9]{2}-[A-Z][0-9]{4,5}$/i;
const formatPlate = (rawValue: string, vehicleCode?: string) => {
    // If the user manually types a dash, preserve it and just clean invalid chars
    if (rawValue.includes('-')) {
        return rawValue.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    }

    let v = rawValue.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (v.length < 4) return v;

    const isMoto = vehicleCode ? (vehicleCode.toUpperCase().includes('MOTOR') || vehicleCode.toUpperCase().includes('BIKE')) : false;

    let prefixLen = 3; // Default for cars (e.g. 51A)
    if (/[A-Z]/.test(v[3])) {
        // 4th char is a letter (e.g. 51LD)
        prefixLen = 4;
    } else if (isMoto) {
        // Motorcycle plates usually have a 4-char prefix (e.g. 59T1)
        prefixLen = 4;
    }

    if (v.length > prefixLen) {
        return v.slice(0, prefixLen) + '-' + v.slice(prefixLen);
    }
    return v;
};

// Format helpers
const fmtVND = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n)) + ' ₫';
const fmtDateTime = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// Checkout field formatters
const formatCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};
const formatCVV = (v: string) => v.replace(/\D/g, '').slice(0, 3);

// Checkout SVG Icons
const CreditCardIcon = ({ size = 24 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </svg>
);

const ZaloPayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#0068ff" />
        <text x="12" y="15" textAnchor="middle" fill="white" fontSize="6" fontWeight="900" fontFamily="sans-serif">ZaloPay</text>
    </svg>
);

const QrCodeIcon = ({ size = 24 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" />
    </svg>
);
const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);


// ─── Step Definitions ────────────────────────────────────────────────────────
const STEPS = [
    { id: 1, label: 'Select Building', icon: '🏢' },
    { id: 2, label: 'Vehicle Type', icon: '🚗' },
    { id: 3, label: 'License Plate', icon: '🪪' },
    { id: 4, label: 'Date & Time', icon: '📅' },
    { id: 5, label: 'Select Floor', icon: '🏢' },
    { id: 6, label: 'Select Zone', icon: '📍' },
    { id: 7, label: 'Select Slot', icon: '🅿️' },
];

// ─── Vehicle B&W SVG Icon ───────────────────────────────────────────────────
const VehicleSvgIcon = ({ code, size = 96 }: { code: string; size?: number }) => {
    const c = code.toUpperCase();
    const stroke = '#0f172a';
    const sw = '2';
    const lc = 'round';
    const lj = 'round';

    // Electric Car / Truck / Van
    if (
        c.includes('ELECTRIC_CAR') ||
        c.includes('TRUCK') ||
        c.includes('TAI') ||
        c.includes('LORRY') ||
        c.includes('VAN') ||
        (c.includes('ELECTRIC') && c.includes('CAR'))
    ) return (
        <img
            src="https://res.cloudinary.com/dgz3rhiv4/image/upload/v1781593889/electric-car_gittvm.png"
            alt="Electric Car"
            style={{ width: size, height: size, objectFit: 'contain' }}
        />
    );

    // Electric bicycle / scooter
    if (c.includes('ELECTRIC') || c.includes('DIEN') || c.includes('EV')) return (
        <img
            src="https://res.cloudinary.com/dgz3rhiv4/image/upload/v1781593348/electric-motor_tijdux.png"
            alt="Electric Bicycle"
            style={{ width: size, height: size, objectFit: 'contain' }}
        />
    );

    // Motorcycle / motorbike
    if (c.includes('MOTOR') || c.includes('MOTO') || c.includes('SCOOTER') || c.includes('MAY')) return (
        <img
            src="https://res.cloudinary.com/dgz3rhiv4/image/upload/v1781592993/bike_uzksng.png"
            alt="Motorcycle"
            style={{ width: size, height: size, objectFit: 'contain' }}
        />
    );

    // Bicycle
    if (c.includes('BICYCLE') || c.includes('BIKE') || c.includes('DAP')) return (
        <img
            src="https://res.cloudinary.com/dgz3rhiv4/image/upload/v1781593172/bike_1_dbeqbj.png"
            alt="Bicycle"
            style={{ width: size, height: size, objectFit: 'contain' }}
        />
    );

    // Default: Car / sedan
    return (
        <img
            src="https://res.cloudinary.com/dgz3rhiv4/image/upload/v1781593098/car_s8v0sp.png"
            alt="Car"
            style={{ width: size, height: size, objectFit: 'contain' }}
        />
    );
};

// ─── Isometric Building (reused) ─────────────────────────────────────────────
const IsoBuilding = ({ floors, selectedFloor, onSelect, isFloorAllowed }: {
    floors: Floor[];
    selectedFloor: Floor | null;
    onSelect: (f: Floor) => void;
    isFloorAllowed?: (f: Floor) => boolean;
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
                const allowed = isFloorAllowed ? isFloorAllowed(f) : true;
                const frontPts = `${startX},${baseY + D} ${startX + W},${baseY + D} ${startX + W},${baseY + D + H} ${startX},${baseY + D + H}`;
                const topPts = `${startX},${baseY + D} ${startX + W},${baseY + D} ${startX + W + D},${baseY} ${startX + D},${baseY}`;
                const sidePts = `${startX + W},${baseY + D} ${startX + W + D},${baseY} ${startX + W + D},${baseY + H} ${startX + W},${baseY + D + H}`;
                const floorLabel = f.name || `Floor ${f.floorNumber < 0 ? 'B' + Math.abs(f.floorNumber) : f.floorNumber}`;
                return (
                    <g key={f._id} onClick={() => allowed && onSelect(f)}
                        style={{ cursor: allowed ? 'pointer' : 'not-allowed', opacity: allowed ? 1 : 0.45, transition: 'all 0.2s' }}>
                        <polygon points={topPts} fill={top(f)} stroke={stroke(f)} strokeWidth="1.2" />
                        <polygon points={frontPts} fill={face(f)} stroke={stroke(f)} strokeWidth="1.2" />
                        <polygon points={sidePts} fill={side(f)} stroke={stroke(f)} strokeWidth="1.2" />
                        {[0, 1, 2].map(w => (
                            <rect key={w} x={startX + 20 + w * 58} y={baseY + D + 12} width={36} height={22} rx="3"
                                fill={sel ? 'rgba(255,255,255,0.2)' : 'rgba(241,245,249,0.9)'}
                                stroke={sel ? 'rgba(255,255,255,0.4)' : '#e2e8f0'} strokeWidth="0.8" />
                        ))}
                        {allowed ? (
                            <text x={startX + W / 2} y={baseY + D + H / 2 + 5} textAnchor="middle" fontSize="12" fontWeight="700"
                                fill={sel ? '#ffffff' : '#475569'}>
                                {floorLabel}
                            </text>
                        ) : (
                            <>
                                <text x={startX + W / 2} y={baseY + D + H / 2 - 2} textAnchor="middle" fontSize="11" fontWeight="700"
                                    fill="#475569">
                                    {floorLabel}
                                </text>
                                <text x={startX + W / 2} y={baseY + D + H / 2 + 11} textAnchor="middle" fontSize="8" fontWeight="800" fill="#ef4444" letterSpacing="0.5px">
                                    UNAVAILABLE
                                </text>
                            </>
                        )}
                        {sel && <text x={startX + W - 16} y={baseY + D + H / 2 + 5} textAnchor="middle" fontSize="14" fill="#ffffff">✓</text>}
                    </g>
                );
            })}
            <ellipse cx={startX + W / 2 + D / 2} cy={startY + sorted.length * (H + gap) + D + 10} rx={W / 2 + 18} ry="9" fill="rgba(0,0,0,0.06)" />
        </svg>
    );
};

// ─── LockCountdown: tiny countdown badge inside a slot button ─────────────────
const LockCountdown = ({ lockedUntil }: { lockedUntil: string }) => {
    const [secsLeft, setSecsLeft] = React.useState(() =>
        Math.max(0, Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 1000))
    );
    useEffect(() => {
        if (secsLeft <= 0) return;
        const id = setInterval(() => {
            const left = Math.max(0, Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 1000));
            setSecsLeft(left);
            if (left === 0) clearInterval(id);
        }, 1000);
        return () => clearInterval(id);
    }, [lockedUntil]);
    if (secsLeft <= 0) return null;
    const mm = String(Math.floor(secsLeft / 60)).padStart(2, '0');
    const ss = String(secsLeft % 60).padStart(2, '0');
    return (
        <span style={{ fontSize: 8, fontWeight: 900, color: '#d97706', letterSpacing: 0 }}>
            {mm}:{ss}
        </span>
    );
};

// ─── SlotMapGrid ─────────────────────────────────────────────────────────────
const SlotMapGrid = ({ slots, selectedSlot, onSelect, vehicleType, currentUserId }: {
    slots: ParkingSlot[]; selectedSlot: ParkingSlot | null;
    onSelect: (s: ParkingSlot) => void; vehicleType: VehicleType | null;
    currentUserId?: string;
}) => {
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

    const now = Date.now();

    /** Returns style tokens based on slot state */
    const statusStyle = (s: ParkingSlot, isSelected: boolean) => {
        if (isSelected) return { bg: '#3b82f6', border: '#2563eb', text: '#ffffff', label: 'Selected', glow: '0 4px 12px rgba(59,130,246,0.35)' };

        // Locked by someone else (and lock hasn't expired)
        const isLockedByOther =
            s.lockedBy && s.lockedUntil &&
            new Date(s.lockedUntil).getTime() > now &&
            (!currentUserId || s.lockedBy !== currentUserId);

        if (isLockedByOther) {
            return {
                bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                border: '#f59e0b',
                text: '#d97706',
                label: 'Being Selected',
                glow: '0 0 0 2px rgba(245,158,11,0.25)',
                animate: true,
            };
        }

        // Locked by current user
        const isLockedByMe =
            s.lockedBy && s.lockedUntil &&
            new Date(s.lockedUntil).getTime() > now &&
            currentUserId && s.lockedBy === currentUserId;

        if (isLockedByMe) {
            return { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8', label: 'Your Selection', glow: '0 0 0 2px rgba(59,130,246,0.2)' };
        }

        // Use computedStatus from backend (takes time-based bookings into account)
        // Fall back to the raw DB status if computedStatus is not present.
        const effectiveStatus = s.computedStatus ?? s.status;

        switch (effectiveStatus) {
            case 'available': return { bg: '#ffffff', border: '#22c55e', text: '#16a34a', label: 'Available', glow: 'none' };
            case 'occupied': return { bg: '#ffffff', border: '#ef4444', text: '#ef4444', label: 'Occupied', glow: 'none' };
            case 'reserved': return {
                bg: '#ede9fe', border: '#8b5cf6', text: '#7c3aed',
                label: s.upcomingBooking
                    ? `Reserved (${s.upcomingBooking.startTime}–${s.upcomingBooking.endTime})`
                    : 'Reserved',
                glow: 'none',
            };
            case 'maintenance': return { bg: '#f8fafc', border: '#94a3b8', text: '#64748b', label: 'Maintenance', glow: 'none' };
            case 'locked': return { bg: '#f8fafc', border: '#cbd5e1', text: '#94a3b8', label: 'Locked', glow: 'none' };
            default: return { bg: '#f8fafc', border: '#e2e8f0', text: '#94a3b8', label: effectiveStatus, glow: 'none' };
        }
    };

    const canSelectSlot = (s: ParkingSlot) => {
        // Use computedStatus to block time-reserved slots from being selected
        const effectiveStatus = s.computedStatus ?? s.status;
        if (effectiveStatus !== 'available') return false;
        // If locked by someone else and lock still active → cannot select
        if (
            s.lockedBy && s.lockedUntil &&
            new Date(s.lockedUntil).getTime() > now &&
            (!currentUserId || s.lockedBy !== currentUserId)
        ) return false;
        return true;
    };

    if (slots.length === 0) return (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🅿️</div>
            <div style={{ fontWeight: 600 }}>No slots in this zone</div>
        </div>
    );

    const SlotBtn = ({ slot }: { slot: ParkingSlot }) => {
        const isSelected = selectedSlot?._id === slot._id;
        const canSelect = canSelectSlot(slot);
        const vtName = typeof slot.vehicleType === 'string' ? '' : (slot.vehicleType as any)?.name ?? '';
        const style = statusStyle(slot, isSelected);
        const isLockedByOther =
            slot.lockedBy && slot.lockedUntil &&
            new Date(slot.lockedUntil).getTime() > now &&
            (!currentUserId || slot.lockedBy !== currentUserId);

        return (
            <button
                onClick={() => canSelect && onSelect(slot)}
                disabled={!canSelect}
                title={`${slot.slotCode} — ${style.label}${vtName ? ' · ' + vtName : ''}`}
                style={{
                    width: 56, height: 82, borderRadius: 10,
                    border: `1.5px solid ${style.border}`,
                    background: style.bg as string,
                    cursor: canSelect ? 'pointer' : 'not-allowed',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: 2, padding: '4px 2px',
                    transition: 'all 0.2s ease',
                    transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                    boxShadow: style.glow || (isSelected ? '0 4px 16px rgba(59,130,246,0.3)' : '0 2px 6px rgba(0,0,0,0.04)'),
                    animation: (style as any).animate ? 'slotPulse 1.5s ease-in-out infinite' : 'none',
                    position: 'relative',
                }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: style.text as string, letterSpacing: 0.2, textAlign: 'center', lineHeight: 1.2 }}>
                    {slot.slotCode}
                </span>
                {slot.features?.hasEVCharger && <span style={{ fontSize: 10 }}>⚡</span>}
                {isSelected && <span style={{ fontSize: 13 }}>✓</span>}
            </button>
        );
    };

    return (
        <div>
            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginBottom: 24, padding: '16px 0', borderBottom: '1px solid #e2e8f0' }}>
                {[
                    { label: 'Available', bg: '#ffffff', border: '#22c55e', text: '#16a34a' },
                    { label: 'Selected', bg: '#3b82f6', border: '#2563eb', text: '#ffffff' },
                    { label: 'Occupied', bg: '#ffffff', border: '#ef4444', text: '#ef4444' },
                    { label: 'Reserved', bg: '#ede9fe', border: '#8b5cf6', text: '#7c3aed' },
                    { label: 'Being Selected ', bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '#f59e0b', text: '#d97706' },
                    { label: 'Maintenance ☒', bg: '#f8fafc', border: '#94a3b8', text: '#64748b' },
                ].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                        <div style={{ width: 16, height: 16, borderRadius: 4, background: l.bg, border: `1.5px solid ${l.border}` }} />
                        {l.label}
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Road lanes */}
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '640px', marginBottom: 6, padding: '0 8px' }}>
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
                                    {top.map(slot => <SlotBtn key={slot._id} slot={slot} />)}
                                </div>
                                {/* Road stripe */}
                                <div style={{ height: 18, background: 'repeating-linear-gradient(90deg,#f59e0b 0,#f59e0b 20px,transparent 20px,transparent 40px)', borderRadius: 4, opacity: 0.25, margin: '0 2px' }} />
                                {/* Bottom row */}
                                {bot.length > 0 && (
                                    <div style={{ display: 'flex', gap: 6, marginTop: 6, minWidth: 'max-content' }}>
                                        {bot.map(slot => <SlotBtn key={slot._id} slot={slot} />)}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
};

// ─── Main Booking Page ────────────────────────────────────────────────────────
const TEMP_PRICES: Record<string, { dayBlockRate: number, dailyRate: number }> = {
    'CAR': { dayBlockRate: 20000, dailyRate: 100000 },
    'ELECTRIC_CAR': { dayBlockRate: 25000, dailyRate: 120000 },
    'MOTORBIKE': { dayBlockRate: 8000, dailyRate: 40000 },
    'BICYCLE': { dayBlockRate: 4000, dailyRate: 20000 },
    'ELECTRIC_BIKE': { dayBlockRate: 10000, dailyRate: 50000 },
    'SMALL_TRUCK': { dayBlockRate: 40000, dailyRate: 200000 },
};

const BookingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isConnected, joinParkingLot, leaveParkingLot, onSlotUpdate } = useSocket();
    // If a spot was passed via navigation state, use it. Otherwise start empty.
    const hasSpotFromNav = !!location.state?.spot?._id;
    const [parkingSpot, setParkingSpot] = useState<any>(location.state?.spot || {});

    // No longer auto-fetching a random lot. The user must select one.

    // ── Real-time: join / leave parking lot socket room ──
    useEffect(() => {
        if (!parkingSpot._id || !isConnected) return;
        joinParkingLot(parkingSpot._id);
        return () => leaveParkingLot(parkingSpot._id);
    }, [parkingSpot._id, joinParkingLot, leaveParkingLot, isConnected]);

    // ── Real-time: patch slot status AND lock fields when backend broadcasts ──
    useEffect(() => {
        if (!isConnected) return;
        const unsubscribe = onSlotUpdate((payload: any) => {
            setFloorSlots(prev =>
                prev.map(s =>
                    s._id === payload.slotId
                        ? {
                            ...s,
                            status: payload.status ?? s.status,
                            lockedBy: payload.locked === false ? null : (payload.lockedBy ?? s.lockedBy ?? null),
                            lockedUntil: payload.locked === false ? null : (payload.lockedUntil ?? s.lockedUntil ?? null),
                        }
                        : s
                )
            );
        });
        return unsubscribe;
    }, [onSlotUpdate, isConnected]);



    // ── Step state ──
    // Start at step 1 (select building) unless a building was already chosen
    const [currentStep, setCurrentStep] = useState(hasSpotFromNav ? 2 : 1);

    // ── Step 1: License Plate ──
    const [licensePlate, setLicensePlate] = useState('');
    const [plateError, setPlateError] = useState('');
    const [savedVehicles, setSavedVehicles] = useState<Vehicle[]>([]);
    const [myMonthlyPasses, setMyMonthlyPasses] = useState<MonthlyPass[]>([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
    const [isCheckingPlate, setIsCheckingPlate] = useState(false);

    // ── Step 2: Vehicle Type ──
    const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
    const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
    const [vehicleTypesLoading, setVehicleTypesLoading] = useState(false);

    const [entryDate, setEntryDate] = useState(() => {
        const d = new Date();
        d.setMinutes(d.getMinutes() + 5 - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    });
    const [exitDate, setExitDate] = useState(() => {
        const d = new Date();
        d.setMinutes(d.getMinutes() + 5 - d.getTimezoneOffset());
        d.setHours(d.getHours() + 4);
        return d.toISOString().slice(0, 16);
    });
    const [showAllBlocks, setShowAllBlocks] = useState(false);

    const selHour = parseInt(entryDate.slice(11, 13)) || 0;
    const selMin = parseInt(entryDate.slice(14, 16)) || 0;
    const exitSelHour = parseInt(exitDate.slice(11, 13)) || 0;
    const exitSelMin = parseInt(exitDate.slice(14, 16)) || 0;
    const handleSetEntryDate = (dateStr: string, h: number, m: number) => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 5);
        const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        const todayStr = localNow.toISOString().slice(0, 10);

        let finalH = h;
        let finalM = m;
        let finalDateStr = dateStr;

        if (dateStr < todayStr) {
            finalDateStr = todayStr;
            finalH = now.getHours();
            finalM = now.getMinutes();
        } else if (dateStr === todayStr) {
            const currentHour = now.getHours();
            const currentMin = now.getMinutes();
            if (finalH < currentHour) {
                finalH = currentHour;
                finalM = Math.max(finalM, currentMin);
            } else if (finalH === currentHour && finalM < currentMin) {
                finalM = currentMin;
            }
        }
        setEntryDate(`${finalDateStr}T${String(finalH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}`);
    };

    const handleSetExitDate = (h: number, m: number) => {
        let dateStr = exitDate.slice(0, 10); // Đổi thành let để có thể gán lại
        let finalH = h;
        let finalM = m;
        let proposed = new Date(`${dateStr}T${String(finalH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}`);
        const entry = new Date(entryDate);
        if (proposed <= entry) {
            // Tự động đẩy sang ngày hôm sau
            proposed.setDate(proposed.getDate() + 1);
            const y = proposed.getFullYear();
            const mo = String(proposed.getMonth() + 1).padStart(2, '0');
            const d = String(proposed.getDate()).padStart(2, '0');
            dateStr = `${y}-${mo}-${d}`;
        }
        setExitDate(`${dateStr}T${String(finalH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}`);
    };

    const setSlot = (h: number, m: number) => {
        handleSetEntryDate(entryDate.slice(0, 10), h, m);
        // Ensure exit date shifts if entry passes it
        const proposedEntry = new Date(`${entryDate.slice(0, 10)}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        const currentExit = new Date(exitDate);
        if (proposedEntry >= currentExit) {
            const nextExit = new Date(proposedEntry.getTime() + 1 * 3600000); // Tự động đẩy lên 1 tiếng thay vì 4 tiếng
            const iso = nextExit.toISOString();
            setExitDate(`${iso.slice(0, 10)}T${String(nextExit.getHours()).padStart(2, '0')}:${String(nextExit.getMinutes()).padStart(2, '0')}`);
        }
    };

    const setExitSlot = (h: number, m: number) => {
        handleSetExitDate(h, m);
    };

    const [showCalendar, setShowCalendar] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showExitTimePicker, setShowExitTimePicker] = useState(false);

    useEffect(() => {
        if (showTimePicker) {
            setTimeout(() => {
                document.getElementById(`time-picker-hour-${selHour}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                document.getElementById(`time-picker-min-${selMin}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }, 50);
        }
    }, [showTimePicker, selHour, selMin]);

    useEffect(() => {
        if (showExitTimePicker) {
            setTimeout(() => {
                document.getElementById(`exit-picker-hour-${exitSelHour}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                document.getElementById(`exit-picker-min-${exitSelMin}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }, 50);
        }
    }, [showExitTimePicker, exitSelHour, exitSelMin]);

    const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
    const [calYear, setCalYear] = useState(() => new Date().getFullYear());
    const [activeInput, setActiveInput] = useState<'from' | 'to'>('from');

    // Temporal calendar values
    const [tempFromDate, setTempFromDate] = useState<Date>(() => new Date());
    const [tempToDate, setTempToDate] = useState<Date>(() => {
        const d = new Date();
        d.setHours(d.getHours() + 2);
        return d;
    });

    const openCalendar = (mode: 'from' | 'to') => {
        const fromDate = new Date(entryDate.slice(0, 10));
        const toDate = new Date(exitDate.slice(0, 10));

        setTempFromDate(fromDate);
        setTempToDate(toDate);

        const targetDate = mode === 'from' ? fromDate : toDate;
        setCalMonth(targetDate.getMonth());
        setCalYear(targetDate.getFullYear());
        setActiveInput(mode);
        setShowCalendar(true);
    };

    // ── Step 4: Floor ──
    const [floors, setFloors] = useState<Floor[]>([]);
    const [floorsLoading, setFloorsLoading] = useState(false);
    const [floorsError, setFloorsError] = useState<string | null>(null);
    const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);

    // ── Step 5: Zone ──
    const [zones, setZones] = useState<Zone[]>([]);
    const [zonesLoading, setZonesLoading] = useState(false);
    const [zonesError, setZonesError] = useState<string | null>(null);
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

    // ── Step 6: Slot ──
    const [floorSlots, setFloorSlots] = useState<ParkingSlot[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [slotsError, setSlotsError] = useState<string | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);

    // ── Current user ID (for lock ownership check) ──
    const [currentUserId] = useState<string | undefined>(() => {
        try {
            const raw = localStorage.getItem('user');
            if (raw) return JSON.parse(raw)?._id;
        } catch (_) { }
        return undefined;
    });

    // ── Slot lock timer (counts down 3 min) ──
    const [slotLockUntil, setSlotLockUntil] = useState<Date | null>(null);
    const lockTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSelectSlot = useCallback(async (slot: ParkingSlot) => {
        // Unlock previously selected slot if different
        if (selectedSlot && selectedSlot._id !== slot._id) {
            try { await parkingSlotService.unlockSlot(selectedSlot._id); } catch (_) { }
        }
        setSelectedSlot(slot);

        // Lock the newly selected slot.
        // Pass wantedStart so backend can allow locking an occupied slot whose
        // current booking ends before the customer's desired start time.
        try {
            const res = await parkingSlotService.lockSlot(
                slot._id,
                entryDate ? new Date(entryDate).toISOString() : undefined,
            );
            const data = (res as any)?.data || res;
            const until = new Date(data.lockedUntil);
            setSlotLockUntil(until);
            // Auto-unlock and clear selection after 3 min if user didn't proceed
            if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
            lockTimerRef.current = setTimeout(async () => {
                try { await parkingSlotService.unlockSlot(slot._id); } catch (_) { }
                setSelectedSlot(null);
                setSlotLockUntil(null);
            }, until.getTime() - Date.now());
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'This slot is being selected by another user.';
            alert(`⚠️ ${msg}`);
        }
    }, [selectedSlot, entryDate]);

    // Cleanup lock on unmount
    useEffect(() => {
        return () => {
            if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
            if (selectedSlot) {
                parkingSlotService.unlockSlot(selectedSlot._id).catch(() => { });
            }
        };
    }, [selectedSlot]);

    // ── Confirm Modal ──
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // ── Motorbike Toast Notice ──
    const [showMotorbikeToast, setShowMotorbikeToast] = useState(true);
    const isMotorbike = useMemo(() => {
        if (!vehicleType) return false;
        const code = vehicleType.code?.toUpperCase() || '';
        return code.includes('MOTOR') || code.includes('MOTO') || code.includes('SCOOTER') || code.includes('MAY');
    }, [vehicleType]);

    useEffect(() => {
        if (currentStep === 5) {
            setShowMotorbikeToast(true);
        }
    }, [currentStep]);

    // ── Integrated Checkout States ──
    const [checkoutPhase, setCheckoutPhase] = useState<'review' | 'payment' | 'qr'>('review');
    const [payMethod, setPayMethod] = useState<'bank_transfer'>('bank_transfer');
    const [checkoutProcessing, setCheckoutProcessing] = useState(false);
    const [checkoutErrors, setCheckoutErrors] = useState<Record<string, string>>({});

    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [successBooking, setSuccessBooking] = useState<any>(null);
    const [mockTransferContent, setMockTransferContent] = useState('');
    const [bankInfo, setBankInfo] = useState<any>(null);
    const [polling, setPolling] = useState(false);

    useEffect(() => {
        if (showSuccessToast) {
            const timer = setTimeout(() => {
                setShowSuccessToast(false);
            }, 8000);
            return () => clearTimeout(timer);
        }
    }, [showSuccessToast]);

    useEffect(() => {
        if (!showConfirmModal) {
            setCheckoutPhase('review');
            setCheckoutErrors({});
            setCheckoutProcessing(false);
            setPolling(false);
            setBankInfo(null);
        }
    }, [showConfirmModal]);

    // ── Compatibility for TicketsPage & Header ──
    const saveToMyTickets = (backendData: any) => {
        const grandTotal = Math.round(estimatedPrice);
        const rawExit = exitTime;

        const bookingDetails = {
            receiptId: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
            bookingId: backendData._id || backendData.data?._id,
            spot: parkingSpot,
            vehicleType: vehicleType?.code || 'CAR',
            floorName: selectedFloor?.name || `Floor ${selectedFloor?.floorNumber ?? 1}`,
            slotCode: selectedSlot?.slotCode ?? '',
            licensePlate: formatPlate(licensePlate),
            entryDate: new Date(entryDate).toISOString(),
            exitTime: rawExit.toISOString(),
            elapsed: new Date(exitDate).getTime() - new Date(entryDate).getTime(),
            totalAmount: grandTotal,
            payMethod,
        };

        const existingRaw = localStorage.getItem('myTickets');
        let ticketsList = [];
        if (existingRaw) {
            try { ticketsList = JSON.parse(existingRaw); } catch (e) { ticketsList = []; }
        }
        const updatedTicketsList = [bookingDetails, ...ticketsList];
        localStorage.setItem('myTickets', JSON.stringify(updatedTicketsList));
        localStorage.setItem('activeBooking', JSON.stringify(bookingDetails));

        window.dispatchEvent(new Event('bookingUpdated'));
    };

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (polling && bankInfo?.payment?._id) {
            interval = setInterval(async () => {
                try {
                    const res = await paymentService.checkBankTransferStatus(bankInfo.payment._id);
                    const statusInfo = (res as any).data || res;
                    if (statusInfo.isPaid || statusInfo.matched) {
                        setPolling(false);
                        clearInterval(interval);

                        saveToMyTickets(successBooking);

                        navigate('/tickets', {
                            state: {
                                showToast: 'Booking successful! Your ticket has been saved here.'
                            }
                        });

                        setCheckoutProcessing(false);
                        setShowConfirmModal(false);
                    }
                } catch (err) {
                    console.error('Polling error:', err);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [polling, bankInfo, successBooking]);

    const handleConfirmPayment = async () => {
        setCheckoutErrors({});
        setCheckoutProcessing(true);

        try {
            // Extract HH:mm directly from the local-time strings to avoid UTC conversion bugs
            const startTime = entryDate.slice(11, 16);   // "HH:mm" from "YYYY-MM-DDTHH:mm"
            const endTime = exitDate.slice(11, 16);       // "HH:mm" from "YYYY-MM-DDTHH:mm"
            const scheduledDate = entryDate.slice(0, 10); // "YYYY-MM-DD"

            const bookingPayload = {
                parkingLot: parkingSpot._id,
                vehicleType: vehicleType?._id,
                scheduledDate,
                startTime,
                endTime,
                vehicleInfo: {
                    licensePlate: formatPlate(licensePlate),
                },
                floorId: selectedFloor?._id,
                zoneId: selectedZone?._id,
                assignedSlot: selectedSlot?._id,
            };

            // axiosClient returns response.data directly (not wrapped in .data)
            const bookingRes: any = await bookingService.create(bookingPayload);
            const bookingObj = bookingRes?.data || bookingRes;
            const bookingId = bookingObj?._id;

            setCheckoutProcessing(false);
            setShowConfirmModal(false);

            // Navigate to /checkout page — CheckoutPage handles payment method selection
            navigate('/checkout', {
                state: {
                    isBooking: true,
                    bookingId,
                    bookingCode: bookingObj?.bookingCode,
                    parkingLotName: parkingSpot?.title || parkingSpot?.name,
                    licensePlate: formatPlate(licensePlate),
                    vehicleTypeName: vehicleType?.code,
                    floorName: selectedFloor?.name || `Floor ${selectedFloor?.floorNumber}`,
                    slotCode: selectedSlot?.slotCode,
                    entryDate,
                    exitDate,
                    totalAmount: estimatedPrice,
                }
            });
        } catch (error: any) {
            // axiosClient transforms errors to { status, message, raw } — not error.response
            console.error('[Booking error]', error);
            const formMsg =
                error?.message ||
                error?.raw?.response?.data?.message ||
                'Failed to create booking. Please try again.';
            setCheckoutErrors({ form: formMsg });
            setCheckoutProcessing(false);
        }
    }; // end handleConfirmPayment

    // ─── isFloorAllowed helper ──────────────────────────────────────────────
    const isFloorAllowed = (floor: Floor) => {
        if (!vehicleType) return true;
        if (!floor.allowedVehicleTypes || floor.allowedVehicleTypes.length === 0) return true;
        return floor.allowedVehicleTypes.some((vt: any) => {
            const vtId = typeof vt === 'string' ? vt : vt?._id ?? vt?.code;
            return vtId === vehicleType._id || vtId === vehicleType.code;
        });
    };

    // ─── Data fetching ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!parkingSpot._id) return;
        setVehicleTypesLoading(true);
        vehicleTypeService.getAll({ parkingLot: parkingSpot._id })
            .then((data: any) => {
                const list: VehicleType[] = Array.isArray(data) ? data : data?.data ?? [];
                setVehicleTypes(list.filter((v: VehicleType) => v.isActive && !v.isDeleted));
            })
            .catch(() => setVehicleTypes([
                { _id: 'car', name: 'Car', code: 'CAR', size: 'medium', isActive: true, pricing: { hourlyRate: 10000, dailyRate: 80000, dayBlockRate: 20000, nightBlockRate: 30000 } },
                { _id: 'motorcycle', name: 'Motorcycle', code: 'MOTORBIKE', size: 'small', isActive: true, pricing: { hourlyRate: 5000, dailyRate: 40000, dayBlockRate: 8000, nightBlockRate: 12000 } },
            ]))
            .finally(() => setVehicleTypesLoading(false));
    }, [parkingSpot._id]);

    useEffect(() => {
        // Fetch saved vehicles
        vehicleService.getMyVehicles(1, 50)
            .then((res: any) => {
                const list = Array.isArray(res?.data) ? res.data : (res?.data?.docs || res?.docs || (Array.isArray(res) ? res : []));
                setSavedVehicles(list);
            })
            .catch(() => { /* not logged in or no vehicles */ });

        // Fetch monthly passes to prevent booking if already has a pass
        monthlyPassService.getMyMonthlyPasses()
            .then((res: any) => {
                const passes = Array.isArray(res?.data) ? res.data : (res?.data?.docs || res?.docs || (Array.isArray(res) ? res : []));
                setMyMonthlyPasses(passes);
            })
            .catch(() => { /* ignore */ });
    }, []);

    useEffect(() => {
        setFloorsLoading(true); setFloorsError(null);
        const params: any = { status: 'active' };
        if (parkingSpot._id) params.parkingLot = parkingSpot._id;
        floorService.getFloors(params)
            .then((data: any) => setFloors(Array.isArray(data) ? data : data?.data ?? []))
            .catch((err: any) => setFloorsError(err?.message || 'Failed to load floors'))
            .finally(() => setFloorsLoading(false));
    }, [parkingSpot._id]);

    useEffect(() => {
        if (!selectedFloor) { setZones([]); setSelectedZone(null); setFloorSlots([]); setSelectedSlot(null); return; }
        setZonesLoading(true); setZonesError(null);
        setSelectedZone(null); setSelectedSlot(null); setFloorSlots([]);
        const params: any = { floor: selectedFloor._id };
        if (parkingSpot._id) params.parkingLot = parkingSpot._id;
        zoneService.getZones(params)
            .then((data: any) => {
                const list: Zone[] = Array.isArray(data) ? data : data?.data ?? [];
                setZones(list.filter(z => {
                    if (z.isDeleted || z.status !== 'active') return false;
                    if (!vehicleType || !z.allowedVehicleTypes?.length) return true;
                    return z.allowedVehicleTypes.some((vt: any) => {
                        const vtId = typeof vt === 'string' ? vt : vt?._id ?? vt?.code;
                        return vtId === vehicleType._id || vtId === vehicleType.code;
                    });
                }));
            })
            .catch((err: any) => setZonesError(err?.message || 'Failed to load zones'))
            .finally(() => setZonesLoading(false));
    }, [selectedFloor]);

    useEffect(() => {
        if (!selectedFloor) return;
        setSlotsLoading(true); setSlotsError(null);
        // Pass the customer's chosen time window so the backend can mark
        // slots with conflicting bookings as computedStatus='reserved'.
        const params = (entryDate && exitDate)
            ? { wantedStart: new Date(entryDate).toISOString(), wantedEnd: new Date(exitDate).toISOString() }
            : undefined;
        parkingSlotService.getFloorMap(selectedFloor._id, params)
            .then((data: any) => setFloorSlots((Array.isArray(data) ? data : data?.data ?? []).filter((s: ParkingSlot) => !s.isDeleted)))
            .catch((err: any) => setSlotsError(err?.message || 'Failed to load slots'))
            .finally(() => setSlotsLoading(false));
    }, [selectedFloor, entryDate, exitDate]);

    useEffect(() => {
        setSelectedFloor(null); setSelectedZone(null);
        setFloorSlots([]); setSelectedSlot(null); setZones([]);
    }, [vehicleType]);

    useEffect(() => { setSelectedSlot(null); }, [selectedZone]);

    // ─── Derived ────────────────────────────────────────────────────────────
    const zoneSlots = useMemo(() => {
        if (!selectedZone) return [];
        return floorSlots.filter(s => getZoneId(s.zone) === selectedZone._id);
    }, [floorSlots, selectedZone]);

    const exitTime = new Date(exitDate);
    const durationMs = exitTime.getTime() - new Date(entryDate).getTime();
    const duration = Math.max(0, Math.round(durationMs / 3600000));
    const baseRate = vehicleType?.pricing?.dayBlockRate || (TEMP_PRICES[vehicleType?.code?.toUpperCase()]?.dayBlockRate) || (vehicleType?.pricing?.hourlyRate ? vehicleType.pricing.hourlyRate * 4 : 20000);
    const nightRate = vehicleType?.pricing?.nightBlockRate || baseRate * 1.5;

    let calculatedEstCost = 0;
    let hasDayBlock = false;
    let hasNightBlock = false;
    let tempStart = new Date(entryDate);
    const tempExit = new Date(exitTime);

    while (tempStart < tempExit) {
        const blockEnd = new Date(Math.min(tempExit.getTime(), tempStart.getTime() + 4 * 60 * 60 * 1000));
        const effectiveEnd = new Date(blockEnd.getTime() - 1);
        const startHour = tempStart.getHours();
        const endHour = effectiveEnd.getHours();
        const isStartNight = startHour >= 18 || startHour < 6;
        const isEndNight = endHour >= 18 || endHour < 6;
        const isNightBlock = isStartNight || isEndNight;
        if (isNightBlock) hasNightBlock = true;
        else hasDayBlock = true;
        calculatedEstCost += isNightBlock ? nightRate : baseRate;
        tempStart = new Date(tempStart.getTime() + 4 * 60 * 60 * 1000);
    }
    const estimatedPrice = calculatedEstCost;

    // ─── Check if current plate already has an active/pending pass ──────────
    const activePlatePass = useMemo(() => {
        if (!licensePlate || !parkingSpot._id) return null;
        const cleaned = formatPlate(licensePlate, vehicleType?.code);
        return myMonthlyPasses.find(p => {
            const pLotId = typeof p.parkingLot === 'object' ? p.parkingLot._id : p.parkingLot;
            return p.licensePlate === cleaned &&
                ['active', 'pending'].includes(p.status) &&
                pLotId === parkingSpot._id;
        }) || null;
    }, [licensePlate, vehicleType, myMonthlyPasses, parkingSpot._id]);

    const canProceed = (step: number): boolean => {
        switch (step) {
            case 1: return !!parkingSpot?._id;
            case 2: return !!vehicleType;
            case 3: return licensePlate.trim().length >= 4 && licensePlate.trim().length <= 10 && !activePlatePass;
            case 4: return !!entryDate && !!exitDate && new Date(exitDate).getTime() > new Date(entryDate).getTime();
            case 5: return !!selectedFloor;
            case 6: return !!selectedZone;
            case 7: return !!selectedSlot;
            default: return false;
        }
    };


    const handleNext = async () => {
        if (currentStep === 3) {
            const cleaned = formatPlate(licensePlate, vehicleType?.code);
            setLicensePlate(cleaned);
            if (cleaned.length < 4 || cleaned.length > 10) {
                setPlateError('Biển số xe không hợp lệ (tối đa 9 ký tự)');
                return;
            }

            // Check if entered plate has active pass for this lot
            const activePass = myMonthlyPasses.find(p => {
                const pLotId = typeof p.parkingLot === 'object' ? p.parkingLot._id : p.parkingLot;
                return p.licensePlate === cleaned &&
                    ['active', 'pending'].includes(p.status) &&
                    pLotId === parkingSpot._id;
            });
            if (activePass) {
                setPlateError('This vehicle already has a Monthly Pass for this location. You can park without booking.');
                return;
            }

            setIsCheckingPlate(true);
            try {
                // 1. Check if the vehicle is currently parked
                try {
                    const activeRes = await parkingSessionService.findActive({ licensePlate: cleaned });
                    if (activeRes && activeRes._id) {
                        setPlateError('This vehicle is currently parked (has an active session).');
                        setIsCheckingPlate(false);
                        return;
                    }
                } catch (e: any) {
                    const status = e?.status || e?.response?.status;
                    if (status !== 404) {
                        console.error('Check active error', e);
                    }
                }

                // 2. Check if the vehicle already has an upcoming booking
                const myBookings = await bookingService.getMyBookings({ limit: 50 });
                const list = Array.isArray(myBookings) ? myBookings : (myBookings?.data ?? myBookings?.docs ?? []);

                const EXPIRY_MS = 10 * 60 * 1000; // 10 phút
                const conflictingBooking = list.find((b: any) => {
                    if (b.vehicleInfo?.licensePlate !== cleaned) return false;
                    if (!['pending', 'approved'].includes(b.status)) return false;
                    // Auto-cancel unpaid booking đã hết hạn (quá 10 phút, dù pending hay approved)
                    if (b.paymentStatus !== 'paid' && b.createdAt) {
                        const elapsed = Date.now() - new Date(b.createdAt).getTime();
                        if (elapsed > EXPIRY_MS) {
                            bookingService.cancel(b._id || b.id, 'Payment timeout').catch(() => {});
                            return false;
                        }
                    }
                    return true;
                });

                if (conflictingBooking) {
                    const bid = conflictingBooking._id || conflictingBooking.id;
                    if (conflictingBooking.paymentStatus === 'paid') {
                        setPlateError(`__PAID_BOOKING__:${bid}`);
                    } else {
                        setPlateError(`__UNPAID_BOOKING__:${bid}`);
                    }
                    setIsCheckingPlate(false);
                    return;
                }
            } catch (err) {
                console.error('Validation error', err);
            }
            setIsCheckingPlate(false);

            setPlateError('');
        }
        if (currentStep < 7) setCurrentStep(s => s + 1);
        else setShowConfirmModal(true);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(s => s - 1);
        else navigate(-1);
    };

    const handleReserve = () => {
        if (!vehicleType || !selectedFloor || !selectedZone || !selectedSlot) return;
        setShowConfirmModal(false);
        navigate('/session', {
            state: {
                spot: parkingSpot,
                vehicleType,
                vehicleTypeId: vehicleType._id,
                floor: selectedFloor,
                zone: selectedZone,
                slot: selectedSlot,
                licensePlate: formatPlate(licensePlate),
                entryDate,
                exitDate,
                estimatedPrice,
                blockRate: baseRate,  // Truyền thẳng giá 1 block để SessionPage dùng
            }
        });
    };

    const fmtExit = () => {
        const d = exitTime;
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const vehicleIcon = (code: string) => {
        const c = code.toUpperCase();
        if (c.includes('TRUCK') || c.includes('LORRY')) return '🚛';
        if (c.includes('BIKE') || c.includes('BICYCLE')) return '🚲';
        if (c.includes('ELECTRIC')) return '⚡';
        if (c.includes('MOTOR') || c.includes('MOTO') || c.includes('SCOOTER')) return '🏍️';
        return '🚗';
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                .time-drum-input {
                    height: 60px;
                    width: 90px;
                    font-size: 44px;
                    font-weight: 900;
                    color: #1e293b;
                    letter-spacing: -2px;
                    background: white;
                    border-radius: 16px;
                    border: 2.5px solid #e2e8f0;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                    text-align: center;
                    outline: none;
                    cursor: text;
                    padding: 0;
                    transition: all 0.2s ease;
                    -moz-appearance: textfield;
                }
                .time-drum-input::-webkit-outer-spin-button,
                .time-drum-input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                .time-drum-input:hover {
                    border-color: #cbd5e1;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.06);
                }
                .time-drum-input:focus {
                    border-color: #2563eb;
                    box-shadow: 0 6px 20px rgba(37,99,235,0.18);
                }

                /* ── Calendar UI ── */
                .cal-container {
                    background: #f0f6fa;
                    border-radius: 20px;
                    border: 1.5px solid #e2e8f0;
                    padding: 20px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
                    margin-bottom: 24px;
                    position: relative;
                }
                .cal-header-title {
                    font-size: 20px;
                    font-weight: 850;
                    color: #1e293b;
                    margin-bottom: 16px;
                    font-family: 'Inter', sans-serif;
                }
                .cal-triggers-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .cal-trigger-label {
                    font-size: 13px;
                    font-weight: 700;
                    color: #64748b;
                }
                .cal-trigger-btn {
                    flex: 1;
                    background: white;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 10px 16px;
                    font-size: 14px;
                    font-weight: 700;
                    color: #334155;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .cal-trigger-btn:hover {
                    border-color: #cbd5e1;
                    background: #f8fafc;
                }
                .cal-trigger-btn.active {
                    border-color: #2563eb;
                    box-shadow: 0 0 0 3px rgba(37,99,235,0.15);
                }
                .cal-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.45);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    animation: calFadeIn 0.2s ease-out;
                }
                .cal-modal-content {
                    background: white;
                    border-radius: 24px;
                    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.15);
                    width: 95%;
                    max-width: 400px;
                    padding: 24px;
                    position: relative;
                    animation: calScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                @keyframes calFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes calScaleIn {
                    from { transform: scale(0.9) translateY(10px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
                .cal-popover-header {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    margin-bottom: 16px;
                }
                .cal-select {
                    padding: 6px 12px;
                    border-radius: 10px;
                    border: 1.5px solid #e2e8f0;
                    font-size: 13px;
                    font-weight: 700;
                    color: #334155;
                    background: #f8fafc;
                    outline: none;
                    cursor: pointer;
                }
                .cal-select:hover {
                    border-color: #cbd5e1;
                }
                .cal-weekdays {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    text-align: center;
                    margin-bottom: 8px;
                }
                .cal-weekday {
                    font-size: 11px;
                    font-weight: 700;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .cal-days-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 4px;
                }
                .cal-day-cell {
                    aspect-ratio: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 13px;
                    font-weight: 700;
                    border-radius: 50%;
                    cursor: pointer;
                    position: relative;
                    transition: all 0.15s ease;
                    color: #334155;
                }
                .cal-day-cell.other-month {
                    color: #cbd5e1;
                }
                .cal-day-cell.disabled {
                    color: #e2e8f0;
                    cursor: not-allowed;
                    text-decoration: line-through;
                }
                .cal-day-cell.in-range {
                    background: #eff6ff;
                    border-radius: 0;
                }
                .cal-day-cell.range-start {
                    background: #2563eb !important;
                    color: white !important;
                    border-radius: 50% 0 0 50%;
                }
                .cal-day-cell.range-end {
                    background: #2563eb !important;
                    color: white !important;
                    border-radius: 0 50% 50% 0;
                }
                .cal-day-cell.range-start-end-same {
                    background: #2563eb !important;
                    color: white !important;
                    border-radius: 50% !important;
                }
                .cal-day-cell:not(.disabled):not(.range-start):not(.range-end):hover {
                    background: #f1f5f9;
                    border-radius: 50%;
                }
                .cal-popover-footer {
                    display: flex;
                    justify-content: center;
                    margin-top: 16px;
                    padding-top: 12px;
                    border-top: 1.5px solid #f1f5f9;
                }
                .cal-btn {
                    padding: 10px 20px;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 700;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s ease;
                }
                .cal-btn-close {
                    background: #fef2f2;
                    color: #ef4444;
                    width: 100%;
                    text-align: center;
                }
                .cal-btn-close:hover {
                    background: #fee2e2;
                }
                .cal-btn-confirm {
                    background: #ecfdf5;
                    color: #10b981;
                }
                .cal-btn-confirm:hover {
                    background: #d1fae5;
                }

                .bk-root {
                    min-height: 100vh;
                    background: #f8fafc;
                    font-family: 'Inter', 'Segoe UI', sans-serif;
                    color: #0f172a;
                }

                /* ── Stepper bar ── */
                .bk-stepper-wrap {
                    background: white;
                    border-bottom: 1px solid #e2e8f0;
                    padding: 12px 24px 0;
                    position: sticky;
                    top: 72px;
                    z-index: 30;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
                }
                .bk-stepper {
                    max-width: 900px;
                    margin: 0 auto;
                    display: flex;
                    align-items: flex-start;
                    overflow-x: auto;
                    padding-top: 8px;
                    padding-bottom: 8px;
                    scrollbar-width: none;
                }
                .bk-stepper::-webkit-scrollbar { display: none; }
                .bk-step {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    flex: 1;
                    min-width: 80px;
                    position: relative;
                    padding-bottom: 16px;
                }
                .bk-step::after {
                    content: '';
                    position: absolute;
                    top: 18px;
                    left: calc(50% + 18px);
                    right: calc(-50% + 18px);
                    height: 2px;
                    background: #e2e8f0;
                    transition: background 0.3s;
                }
                .bk-step:last-child::after { display: none; }
                .bk-step.completed::after { background: #2563eb; }
                .bk-step-circle {
                    width: 36px; height: 36px;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 13px; font-weight: 800;
                    transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
                    border: 2px solid #e2e8f0;
                    background: white;
                    color: #94a3b8;
                    position: relative;
                    z-index: 1;
                    flex-shrink: 0;
                }
                .bk-step.active .bk-step-circle {
                    background: #2563eb;
                    border-color: #2563eb;
                    color: white;
                    box-shadow: 0 0 0 4px rgba(37,99,235,0.15);
                    transform: scale(1.15);
                }
                .bk-step.completed .bk-step-circle {
                    background: #10b981;
                    border-color: #10b981;
                    color: white;
                }
                .bk-step-label {
                    margin-top: 8px;
                    font-size: 10px;
                    font-weight: 600;
                    color: #94a3b8;
                    text-align: center;
                    letter-spacing: 0.02em;
                    text-transform: uppercase;
                    white-space: nowrap;
                    transition: color 0.2s;
                }
                .bk-step.active .bk-step-label { color: #2563eb; font-weight: 700; }
                .bk-step.completed .bk-step-label { color: #10b981; }

                /* ── Page layout ── */
                .bk-body {
                    max-width: 760px;
                    margin: 0 auto;
                    padding: 32px 20px 100px;
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 24px;
                    align-items: start;
                }

                /* ── Step content card ── */
                .bk-card {
                    background: white;
                    border-radius: 20px;
                    border: 1px solid #e8edf4;
                    padding: 32px;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
                    animation: stepIn 0.35s cubic-bezier(0.22,1,0.36,1) both;
                    overflow: hidden;
                }
                @keyframes stepIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                .bk-step-header {
                    display: flex; align-items: center; gap: 14px; margin-bottom: 28px;
                }
                .bk-step-icon {
                    width: 52px; height: 52px;
                    background: linear-gradient(135deg, #eff6ff, #dbeafe);
                    border-radius: 14px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 24px;
                    border: 1px solid #bfdbfe;
                }
                .bk-step-title { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px; }
                .bk-step-sub { font-size: 13px; color: #64748b; font-weight: 500; margin-top: 2px; }

                /* ── Navigation buttons ── */
                .bk-nav {
                    display: flex; gap: 12px; margin-top: 32px; justify-content: space-between;
                }
                .bk-btn-back {
                    padding: 14px 24px;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 12px;
                    background: white;
                    color: #475569;
                    font-size: 14px; font-weight: 700;
                    cursor: pointer;
                    display: flex; align-items: center; gap: 8px;
                    transition: all 0.2s;
                }
                .bk-btn-back:hover { border-color: #94a3b8; background: #f8fafc; }
                .bk-btn-next {
                    flex: 1;
                    padding: 14px 24px;
                    border: none;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #2563eb, #1d4ed8);
                    color: white;
                    font-size: 15px; font-weight: 800;
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
                    box-shadow: 0 6px 20px rgba(37,99,235,0.35);
                    letter-spacing: 0.02em;
                }
                .bk-btn-next:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(37,99,235,0.45); }
                .bk-btn-next:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
                .bk-btn-next:active:not(:disabled) { transform: scale(0.98); }

                /* ── Step 1: License Plate ── */
                .lp-hero {
                    text-align: center;
                    padding: 8px 0 24px;
                }
                .lp-hero-icon { font-size: 80px; margin-bottom: 12px; line-height: 1; }
                .lp-input-wrap {
                    position: relative;
                    margin: 0 auto;
                    max-width: 320px;
                }
                .lp-plate-input {
                    width: 100%;
                    padding: 18px 20px;
                    font-size: 24px;
                    font-weight: 900;
                    text-align: center;
                    letter-spacing: 0.14em;
                    font-family: 'Courier New', monospace;
                    border: 3px solid #e2e8f0;
                    border-radius: 14px;
                    background: #f8fafc;
                    color: #0f172a;
                    outline: none;
                    text-transform: uppercase;
                    transition: all 0.25s;
                }
                .lp-plate-input:focus { border-color: #2563eb; background: white; box-shadow: 0 0 0 4px rgba(37,99,235,0.12); }
                .lp-plate-input.error { border-color: #ef4444; background: #fef2f2; box-shadow: 0 0 0 4px rgba(239,68,68,0.1); }
                .lp-plate-preview {
                    margin-top: 20px;
                    padding: 14px 24px;
                    background: linear-gradient(135deg, #1e293b, #334155);
                    border-radius: 12px;
                    display: inline-flex;
                    align-items: center;
                    gap: 12px;
                    color: white;
                    font-weight: 900;
                    font-size: 22px;
                    letter-spacing: 0.1em;
                    font-family: monospace;
                    box-shadow: 0 8px 28px rgba(15,23,42,0.35);
                    border: 2px solid rgba(255,255,255,0.1);
                }
                .lp-flag { font-size: 20px; }
                .lp-hint {
                    font-size: 12px; color: #94a3b8; font-weight: 500;
                    margin-top: 12px; line-height: 1.6;
                }
                .lp-error { font-size: 13px; color: #ef4444; font-weight: 600; margin-top: 8px; text-align: center; }

                /* ── Step 2: Vehicle Types ── */
                .vt-grid {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 16px;
                }
                .vt-card {
                    flex: 1 1 130px;
                    max-width: 160px;
                    border: 2px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 20px 12px;
                    cursor: pointer;
                    text-align: center;
                    transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
                    background: white;
                }
                .vt-card:hover { border-color: #93c5fd; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(37,99,235,0.12); }
                .vt-card.sel {
                    border-color: #2563eb;
                    background: linear-gradient(135deg, #eff6ff, #dbeafe);
                    box-shadow: 0 6px 20px rgba(37,99,235,0.2);
                    transform: translateY(-3px) scale(1.02);
                }
                .vt-icon { font-size: 36px; margin-bottom: 10px; line-height: 1; }
                .vt-name { font-size: 13px; font-weight: 800; color: #1e293b; margin-bottom: 4px; }
                .vt-price { font-size: 11px; color: #64748b; font-weight: 600; }
                .vt-check {
                    width: 22px; height: 22px;
                    background: #2563eb; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    color: white; font-size: 12px; font-weight: 900;
                    margin: 8px auto 0;
                }

                /* ── Step 3: Date/Time ── */
                .dt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                @media (max-width: 480px) { .dt-grid { grid-template-columns: 1fr; } }
                .dt-field { display: flex; flex-direction: column; gap: 8px; }
                .dt-label {
                    font-size: 11px; font-weight: 700; color: #64748b;
                    text-transform: uppercase; letter-spacing: 0.08em;
                }
                .dt-input {
                    padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px;
                    font-size: 14px; font-weight: 600; color: #0f172a;
                    background: #f8fafc; outline: none; transition: all 0.2s; width: 100%;
                }
                .dt-input:focus { border-color: #2563eb; background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
                .duration-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
                .dur-pill {
                    padding: 9px 18px; border: 2px solid #e2e8f0; border-radius: 20px;
                    font-size: 13px; font-weight: 700; cursor: pointer;
                    transition: all 0.2s; background: white; color: #475569;
                }
                .dur-pill:hover { border-color: #93c5fd; color: #1d4ed8; }
                .dur-pill.sel {
                    border-color: #2563eb; background: #2563eb; color: white;
                    box-shadow: 0 4px 12px rgba(37,99,235,0.3);
                }
                .dt-exit-info {
                    margin-top: 20px; padding: 16px 20px;
                    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
                    border: 1.5px solid #86efac; border-radius: 14px;
                    display: flex; align-items: center; gap: 12px;
                }
                .dt-exit-icon { font-size: 24px; }
                .dt-exit-label { font-size: 11px; color: #15803d; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px; }
                .dt-exit-value { font-size: 17px; font-weight: 900; color: #166534; }

                /* ── Step 4: Floor ── */
                .floor-layout {
                    display: grid;
                    grid-template-columns: auto 1fr;
                    gap: 24px;
                    align-items: start;
                }
                @media (max-width: 520px) { .floor-layout { grid-template-columns: 1fr; } }
                .floor-list { display: flex; flex-direction: column; gap: 8px; }
                .floor-item {
                    padding: 12px 18px; border: 2px solid #e2e8f0;
                    border-radius: 12px; cursor: pointer;
                    display: flex; align-items: center; gap: 12px;
                    transition: all 0.2s; background: white;
                    min-width: 160px;
                }
                .floor-item:hover:not(.disabled) { border-color: #93c5fd; background: #f0f9ff; }
                .floor-item.sel {
                    border-color: #2563eb; background: linear-gradient(135deg, #eff6ff, #dbeafe);
                    box-shadow: 0 4px 16px rgba(37,99,235,0.15);
                }
                .floor-item.disabled {
                    background: #f8fafc;
                    border-color: #e2e8f0;
                    cursor: not-allowed;
                    opacity: 0.65;
                }
                .floor-item.disabled .floor-item-name {
                    color: #475569;
                }
                .floor-item.disabled .floor-num {
                    background: #e2e8f0;
                    color: #94a3b8;
                }
                .floor-num {
                    width: 32px; height: 32px; border-radius: 8px;
                    background: #f1f5f9; color: #475569;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 13px; font-weight: 900; flex-shrink: 0;
                }
                .floor-item.sel .floor-num { background: #2563eb; color: white; }
                .floor-item-name { font-size: 13px; font-weight: 700; color: #1e293b; }
                .floor-item-slots { font-size: 11px; color: #64748b; font-weight: 500; }

                /* ── Step 5: Zone ── */
                .zone-grid { 
                    display: flex; 
                    flex-wrap: wrap; 
                    justify-content: center; 
                    gap: 16px; 
                }
                .zone-card {
                    flex: 1 1 200px;
                    max-width: 280px;
                    border: 2px solid #e2e8f0; border-radius: 16px;
                    padding: 18px; background: white; cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
                }
                .zone-card:hover:not(.full) { border-color: #93c5fd; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(37,99,235,0.12); }
                .zone-card.sel { border-color: #2563eb; background: linear-gradient(135deg, #eff6ff, #dbeafe); box-shadow: 0 6px 20px rgba(37,99,235,0.2); transform: translateY(-3px); }
                .zone-card.full { opacity: 0.5; cursor: not-allowed; }
                .zone-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
                .zone-badge {
                    padding: 4px 12px; border-radius: 6px;
                    font-size: 11px; font-weight: 800; letter-spacing: 0.05em;
                    background: #f1f5f9; color: #475569;
                }
                .zone-card.sel .zone-badge { background: #2563eb; color: white; }
                .zone-name { font-size: 14px; font-weight: 800; color: #1e293b; margin-bottom: 2px; }
                .zone-full-badge {
                    padding: 3px 10px; background: #fef2f2; border: 1px solid #fca5a5;
                    border-radius: 6px; font-size: 11px; font-weight: 700; color: #b91c1c;
                }
                .zone-check {
                    width: 22px; height: 22px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    color: white; font-size: 12px; font-weight: 900;
                }
                .zone-slot-bar-bg {
                    height: 6px; background: #f1f5f9; border-radius: 99px;
                    margin: 10px 0 6px; overflow: hidden;
                }
                .zone-slot-bar-fill { height: 100%; border-radius: 99px; transition: width 0.4s ease; }
                .zone-slot-text { font-size: 12px; display: flex; gap: 4px; font-weight: 600; }

                /* ── Summary sidebar ── */
                .bk-summary {
                    position: sticky;
                    top: 160px;
                }
                .summary-card {
                    background: white; border-radius: 16px;
                    border: 1px solid #e2e8f0; padding: 24px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
                }
                .summary-title {
                    font-size: 16px; font-weight: 800; color: #0f172a;
                    margin-bottom: 20px; display: flex; align-items: center; gap: 8px;
                    padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;
                }
                .sum-row {
                    display: flex; justify-content: space-between;
                    align-items: flex-start; padding: 12px 0;
                    border-bottom: 1px dashed #f1f5f9; font-size: 13px;
                }
                .sum-row:last-child { border-bottom: none; }
                .sum-label { color: #64748b; font-weight: 500; }
                .sum-value { color: #0f172a; font-weight: 700; text-align: right; max-width: 60%; font-size: 13px; }
                .sum-empty { color: #cbd5e1; font-style: italic; }
                .sum-total {
                    margin-top: 24px; padding: 20px;
                    background: #f0f9ff;
                    border-radius: 12px;
                    display: flex; justify-content: space-between; align-items: flex-start;
                }
                .sum-total-label { font-size: 14px; font-weight: 600; color: #1e293b; margin-top: 4px; }
                .sum-total-right { display: flex; flexDirection: column; align-items: flex-end; }
                .sum-total-value { font-size: 24px; font-weight: 900; color: #2563eb; letter-spacing: -0.5px; }
                .sum-total-sub { font-size: 11px; color: #3b82f6; font-weight: 500; margin-top: 2px; }

                /* ── Loading spinner ── */
                .bk-loading { display: flex; align-items: center; gap: 10px; padding: 40px 0; color: #64748b; font-weight: 600; font-size: 14px; justify-content: center; flex-direction: column; }
                .bk-spin { width: 32px; height: 32px; border: 3px solid #dbeafe; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .bk-error { padding: 20px; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 12px; color: #b91c1c; font-weight: 600; font-size: 13px; text-align: center; }

                /* ── Confirm Modal ── */
                .modal-overlay {
                    position: fixed; inset: 0; background: rgba(15,23,42,0.6);
                    backdrop-filter: blur(6px); z-index: 999;
                    display: flex; align-items: center; justify-content: center; padding: 20px;
                    animation: fadeIn 0.2s ease;
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUpToast { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
                @keyframes slideInRightToast { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
                .modal-box {
                    background: white; border-radius: 24px; padding: 32px; width: 100%;
                    max-width: 520px; max-height: 90vh; overflow-y: auto;
                    box-shadow: 0 24px 80px rgba(0,0,0,0.3);
                    animation: slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
                }
                @keyframes slideUp { from { transform: translateY(40px) scale(0.95); opacity: 0; } to { transform: none; opacity: 1; } }
                .modal-title { font-size: 22px; font-weight: 900; color: #0f172a; margin-bottom: 4px; }
                .modal-sub { font-size: 13px; color: #64748b; font-weight: 500; margin-bottom: 24px; }
                .modal-section { margin-bottom: 20px; }
                .modal-section-title {
                    font-size: 11px; font-weight: 700; color: #94a3b8;
                    text-transform: uppercase; letter-spacing: 0.08em;
                    margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;
                }
                .modal-row {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 9px 0; font-size: 13px; border-bottom: 1px solid #f8fafc;
                }
                .modal-row:last-child { border-bottom: none; }
                .modal-row-label { color: #64748b; font-weight: 500; }
                .modal-row-value { color: #0f172a; font-weight: 700; text-align: right; }
                .modal-plate-badge {
                    font-size: 17px; font-weight: 900; letter-spacing: 0.1em;
                    background: linear-gradient(135deg, #1e293b, #334155);
                    color: white; padding: 8px 20px; border-radius: 10px;
                    font-family: monospace;
                }
                .modal-total {
                    padding: 18px; background: linear-gradient(135deg, #eff6ff, #dbeafe);
                    border: 1.5px solid #bfdbfe; border-radius: 14px;
                    display: flex; justify-content: space-between; align-items: center; margin-top: 20px;
                }
                .modal-total-label { font-size: 14px; font-weight: 700; color: #1d4ed8; }
                .modal-total-value { font-size: 26px; font-weight: 900; color: #1e40af; letter-spacing: -0.5px; }
                .modal-actions { display: flex; gap: 12px; margin-top: 24px; }
                .modal-cancel {
                    flex: 1; padding: 15px; border: 1.5px solid #e2e8f0; border-radius: 12px;
                    background: white; color: #475569; font-size: 14px; font-weight: 700; cursor: pointer;
                    transition: all 0.2s;
                }
                .modal-cancel:hover { border-color: #94a3b8; background: #f8fafc; }
                .modal-confirm {
                    flex: 2; padding: 15px; border: none; border-radius: 12px;
                    background: linear-gradient(135deg, #2563eb, #1d4ed8);
                    color: white; font-size: 15px; font-weight: 800; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
                    box-shadow: 0 6px 20px rgba(37,99,235,0.4);
                }
                .modal-confirm:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(37,99,235,0.5); }
                .modal-confirm:active { transform: scale(0.98); }

                /* ── Payment / Checkout styles ── */
                .pay-methods { display: flex; flex-direction: column; gap: 10px; margin-top: 14px; }
                .pay-method {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 14px 16px;
                    border: 2px solid #e2e8f0;
                    border-radius: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: white;
                }
                .pay-method:hover { border-color: #93c5fd; background: #f8fafc; }
                .pay-method.selected { border-color: #3b82f6; background: linear-gradient(135deg, #eff6ff, #f0f9ff); }
                .pay-method-icon {
                    width: 42px; height: 42px;
                    border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                    background: #f8fafc;
                    flex-shrink: 0;
                }
                .pay-method.selected .pay-method-icon { background: #eff6ff; }
                .pay-method-info { flex: 1; text-align: left; }
                .pay-method-name { font-size: 14px; font-weight: 700; color: #1e293b; }
                .pay-method-sub { font-size: 11px; color: #94a3b8; font-weight: 500; margin-top: 1px; }
                .pay-method-radio {
                    width: 20px; height: 20px;
                    border: 2px solid #cbd5e1;
                    border-radius: 50%;
                    flex-shrink: 0;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.15s;
                }
                .pay-method.selected .pay-method-radio { border-color: #3b82f6; }
                .pay-radio-dot {
                    width: 10px; height: 10px;
                    background: #3b82f6;
                    border-radius: 50%;
                    transform: scale(0);
                    transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .pay-method.selected .pay-radio-dot { transform: scale(1); }

                .card-form { margin-top: 20px; display: flex; flex-direction: column; gap: 14px; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                .form-field { display: flex; flex-direction: column; gap: 6px; text-align: left; }
                .form-label {
                    font-size: 11px;
                    font-weight: 700;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.07em;
                }
                .form-input {
                    padding: 13px 16px;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 600;
                    color: #0f172a;
                    background: #f8fafc;
                    outline: none;
                    transition: all 0.2s;
                    font-variant-numeric: tabular-nums;
                    letter-spacing: 0.04em;
                    width: 100%;
                }
                .form-input:focus { border-color: #3b82f6; background: white; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
                .form-input.error { border-color: #ef4444; background: #fef2f2; }
                .form-error { font-size: 11px; color: #ef4444; font-weight: 600; }

                .card-visual {
                    height: 140px;
                    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #6366f1 100%);
                    border-radius: 16px;
                    padding: 20px 24px;
                    position: relative;
                    overflow: hidden;
                    margin-bottom: 20px;
                    box-shadow: 0 8px 32px rgba(59,130,246,0.35);
                    text-align: left;
                }
                .card-visual::before {
                    content: '';
                    position: absolute;
                    top: -30px; right: -30px;
                    width: 140px; height: 140px;
                    background: rgba(255,255,255,0.08);
                    border-radius: 50%;
                }
                .card-visual::after {
                    content: '';
                    position: absolute;
                    bottom: -50px; right: 60px;
                    width: 180px; height: 180px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 50%;
                }
                .card-chip {
                    width: 36px; height: 26px;
                    background: linear-gradient(135deg, #fbbf24, #f59e0b);
                    border-radius: 5px;
                    margin-bottom: 20px;
                    position: relative;
                    z-index: 1;
                }
                .card-number-display {
                    font-size: 16px;
                    font-weight: 700;
                    color: white;
                    letter-spacing: 0.12em;
                    font-variant-numeric: tabular-nums;
                    position: relative;
                    z-index: 1;
                    margin-bottom: 12px;
                }
                .card-bottom {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    position: relative;
                    z-index: 1;
                }
                .card-holder {
                    font-size: 11px;
                    color: rgba(255,255,255,0.7);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                }
                .card-holder-name {
                    font-size: 13px;
                    color: white;
                    font-weight: 700;
                    letter-spacing: 0.04em;
                }
                .card-exp-label { font-size: 9px; color: rgba(255,255,255,0.6); letter-spacing: 0.06em; font-weight: 600; }
                .card-exp-value { font-size: 13px; color: white; font-weight: 700; letter-spacing: 0.06em; }

                .save-card-row {
                    display: flex; align-items: center; gap: 10px;
                    padding: 12px 14px;
                    background: #f8fafc;
                    border-radius: 10px;
                    cursor: pointer;
                    margin-top: 4px;
                    border: 1px solid #e2e8f0;
                    transition: all 0.2s;
                }
                .save-card-row:hover { background: #eff6ff; border-color: #93c5fd; }
                .save-checkbox {
                    width: 18px; height: 18px;
                    border: 2px solid #cbd5e1;
                    border-radius: 5px;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s;
                    flex-shrink: 0;
                    background: white;
                }
                .save-checkbox.checked { background: #3b82f6; border-color: #3b82f6; }
                .save-card-text { font-size: 13px; font-weight: 600; color: #475569; }

                .modal-pay-btn {
                    width: 100%;
                    padding: 15px;
                    border: none;
                    border-radius: 12px;
                    font-size: 15px;
                    font-weight: 800;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
                    letter-spacing: 0.02em;
                    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
                }
                .modal-pay-btn.active {
                    background: linear-gradient(135deg, #2563eb, #1d4ed8);
                    color: white;
                }
                .modal-pay-btn.active:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(37, 99, 235, 0.5); }
                .modal-pay-btn.active:active { transform: scale(0.98); }
                .modal-pay-btn.processing {
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    color: white;
                    cursor: wait;
                    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
                }

                /* ── Empty state ── */
                .bk-empty {
                    text-align: center; padding: 40px 20px; color: #94a3b8;
                }
                .bk-empty-icon { font-size: 48px; margin-bottom: 12px; }
                .bk-empty-text { font-size: 14px; font-weight: 600; }
            `}</style>

            <div className="bk-root">
                <Header />

                {/* ── Sticky Step Progress ── */}
                <div className="bk-stepper-wrap">
                    <div className="bk-stepper">
                        {STEPS.map(step => (
                            <div key={step.id}
                                className={`bk-step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}>
                                <div className="bk-step-circle">
                                    {currentStep > step.id ? '✓' : step.id}
                                </div>
                                <div className="bk-step-label">{step.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bk-body">
                    {/* ── LEFT: Step Content ── */}
                    <div key={currentStep}>

                        {/* ── STEP 1: Select Building ── */}
                        {currentStep === 1 && (
                            <div className="bk-card">
                                <div className="bk-step-header">
                                    <div>
                                        <div className="bk-step-title">Select a Parking Building</div>
                                        <div className="bk-step-sub">Step 1 of 7 — Choose where you want to park</div>
                                    </div>
                                </div>

                                {parkingSpot?._id ? (
                                    // Building already chosen
                                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                                        <div style={{ fontSize: 48, marginBottom: 12 }}>🏢</div>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                                            {parkingSpot.name || parkingSpot.title}
                                        </div>
                                        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
                                            {parkingSpot.address || 'Parking building selected'}
                                        </div>
                                        <button
                                            style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 20px', fontSize: 13, color: '#64748b', cursor: 'pointer', marginBottom: 8 }}
                                            onClick={() => setParkingSpot({})}
                                        >
                                            Change Building
                                        </button>
                                    </div>
                                ) : (
                                    // No building selected
                                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                        <div style={{ fontSize: 56, marginBottom: 16 }}>🗺️</div>
                                        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>No building selected yet</div>
                                        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 32, lineHeight: 1.6 }}>
                                            You need to choose a parking building first. Browse available buildings on the map and tap <strong>"Book a Slot"</strong> to continue here.
                                        </p>
                                        <button
                                            onClick={() => navigate('/find-parking')}
                                            style={{
                                                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: 12,
                                                padding: '14px 32px',
                                                fontSize: 15,
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
                                            }}
                                        >
                                            🔍 Find a Building
                                        </button>
                                    </div>
                                )}

                                <div className="bk-nav">
                                    <button className="bk-btn-back" onClick={handleBack}>← Back</button>
                                    <button
                                        className="bk-btn-next"
                                        disabled={!parkingSpot?._id}
                                        onClick={() => setCurrentStep(2)}
                                    >
                                        Continue → Select Vehicle
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 2: Vehicle Type ── */}
                        {currentStep === 2 && (
                            <div className="bk-card">
                                <div className="bk-step-header">

                                    <div>
                                        <div className="bk-step-title">Select Vehicle Type</div>
                                        <div className="bk-step-sub">Step 2 of 7 — Choose your vehicle category</div>
                                    </div>
                                </div>

                                {vehicleTypesLoading ? (
                                    <div className="bk-loading"><div className="bk-spin" /><span>Loading vehicle types...</span></div>
                                ) : (
                                    <div className="vt-grid">
                                        {vehicleTypes.map(vt => (
                                            <div key={vt._id}
                                                className={`vt-card ${vehicleType?._id === vt._id ? 'sel' : ''}`}
                                                onClick={() => setVehicleType(vt)}>
                                                <div style={{
                                                    width: 60, height: 60,
                                                    background: vehicleType?._id === vt._id ? '#f0f4ff' : '#ffffff',
                                                    border: `1.5px solid ${vehicleType?._id === vt._id ? '#bfdbfe' : '#e2e8f0'}`,
                                                    borderRadius: 14,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    margin: '0 auto 8px',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                                    transition: 'all 0.2s',
                                                }}>
                                                    <VehicleSvgIcon code={vt.code} size={38} />
                                                </div>
                                                <div className="vt-name">{vt.code}</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                                                    <div className="vt-price" style={{ fontSize: '12px' }}>
                                                        <span style={{ color: '#64748b', marginRight: '4px' }}>Day:</span>
                                                        <span style={{ fontWeight: 600 }}>{fmtVND(vt.pricing?.dayBlockRate || TEMP_PRICES[vt.code?.toUpperCase()]?.dayBlockRate || (vt.pricing?.hourlyRate ? vt.pricing.hourlyRate * 4 : 20000))}</span>/4h
                                                    </div>
                                                    <div className="vt-price" style={{ fontSize: '12px' }}>
                                                        <span style={{ color: '#64748b', marginRight: '4px' }}>Night:</span>
                                                        <span style={{ fontWeight: 600 }}>{fmtVND(vt.pricing?.nightBlockRate || (vt.pricing?.dayBlockRate || TEMP_PRICES[vt.code?.toUpperCase()]?.dayBlockRate || (vt.pricing?.hourlyRate ? vt.pricing.hourlyRate * 4 : 20000)) * 1.5)}</span>/4h
                                                    </div>
                                                </div>
                                                {vehicleType?._id === vt._id && (
                                                    <div className="vt-check">✓</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="bk-nav">
                                    <button className="bk-btn-back" onClick={handleBack}>← Back</button>
                                    <button
                                        id="step1-next-btn"
                                        className="bk-btn-next"
                                        onClick={handleNext}
                                        disabled={!vehicleType}>
                                        Continue → License Plate
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 2: License Plate ── */}
                        {/* ── STEP 3: License Plate ── */}
                        {currentStep === 3 && (
                            <div className="bk-card">
                                <div className="bk-step-header">
                                    {/* <div className="bk-step-icon">🪪</div> */}
                                    <div>
                                        <div className="bk-step-title">Enter License Plate</div>
                                        <div className="bk-step-sub">Step 2 of 6 — Your vehicle's identification number</div>
                                    </div>
                                </div>

                                <div className="lp-hero">
                                    <div style={{
                                        width: 120, height: 120,
                                        background: '#ffffff',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: 20,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 4px',
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
                                    }}>
                                        <VehicleSvgIcon code={vehicleType?.code ?? 'CAR'} size={76} />
                                    </div>
                                    {vehicleType && (
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginTop: 8, marginBottom: 4 }}>
                                            {vehicleType.name}
                                        </div>
                                    )}

                                    {/* ── Saved Vehicles Quick Select ── */}
                                    {(() => {
                                        const matching = savedVehicles.filter(v => {
                                            const vtCode = typeof v.vehicleType === 'object' ? v.vehicleType.code : null;
                                            return vtCode === vehicleType?.code;
                                        });
                                        if (matching.length === 0) return null;
                                        return (
                                            <div style={{ marginBottom: 16, width: '100%', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, textAlign: 'left' }}>
                                                    My Vehicles
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    {matching.map(v => {
                                                        const isSelected = selectedVehicleId === v._id;
                                                        // Check if vehicle has an active monthly pass for this parking lot
                                                        const activePass = myMonthlyPasses.find(p => {
                                                            const pLotId = typeof p.parkingLot === 'object' ? p.parkingLot._id : p.parkingLot;
                                                            return p.licensePlate === v.licensePlate &&
                                                                ['active', 'pending'].includes(p.status) &&
                                                                pLotId === parkingSpot._id;
                                                        });
                                                        const isDisabled = !!activePass;

                                                        return (
                                                            <button
                                                                key={v._id}
                                                                type="button"
                                                                disabled={isDisabled}
                                                                onClick={() => {
                                                                    if (isDisabled) return;
                                                                    setLicensePlate(v.licensePlate);
                                                                    setSelectedVehicleId(v._id);
                                                                    setPlateError('');
                                                                }}
                                                                style={{
                                                                    display: 'flex', alignItems: 'center', gap: 12,
                                                                    padding: '12px 16px',
                                                                    borderRadius: 14,
                                                                    border: isSelected ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                                                                    background: isDisabled ? '#f8fafc' : (isSelected ? '#eff6ff' : '#ffffff'),
                                                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                                    transition: 'all 0.15s',
                                                                    textAlign: 'left',
                                                                    width: '100%',
                                                                    boxShadow: isSelected ? '0 2px 8px rgba(37,99,235,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
                                                                    opacity: isDisabled ? 0.6 : 1,
                                                                }}
                                                            >
                                                                <div style={{
                                                                    width: 42, height: 42, borderRadius: 10,
                                                                    background: isSelected ? '#dbeafe' : '#f8fafc',
                                                                    border: `1px solid ${isSelected ? '#93c5fd' : '#e2e8f0'}`,
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                                }}>
                                                                    <VehicleSvgIcon code={vehicleType?.code ?? 'CAR'} size={26} />
                                                                </div>
                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                    <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        {v.licensePlate}
                                                                        {isDisabled && (
                                                                            <span style={{
                                                                                fontSize: 10, fontWeight: 700, color: '#047857', background: '#d1fae5',
                                                                                padding: '2px 6px', borderRadius: 6, letterSpacing: 0
                                                                            }}>
                                                                                Has Monthly Pass
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                                                                        {[v.vehicleBrand, v.vehicleModel].filter(Boolean).join(' ') || 'No details'}
                                                                        {v.vehicleColor ? ` · ${v.vehicleColor}` : ''}
                                                                        {v.nickname ? ` — "${v.nickname}"` : ''}
                                                                    </div>
                                                                </div>
                                                                {isSelected && (
                                                                    <div style={{ color: '#2563eb', fontWeight: 800, fontSize: 16 }}>✓</div>
                                                                )}
                                                                {v.isDefault && !isSelected && !isDisabled && (
                                                                    <div style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', background: '#dbeafe', padding: '2px 8px', borderRadius: 6 }}>Default</div>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8, textAlign: 'center', fontWeight: 500 }}>
                                                    Select a saved vehicle or enter a new plate below
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    <div className="lp-input-wrap">
                                        <input
                                            id="license-plate-input"
                                            className={`lp-plate-input ${plateError ? 'error' : ''}`}
                                            value={licensePlate}
                                            onChange={e => {
                                                const formatted = formatPlate(e.target.value, vehicleType?.code);
                                                setLicensePlate(formatted);
                                                setSelectedVehicleId(null);
                                                if (formatted.length > 10) {
                                                    setPlateError('Vehicle license plates can have a maximum of 9 characters (excluding the dash).');
                                                } else {
                                                    setPlateError('');
                                                }
                                            }}
                                            onKeyDown={e => { if (e.key === 'Enter' && canProceed(2)) handleNext(); }}
                                            placeholder="51A-35574"
                                            maxLength={11}
                                            autoFocus
                                        />
                                        {plateError?.startsWith('__PAID_BOOKING__') ? (
                                            <div style={{
                                                marginTop: 10, padding: '12px 16px',
                                                background: '#f0fdf4', border: '1.5px solid #86efac',
                                                borderRadius: 12, fontSize: 13, color: '#166534', fontWeight: 600,
                                                display: 'flex', alignItems: 'center', gap: 10,
                                            }}>
                                                <span style={{ fontSize: 20 }}>🎉</span>
                                                <span>
                                                    Your booking was paid successfully!
                                                    {' '}
                                                    <span
                                                        onClick={() => navigate('/tickets')}
                                                        style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700 }}
                                                    >
                                                        View your ticket →
                                                    </span>
                                                </span>
                                            </div>
                                        ) : plateError?.startsWith('__UNPAID_BOOKING__') ? (() => {
                                            const bookingId = plateError.split(':')[1];
                                            return (
                                                <div style={{
                                                    marginTop: 10,
                                                    padding: '12px 14px',
                                                    background: '#eff6ff',
                                                    border: '1px solid #bfdbfe',
                                                    borderRadius: 10,
                                                    fontSize: 13,
                                                    color: '#1e40af',
                                                }}>
                                                    <div style={{ fontWeight: 600, marginBottom: 10 }}>
                                                        ⚠️ This vehicle has an unpaid booking.
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <button
                                                            onClick={() => navigate('/checkout', {
                                                                state: {
                                                                    isBooking: true,
                                                                    bookingId,
                                                                    parkingLotName: parkingSpot?.title || parkingSpot?.name,
                                                                    licensePlate: licensePlate,
                                                                    totalAmount: estimatedPrice,
                                                                }
                                                            })}
                                                            style={{
                                                                flex: 1,
                                                                background: '#2563eb',
                                                                color: 'white', border: 'none', borderRadius: 8,
                                                                padding: '8px 0', fontWeight: 700, fontSize: 13,
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            Continue to Payment →
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await bookingService.cancel(bookingId, 'Cancelled by user');
                                                                } catch (_) {}
                                                                setPlateError('');
                                                            }}
                                                            style={{
                                                                background: 'white',
                                                                color: '#64748b', border: '1px solid #cbd5e1', borderRadius: 8,
                                                                padding: '8px 14px', fontWeight: 600, fontSize: 13,
                                                                cursor: 'pointer', whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })() : plateError ? (
                                            <div className="lp-error">{plateError}</div>
                                        ) : null}
                                    </div>

                                    {licensePlate.length >= 4 && (
                                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
                                            <div className="lp-plate-preview">
                                                {/* <span className="lp-flag">🇻🇳</span> */}
                                                {licensePlate}
                                            </div>
                                        </div>
                                    )}

                                    <div className="lp-hint">
                                        Format: <strong>51A-12345</strong> (car) or <strong>59T1-12345</strong> (motorcycle)<br />
                                        This will be linked to your parking session.
                                    </div>
                                </div>

                                <div className="bk-nav">
                                    <button className="bk-btn-back" onClick={handleBack}>
                                        ← Back
                                    </button>
                                    <button
                                        id="step2-next-btn"
                                        className="bk-btn-next"
                                        onClick={handleNext}
                                        disabled={licensePlate.trim().length < 4 || isCheckingPlate}>
                                        {isCheckingPlate ? 'Checking...' : 'Continue → Date & Time'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 3: Date & Time ── */}
                        {currentStep === 4 && (() => {
                            const now = new Date();
                            const todayStr = now.toISOString().slice(0, 10);
                            const selectedDate = entryDate.slice(0, 10);

                            // Build next 7 day options
                            const dayOptions = Array.from({ length: 7 }, (_, i) => {
                                const d = new Date(now);
                                d.setDate(d.getDate() + i);
                                const iso = d.toISOString().slice(0, 10);
                                const labels = ['Today', 'Tomorrow'];
                                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                return {
                                    val: iso,
                                    line1: labels[i] ?? dayNames[d.getDay()],
                                    line2: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
                                };
                            });

                            // Build time slots every 30 min
                            const timeSlots: { label: string; h: number; m: number; disabled: boolean }[] = [];
                            for (let h = 0; h < 24; h++) {
                                for (const m of [0, 30]) {
                                    const isToday = selectedDate === todayStr;
                                    const disabled = isToday && (h < now.getHours() || (h === now.getHours() && m <= now.getMinutes()));
                                    timeSlots.push({
                                        label: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
                                        h, m, disabled,
                                    });
                                }
                            }

                            // setSlot is now globally defined
                            const setDay = (dateStr: string) => {
                                handleSetEntryDate(dateStr, selHour, selMin);
                            };

                            const exitDt = new Date(new Date(entryDate).getTime() + duration * 3600000);
                            const fmtT = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                            const fmtD = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

                            const bs = 4;
                            const DURATION_OPTIONS = [
                                { label: '4h (1 block)', val: 4 },
                                { label: '8h (2 blocks)', val: 8 },
                                { label: '12h (3 blocks)', val: 12 },
                                { label: '16h (4 blocks)', val: 16 },
                                { label: '20h (5 blocks)', val: 20 },
                                { label: '24h (6 blocks)', val: 24 },
                            ];
                            const isCustomDur = !DURATION_OPTIONS.find(o => o.val === duration);

                            // Pre-calculate blocks and cost
                            const baseRate = vehicleType?.pricing?.dayBlockRate || TEMP_PRICES[vehicleType?.code?.toUpperCase()]?.dayBlockRate || (vehicleType?.pricing?.hourlyRate ? vehicleType.pricing.hourlyRate * 4 : 20000);
                            const nightRate = vehicleType?.pricing?.nightBlockRate || baseRate * 1.5;

                            const blockDetails = [];
                            let totalEstCost = 0;
                            let currentStart = new Date(entryDate);
                            const totalExitTime = new Date(exitDate);

                            while (currentStart < totalExitTime) {
                                const blockEnd = new Date(Math.min(totalExitTime.getTime(), currentStart.getTime() + 4 * 60 * 60 * 1000));
                                const effectiveEnd = new Date(blockEnd.getTime() - 1);

                                const startHour = currentStart.getHours();
                                const endHour = effectiveEnd.getHours();

                                const isStartNight = startHour >= 18 || startHour < 6;
                                const isEndNight = endHour >= 18 || endHour < 6;
                                const isNightBlock = isStartNight || isEndNight;

                                const blockCost = isNightBlock ? nightRate : baseRate;
                                totalEstCost += blockCost;

                                blockDetails.push({
                                    start: fmtT(currentStart),
                                    end: fmtT(blockEnd),
                                    isNight: isNightBlock,
                                    cost: blockCost
                                });

                                currentStart = new Date(currentStart.getTime() + 4 * 60 * 60 * 1000);
                            }

                            return (
                                <div className="bk-card">
                                    <div className="bk-step-header">
                                        {/* <div className="bk-step-icon">📅</div> */}
                                        <div>
                                            <div className="bk-step-title">When do you want to park?</div>
                                            <div className="bk-step-sub">Step 3 of 6 — Pick date, arrival time & duration</div>
                                        </div>
                                    </div>

                                    {/* ── 1. DATE (Single trigger + Calendar Popover) ── */}
                                    {(() => {
                                        const MONTH_NAMES = [
                                            'January', 'February', 'March', 'April', 'May', 'June',
                                            'July', 'August', 'September', 'October', 'November', 'December'
                                        ];
                                        const fromDt = new Date(entryDate.slice(0, 10));
                                        const toDt = new Date(entryDate);
                                        toDt.setHours(toDt.getHours() + duration);

                                        const fmtCalBtnDate = (d: Date) => {
                                            const day = String(d.getDate()).padStart(2, '0');
                                            const month = MONTH_NAMES[d.getMonth()];
                                            const year = d.getFullYear();
                                            return `${day} ${month}, ${year}`;
                                        };

                                        return (
                                            <div style={{ position: 'relative', marginBottom: 28 }}>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}> Booking Date</div>
                                                <button
                                                    onClick={() => {
                                                        if (showCalendar && activeInput === 'from') setShowCalendar(false);
                                                        else openCalendar('from');
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        background: 'white',
                                                        border: (showCalendar && activeInput === 'from') ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0',
                                                        borderRadius: 14,
                                                        padding: '14px 18px',
                                                        fontSize: 15,
                                                        fontWeight: 700,
                                                        color: '#334155',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        cursor: 'pointer',
                                                        boxShadow: (showCalendar && activeInput === 'from') ? '0 0 0 3px rgba(37,99,235,0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        {/* <span style={{ fontSize: 16 }}>📅</span> */}
                                                        <span>{fmtCalBtnDate(fromDt)}</span>
                                                    </div>
                                                    <span style={{ color: '#94a3b8', fontSize: 10 }}>▼</span>
                                                </button>                                            </div>
                                        );
                                    })()}

                                    {/* ── 1.5 EXIT DATE ── */}
                                    {(() => {
                                        const MONTH_NAMES = [
                                            'January', 'February', 'March', 'April', 'May', 'June',
                                            'July', 'August', 'September', 'October', 'November', 'December'
                                        ];
                                        const toDt = new Date(exitDate.slice(0, 10));

                                        const fmtCalBtnDate = (d: Date) => {
                                            const day = String(d.getDate()).padStart(2, '0');
                                            const month = MONTH_NAMES[d.getMonth()];
                                            const year = d.getFullYear();
                                            return `${day} ${month}, ${year}`;
                                        };

                                        return (
                                            <div style={{ position: 'relative', marginBottom: 28 }}>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}> Exit Date</div>
                                                <button
                                                    onClick={() => {
                                                        if (showCalendar && activeInput === 'to') setShowCalendar(false);
                                                        else openCalendar('to');
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        background: 'white',
                                                        border: (showCalendar && activeInput === 'to') ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0',
                                                        borderRadius: 14,
                                                        padding: '14px 18px',
                                                        fontSize: 15,
                                                        fontWeight: 700,
                                                        color: '#334155',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        cursor: 'pointer',
                                                        boxShadow: (showCalendar && activeInput === 'to') ? '0 0 0 3px rgba(37,99,235,0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <span>{fmtCalBtnDate(toDt)}</span>
                                                    </div>
                                                    <span style={{ color: '#94a3b8', fontSize: 10 }}>▼</span>
                                                </button>                                            </div>
                                        );
                                    })()}

                                    {/* ── 2. ARRIVAL TIME ── */}
                                    <div style={{ marginBottom: 28, position: 'relative' }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}> Arrival Time</div>
                                        <button
                                            onClick={() => {
                                                if (showTimePicker) setShowTimePicker(false);
                                                else setShowTimePicker(true);
                                            }}
                                            style={{
                                                width: '100%',
                                                background: 'white',
                                                border: showTimePicker ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0',
                                                borderRadius: 14,
                                                padding: '14px 18px',
                                                fontSize: 15,
                                                fontWeight: 700,
                                                color: '#334155',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                cursor: 'pointer',
                                                boxShadow: showTimePicker ? '0 0 0 3px rgba(37,99,235,0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span>{String(selHour).padStart(2, '0')}:{String(selMin).padStart(2, '0')}</span>
                                            </div>
                                            <span style={{ color: '#94a3b8', fontSize: 10 }}>▼</span>
                                        </button>
                                    </div>


                                    {/* ── 3. EXIT TIME ── */}
                                    <div style={{ marginBottom: 28, position: 'relative' }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}> Exit Time</div>
                                        <button
                                            onClick={() => {
                                                if (showExitTimePicker) setShowExitTimePicker(false);
                                                else setShowExitTimePicker(true);
                                            }}
                                            style={{
                                                width: '100%',
                                                background: 'white',
                                                border: showExitTimePicker ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0',
                                                borderRadius: 14,
                                                padding: '14px 18px',
                                                fontSize: 15,
                                                fontWeight: 700,
                                                color: '#334155',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                cursor: 'pointer',
                                                boxShadow: showExitTimePicker ? '0 0 0 3px rgba(37,99,235,0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span>{String(exitSelHour).padStart(2, '0')}:{String(exitSelMin).padStart(2, '0')}</span>
                                                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginLeft: 8 }}>
                                                    ({new Date(exitDate).toLocaleDateString('en-GB')})
                                                </span>
                                            </div>
                                            <span style={{ color: '#94a3b8', fontSize: 10 }}>▼</span>
                                        </button>
                                    </div>

                                    <div style={{ marginBottom: 24 }}>

                                        {/* Block Visualizer */}
                                        <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 12, padding: '12px 16px', marginTop: 16 }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, letterSpacing: '0.04em' }}>BLOCK BREAKDOWN ({blockDetails.length} BLOCKS)</div>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                {(showAllBlocks ? blockDetails : blockDetails.slice(0, 4)).map((b, i) => (
                                                    <div key={i} style={{
                                                        display: 'flex', alignItems: 'center', gap: 6,
                                                        background: b.isNight ? '#1e293b' : '#fff',
                                                        color: b.isNight ? '#f8fafc' : '#334155',
                                                        border: b.isNight ? 'none' : '1px solid #e2e8f0',
                                                        padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                    }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', opacity: 0.9 }}>
                                                            {b.isNight ? (
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
                                                            ) : (
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
                                                            )}
                                                        </span>
                                                        <span>{b.start} - {b.end} <span style={{ opacity: 0.8, fontWeight: 500, fontSize: 11, marginLeft: 2 }}>({new Intl.NumberFormat('vi-VN').format(b.cost)}₫)</span></span>
                                                    </div>
                                                ))}
                                                {blockDetails.length > 4 && (
                                                    <button
                                                        onClick={() => setShowAllBlocks(!showAllBlocks)}
                                                        style={{
                                                            background: 'transparent',
                                                            border: '1px dashed #94a3b8',
                                                            color: '#64748b',
                                                            padding: '6px 10px',
                                                            borderRadius: 8,
                                                            fontSize: 12,
                                                            fontWeight: 700,
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={e => {
                                                            e.currentTarget.style.background = '#e2e8f0';
                                                            e.currentTarget.style.color = '#334155';
                                                        }}
                                                        onMouseLeave={e => {
                                                            e.currentTarget.style.background = 'transparent';
                                                            e.currentTarget.style.color = '#64748b';
                                                        }}
                                                    >
                                                        {showAllBlocks ? 'Show less' : `+ ${blockDetails.length - 4} more`}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── 4. SUMMARY CARD ── */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                                        border: '1.5px solid #bfdbfe',
                                        borderRadius: 20, padding: '18px 22px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        gap: 12,
                                    }}>
                                        <div>
                                            <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}> Your Parking</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: 22, fontWeight: 900, color: '#1e3a8a', letterSpacing: -0.5 }}>{fmtT(new Date(entryDate))}</div>
                                                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>{fmtD(new Date(entryDate))}</div>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 }}>
                                                    <div style={{ fontSize: 11, color: '#475569', fontWeight: 700 }}>{duration}h</div>
                                                    <div style={{ height: 2, background: 'linear-gradient(90deg,#3b82f6,#2563eb)', borderRadius: 1, width: '100%' }} />
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: 22, fontWeight: 900, color: '#1d4ed8', letterSpacing: -0.5 }}>{fmtT(exitDt)}</div>
                                                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>{fmtD(exitDt)}</div>
                                                </div>
                                            </div>
                                        </div>
                                        {vehicleType && (
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Est. Cost</div>
                                                <div style={{ fontSize: 20, fontWeight: 900, color: '#ea580c', letterSpacing: -0.5 }}>
                                                    {new Intl.NumberFormat('vi-VN').format(Math.round(totalEstCost))}₫
                                                </div>
                                                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 500, marginTop: 4, maxWidth: '120px' }}>
                                                    Billed by block. {duration}h = {blockDetails.length} block(s).
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bk-nav">
                                        <button className="bk-btn-back" onClick={handleBack}>← Back</button>
                                        <button id="step3-next-btn" className="bk-btn-next" onClick={handleNext}>
                                            Continue → Select Floor
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}



                        {/* ── STEP 4: Floor ── */}
                        {/* ── STEP 5: Select Floor ── */}
                        {currentStep === 5 && (
                            <div className="bk-card">
                                <div className="bk-step-header">
                                    {/* <div className="bk-step-icon">🏢</div> */}
                                    <div>
                                        <div className="bk-step-title">Select Floor</div>
                                        <div className="bk-step-sub">Step 4 of 6 — Choose which floor to park on</div>
                                    </div>
                                </div>

                                {floorsLoading ? (
                                    <div className="bk-loading"><div className="bk-spin" /><span>Loading floors...</span></div>
                                ) : floorsError ? (
                                    <div className="bk-error">⚠️ {floorsError}</div>
                                ) : (
                                    <div className="floor-layout">
                                        {/* List */}
                                        <div className="floor-list">
                                            {[...floors].sort((a, b) => b.floorNumber - a.floorNumber).map(f => {
                                                const allowed = isFloorAllowed(f);
                                                return (
                                                    <div key={f._id}
                                                        className={`floor-item ${selectedFloor?._id === f._id ? 'sel' : ''} ${!allowed ? 'disabled' : ''}`}
                                                        onClick={() => allowed && setSelectedFloor(f)}>
                                                        <div className="floor-num">{f.floorNumber < 0 ? `B${Math.abs(f.floorNumber)}` : f.floorNumber}</div>
                                                        <div style={{ flex: 1 }}>
                                                            <div className="floor-item-name">{f.name || `Floor ${f.floorNumber}`}</div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                                                                <span className="floor-item-slots">
                                                                    {f.availableSlots ?? '?'} available
                                                                </span>
                                                                {isMotorbike && allowed && (
                                                                    <span style={{
                                                                        fontSize: '10px',
                                                                        fontWeight: 700,
                                                                        color: '#16a34a',
                                                                        background: '#dcfce7',
                                                                        padding: '2px 8px',
                                                                        borderRadius: '20px',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '3px'
                                                                    }}>
                                                                        🏍️ Allowed
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {selectedFloor?._id === f._id && <span style={{ marginLeft: 'auto', color: '#2563eb', fontWeight: 900 }}>✓</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {/* 3D Building */}
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <IsoBuilding
                                                floors={floors}
                                                selectedFloor={selectedFloor}
                                                onSelect={setSelectedFloor}
                                                isFloorAllowed={isFloorAllowed}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="bk-nav">
                                    <button className="bk-btn-back" onClick={handleBack}>← Back</button>
                                    <button
                                        id="step4-next-btn"
                                        className="bk-btn-next"
                                        onClick={handleNext}
                                        disabled={!selectedFloor}>
                                        Continue → Select Zone
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 5: Zone ── */}
                        {/* ── STEP 6: Select Zone ── */}
                        {currentStep === 6 && (
                            <div className="bk-card">
                                <div className="bk-step-header">
                                    {/* <div className="bk-step-icon">📍</div> */}
                                    <div>
                                        <div className="bk-step-title">Select Parking Zone</div>
                                        <div className="bk-step-sub">Step 5 of 6 — Choose your preferred area</div>
                                    </div>
                                </div>

                                {zonesLoading ? (
                                    <div className="bk-loading"><div className="bk-spin" /><span>Loading zones...</span></div>
                                ) : zonesError ? (
                                    <div className="bk-error">⚠️ {zonesError}</div>
                                ) : zones.length === 0 ? (
                                    <div className="bk-empty">
                                        <div className="bk-empty-icon">🚧</div>
                                        <div className="bk-empty-text">No zones available on this floor</div>
                                    </div>
                                ) : (
                                    <div className="zone-grid">
                                        {zones.map(z => {
                                            const nowTime = Date.now();
                                            const zSlots = floorSlots.filter(s => getZoneId(s.zone) === z._id);
                                            const liveAvailable = zSlots.length > 0 ? zSlots.filter(s => {
                                                if (s.status !== 'available') return false;
                                                if (
                                                    s.lockedBy && s.lockedUntil &&
                                                    new Date(s.lockedUntil).getTime() > nowTime &&
                                                    (!currentUserId || s.lockedBy !== currentUserId)
                                                ) return false;
                                                return true;
                                            }).length : z.availableSlots;

                                            const liveTotal = z.totalSlots;
                                            const pct = liveTotal > 0 ? Math.round((liveAvailable / liveTotal) * 100) : 0;
                                            const isFull = liveAvailable === 0;
                                            const barColor = isFull ? '#ef4444' : pct < 30 ? '#f59e0b' : '#10b981';
                                            const isSel = selectedZone?._id === z._id;
                                            return (
                                                <div key={z._id}
                                                    className={`zone-card ${isSel ? 'sel' : ''} ${isFull ? 'full' : ''}`}
                                                    onClick={() => !isFull && setSelectedZone(z)}>
                                                    <div className="zone-card-top">
                                                        <div className="zone-badge">{z.code}</div>
                                                        {isSel && <div className="zone-check" style={{ background: '#2563eb' }}>✓</div>}
                                                        {isFull && <div className="zone-full-badge">Full</div>}
                                                    </div>
                                                    <div className="zone-name">{z.name}</div>
                                                    <div className="zone-slot-bar-bg">
                                                        <div className="zone-slot-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                                                    </div>
                                                    <div className="zone-slot-text">
                                                        <span style={{ color: barColor, fontWeight: 800 }}>{liveAvailable}</span>
                                                        <span style={{ color: '#94a3b8' }}>/{liveTotal} available</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="bk-nav">
                                    <button className="bk-btn-back" onClick={handleBack}>← Back</button>
                                    <button
                                        id="step5-next-btn"
                                        className="bk-btn-next"
                                        onClick={handleNext}
                                        disabled={!selectedZone}>
                                        Continue → Select Slot
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 6: Slot ── */}
                        {/* ── STEP 7: Select Slot ── */}
                        {currentStep === 7 && (
                            <div className="bk-card">
                                <div className="bk-step-header">
                                    {/* <div className="bk-step-icon">🅿️</div> */}
                                    <div>
                                        <div className="bk-step-title">Select Parking Slot</div>
                                        <div className="bk-step-sub">Step 6 of 6 — Pick your exact spot</div>
                                    </div>
                                </div>

                                {slotsLoading ? (
                                    <div className="bk-loading"><div className="bk-spin" /><span>Loading parking map...</span></div>
                                ) : slotsError ? (
                                    <div className="bk-error">⚠️ {slotsError}</div>
                                ) : (
                                    <SlotMapGrid
                                        slots={zoneSlots}
                                        selectedSlot={selectedSlot}
                                        onSelect={handleSelectSlot}
                                        vehicleType={vehicleType}
                                        currentUserId={currentUserId}
                                    />
                                )}



                                <div className="bk-nav">
                                    <button className="bk-btn-back" onClick={handleBack}>← Back</button>
                                    <button
                                        id="step6-review-btn"
                                        className="bk-btn-next"
                                        onClick={handleNext}
                                        disabled={!selectedSlot}
                                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 6px 20px rgba(16,185,129,0.4)' }}>
                                        Review & Confirm
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>


                </div>
            </div>

            {/* ── Confirm Modal ── */}
            {showConfirmModal && (() => {
                const grandTotal = Math.round(estimatedPrice);
                const payMethods = [
                    { id: 'bank_transfer', label: 'Bank Transfer (VietQR)', icon: <QrCodeIcon size={22} />, color: '#2563eb' },
                ];
                return (
                    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !checkoutProcessing) setShowConfirmModal(false); }}>
                        <div className="modal-box">
                            {checkoutPhase === 'review' && (
                                <>
                                    <div className="modal-title"> Confirm Your Booking</div>
                                    <div className="modal-sub">Please review all details before confirming.</div>

                                    <div className="modal-section">
                                        <div className="modal-section-title"> Vehicle Information</div>
                                        <div className="modal-row">
                                            <span className="modal-row-label">License Plate</span>
                                            <span className="modal-plate-badge">{licensePlate}</span>
                                        </div>
                                        <div className="modal-row">
                                            <span className="modal-row-label">Vehicle Type</span>
                                            <span className="modal-row-value"> {vehicleType?.name}</span>
                                        </div>
                                    </div>

                                    <div className="modal-section">
                                        <div className="modal-section-title"> Parking Location</div>
                                        <div className="modal-row">
                                            <span className="modal-row-label">Facility</span>
                                            <span className="modal-row-value">{parkingSpot.title}</span>
                                        </div>
                                        <div className="modal-row">
                                            <span className="modal-row-label">Floor</span>
                                            <span className="modal-row-value">{selectedFloor?.name || `Floor ${selectedFloor?.floorNumber}`}</span>
                                        </div>
                                        <div className="modal-row">
                                            <span className="modal-row-label">Zone</span>
                                            <span className="modal-row-value">{selectedZone?.name} ({selectedZone?.code})</span>
                                        </div>
                                        <div className="modal-row">
                                            <span className="modal-row-label">Slot</span>
                                            <span className="modal-row-value" style={{ fontSize: 16, color: '#2563eb', fontWeight: 900 }}>{selectedSlot?.slotCode}</span>
                                        </div>
                                    </div>

                                    <div className="modal-section">
                                        <div className="modal-section-title"> Time Details</div>
                                        <div className="modal-row">
                                            <span className="modal-row-label">Entry</span>
                                            <span className="modal-row-value">{fmtDateTime(entryDate)}</span>
                                        </div>
                                        <div className="modal-row">
                                            <span className="modal-row-label">Est. Exit</span>
                                            <span className="modal-row-value">{fmtExit()}</span>
                                        </div>
                                        <div className="modal-row">
                                            <span className="modal-row-label">Duration</span>
                                            <span className="modal-row-value">{duration} hour{duration !== 1 ? 's' : ''}</span>
                                        </div>
                                        {hasDayBlock && (
                                            <div className="modal-row">
                                                <span className="modal-row-label">Day Rate</span>
                                                <span className="modal-row-value">{fmtVND(baseRate)}/4h</span>
                                            </div>
                                        )}
                                        {hasNightBlock && (
                                            <div className="modal-row">
                                                <span className="modal-row-label">Night Rate (18:00 - 06:00)</span>
                                                <span className="modal-row-value">{fmtVND(nightRate)}/4h</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="modal-total">
                                        <span className="modal-total-label">Estimated Total</span>
                                        <span className="modal-total-value">{fmtVND(estimatedPrice)}</span>
                                    </div>

                                    <div className="modal-actions">
                                        <button className="modal-cancel" onClick={() => setShowConfirmModal(false)}>
                                            ← Edit
                                        </button>
                                        <button
                                            id="confirm-booking-btn"
                                            className={`modal-pay-btn ${checkoutProcessing ? 'processing' : 'active'}`}
                                            onClick={handleConfirmPayment}
                                            disabled={checkoutProcessing}
                                        >
                                            {checkoutProcessing ? (
                                                <>
                                                    <div className="bk-spin" style={{ width: 16, height: 16, borderWidth: 2 }} />
                                                    Processing...
                                                </>
                                            ) : (
                                                'Proceed to Payment →'
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                            {checkoutPhase === 'payment' && (
                                <>
                                    <div className="modal-title">💳 Secure Checkout</div>
                                    <div className="modal-sub">Select payment method and complete your reservation.</div>

                                    {/* Payment method list */}
                                    <div className="pay-methods">
                                        {payMethods.map(m => (
                                            <div
                                                key={m.id}
                                                className={`pay-method ${payMethod === m.id ? 'selected' : ''}`}
                                                onClick={() => { setPayMethod(m.id as any); setCheckoutErrors({}); }}
                                            >
                                                <div className="pay-method-icon" style={{ color: m.color }}>{m.icon}</div>
                                                <div className="pay-method-info">
                                                    <div className="pay-method-name">{m.label}</div>
                                                    <div className="pay-method-sub">
                                                        {m.id === 'bank_transfer' && 'Scan VietQR code to pay via Banking App'}
                                                    </div>
                                                </div>
                                                <div className="pay-method-radio">
                                                    <div className="pay-radio-dot"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>




                                    <div className="modal-total" style={{ marginTop: '20px' }}>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', textAlign: 'left' }}>parking fee: {fmtVND(estimatedPrice)}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div className="modal-total-label">Grand Total</div>
                                            <div className="modal-total-value" style={{ fontSize: '24px' }}>{fmtVND(grandTotal)}</div>
                                        </div>
                                    </div>

                                    {/* Error message from backend */}
                                    {checkoutErrors.form && (
                                        <div style={{
                                            margin: '16px 0 0',
                                            padding: '12px 16px',
                                            background: '#fef2f2',
                                            border: '1px solid #fca5a5',
                                            borderRadius: 10,
                                            color: '#b91c1c',
                                            fontSize: 13,
                                            fontWeight: 600,
                                            lineHeight: 1.5,
                                        }}>
                                            ⚠️ {checkoutErrors.form}
                                        </div>
                                    )}

                                    <div className="modal-actions" style={{ marginTop: '24px' }}>
                                        <button className="modal-cancel" onClick={() => setShowConfirmModal(false)} disabled={checkoutProcessing}>
                                            Cancel
                                        </button>
                                        <button
                                            id="confirm-payment-btn"
                                            className={`modal-pay-btn ${checkoutProcessing ? 'processing' : 'active'}`}
                                            onClick={handleConfirmPayment}
                                            disabled={checkoutProcessing}
                                        >
                                            {checkoutProcessing ? (
                                                <>
                                                    <div className="bk-spin" style={{ width: 16, height: 16, borderWidth: 2 }} />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    Confirm Reservation
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                            {checkoutPhase === 'qr' && (
                                <>
                                    <div className="modal-header">
                                        <div className="modal-title">Payment</div>
                                        <div className="modal-subtitle">Scan to complete reservation</div>
                                    </div>
                                    <div className="modal-body" style={{ textAlign: 'center', padding: '20px' }}>
                                        {payMethod === 'bank_transfer' && bankInfo ? (
                                            <div style={{
                                                background: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
                                                borderRadius: 16,
                                                padding: '24px',
                                                border: '1px solid #bfdbfe'
                                            }}>
                                                <div style={{ fontWeight: 800, fontSize: 18, color: '#1d4ed8', marginBottom: 16 }}>
                                                    Scan to Pay via VietQR
                                                </div>
                                                <div style={{ background: 'white', padding: 16, borderRadius: 16, display: 'inline-block', marginBottom: 16, boxShadow: '0 8px 24px rgba(37,99,235,0.15)' }}>
                                                    <img src={bankInfo.qrUrl} alt="VietQR" style={{ width: 220, height: 220, objectFit: 'contain' }} />
                                                </div>
                                                <div style={{ fontSize: 14, color: '#475569', fontWeight: 600, background: '#ffffff', padding: '12px 20px', borderRadius: 8, border: '1px dashed #93c5fd' }}>
                                                    Transfer Content: <strong style={{ color: '#1e293b', fontSize: 18, letterSpacing: 1 }}>{bankInfo.transferContent}</strong>
                                                </div>

                                                <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                                    <div className="bk-spin" style={{ width: 18, height: 18, borderWidth: 2, borderColor: '#3b82f6', borderTopColor: 'transparent' }} />
                                                    <span style={{ fontSize: 13, color: '#2563eb', fontWeight: 600 }}>Waiting for payment confirmation...</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>Payment processing...</div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                );
            })()}
            {/* ── Motorbike Toast Notice ── */}
            {currentStep === 5 && isMotorbike && showMotorbikeToast && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    maxWidth: '360px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '16px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    display: 'flex',
                    gap: '12px',
                    animation: 'toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
                }}>
                    <style>{`
                        @keyframes toastSlideIn {
                            from { transform: translateY(20px) scale(0.95); opacity: 0; }
                            to { transform: translateY(0) scale(1); opacity: 1; }
                        }
                    `}</style>
                    <span style={{ fontSize: '22px', flexShrink: 0 }}>🏍️</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
                            Motorbike Parking Rules
                        </div>
                        <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.4 }}>
                            Motorbikes are only allowed on designated floors (highlighted below). Other floors will be locked.
                        </div>
                    </div>
                    <button
                        onClick={() => setShowMotorbikeToast(false)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            padding: '0 4px',
                            alignSelf: 'flex-start',
                            lineHeight: 1,
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* ── Success Payment Toast Notice ── */}
            {showSuccessToast && successBooking && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    maxWidth: '380px',
                    background: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(10px)',
                    border: '1.5px solid #bbf7d0',
                    borderRadius: '16px',
                    padding: '16px',
                    boxShadow: '0 10px 30px -5px rgba(21, 128, 61, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    zIndex: 10000,
                    display: 'flex',
                    gap: '12px',
                    animation: 'toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
                    fontFamily: "'Inter', sans-serif",
                }}>
                    {/* <span style={{ fontSize: '24px', flexShrink: 0 }}>🎉</span> */}
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#15803d', marginBottom: '3px' }}>
                            Payment Successful!
                        </div>
                        <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.4, marginBottom: '10px' }}>
                            Slot <strong>{successBooking.slotCode}</strong> has been reserved for plate <strong>{successBooking.licensePlate}</strong> at <strong>{successBooking.spot?.title}</strong>.
                        </div>
                        <button
                            onClick={() => {
                                window.dispatchEvent(new Event('openQRModal'));
                                setShowSuccessToast(false);
                            }}
                            style={{
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#059669'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#10b981'}
                        >
                            View QR Ticket
                        </button>
                    </div>
                    <button
                        onClick={() => setShowSuccessToast(false)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            padding: '0 4px',
                            alignSelf: 'flex-start',
                            lineHeight: 1,
                        }}
                    >
                        ×
                    </button>
                </div>
            )}
            {/* ── Calendar Modal (escapes transformed parents) ── */}
            {showCalendar && (() => {
                const MONTH_NAMES = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                ];
                const calDays = getCalendarDays(calYear, calMonth);
                const now = new Date();
                const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                const fmtCalBtnDate = (d: Date) => {
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = MONTH_NAMES[d.getMonth()];
                    const year = d.getFullYear();
                    return `${day} ${month}, ${year}`;
                };

                return (
                    <div className="cal-modal-overlay" onClick={() => setShowCalendar(false)}>
                        <div className="cal-modal-content" onClick={e => e.stopPropagation()}>
                            {/* Title inside Modal */}
                            <div style={{ textAlign: 'center', marginBottom: 16, fontSize: 16, fontWeight: 800, color: '#1e293b' }}>
                                Select {activeInput === 'from' ? 'Booking Date' : 'Exit Date'}
                            </div>

                            <div className="cal-popover-header">
                                <select
                                    className="cal-select"
                                    value={calMonth}
                                    onChange={e => setCalMonth(parseInt(e.target.value))}
                                >
                                    {MONTH_NAMES.map((name, idx) => {
                                        const isPastMonth = calYear === now.getFullYear() && idx < now.getMonth();
                                        return (
                                            <option key={name} value={idx} disabled={isPastMonth}>{name}</option>
                                        );
                                    })}
                                </select>
                                <select
                                    className="cal-select"
                                    value={calYear}
                                    onChange={e => {
                                        const selectedYear = parseInt(e.target.value);
                                        setCalYear(selectedYear);
                                        if (selectedYear === now.getFullYear() && calMonth < now.getMonth()) {
                                            setCalMonth(now.getMonth());
                                        }
                                    }}
                                >
                                    {Array.from({ length: 3 }, (_, i) => now.getFullYear() + i).map(yr => (
                                        <option key={yr} value={yr}>{yr}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="cal-weekdays">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                    <div key={d} className="cal-weekday">{d}</div>
                                ))}
                            </div>

                            <div className="cal-days-grid">
                                {calDays.map((cell, idx) => {
                                    const cellDate = new Date(cell.year, cell.month, cell.day);
                                    const isPast = isBeforeDay(cellDate, todayOnly);
                                    
                                    const maxAdvanceDate = new Date(todayOnly);
                                    maxAdvanceDate.setDate(maxAdvanceDate.getDate() + 7);
                                    const isTooFar = cellDate > maxAdvanceDate;
                                    
                                    const isDisabled = isPast || isTooFar;

                                    const isSelected = isSameDay(cellDate, activeInput === 'from' ? tempFromDate : tempToDate);

                                    let cellClass = 'cal-day-cell';
                                    if (!cell.isCurrentMonth) cellClass += ' other-month';
                                    if (isDisabled) cellClass += ' disabled';
                                    else if (isSelected) cellClass += ' range-start-end-same';

                                    return (
                                        <div
                                            key={idx}
                                            className={cellClass}
                                            onClick={() => {
                                                if (isDisabled) return;
                                                const dateStr = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`;

                                                if (activeInput === 'from') {
                                                    const selHour = parseInt(entryDate.slice(11, 13)) || 0;
                                                    const selMin = parseInt(entryDate.slice(14, 16)) || 0;
                                                    handleSetEntryDate(dateStr, selHour, selMin);
                                                    setTempFromDate(cellDate);

                                                    // Ensure exit date shifts if entry passes it
                                                    const proposedEntry = new Date(`${dateStr}T${String(selHour).padStart(2, '0')}:${String(selMin).padStart(2, '0')}`);
                                                    const currentExit = new Date(exitDate);
                                                    if (proposedEntry >= currentExit) {
                                                        const nextExit = new Date(proposedEntry.getTime() + 1 * 3600000); // Tự động đẩy lên 1 tiếng thay vì 4 tiếng
                                                        const iso = nextExit.toISOString();
                                                        setExitDate(`${iso.slice(0, 10)}T${String(nextExit.getHours()).padStart(2, '0')}:${String(nextExit.getMinutes()).padStart(2, '0')}`);
                                                        setTempToDate(nextExit);
                                                    }
                                                } else {
                                                    const exitSelHour = parseInt(exitDate.slice(11, 13)) || 0;
                                                    const exitSelMin = parseInt(exitDate.slice(14, 16)) || 0;
                                                    const newExitDate = `${dateStr}T${String(exitSelHour).padStart(2, '0')}:${String(exitSelMin).padStart(2, '0')}`;

                                                    if (new Date(newExitDate) <= new Date(entryDate)) {
                                                        alert("Exit date/time must be after arrival date/time.");
                                                        return;
                                                    }
                                                    setExitDate(newExitDate);
                                                    setTempToDate(cellDate);
                                                }
                                                setShowCalendar(false);
                                            }}
                                        >
                                            {cell.day}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="cal-popover-footer">
                                <button className="cal-btn cal-btn-close" onClick={() => setShowCalendar(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ── TIME PICKER POPUP ── */}
            {showTimePicker && (
                <div className="cal-modal-overlay" onClick={() => setShowTimePicker(false)}>
                    <div className="cal-modal-content" onClick={e => e.stopPropagation()} style={{ padding: '24px', width: '90%', maxWidth: 360 }}>
                        <div style={{ textAlign: 'center', marginBottom: 16, fontSize: 16, fontWeight: 800, color: '#1e293b' }}>
                            Select Arrival Time
                        </div>

                        <div style={{
                            background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 14,
                            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                            display: 'flex', height: 260, overflow: 'hidden'
                        }}>
                            {(() => {
                                const now = new Date();
                                now.setMinutes(now.getMinutes() + 5);
                                const currentHour = now.getHours();
                                const currentMin = now.getMinutes();
                                const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
                                const todayStr = localNow.toISOString().slice(0, 10);
                                const isTodaySelection = entryDate.slice(0, 10) === todayStr;

                                return (
                                    <>
                                        <div style={{ flex: 1, overflowY: 'auto', borderRight: '1.5px solid #e2e8f0' }} className="custom-scrollbar">
                                            <div style={{ padding: '10px 0', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1.5px solid #f1f5f9', position: 'sticky', top: 0, background: '#f8fafc', zIndex: 2 }}>Hour</div>
                                            {Array.from({ length: 24 }).map((_, i) => {
                                                const isPastHour = isTodaySelection && i < currentHour;
                                                return (
                                                    <div key={i}
                                                        id={`time-picker-hour-${i}`}
                                                        onClick={() => {
                                                            if (!isPastHour) setSlot(i, selMin);
                                                        }}
                                                        style={{
                                                            padding: '14px 0', textAlign: 'center',
                                                            cursor: isPastHour ? 'not-allowed' : 'pointer',
                                                            background: selHour === i ? '#2563eb' : 'white',
                                                            color: selHour === i ? 'white' : '#334155',
                                                            fontWeight: selHour === i ? 800 : 500,
                                                            fontSize: 18,
                                                            opacity: isPastHour ? 0.3 : 1,
                                                            transition: 'background 0.2s'
                                                        }}
                                                    >
                                                        {String(i).padStart(2, '0')}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                                            <div style={{ padding: '10px 0', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1.5px solid #f1f5f9', position: 'sticky', top: 0, background: '#f8fafc', zIndex: 2 }}>Minute</div>
                                            {Array.from({ length: 60 }).map((_, m) => {
                                                const isPastMin = isTodaySelection && selHour === currentHour && m < currentMin;
                                                return (
                                                    <div key={m}
                                                        id={`time-picker-min-${m}`}
                                                        onClick={() => {
                                                            if (!isPastMin) {
                                                                setSlot(selHour, m);
                                                                setShowTimePicker(false);
                                                            }
                                                        }}
                                                        style={{
                                                            padding: '14px 0', textAlign: 'center',
                                                            cursor: isPastMin ? 'not-allowed' : 'pointer',
                                                            background: selMin === m ? '#2563eb' : 'white',
                                                            color: selMin === m ? 'white' : '#334155',
                                                            fontWeight: selMin === m ? 800 : 500,
                                                            fontSize: 18,
                                                            opacity: isPastMin ? 0.3 : 1,
                                                            transition: 'background 0.2s'
                                                        }}
                                                    >
                                                        {String(m).padStart(2, '0')}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        <button className="cal-btn cal-btn-confirm" onClick={() => setShowTimePicker(false)} style={{ width: '100%', background: '#1e293b', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: 20 }}>
                            Confirm Time
                        </button>
                    </div>
                </div>
            )}

            {/* ── EXIT TIME PICKER POPUP ── */}
            {showExitTimePicker && (
                <div className="cal-modal-overlay" onClick={() => setShowExitTimePicker(false)}>
                    <div className="cal-modal-content" onClick={e => e.stopPropagation()} style={{ padding: '24px', width: '90%', maxWidth: 360 }}>
                        <div style={{ textAlign: 'center', marginBottom: 16, fontSize: 16, fontWeight: 800, color: '#1e293b' }}>
                            Select Exit Time
                        </div>

                        <div style={{
                            background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 14,
                            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                            display: 'flex', height: 260, overflow: 'hidden'
                        }}>
                            {(() => {
                                const entryObj = new Date(entryDate);
                                const isSameDayAsEntry = exitDate.slice(0, 10) === entryDate.slice(0, 10);
                                const minHour = entryObj.getHours();
                                const minMin = entryObj.getMinutes();

                                return (
                                    <>
                                        <div style={{ flex: 1, overflowY: 'auto', borderRight: '1.5px solid #e2e8f0' }} className="custom-scrollbar">
                                            <div style={{ padding: '10px 0', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1.5px solid #f1f5f9', position: 'sticky', top: 0, background: '#f8fafc', zIndex: 2 }}>Hour</div>
                                            {Array.from({ length: 24 }).map((_, i) => {
                                                const isPastHour = false; // Không block giờ nào cả
                                                return (
                                                    <div key={i}
                                                        id={`exit-picker-hour-${i}`}
                                                        onClick={() => {
                                                            if (!isPastHour) setExitSlot(i, exitSelMin);
                                                        }}
                                                        style={{
                                                            padding: '14px 0', textAlign: 'center',
                                                            cursor: 'pointer',
                                                            background: exitSelHour === i ? '#2563eb' : 'white',
                                                            color: exitSelHour === i ? 'white' : '#334155',
                                                            fontWeight: exitSelHour === i ? 800 : 500,
                                                            fontSize: 18,
                                                            opacity: 1,
                                                            transition: 'background 0.2s'
                                                        }}
                                                    >
                                                        {String(i).padStart(2, '0')}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                                            <div style={{ padding: '10px 0', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1.5px solid #f1f5f9', position: 'sticky', top: 0, background: '#f8fafc', zIndex: 2 }}>Minute</div>
                                            {Array.from({ length: 60 }).map((_, m) => {
                                                const isPastMin = false; // Không block phút nào cả
                                                return (
                                                    <div key={m}
                                                        id={`exit-picker-min-${m}`}
                                                        onClick={() => {
                                                            if (!isPastMin) {
                                                                setExitSlot(exitSelHour, m);
                                                                setShowExitTimePicker(false);
                                                            }
                                                        }}
                                                        style={{
                                                            padding: '14px 0', textAlign: 'center',
                                                            cursor: 'pointer',
                                                            background: exitSelMin === m ? '#2563eb' : 'white',
                                                            color: exitSelMin === m ? 'white' : '#334155',
                                                            fontWeight: exitSelMin === m ? 800 : 500,
                                                            fontSize: 18,
                                                            opacity: 1,
                                                            transition: 'background 0.2s'
                                                        }}
                                                    >
                                                        {String(m).padStart(2, '0')}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        <button className="cal-btn cal-btn-confirm" onClick={() => setShowExitTimePicker(false)} style={{ width: '100%', background: '#1e293b', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: 20 }}>
                            Confirm Exit Time
                        </button>
                    </div>
                </div>
            )}

            {/* ── Floating Lock Toast ── */}
            {slotLockUntil && slotLockUntil > new Date() && (
                <div style={{
                    position: 'fixed',
                    top: 100,
                    right: 24,
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(8px)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: 30,
                    boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    zIndex: 1000,
                    animation: 'slideInRightToast 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    {/* <span style={{ fontSize: 18 }}>🔒</span> */}
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>
                        <span style={{ color: '#cbd5e1' }}>Slot reserved for you · </span>
                        <span style={{ color: '#fcd34d', fontWeight: 700 }}>Expires in <LockCountdown lockedUntil={slotLockUntil.toISOString()} /></span>
                    </div>
                    <button
                        onClick={async () => {
                            if (selectedSlot) {
                                try { await parkingSlotService.unlockSlot(selectedSlot._id); } catch (_) { }
                            }
                            setSelectedSlot(null);
                            setSlotLockUntil(null);
                            if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
                        }}
                        style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 20, marginLeft: 8, transition: 'background 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                        onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                    >
                        Release
                    </button>
                </div>
            )}
        </>
    );
};

export default BookingPage;
