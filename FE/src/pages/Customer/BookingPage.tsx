import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header/Header';
import floorService, { Floor } from '../../services/api/floorService';
import zoneService, { Zone } from '../../services/api/zoneService';
import parkingSlotService, { ParkingSlot } from '../../services/api/parkingSlotService';
import vehicleTypeService, { VehicleType } from '../../services/api/vehicleTypeService';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getZoneId = (z: ParkingSlot['zone']): string =>
    typeof z === 'string' ? z : (z as any)?._id ?? '';

// Vietnamese license plate validation
const LP_REGEX = /^[0-9]{2}[A-Z]{1,2}-[0-9]{4,5}$|^[0-9]{2}-[A-Z][0-9]{4,5}$/i;
const formatPlate = (v: string) => v.toUpperCase().replace(/[^A-Z0-9-]/gi, '');

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
const MomoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#ae2070" />
        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="8" fontWeight="900" fontFamily="sans-serif">MoMo</text>
    </svg>
);
const ZaloPayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#0068ff" />
        <text x="12" y="15" textAnchor="middle" fill="white" fontSize="6" fontWeight="900" fontFamily="sans-serif">ZaloPay</text>
    </svg>
);
const CashIcon = ({ size = 24 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <circle cx="12" cy="12" r="3" /><path d="M5 12h.01M19 12h.01" />
    </svg>
);
const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);


// ─── Step Definitions ────────────────────────────────────────────────────────
const STEPS = [
    { id: 1, label: 'Vehicle Type', icon: '🚗' },
    { id: 2, label: 'License Plate', icon: '🪪' },
    { id: 3, label: 'Date & Time', icon: '📅' },
    { id: 4, label: 'Select Floor', icon: '🏢' },
    { id: 5, label: 'Select Zone', icon: '📍' },
    { id: 6, label: 'Select Slot', icon: '🅿️' },
];

// ─── Vehicle B&W SVG Icon ───────────────────────────────────────────────────
const VehicleSvgIcon = ({ code, size = 96 }: { code: string; size?: number }) => {
    const c = code.toUpperCase();
    const stroke = '#0f172a';
    const sw = '2';
    const lc = 'round';
    const lj = 'round';

    // Bicycle
    if (c.includes('BICYCLE') || c.includes('BIKE') || (c.includes('DAP') && !c.includes('DIEN'))) return (
        <svg viewBox="0 0 48 48" width={size} height={size} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap={lc as any} strokeLinejoin={lj as any}>
            <circle cx="12" cy="34" r="9" />
            <circle cx="36" cy="34" r="9" />
            <circle cx="24" cy="12" r="3" />
            <path d="M12 34 L20 16 L28 16" />
            <path d="M12 34 L28 22 L36 34" />
            <path d="M20 16 L36 34" />
            <path d="M22 12 L30 12" />
        </svg>
    );

    // Electric bicycle / scooter
    if (c.includes('ELECTRIC') || c.includes('DIEN') || c.includes('EV')) return (
        <svg viewBox="0 0 48 48" width={size} height={size} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap={lc as any} strokeLinejoin={lj as any}>
            <circle cx="12" cy="34" r="8" />
            <circle cx="36" cy="34" r="8" />
            <path d="M12 34 L20 16 L28 16" />
            <path d="M20 16 L36 34" />
            <path d="M12 34 L28 22 L36 34" />
            {/* Lightning bolt */}
            <path d="M26 8 L22 18 L27 18 L23 28" strokeWidth="2.2" />
        </svg>
    );

    // Motorcycle / motorbike
    if (c.includes('MOTOR') || c.includes('MOTO') || c.includes('SCOOTER') || c.includes('MAY')) return (
        <svg viewBox="0 0 48 48" width={size} height={size} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap={lc as any} strokeLinejoin={lj as any}>
            <circle cx="10" cy="32" r="8" />
            <circle cx="38" cy="32" r="8" />
            <path d="M10 32 C14 20 20 16 26 16" />
            <path d="M26 16 L32 16 L38 24 L38 32" />
            <path d="M18 24 L30 24 L34 32" />
            <path d="M24 16 L26 10 L32 10" />
            <path d="M18 24 L14 28" />
        </svg>
    );

    // Truck / tải
    if (c.includes('TRUCK') || c.includes('TAI') || c.includes('LORRY') || c.includes('VAN')) return (
        <svg viewBox="0 0 48 48" width={size} height={size} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap={lc as any} strokeLinejoin={lj as any}>
            <rect x="2" y="14" width="28" height="20" rx="2" />
            <path d="M30 20 L44 20 L46 34 L30 34" />
            <path d="M30 20 L36 14 L44 14 L44 20" />
            <circle cx="10" cy="36" r="4" />
            <circle cx="36" cy="36" r="4" />
            <line x1="2" y1="22" x2="30" y2="22" />
        </svg>
    );

    // Default: Car / sedan
    return (
        <svg viewBox="0 0 48 48" width={size} height={size} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap={lc as any} strokeLinejoin={lj as any}>
            <rect x="3" y="22" width="42" height="16" rx="3" />
            <path d="M8 22 L13 12 L35 12 L40 22" />
            <circle cx="12" cy="38" r="4" />
            <circle cx="36" cy="38" r="4" />
            <rect x="14" y="14" width="10" height="8" rx="1.5" />
            <rect x="25" y="14" width="10" height="8" rx="1.5" />
            <line x1="3" y1="29" x2="45" y2="29" />
        </svg>
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

// ─── SlotMapGrid (reused) ─────────────────────────────────────────────────────
const SlotMapGrid = ({ slots, selectedSlot, onSelect, vehicleType }: {
    slots: ParkingSlot[]; selectedSlot: ParkingSlot | null;
    onSelect: (s: ParkingSlot) => void; vehicleType: VehicleType | null;
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
            <div style={{ fontWeight: 600 }}>No slots in this zone</div>
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
                                    const canSelect = slot.status === 'available';
                                    const vtName = typeof slot.vehicleType === 'string' ? '' : (slot.vehicleType as any)?.name ?? '';
                                    const style = statusStyle(slot, isSelected);
                                    return (
                                        <button key={slot._id}
                                            onClick={() => canSelect && onSelect(slot)}
                                            disabled={!canSelect}
                                            title={`${slot.slotCode} — ${style.label}${vtName ? ' · ' + vtName : ''}`}
                                            style={{
                                                width: 52, height: 80, borderRadius: 8, border: `2px solid ${style.border}`,
                                                background: style.bg, cursor: canSelect ? 'pointer' : 'not-allowed',
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
                                        const canSelect = slot.status === 'available';
                                        const style = statusStyle(slot, isSelected);
                                        return (
                                            <button key={slot._id}
                                                onClick={() => canSelect && onSelect(slot)}
                                                disabled={!canSelect}
                                                title={`${slot.slotCode} — ${style.label}`}
                                                style={{
                                                    width: 52, height: 80, borderRadius: 8, border: `2px solid ${style.border}`,
                                                    background: style.bg, cursor: canSelect ? 'pointer' : 'not-allowed',
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

// ─── Main Booking Page ────────────────────────────────────────────────────────
const BookingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const parkingSpot = location.state?.spot || { title: 'Bitexco Financial Tower Parking', price: 50000 };

    // ── Step state ──
    const [currentStep, setCurrentStep] = useState(1);

    // ── Step 1: License Plate ──
    const [licensePlate, setLicensePlate] = useState('');
    const [plateError, setPlateError] = useState('');

    // ── Step 2: Vehicle Type ──
    const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
    const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
    const [vehicleTypesLoading, setVehicleTypesLoading] = useState(false);

    // ── Step 3: Date & Time ──
    const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 16));
    const [duration, setDuration] = useState(2);

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
        if (currentStep === 4) {
            setShowMotorbikeToast(true);
        }
    }, [currentStep]);

    // ── Integrated Checkout States ──
    const [checkoutPhase, setCheckoutPhase] = useState<'review' | 'payment'>('review');
    const [payMethod, setPayMethod] = useState<'card' | 'momo' | 'zalopay' | 'cash'>('card');
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [saveCard, setSaveCard] = useState(false);
    const [checkoutProcessing, setCheckoutProcessing] = useState(false);
    const [checkoutErrors, setCheckoutErrors] = useState<Record<string, string>>({});

    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [successBooking, setSuccessBooking] = useState<any>(null);

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
            setCardNumber('');
            setCardName('');
            setExpiry('');
            setCvv('');
            setCheckoutErrors({});
            setCheckoutProcessing(false);
        }
    }, [showConfirmModal]);

    const validateCard = () => {
        const e: Record<string, string> = {};
        if (payMethod === 'card') {
            if (cardNumber.replace(/\s/g, '').length < 16) e.cardNumber = 'Enter a valid 16-digit card number';
            if (!cardName.trim()) e.cardName = 'Cardholder name is required';
            if (expiry.length < 5) e.expiry = 'Enter valid expiry MM/YY';
            if (cvv.length < 3) e.cvv = 'Enter valid CVV';
        }
        return e;
    };

    const handleConfirmPayment = () => {
        const e = validateCard();
        if (Object.keys(e).length) { setCheckoutErrors(e); return; }
        setCheckoutErrors({});
        setCheckoutProcessing(true);

        const slotCode = selectedSlot?.slotCode ?? '';
        const rawExit = exitTime;

        setTimeout(() => {
            const bookingDetails = {
                receiptId: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
                spot: parkingSpot,
                vehicleType: vehicleType?.code || 'CAR',
                floorName: selectedFloor?.name || `Floor ${selectedFloor?.floorNumber ?? 1}`,
                slotCode,
                licensePlate: formatPlate(licensePlate),
                entryDate: new Date(entryDate).toISOString(),
                exitTime: rawExit.toISOString(),
                elapsed: duration * 3600,
                totalAmount: estimatedPrice,
                payMethod,
            };

            // Save to localStorage
            localStorage.setItem('activeBooking', JSON.stringify(bookingDetails));

            // Notify header
            window.dispatchEvent(new Event('bookingUpdated'));

            // Show Toast & Save Booking Details
            setSuccessBooking(bookingDetails);
            setShowSuccessToast(true);

            // Clean up and close modal
            setCheckoutProcessing(false);
            setShowConfirmModal(false);

            // Reset states
            setLicensePlate('');
            setSelectedFloor(null);
            setSelectedZone(null);
            setSelectedSlot(null);
            setCurrentStep(1);
        }, 1800);
    };

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
        setVehicleTypesLoading(true);
        vehicleTypeService.getAll()
            .then((data: any) => {
                const list: VehicleType[] = Array.isArray(data) ? data : data?.data ?? [];
                setVehicleTypes(list.filter((v: VehicleType) => v.isActive && !v.isDeleted));
            })
            .catch(() => setVehicleTypes([
                { _id: 'car', name: 'Car', code: 'CAR', size: 'medium', isActive: true, pricing: { hourlyRate: 10000, dailyRate: 80000 } },
                { _id: 'motorcycle', name: 'Motorcycle', code: 'MOTORBIKE', size: 'small', isActive: true, pricing: { hourlyRate: 5000, dailyRate: 40000 } },
            ]))
            .finally(() => setVehicleTypesLoading(false));
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
        parkingSlotService.getFloorMap(selectedFloor._id)
            .then((data: any) => setFloorSlots((Array.isArray(data) ? data : data?.data ?? []).filter((s: ParkingSlot) => !s.isDeleted)))
            .catch((err: any) => setSlotsError(err?.message || 'Failed to load slots'))
            .finally(() => setSlotsLoading(false));
    }, [selectedFloor]);

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

    const exitTime = new Date(new Date(entryDate).getTime() + duration * 3600000);
    const hourlyRate = vehicleType?.pricing?.hourlyRate ?? 0;
    const estimatedPrice = hourlyRate * duration;

    // ─── Navigation ─────────────────────────────────────────────────────────
    const canProceed = (step: number): boolean => {
        switch (step) {
            case 1: return !!vehicleType;
            case 2: return licensePlate.trim().length >= 4;
            case 3: return !!entryDate && duration >= 1;
            case 4: return !!selectedFloor;
            case 5: return !!selectedZone;
            case 6: return !!selectedSlot;
            default: return false;
        }
    };

    const handleNext = () => {
        if (currentStep === 2) {
            const cleaned = formatPlate(licensePlate);
            setLicensePlate(cleaned);
            if (cleaned.length < 4) { setPlateError('Please enter a valid license plate number'); return; }
            setPlateError('');
        }
        if (currentStep < 6) setCurrentStep(s => s + 1);
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
                duration,
                estimatedPrice,
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
                * { box-sizing: border-box; margin: 0; padding: 0; }

                .bk-root {
                    min-height: 100vh;
                    background: linear-gradient(160deg, #f0f4ff 0%, #f8fafc 50%, #f0fdf4 100%);
                    font-family: 'Inter', 'Segoe UI', sans-serif;
                    color: #0f172a;
                }

                /* ── Stepper bar ── */
                .bk-stepper-wrap {
                    background: white;
                    border-bottom: 1px solid #e2e8f0;
                    padding: 20px 24px 0;
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
                    padding-bottom: 0;
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
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 32px 20px 100px;
                    display: grid;
                    grid-template-columns: 1fr 300px;
                    gap: 24px;
                    align-items: start;
                }
                @media (max-width: 768px) {
                    .bk-body { grid-template-columns: 1fr; }
                    .bk-summary { display: none; }
                }

                /* ── Step content card ── */
                .bk-card {
                    background: white;
                    border-radius: 20px;
                    border: 1px solid #e8edf4;
                    padding: 32px;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
                    animation: stepIn 0.35s cubic-bezier(0.22,1,0.36,1) both;
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
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                    gap: 12px;
                }
                .vt-card {
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
                .zone-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }
                .zone-card {
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
                    background: white; border-radius: 20px;
                    border: 1px solid #e8edf4; padding: 24px;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
                }
                .summary-title {
                    font-size: 14px; font-weight: 800; color: #0f172a;
                    margin-bottom: 20px; display: flex; align-items: center; gap: 8px;
                    padding-bottom: 14px; border-bottom: 1px solid #f1f5f9;
                }
                .sum-row {
                    display: flex; justify-content: space-between;
                    align-items: flex-start; padding: 10px 0;
                    border-bottom: 1px dashed #f1f5f9; font-size: 13px;
                }
                .sum-row:last-child { border-bottom: none; }
                .sum-label { color: #64748b; font-weight: 500; }
                .sum-value { color: #0f172a; font-weight: 700; text-align: right; max-width: 55%; font-size: 12px; }
                .sum-empty { color: #cbd5e1; font-style: italic; }
                .sum-total {
                    margin-top: 16px; padding: 16px;
                    background: linear-gradient(135deg, #eff6ff, #dbeafe);
                    border: 1.5px solid #bfdbfe; border-radius: 14px;
                    display: flex; justify-content: space-between; align-items: center;
                }
                .sum-total-label { font-size: 13px; font-weight: 700; color: #1d4ed8; }
                .sum-total-value { font-size: 20px; font-weight: 900; color: #1e40af; letter-spacing: -0.5px; }

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

                        {/* ── STEP 1: Vehicle Type ── */}
                        {currentStep === 1 && (
                            <div className="bk-card">
                                <div className="bk-step-header">
                                    <div className="bk-step-icon">🚗</div>
                                    <div>
                                        <div className="bk-step-title">Select Vehicle Type</div>
                                        <div className="bk-step-sub">Step 1 of 6 — Choose your vehicle category</div>
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
                                                <div className="vt-name">{vt.name}</div>
                                                <div className="vt-price">{fmtVND(vt.pricing?.hourlyRate ?? 0)}/hr</div>
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
                        {currentStep === 2 && (
                            <div className="bk-card">
                                <div className="bk-step-header">
                                    <div className="bk-step-icon">🪪</div>
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

                                    <div className="lp-input-wrap">
                                        <input
                                            id="license-plate-input"
                                            className={`lp-plate-input ${plateError ? 'error' : ''}`}
                                            value={licensePlate}
                                            onChange={e => {
                                                setLicensePlate(formatPlate(e.target.value));
                                                setPlateError('');
                                            }}
                                            onKeyDown={e => { if (e.key === 'Enter' && canProceed(2)) handleNext(); }}
                                            placeholder="51A-12345"
                                            maxLength={12}
                                            autoFocus
                                        />
                                        {plateError && <div className="lp-error">⚠️ {plateError}</div>}
                                    </div>

                                    {licensePlate.length >= 4 && (
                                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
                                            <div className="lp-plate-preview">
                                                <span className="lp-flag">🇻🇳</span>
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
                                        disabled={licensePlate.trim().length < 4}>
                                        Continue → Date & Time
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 3: Date & Time ── */}
                        {currentStep === 3 && (() => {
                            const now          = new Date();
                            const todayStr     = now.toISOString().slice(0, 10);
                            const selectedDate = entryDate.slice(0, 10);
                            const selHour      = parseInt(entryDate.slice(11, 13)) || 0;
                            const selMin       = parseInt(entryDate.slice(14, 16)) || 0;

                            // Build next 7 day options
                            const dayOptions = Array.from({ length: 7 }, (_, i) => {
                                const d = new Date(now);
                                d.setDate(d.getDate() + i);
                                const iso = d.toISOString().slice(0, 10);
                                const labels = ['Today', 'Tomorrow'];
                                const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                                return {
                                    val: iso,
                                    line1: labels[i] ?? dayNames[d.getDay()],
                                    line2: `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`,
                                };
                            });

                            // Build time slots every 30 min
                            const timeSlots: { label: string; h: number; m: number; disabled: boolean }[] = [];
                            for (let h = 0; h < 24; h++) {
                                for (const m of [0, 30]) {
                                    const isToday = selectedDate === todayStr;
                                    const disabled = isToday && (h < now.getHours() || (h === now.getHours() && m <= now.getMinutes()));
                                    timeSlots.push({
                                        label: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,
                                        h, m, disabled,
                                    });
                                }
                            }

                            const setSlot = (h: number, m: number) => {
                                setEntryDate(`${selectedDate}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
                            };
                            const setDay = (dateStr: string) => {
                                setEntryDate(`${dateStr}T${String(selHour).padStart(2,'0')}:${String(selMin).padStart(2,'0')}`);
                            };

                            const exitDt = new Date(new Date(entryDate).getTime() + duration * 3600000);
                            const fmtT   = (d: Date) => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                            const fmtD   = (d: Date) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;

                            const DURATION_OPTIONS = [
                                { label: '1h',     val: 1  },
                                { label: '2h',     val: 2  },
                                { label: '3h',     val: 3  },
                                { label: '4h',     val: 4  },
                                { label: '6h',     val: 6  },
                                { label: '8h',     val: 8  },
                                { label: '12h',    val: 12 },
                                { label: 'All day',val: 24 },
                            ];
                            const isCustomDur = !DURATION_OPTIONS.find(o => o.val === duration);

                            return (
                            <div className="bk-card">
                                <div className="bk-step-header">
                                    <div className="bk-step-icon">📅</div>
                                    <div>
                                        <div className="bk-step-title">When do you want to park?</div>
                                        <div className="bk-step-sub">Step 3 of 6 — Pick date, arrival time & duration</div>
                                    </div>
                                </div>

                                {/* ── 1. DATE ── */}
                                <div style={{ marginBottom: 28 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>📆 Date</div>
                                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                                        {dayOptions.map(opt => {
                                            const isSel = selectedDate === opt.val;
                                            return (
                                                <button key={opt.val} onClick={() => setDay(opt.val)}
                                                    style={{
                                                        flexShrink: 0,
                                                        minWidth: 68,
                                                        padding: '12px 10px',
                                                        border: `2px solid ${isSel ? '#2563eb' : '#e2e8f0'}`,
                                                        borderRadius: 14,
                                                        background: isSel ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'white',
                                                        color: isSel ? 'white' : '#374151',
                                                        cursor: 'pointer',
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                                        transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                                                        boxShadow: isSel ? '0 6px 16px rgba(37,99,235,0.35)' : '0 1px 4px rgba(0,0,0,0.05)',
                                                        transform: isSel ? 'scale(1.05)' : 'scale(1)',
                                                    }}>
                                                    <span style={{ fontSize: 12, fontWeight: 700, opacity: isSel ? 1 : 0.6 }}>{opt.line1}</span>
                                                    <span style={{ fontSize: 15, fontWeight: 900 }}>{opt.line2}</span>
                                                </button>
                                            );
                                        })}
                                        {/* Hidden custom date behind a styled button */}
                                        <label style={{
                                            flexShrink: 0, minWidth: 68, padding: '12px 10px',
                                            border: '2px dashed #e2e8f0', borderRadius: 14, cursor: 'pointer',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                            color: '#94a3b8', position: 'relative', background: '#fafbfc',
                                        }}>
                                            <span style={{ fontSize: 18 }}>＋</span>
                                            <span style={{ fontSize: 11, fontWeight: 700 }}>More</span>
                                            <input type="date" value={selectedDate} min={todayStr}
                                                onChange={e => setDay(e.target.value)}
                                                style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                        </label>
                                    </div>
                                </div>

                                {/* ── 2. ARRIVAL TIME — Dual Drum Spinner ── */}
                                <div style={{ marginBottom: 28 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                                        🕐 Arrival Time
                                        <span style={{ fontSize: 13, fontWeight: 800, color: '#2563eb', marginLeft: 10, letterSpacing: 0, textTransform: 'none' }}>
                                            {String(selHour).padStart(2,'0')}:{String(selMin).padStart(2,'0')}
                                        </span>
                                    </div>

                                    {/* Drum spinner container */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0,
                                        background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)',
                                        borderRadius: 22, border: '1.5px solid #e2e8f0',
                                        padding: '16px 24px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                                    }}>
                                        {/* ── HOUR drum ── */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, flex: 1 }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Hour</div>
                                            <button
                                                onClick={() => setSlot((selHour - 1 + 24) % 24, selMin)}
                                                style={{ width: 48, height: 36, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
                                                <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><path d="M1 10L9 2L17 10" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"/></svg>
                                            </button>
                                            {/* prev */}
                                            <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: '#d1d5db', opacity: 0.5, letterSpacing: -1 }}>
                                                {String((selHour - 1 + 24) % 24).padStart(2,'0')}
                                            </div>
                                            {/* selected — highlight */}
                                            <div style={{
                                                height: 60, width: 90, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 44, fontWeight: 900, color: '#1e293b', letterSpacing: -2,
                                                background: 'white', borderRadius: 16,
                                                border: '2.5px solid #2563eb',
                                                boxShadow: '0 6px 20px rgba(37,99,235,0.18)',
                                                transition: 'all 0.2s',
                                            }}>
                                                {String(selHour).padStart(2,'0')}
                                            </div>
                                            {/* next */}
                                            <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: '#d1d5db', opacity: 0.5, letterSpacing: -1 }}>
                                                {String((selHour + 1) % 24).padStart(2,'0')}
                                            </div>
                                            <button
                                                onClick={() => setSlot((selHour + 1) % 24, selMin)}
                                                style={{ width: 48, height: 36, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
                                                <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><path d="M1 2L9 10L17 2" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"/></svg>
                                            </button>
                                        </div>

                                        {/* colon */}
                                        <div style={{ fontSize: 44, fontWeight: 900, color: '#1e293b', padding: '0 4px', lineHeight: 1, marginTop: 8 }}>:</div>

                                        {/* ── MINUTE drum ── */}
                                        {(() => {
                                            const MINS = [0, 15, 30, 45];
                                            const selIdx = MINS.indexOf(selMin) === -1 ? 0 : MINS.indexOf(selMin);
                                            const prevMin = MINS[(selIdx - 1 + MINS.length) % MINS.length];
                                            const nextMin = MINS[(selIdx + 1) % MINS.length];
                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, flex: 1 }}>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Min</div>
                                                    <button
                                                        onClick={() => setSlot(selHour, prevMin)}
                                                        style={{ width: 48, height: 36, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
                                                        <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><path d="M1 10L9 2L17 10" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"/></svg>
                                                    </button>
                                                    <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: '#d1d5db', opacity: 0.5, letterSpacing: -1 }}>
                                                        {String(prevMin).padStart(2,'0')}
                                                    </div>
                                                    <div style={{
                                                        height: 60, width: 90, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 44, fontWeight: 900, color: '#1e293b', letterSpacing: -2,
                                                        background: 'white', borderRadius: 16,
                                                        border: '2.5px solid #2563eb',
                                                        boxShadow: '0 6px 20px rgba(37,99,235,0.18)',
                                                        transition: 'all 0.2s',
                                                    }}>
                                                        {String(selMin).padStart(2,'0')}
                                                    </div>
                                                    <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: '#d1d5db', opacity: 0.5, letterSpacing: -1 }}>
                                                        {String(nextMin).padStart(2,'0')}
                                                    </div>
                                                    <button
                                                        onClick={() => setSlot(selHour, nextMin)}
                                                        style={{ width: 48, height: 36, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
                                                        <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><path d="M1 2L9 10L17 2" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"/></svg>
                                                    </button>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10, textAlign: 'center', fontWeight: 500 }}>
                                        Tap ▲▼ to adjust hour & minute
                                    </div>
                                </div>


                                {/* ── 3. DURATION ── */}
                                <div style={{ marginBottom: 24 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>⏳ Duration</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                        {DURATION_OPTIONS.map(opt => {
                                            const isSel = duration === opt.val && !isCustomDur;
                                            return (
                                                <button key={opt.val} onClick={() => setDuration(opt.val)}
                                                    style={{
                                                        padding: '14px 20px',
                                                        border: `2px solid ${isSel ? '#2563eb' : '#e2e8f0'}`,
                                                        borderRadius: 14,
                                                        background: isSel ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'white',
                                                        color: isSel ? 'white' : '#374151',
                                                        fontWeight: isSel ? 800 : 700,
                                                        fontSize: 15,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                                                        boxShadow: isSel ? '0 6px 18px rgba(37,99,235,0.35)' : '0 1px 4px rgba(0,0,0,0.05)',
                                                        transform: isSel ? 'scale(1.06)' : 'scale(1)',
                                                    }}>
                                                    {opt.label}
                                                </button>
                                            );
                                        })}
                                        {/* Custom stepper */}
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 0,
                                            border: `2px solid ${isCustomDur ? '#2563eb' : '#e2e8f0'}`,
                                            borderRadius: 14, overflow: 'hidden', background: isCustomDur ? '#eff6ff' : 'white',
                                        }}>
                                            <button onClick={() => setDuration(d => Math.max(1, d - 1))}
                                                style={{ width: 38, height: 52, border: 'none', background: 'transparent', fontSize: 20, fontWeight: 900, color: '#1e293b', cursor: 'pointer' }}>−</button>
                                            <div style={{ padding: '0 8px', textAlign: 'center', borderLeft: '1.5px solid #e2e8f0', borderRight: '1.5px solid #e2e8f0', minWidth: 52 }}>
                                                <div style={{ fontSize: 18, fontWeight: 900, color: isCustomDur ? '#2563eb' : '#64748b', lineHeight: 1 }}>{duration}</div>
                                                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>hr</div>
                                            </div>
                                            <button onClick={() => setDuration(d => Math.min(72, d + 1))}
                                                style={{ width: 38, height: 52, border: 'none', background: 'transparent', fontSize: 20, fontWeight: 900, color: '#1e293b', cursor: 'pointer' }}>+</button>
                                        </div>
                                    </div>
                                </div>

                                {/* ── 4. SUMMARY CARD ── */}
                                <div style={{
                                    background: 'linear-gradient(135deg,#0f172a,#1e293b)',
                                    borderRadius: 20, padding: '18px 22px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    gap: 12,
                                }}>
                                    <div>
                                        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>🅿️ Your Parking</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: 22, fontWeight: 900, color: '#60a5fa', letterSpacing: -0.5 }}>{fmtT(new Date(entryDate))}</div>
                                                <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>{fmtD(new Date(entryDate))}</div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 }}>
                                                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{duration}h</div>
                                                <div style={{ height: 2, background: 'linear-gradient(90deg,#60a5fa,#34d399)', borderRadius: 1, width: '100%' }} />
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: 22, fontWeight: 900, color: '#34d399', letterSpacing: -0.5 }}>{fmtT(exitDt)}</div>
                                                <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>{fmtD(exitDt)}</div>
                                            </div>
                                        </div>
                                    </div>
                                    {vehicleType && (
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Est. Cost</div>
                                            <div style={{ fontSize: 20, fontWeight: 900, color: '#fbbf24', letterSpacing: -0.5 }}>
                                                {new Intl.NumberFormat('vi-VN').format(Math.round((vehicleType.pricing?.hourlyRate ?? 0) * duration))}₫
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
                        {currentStep === 4 && (
                            <div className="bk-card">
                                <div className="bk-step-header">
                                    <div className="bk-step-icon">🏢</div>
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
                                            {[...floors].sort((a, b) => a.floorNumber - b.floorNumber).map(f => {
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
                        {currentStep === 5 && (
                            <div className="bk-card">
                                <div className="bk-step-header">
                                    <div className="bk-step-icon">📍</div>
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
                                            const pct = z.totalSlots > 0 ? Math.round((z.availableSlots / z.totalSlots) * 100) : 0;
                                            const isFull = z.availableSlots === 0;
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
                                                        <span style={{ color: barColor, fontWeight: 800 }}>{z.availableSlots}</span>
                                                        <span style={{ color: '#94a3b8' }}>/{z.totalSlots} available</span>
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
                        {currentStep === 6 && (
                            <div className="bk-card">
                                <div className="bk-step-header">
                                    <div className="bk-step-icon">🅿️</div>
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
                                        onSelect={setSelectedSlot}
                                        vehicleType={vehicleType}
                                    />
                                )}

                                {selectedSlot && (
                                    <div style={{ marginTop: 20, padding: '14px 18px', background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: '1.5px solid #bfdbfe', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <span style={{ fontSize: 24 }}>✅</span>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8' }}>Slot Selected</div>
                                            <div style={{ fontSize: 16, fontWeight: 900, color: '#1e40af', letterSpacing: 1 }}>{selectedSlot.slotCode}</div>
                                            {selectedSlot.features?.hasEVCharger && <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700, marginTop: 2 }}>⚡ EV Charging Available</div>}
                                        </div>
                                    </div>
                                )}

                                <div className="bk-nav">
                                    <button className="bk-btn-back" onClick={handleBack}>← Back</button>
                                    <button
                                        id="step6-review-btn"
                                        className="bk-btn-next"
                                        onClick={handleNext}
                                        disabled={!selectedSlot}
                                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 6px 20px rgba(16,185,129,0.4)' }}>
                                        🎉 Review & Confirm
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT: Summary Sidebar ── */}
                    <div className="bk-summary">
                        <div className="summary-card">
                            <div className="summary-title">
                                📋 Booking Summary
                            </div>

                            <div className="sum-row">
                                <span className="sum-label">Facility</span>
                                <span className="sum-value">{parkingSpot.title || 'Parking'}</span>
                            </div>
                            <div className="sum-row">
                                <span className="sum-label">License Plate</span>
                                <span className="sum-value">
                                    {licensePlate || <span className="sum-empty">Not entered</span>}
                                </span>
                            </div>
                            <div className="sum-row">
                                <span className="sum-label">Vehicle</span>
                                <span className="sum-value">
                                    {vehicleType ? `${vehicleIcon(vehicleType.code)} ${vehicleType.name}` : <span className="sum-empty">Not selected</span>}
                                </span>
                            </div>
                            <div className="sum-row">
                                <span className="sum-label">Entry</span>
                                <span className="sum-value">{fmtDateTime(entryDate)}</span>
                            </div>
                            <div className="sum-row">
                                <span className="sum-label">Duration</span>
                                <span className="sum-value">{duration}h</span>
                            </div>
                            <div className="sum-row">
                                <span className="sum-label">Floor</span>
                                <span className="sum-value">
                                    {selectedFloor ? (selectedFloor.name || `Floor ${selectedFloor.floorNumber}`) : <span className="sum-empty">Not selected</span>}
                                </span>
                            </div>
                            <div className="sum-row">
                                <span className="sum-label">Zone</span>
                                <span className="sum-value">
                                    {selectedZone ? selectedZone.name : <span className="sum-empty">Not selected</span>}
                                </span>
                            </div>
                            <div className="sum-row">
                                <span className="sum-label">Slot</span>
                                <span className="sum-value">
                                    {selectedSlot ? selectedSlot.slotCode : <span className="sum-empty">Not selected</span>}
                                </span>
                            </div>

                            {vehicleType && (
                                <div className="sum-total">
                                    <span className="sum-total-label">Est. Total</span>
                                    <span className="sum-total-value">{fmtVND(estimatedPrice)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Confirm Modal ── */}
            {showConfirmModal && (() => {
                const serviceFee = Math.round(estimatedPrice * 0.05);
                const grandTotal = Math.round(estimatedPrice) + serviceFee;
                const payMethods = [
                    { id: 'card', label: 'Credit / Debit Card', icon: <CreditCardIcon size={22} />, color: '#2563eb' },
                    { id: 'momo', label: 'MoMo Wallet', icon: <MomoIcon />, color: '#ae2070' },
                    { id: 'zalopay', label: 'ZaloPay', icon: <ZaloPayIcon />, color: '#0068ff' },
                    { id: 'cash', label: 'Pay at Counter', icon: <CashIcon size={22} />, color: '#10b981' },
                ];
                return (
                    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !checkoutProcessing) setShowConfirmModal(false); }}>
                        <div className="modal-box">
                            {checkoutPhase === 'review' ? (
                                <>
                                    <div className="modal-title">🎉 Confirm Your Booking</div>
                                    <div className="modal-sub">Please review all details before confirming.</div>

                                    <div className="modal-section">
                                        <div className="modal-section-title">🚘 Vehicle Information</div>
                                        <div className="modal-row">
                                            <span className="modal-row-label">License Plate</span>
                                            <span className="modal-plate-badge">{licensePlate}</span>
                                        </div>
                                        <div className="modal-row">
                                            <span className="modal-row-label">Vehicle Type</span>
                                            <span className="modal-row-value">{vehicleIcon(vehicleType?.code ?? '')} {vehicleType?.name}</span>
                                        </div>
                                    </div>

                                    <div className="modal-section">
                                        <div className="modal-section-title">📍 Parking Location</div>
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
                                        <div className="modal-section-title">⏰ Time Details</div>
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
                                        <div className="modal-row">
                                            <span className="modal-row-label">Rate</span>
                                            <span className="modal-row-value">{fmtVND(hourlyRate)}/hr</span>
                                        </div>
                                    </div>

                                    <div className="modal-total">
                                        <span className="modal-total-label">Estimated Total</span>
                                        <span className="modal-total-value">{fmtVND(estimatedPrice)}</span>
                                    </div>

                                    <div className="modal-actions">
                                        <button className="modal-cancel" onClick={() => setShowConfirmModal(false)}>
                                            ← Edit
                                        </button>
                                        <button id="confirm-booking-btn" className="modal-confirm" onClick={() => setCheckoutPhase('payment')}>
                                            Proceed to Payment →
                                        </button>
                                    </div>
                                </>
                            ) : (
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
                                                        {m.id === 'card' && 'Visa, Mastercard, JCB, Amex'}
                                                        {m.id === 'momo' && 'Instant payment via MoMo app'}
                                                        {m.id === 'zalopay' && 'Instant payment via ZaloPay app'}
                                                        {m.id === 'cash' && 'Pay at parking booth before exit'}
                                                    </div>
                                                </div>
                                                <div className="pay-method-radio">
                                                    <div className="pay-radio-dot"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Card form */}
                                    {payMethod === 'card' && (
                                        <div className="card-form">
                                            {/* Visual card */}
                                            <div className="card-visual">
                                                <div className="card-chip"></div>
                                                <div className="card-number-display">
                                                    {cardNumber || '•••• •••• •••• ••••'}
                                                </div>
                                                <div className="card-bottom">
                                                    <div>
                                                        <div className="card-holder">Card Holder</div>
                                                        <div className="card-holder-name">{cardName || 'YOUR NAME'}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div className="card-exp-label">EXPIRES</div>
                                                        <div className="card-exp-value">{expiry || 'MM/YY'}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="form-field">
                                                <label className="form-label">Card Number</label>
                                                <input
                                                    id="card-number"
                                                    className={`form-input ${checkoutErrors.cardNumber ? 'error' : ''}`}
                                                    placeholder="1234 5678 9012 3456"
                                                    value={cardNumber}
                                                    onChange={e => setCardNumber(formatCard(e.target.value))}
                                                    maxLength={19}
                                                />
                                                {checkoutErrors.cardNumber && <span className="form-error">{checkoutErrors.cardNumber}</span>}
                                            </div>

                                            <div className="form-field">
                                                <label className="form-label">Cardholder Name</label>
                                                <input
                                                    id="card-name"
                                                    className={`form-input ${checkoutErrors.cardName ? 'error' : ''}`}
                                                    placeholder="NGUYEN VAN A"
                                                    value={cardName}
                                                    onChange={e => setCardName(e.target.value.toUpperCase())}
                                                />
                                                {checkoutErrors.cardName && <span className="form-error">{checkoutErrors.cardName}</span>}
                                            </div>

                                            <div className="form-row">
                                                <div className="form-field">
                                                    <label className="form-label">Expiry Date</label>
                                                    <input
                                                        id="card-expiry"
                                                        className={`form-input ${checkoutErrors.expiry ? 'error' : ''}`}
                                                        placeholder="MM/YY"
                                                        value={expiry}
                                                        onChange={e => setExpiry(formatExpiry(e.target.value))}
                                                        maxLength={5}
                                                    />
                                                    {checkoutErrors.expiry && <span className="form-error">{checkoutErrors.expiry}</span>}
                                                </div>
                                                <div className="form-field">
                                                    <label className="form-label">CVV</label>
                                                    <input
                                                        id="card-cvv"
                                                        className={`form-input ${checkoutErrors.cvv ? 'error' : ''}`}
                                                        placeholder="•••"
                                                        value={cvv}
                                                        type="password"
                                                        onChange={e => setCvv(formatCVV(e.target.value))}
                                                        maxLength={3}
                                                    />
                                                    {checkoutErrors.cvv && <span className="form-error">{checkoutErrors.cvv}</span>}
                                                </div>
                                            </div>

                                            <div className="save-card-row" onClick={() => setSaveCard(!saveCard)}>
                                                <div className={`save-checkbox ${saveCard ? 'checked' : ''}`}>
                                                    {saveCard && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                                                </div>
                                                <span className="save-card-text">Save this card for future payments</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* QR instruction for e-wallets */}
                                    {(payMethod === 'momo' || payMethod === 'zalopay') && (
                                        <div style={{
                                            marginTop: 20, padding: '20px',
                                            background: payMethod === 'momo' ? 'linear-gradient(135deg,#fdf2f8,#fce7f3)' : 'linear-gradient(135deg,#eff6ff,#dbeafe)',
                                            borderRadius: 14,
                                            border: `1px solid ${payMethod === 'momo' ? '#f9a8d4' : '#bfdbfe'}`,
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: 36, marginBottom: 12 }}>
                                                {payMethod === 'momo' ? '📱' : '📲'}
                                            </div>
                                            <div style={{ fontWeight: 700, fontSize: 14, color: payMethod === 'momo' ? '#9d174d' : '#1d4ed8', marginBottom: 6 }}>
                                                Open {payMethod === 'momo' ? 'MoMo' : 'ZaloPay'} app and confirm payment
                                            </div>
                                            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                                                Amount: <strong>{fmtVND(grandTotal)}</strong> will be deducted from your wallet
                                            </div>
                                        </div>
                                    )}

                                    {/* Cash instructions */}
                                    {payMethod === 'cash' && (
                                        <div style={{
                                            marginTop: 20, padding: '16px',
                                            background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
                                            borderRadius: 14,
                                            border: '1px solid #86efac',
                                            textAlign: 'left'
                                        }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#166534', lineHeight: 1.6 }}>
                                                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>📋 Cash Payment Guidelines</div>
                                                <div>1. Attendant will verify your entry ticket on Floor G.</div>
                                                <div>2. Show booking confirmation details upon arrival.</div>
                                                <div>3. Pay Attendant <strong>{fmtVND(grandTotal)}</strong> in cash.</div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="modal-total" style={{ marginTop: '20px' }}>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', textAlign: 'left' }}>parking fee: {fmtVND(estimatedPrice)}</div>
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', textAlign: 'left', marginTop: '2px' }}>service fee (5%): {fmtVND(serviceFee)}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div className="modal-total-label">Grand Total</div>
                                            <div className="modal-total-value" style={{ fontSize: '24px' }}>{fmtVND(grandTotal)}</div>
                                        </div>
                                    </div>

                                    <div className="modal-actions" style={{ marginTop: '24px' }}>
                                        <button className="modal-cancel" onClick={() => setCheckoutPhase('review')} disabled={checkoutProcessing}>
                                            ← Back
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
                                                    <LockIcon />
                                                    Pay {fmtVND(grandTotal)}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                );
            })()}
            {/* ── Motorbike Toast Notice ── */}
            {currentStep === 4 && isMotorbike && showMotorbikeToast && (
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
                    <span style={{ fontSize: '24px', flexShrink: 0 }}>🎉</span>
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
        </>
    );
};

export default BookingPage;
