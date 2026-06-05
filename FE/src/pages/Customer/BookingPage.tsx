import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header/Header';
import floorService, { Floor } from '../../services/api/floorService';

// ── Icons ──────────────────────────────────────────────────────────────────────
const MotorcycleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="36" height="36">
        <circle cx="12" cy="46" r="8" />
        <circle cx="52" cy="46" r="8" />
        <path d="M20 46h24M32 22l6 14H20l4-8h14" />
        <path d="M38 22h8l6 10" />
        <circle cx="48" cy="20" r="3" />
    </svg>
);

const CarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="36" height="36">
        <rect x="6" y="28" width="52" height="18" rx="4" />
        <path d="M14 28l6-12h24l6 12" />
        <circle cx="18" cy="46" r="5" />
        <circle cx="46" cy="46" r="5" />
        <rect x="24" y="18" width="16" height="10" rx="2" />
        <path d="M6 36h4M54 36h4" />
    </svg>
);

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
);

const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 18-6-6 6-6" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

// ── Slot statuses ──────────────────────────────────────────────────────────────
const generateSlots = (totalSlots: number, floorIndex: number) => {
    // Simulate some occupied slots deterministically per floor index
    const occupiedSets: number[][] = [
        [2, 5, 8, 12, 17],
        [1, 4, 9, 11, 15, 19],
        [3, 6, 10, 13, 16],
        [2, 7, 8, 14, 18, 20],
    ];
    const occupied = occupiedSets[floorIndex % occupiedSets.length] || [];
    return Array.from({ length: totalSlots }, (_, i) => ({
        id: i + 1,
        status: occupied.includes(i + 1) ? 'occupied' : 'available',
    }));
};

// ── 3-D Building SVG ──────────────────────────────────────────────────────────
const BuildingVisual = ({ selectedFloor, vehicleType, onSelectFloor, floors: floorList }: {
    selectedFloor: Floor | null;
    vehicleType: string | null;
    onSelectFloor: (floor: Floor) => void;
    floors: Floor[];
}) => {
    // Render order: top → bottom (reverse floorNumber)
    const floors = [...floorList].sort((a, b) => b.floorNumber - a.floorNumber);

    const isSelectable = (f: Floor) => {
        if (!vehicleType) return false;
        return f.vehicleType === vehicleType || f.vehicleType === 'both';
    };

    // Isometric-ish colours
    const faceColor = (f: Floor) => {
        if (selectedFloor?._id === f._id) return '#3b82f6';
        if (!vehicleType) return '#94a3b8';
        if (f.vehicleType === vehicleType || f.vehicleType === 'both') return '#e0f2fe';
        return '#f1f5f9';
    };
    const sideColor = (f: Floor) => {
        if (selectedFloor?._id === f._id) return '#1d4ed8';
        if (!vehicleType) return '#64748b';
        if (f.vehicleType === vehicleType || f.vehicleType === 'both') return '#bae6fd';
        return '#e2e8f0';
    };
    const topColor = (f: Floor) => {
        if (selectedFloor?._id === f._id) return '#60a5fa';
        if (!vehicleType) return '#94a3b8';
        if (f.vehicleType === vehicleType || f.vehicleType === 'both') return '#7dd3fc';
        return '#cbd5e1';
    };

    const W = 200, H = 48, D = 28; // width, height, depth
    const startX = 80, startY = 30;
    const gap = 6;

    if (floors.length === 0) return null;

    return (
        <svg viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-sm mx-auto drop-shadow-xl select-none">
            {floors.map((f, idx) => {
                const baseY = startY + idx * (H + gap);
                const selectable = isSelectable(f);
                const isSelected = selectedFloor?._id === f._id;

                // Front face polygon
                const frontPts = `${startX},${baseY + D} ${startX + W},${baseY + D} ${startX + W},${baseY + D + H} ${startX},${baseY + D + H}`;
                // Top face polygon (parallelogram shifted up-right)
                const topPts = `${startX},${baseY + D} ${startX + W},${baseY + D} ${startX + W + D},${baseY} ${startX + D},${baseY}`;
                // Right side face polygon
                const sidePts = `${startX + W},${baseY + D} ${startX + W + D},${baseY} ${startX + W + D},${baseY + H} ${startX + W},${baseY + D + H}`;

                return (
                    <g
                        key={f._id}
                        onClick={() => selectable && onSelectFloor(f)}
                        style={{ cursor: selectable ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
                        className={isSelected ? 'building-floor-selected' : ''}
                    >
                        {/* Top face */}
                        <polygon points={topPts} fill={topColor(f)} stroke="#475569" strokeWidth="1" opacity={selectable || isSelected ? 1 : 0.5} />
                        {/* Front face */}
                        <polygon points={frontPts} fill={faceColor(f)} stroke="#475569" strokeWidth="1" opacity={selectable || isSelected ? 1 : 0.5} />
                        {/* Right side face */}
                        <polygon points={sidePts} fill={sideColor(f)} stroke="#475569" strokeWidth="1" opacity={selectable || isSelected ? 1 : 0.5} />

                        {/* Windows on front face */}
                        {[0, 1, 2, 3].map((w) => (
                            <rect
                                key={w}
                                x={startX + 20 + w * 46}
                                y={baseY + D + 12}
                                width={26}
                                height={20}
                                rx="3"
                                fill={isSelected ? 'rgba(255,255,255,0.35)' : selectable ? 'rgba(96,165,250,0.25)' : 'rgba(148,163,184,0.2)'}
                                stroke={isSelected ? 'rgba(255,255,255,0.6)' : 'rgba(148,163,184,0.4)'}
                                strokeWidth="1"
                            />
                        ))}

                        {/* Floor label */}
                        <text
                            x={startX + W / 2}
                            y={baseY + D + H / 2 + 5}
                            textAnchor="middle"
                            fontSize="13"
                            fontWeight="700"
                            fill={isSelected ? '#fff' : selectable ? '#1e40af' : '#94a3b8'}
                        >
                            {f.name || `Floor ${f.floorNumber}`}
                        </text>

                        {/* Vehicle type badge on right side */}
                        <text
                            x={startX + W + D / 2 + 2}
                            y={baseY + H / 2 + 5}
                            textAnchor="middle"
                            fontSize="9"
                            fontWeight="600"
                            fill={isSelected ? '#bfdbfe' : '#64748b'}
                            transform={`rotate(-28, ${startX + W + D / 2 + 2}, ${baseY + H / 2 + 5})`}
                        >
                            {f.vehicleType === 'motorcycle' ? '🏍' : f.vehicleType === 'car' ? '🚗' : '🏍🚗'}
                        </text>

                        {/* Selected highlight ring */}
                        {isSelected && (
                            <polygon
                                points={frontPts}
                                fill="none"
                                stroke="#60a5fa"
                                strokeWidth="3"
                                strokeDasharray="6 3"
                                opacity="0.8"
                            >
                                <animate attributeName="stroke-dashoffset" from="0" to="18" dur="1s" repeatCount="indefinite" />
                            </polygon>
                        )}
                    </g>
                );
            })}

            {/* Ground shadow */}
            <ellipse cx={startX + W / 2 + D / 2} cy={startY + 4 * (H + gap) + D + 8} rx={W / 2 + 20} ry="12" fill="rgba(0,0,0,0.08)" />

            {/* Legend */}
            <g transform={`translate(10, 250)`}>
                <rect x="0" y="0" width="14" height="14" rx="3" fill="#e0f2fe" stroke="#475569" strokeWidth="1" />
                <text x="18" y="11" fontSize="10" fill="#475569">Available for your vehicle</text>

                <rect x="0" y="20" width="14" height="14" rx="3" fill="#3b82f6" stroke="#475569" strokeWidth="1" />
                <text x="18" y="31" fontSize="10" fill="#475569">Selected floor</text>

                <rect x="0" y="40" width="14" height="14" rx="3" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                <text x="18" y="51" fontSize="10" fill="#94a3b8">Not available for your vehicle</text>
            </g>
        </svg>
    );
};

// ── Slot Grid ──────────────────────────────────────────────────────────────────
const SlotGrid = ({ slots, selectedSlot, onSelect, vehicleType }) => {
    return (
        <div className="slot-grid">
            {slots.map((slot) => {
                const isOccupied = slot.status === 'occupied';
                const isSelected = selectedSlot === slot.id;
                return (
                    <button
                        key={slot.id}
                        disabled={isOccupied}
                        onClick={() => !isOccupied && onSelect(slot.id)}
                        className={[
                            'slot-cell',
                            isOccupied ? 'slot-occupied' : 'slot-available',
                            isSelected ? 'slot-selected' : '',
                        ].join(' ')}
                        title={isOccupied ? `Slot ${slot.id} — Occupied` : `Slot ${slot.id} — Available`}
                    >
                        <span className="slot-number">{String(slot.id).padStart(2, '0')}</span>
                        {vehicleType === 'motorcycle' ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="slot-icon">
                                <circle cx="5" cy="17" r="3" /><circle cx="19" cy="17" r="3" />
                                <path d="M8 17h8M12 8l2 5H8l1.5-3H14" /><path d="M14 8h3l2 4" />
                                <circle cx="18" cy="7" r="1.5" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="slot-icon">
                                <rect x="2" y="10" width="20" height="8" rx="2" />
                                <path d="M5 10l2.5-5h9L19 10" />
                                <circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" />
                            </svg>
                        )}
                        {isSelected && (
                            <span className="slot-check"><CheckIcon /></span>
                        )}
                        {isOccupied && (
                            <span className="slot-x">✕</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

// ── Loading Spinner ────────────────────────────────────────────────────────────
const LoadingSpinner = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px', gap: '12px' }}>
        <div style={{
            width: '36px', height: '36px',
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Loading floors...</span>
    </div>
);

// ── Main Page ──────────────────────────────────────────────────────────────────
const BookingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const parkingSpot = location.state?.spot || { title: 'Bitexco Financial Tower Parking', price: 50000 };

    const [vehicleType, setVehicleType] = useState<string | null>(null); // 'motorcycle' | 'car'
    const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
    const [slots, setSlots] = useState<{ id: number; status: string }[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const [entryDate, setEntryDate] = useState(() => {
        const d = new Date();
        return d.toISOString().slice(0, 16);
    });
    const [duration, setDuration] = useState(2);
    const [step, setStep] = useState(1); // 1: vehicle, 2: time, 3: floor, 4: slot

    // API floor state
    const [floors, setFloors] = useState<Floor[]>([]);
    const [floorsLoading, setFloorsLoading] = useState(false);
    const [floorsError, setFloorsError] = useState<string | null>(null);

    // Fetch floors from API on mount (filter by parkingLot if available)
    useEffect(() => {
        const fetchFloors = async () => {
            setFloorsLoading(true);
            setFloorsError(null);
            try {
                const params = parkingSpot._id ? { parkingLot: parkingSpot._id, status: 'active' as const } : { status: 'active' as const };
                const data = await floorService.getFloors(params);
                // Support both array response and { data: [] } wrapper
                const list: Floor[] = Array.isArray(data) ? data : (data as any)?.data ?? [];
                setFloors(list);
            } catch (err: any) {
                setFloorsError(err?.message || 'Failed to load floors. Please try again.');
            } finally {
                setFloorsLoading(false);
            }
        };
        fetchFloors();
    }, [parkingSpot._id]);

    // Reset floor & slot when vehicle changes
    useEffect(() => {
        setSelectedFloor(null);
        setSelectedSlot(null);
        setSlots([]);
        if (vehicleType) setStep(2);
    }, [vehicleType]);

    // Load slots when floor selected
    useEffect(() => {
        if (selectedFloor) {
            const floorIndex = floors.findIndex(f => f._id === selectedFloor._id);
            setSlots(generateSlots(selectedFloor.totalSlots || 20, floorIndex));
            setSelectedSlot(null);
            setStep(4);
        }
    }, [selectedFloor]);

    const handleFloorSelect = (f: Floor) => {
        setSelectedFloor(f);
    };

    const handleReserve = () => {
        if (!vehicleType || !selectedFloor || !selectedSlot) return;
        navigate('/session', {
            state: {
                spot: parkingSpot,
                vehicleType,
                floor: selectedFloor,
                slot: selectedSlot,
                entryDate,
                duration,
            }
        });
    };

    const floorLabel = (f: Floor | null) => f ? `${f.name || 'Floor ' + f.floorNumber} (${f.vehicleType === 'motorcycle' ? 'Motorcycle' : f.vehicleType === 'car' ? 'Car' : 'All vehicles'})` : '';
    const availableCount = slots.filter(s => s.status === 'available').length;
    const exitTime = new Date(new Date(entryDate).getTime() + duration * 3600000);
    const totalPrice = parkingSpot.price * duration;

    // Floors available for selected vehicle type
    const availableFloors = floors.filter(f =>
        vehicleType ? (f.vehicleType === vehicleType || f.vehicleType === 'both') : true
    );
    const motorcycleFloorNums = floors.filter(f => f.vehicleType === 'motorcycle' || f.vehicleType === 'both').length;
    const carFloorNums = floors.filter(f => f.vehicleType === 'car' || f.vehicleType === 'both').length;

    return (
        <>
            <style>{`
                /* ── Global Reset ── */
                * { box-sizing: border-box; }

                /* ── Page ── */
                .booking-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 40%, #f8fafc 100%);
                    font-family: 'Inter', 'Segoe UI', sans-serif;
                    color: #0f172a;
                }

                /* ── Back button ── */
                .back-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: white;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 10px;
                    padding: 8px 16px;
                    font-size: 14px;
                    font-weight: 600;
                    color: #475569;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
                }
                .back-btn:hover { background: #f8fafc; border-color: #94a3b8; color: #1e293b; transform: translateX(-2px); }

                /* ── Page header strip ── */
                .page-top {
                    background: white;
                    border-bottom: 1px solid #e2e8f0;
                    padding: 18px 32px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
                    position: sticky;
                    top: 72px;
                    z-index: 30;
                }
                .page-title {
                    font-size: 20px;
                    font-weight: 800;
                    color: #0f172a;
                    letter-spacing: -0.3px;
                }
                .page-subtitle {
                    font-size: 13px;
                    color: #64748b;
                    font-weight: 500;
                    margin-left: auto;
                }

                /* ── Single-column layout ── */
                .booking-content {
                    max-width: 780px;
                    margin: 0 auto;
                    padding: 32px 24px 60px;
                }

                /* ── Reserve button ── */
                .reserve-btn-wrap {
                    margin-top: 12px;
                    padding: 28px;
                    background: white;
                    border-radius: 20px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.05);
                }
                .reserve-btn {
                    width: 100%;
                    padding: 18px;
                    border: none;
                    border-radius: 14px;
                    font-size: 16px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
                    letter-spacing: 0.02em;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }
                .reserve-btn.ready {
                    background: linear-gradient(135deg, #2563eb, #4f46e5);
                    color: white;
                    box-shadow: 0 8px 28px rgba(79,70,229,0.4);
                }
                .reserve-btn.ready:hover {
                    transform: translateY(-3px) scale(1.015);
                    box-shadow: 0 14px 36px rgba(79,70,229,0.5);
                }
                .reserve-btn.ready:active { transform: scale(0.98); }
                .reserve-btn.disabled {
                    background: #f1f5f9;
                    color: #94a3b8;
                    cursor: not-allowed;
                }
                .reserve-hint {
                    text-align: center;
                    margin-top: 12px;
                    font-size: 12px;
                    color: #94a3b8;
                    font-weight: 500;
                }
                .step-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin: 0 3px; background: #e2e8f0; }
                .step-dot.done { background: #3b82f6; }

                /* ── Section card ── */
                .section-card {
                    background: white;
                    border-radius: 20px;
                    border: 1px solid #e2e8f0;
                    padding: 28px;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.05);
                    margin-bottom: 20px;
                    transition: box-shadow 0.3s;
                }
                .section-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.09); }

                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 22px;
                }
                .section-step {
                    width: 32px; height: 32px;
                    background: linear-gradient(135deg, #3b82f6, #6366f1);
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    color: white;
                    font-size: 14px;
                    font-weight: 800;
                    flex-shrink: 0;
                    box-shadow: 0 4px 12px rgba(59,130,246,0.35);
                }
                .section-step.done {
                    background: linear-gradient(135deg, #10b981, #059669);
                    box-shadow: 0 4px 12px rgba(16,185,129,0.35);
                }
                .section-title {
                    font-size: 17px;
                    font-weight: 700;
                    color: #1e293b;
                    letter-spacing: -0.2px;
                }

                /* ── Vehicle cards ── */
                .vehicle-cards {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }
                .vehicle-card {
                    border: 2px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 22px 16px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
                    background: white;
                    position: relative;
                    overflow: hidden;
                }
                .vehicle-card::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, #eff6ff, #dbeafe);
                    opacity: 0;
                    transition: opacity 0.25s;
                }
                .vehicle-card:hover { border-color: #93c5fd; transform: translateY(-3px); box-shadow: 0 8px 24px rgba(59,130,246,0.15); }
                .vehicle-card:hover::before { opacity: 1; }
                .vehicle-card.selected { border-color: #3b82f6; background: linear-gradient(135deg, #eff6ff, #dbeafe); transform: translateY(-3px); box-shadow: 0 8px 24px rgba(59,130,246,0.25); }
                .vehicle-card svg, .vehicle-card > * { position: relative; z-index: 1; }
                .vehicle-name { font-size: 14px; font-weight: 700; color: #1e293b; }
                .vehicle-floors { font-size: 11px; color: #64748b; font-weight: 500; background: #f1f5f9; padding: 4px 10px; border-radius: 20px; }
                .vehicle-card.selected .vehicle-floors { background: #dbeafe; color: #1d4ed8; }
                .vehicle-selected-badge {
                    position: absolute;
                    top: 10px; right: 10px;
                    width: 22px; height: 22px;
                    background: #3b82f6;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    color: white;
                    box-shadow: 0 2px 8px rgba(59,130,246,0.5);
                }

                /* ── Time inputs ── */
                .time-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }
                @media(max-width: 500px) { .time-grid { grid-template-columns: 1fr; } }
                .time-field label {
                    display: block;
                    font-size: 11px;
                    font-weight: 700;
                    color: #94a3b8;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    margin-bottom: 6px;
                }
                .time-field input, .time-field select {
                    width: 100%;
                    padding: 12px 14px;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 600;
                    color: #1e293b;
                    background: #f8fafc;
                    transition: all 0.2s;
                    outline: none;
                }
                .time-field input:focus, .time-field select:focus {
                    border-color: #3b82f6;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
                }

                .exit-time-info {
                    margin-top: 14px;
                    padding: 12px 16px;
                    background: linear-gradient(135deg, #eff6ff, #e0f2fe);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #1d4ed8;
                    border: 1px solid #bfdbfe;
                }

                /* ── Building & floor selection ── */
                .floor-tabs {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-top: 20px;
                }
                .floor-tab {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: white;
                    font-size: 14px;
                    font-weight: 600;
                    color: #475569;
                }
                .floor-tab.disabled { opacity: 0.4; cursor: not-allowed; }
                .floor-tab.selectable:hover { border-color: #3b82f6; color: #1d4ed8; background: #eff6ff; }
                .floor-tab.selected { border-color: #3b82f6; background: linear-gradient(135deg, #eff6ff, #dbeafe); color: #1d4ed8; }
                .floor-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
                .floor-dot.motorcycle { background: linear-gradient(135deg, #f59e0b, #f97316); }
                .floor-dot.car { background: linear-gradient(135deg, #3b82f6, #6366f1); }
                .floor-tab-slots { margin-left: auto; font-size: 11px; font-weight: 600; background: #f1f5f9; padding: 3px 9px; border-radius: 20px; }
                .floor-tab.selected .floor-tab-slots { background: #bfdbfe; color: #1d4ed8; }

                /* ── Slot grid ── */
                .slot-section-title {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 16px;
                }
                .slot-legend {
                    display: flex;
                    gap: 14px;
                    flex-wrap: wrap;
                }
                .slot-legend-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    color: #64748b;
                }
                .legend-dot {
                    width: 12px; height: 12px;
                    border-radius: 4px;
                }
                .ld-available { background: linear-gradient(135deg, #d1fae5, #a7f3d0); border: 1px solid #6ee7b7; }
                .ld-occupied { background: #fee2e2; border: 1px solid #fca5a5; }
                .ld-selected { background: linear-gradient(135deg, #3b82f6, #6366f1); }

                .slot-grid {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 10px;
                }
                @media(max-width: 480px) { .slot-grid { grid-template-columns: repeat(4, 1fr); } }

                .slot-cell {
                    position: relative;
                    aspect-ratio: 1;
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    cursor: pointer;
                    border: 2px solid transparent;
                    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                    font-size: 11px;
                    background: white;
                    outline: none;
                }
                .slot-number { font-weight: 800; font-size: 12px; }
                .slot-icon { width: 20px; height: 20px; }

                .slot-available {
                    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
                    border-color: #86efac;
                    color: #166534;
                }
                .slot-available:hover {
                    border-color: #22c55e;
                    transform: scale(1.08);
                    box-shadow: 0 6px 20px rgba(34,197,94,0.25);
                    z-index: 5;
                }
                .slot-occupied {
                    background: #fef2f2;
                    border-color: #fca5a5;
                    color: #ef4444;
                    cursor: not-allowed;
                    opacity: 0.65;
                }
                .slot-selected {
                    background: linear-gradient(135deg, #3b82f6, #6366f1) !important;
                    border-color: #6366f1 !important;
                    color: white !important;
                    transform: scale(1.1);
                    box-shadow: 0 8px 24px rgba(99,102,241,0.4);
                    z-index: 5;
                }
                .slot-check {
                    position: absolute;
                    top: 4px; right: 4px;
                    width: 16px; height: 16px;
                    background: rgba(255,255,255,0.3);
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                }
                .slot-x {
                    position: absolute;
                    top: 3px; right: 5px;
                    font-size: 9px;
                    color: #ef4444;
                    font-weight: 900;
                }

                /* ── Summary card (right column) ── */
                .summary-card {
                    background: white;
                    border-radius: 20px;
                    border: 1px solid #e2e8f0;
                    padding: 28px;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.07);
                    position: sticky;
                    top: 140px;
                }
                .summary-title { font-size: 17px; font-weight: 800; color: #1e293b; margin-bottom: 20px; letter-spacing: -0.2px; }
                .summary-parking-name {
                    font-size: 15px; font-weight: 700; color: #1d4ed8;
                    padding: 12px;
                    background: linear-gradient(135deg, #eff6ff, #dbeafe);
                    border-radius: 12px;
                    margin-bottom: 20px;
                    border: 1px solid #bfdbfe;
                }
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 9px 0;
                    border-bottom: 1px solid #f1f5f9;
                    font-size: 13px;
                }
                .summary-row:last-child { border-bottom: none; }
                .summary-label { color: #64748b; font-weight: 600; }
                .summary-value { color: #1e293b; font-weight: 700; }
                .summary-value.empty { color: #cbd5e1; font-style: italic; font-weight: 500; }
                .summary-total {
                    margin-top: 16px;
                    padding: 16px;
                    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
                    border-radius: 14px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border: 1px solid #86efac;
                }
                .summary-total-label { font-size: 14px; font-weight: 700; color: #166534; }
                .summary-total-price { font-size: 22px; font-weight: 900; color: #15803d; letter-spacing: -0.5px; }

                /* ── Confirm button ── */
                .confirm-btn {
                    width: 100%;
                    margin-top: 20px;
                    padding: 16px;
                    border: none;
                    border-radius: 14px;
                    font-size: 15px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
                    letter-spacing: 0.01em;
                }
                .confirm-btn.ready {
                    background: linear-gradient(135deg, #3b82f6, #6366f1);
                    color: white;
                    box-shadow: 0 8px 24px rgba(99,102,241,0.4);
                }
                .confirm-btn.ready:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 14px 32px rgba(99,102,241,0.5); }
                .confirm-btn.ready:active { transform: scale(0.98); }
                .confirm-btn.disabled {
                    background: #f1f5f9;
                    color: #94a3b8;
                    cursor: not-allowed;
                }
                .confirm-steps { margin-top: 14px; font-size: 12px; color: #94a3b8; text-align: center; font-weight: 500; }
                .step-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin: 0 3px; background: #e2e8f0; }
                .step-dot.done { background: #3b82f6; }

                /* ── Empty state ── */
                .empty-state {
                    text-align: center;
                    padding: 40px 20px;
                    color: #94a3b8;
                }
                .empty-state-icon { font-size: 48px; margin-bottom: 12px; }
                .empty-state-text { font-size: 14px; font-weight: 600; }

                /* ── Fade-in animation ── */
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(14px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-in { animation: fadeSlideIn 0.35s ease-out forwards; }

                /* ── Spinner ── */
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* ── Error state ── */
                .error-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 24px;
                    gap: 10px;
                    color: #ef4444;
                    font-size: 13px;
                    font-weight: 600;
                    text-align: center;
                }
                .error-state button {
                    margin-top: 8px;
                    padding: 8px 20px;
                    border: 1.5px solid #ef4444;
                    border-radius: 8px;
                    background: white;
                    color: #ef4444;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .error-state button:hover { background: #fef2f2; }
            `}</style>

            <div className="booking-page">
                <Header />

                {/* Sticky top bar */}
                <div className="page-top">
                    <button className="back-btn" onClick={() => navigate('/find-parking')}>
                        <ArrowLeftIcon /> Back
                    </button>
                    <h1 className="page-title">Reserve a Parking Spot</h1>
                    <span className="page-subtitle">{parkingSpot.title}</span>
                </div>

                <div className="booking-content">
                    <div>
                        {/* Step 1 — Vehicle */}
                        <div className="section-card animate-in">
                            <div className="section-header">
                                <div className={`section-step ${vehicleType ? 'done' : ''}`}>
                                    {vehicleType ? <CheckIcon /> : '1'}
                                </div>
                                <span className="section-title">Select Your Vehicle Type</span>
                            </div>
                            <div className="vehicle-cards">
                                <div
                                    className={`vehicle-card ${vehicleType === 'motorcycle' ? 'selected' : ''}`}
                                    onClick={() => setVehicleType('motorcycle')}
                                >
                                    {vehicleType === 'motorcycle' && <span className="vehicle-selected-badge"><CheckIcon /></span>}
                                    <MotorcycleIcon />
                                    <span className="vehicle-name">Motorcycle</span>
                                    <span className="vehicle-floors">
                                    {motorcycleFloorNums > 0 ? `${motorcycleFloorNums} floor${motorcycleFloorNums > 1 ? 's' : ''}` : 'No floors'}
                                </span>
                                </div>
                                <div
                                    className={`vehicle-card ${vehicleType === 'car' ? 'selected' : ''}`}
                                    onClick={() => setVehicleType('car')}
                                >
                                    {vehicleType === 'car' && <span className="vehicle-selected-badge"><CheckIcon /></span>}
                                    <CarIcon />
                                    <span className="vehicle-name">Car</span>
                                    <span className="vehicle-floors">
                                    {carFloorNums > 0 ? `${carFloorNums} floor${carFloorNums > 1 ? 's' : ''}` : 'No floors'}
                                </span>
                                </div>
                            </div>
                        </div>

                        {/* Step 2 — Time */}
                        <div className="section-card animate-in" style={{ animationDelay: '0.05s' }}>
                            <div className="section-header">
                                <div className={`section-step ${entryDate && duration ? 'done' : ''}`}>
                                    {entryDate && duration ? <CheckIcon /> : '2'}
                                </div>
                                <span className="section-title">Entry Time &amp; Duration</span>
                            </div>
                            <div className="time-grid">
                                <div className="time-field">
                                    <label>Entry Date &amp; Time</label>
                                    <input
                                        type="datetime-local"
                                        value={entryDate}
                                        onChange={e => setEntryDate(e.target.value)}
                                    />
                                </div>
                                <div className="time-field">
                                    <label>Duration</label>
                                    <select value={duration} onChange={e => setDuration(Number(e.target.value))}>
                                        {[1, 2, 3, 4, 5, 6, 8, 10, 12, 24].map(h => (
                                            <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {entryDate && (
                                <div className="exit-time-info">
                                    <ClockIcon />
                                    Estimated exit time:&nbsp;
                                    <strong>
                                        {exitTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}&nbsp;
                                        {exitTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </strong>
                                </div>
                            )}
                        </div>

                        {/* Step 3 — Floor */}
                        <div className="section-card animate-in" style={{ animationDelay: '0.1s' }}>
                            <div className="section-header">
                                <div className={`section-step ${selectedFloor ? 'done' : ''}`}>
                                    {selectedFloor ? <CheckIcon /> : '3'}
                                </div>
                                <span className="section-title">Select Building Floor</span>
                            </div>

                            {/* 3D building */}
                            {floorsLoading ? (
                                <LoadingSpinner />
                            ) : floorsError ? (
                                <div className="error-state">
                                    <span>⚠️ {floorsError}</span>
                                    <button onClick={() => window.location.reload()}>Retry</button>
                                </div>
                            ) : (
                                <BuildingVisual
                                    selectedFloor={selectedFloor}
                                    vehicleType={vehicleType}
                                    onSelectFloor={handleFloorSelect}
                                    floors={floors}
                                />
                            )}

                            {/* Floor list tabs */}
                            <div className="floor-tabs">
                                {floorsLoading ? (
                                    <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '13px' }}>Loading floors...</div>
                                ) : floorsError ? null : floors.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '13px' }}>No floors available.</div>
                                ) : (
                                    floors.map((f) => {
                                        const selectable = vehicleType ? (f.vehicleType === vehicleType || f.vehicleType === 'both') : false;
                                        const isSelected = selectedFloor?._id === f._id;
                                        const dotClass = f.vehicleType === 'car' ? 'car' : 'motorcycle';
                                        return (
                                            <div
                                                key={f._id}
                                                className={`floor-tab ${!vehicleType || !selectable ? 'disabled' : 'selectable'} ${isSelected ? 'selected' : ''}`}
                                                onClick={() => selectable && handleFloorSelect(f)}
                                            >
                                                <span className={`floor-dot ${dotClass}`}></span>
                                                <span>{f.name || `Floor ${f.floorNumber}`}</span>
                                                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                                                    {f.vehicleType === 'motorcycle' ? '🏍 Motorcycle' : f.vehicleType === 'car' ? '🚗 Car' : '🏍🚗 All'}
                                                </span>
                                                <span className="floor-tab-slots">
                                                    {isSelected ? `${availableCount} avail.` : `${f.totalSlots ?? '?'} slots`}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Step 4 — Slot */}
                        {selectedFloor && (
                            <div className="section-card animate-in" style={{ animationDelay: '0.15s' }}>
                                <div className="section-header">
                                    <div className={`section-step ${selectedSlot ? 'done' : ''}`}>
                                        {selectedSlot ? <CheckIcon /> : '4'}
                                    </div>
                                    <span className="section-title">Choose a Slot — {floorLabel(selectedFloor)}</span>
                                </div>

                                {/* Legend */}
                                <div className="slot-section-title">
                                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                                        {availableCount} of {selectedFloor?.totalSlots ?? slots.length} slots available
                                    </span>
                                    <div className="slot-legend">
                                        <div className="slot-legend-item"><span className="legend-dot ld-available"></span>Available</div>
                                        <div className="slot-legend-item"><span className="legend-dot ld-occupied"></span>Occupied</div>
                                        <div className="slot-legend-item"><span className="legend-dot ld-selected"></span>Selected</div>
                                    </div>
                                </div>

                                <SlotGrid
                                    slots={slots}
                                    selectedSlot={selectedSlot}
                                    onSelect={setSelectedSlot}
                                    vehicleType={vehicleType}
                                />
                            </div>
                        )}

                        {!selectedFloor && (
                            <div className="section-card" style={{ opacity: 0.5 }}>
                                <div className="empty-state">
                                    <div className="empty-state-icon">🅿️</div>
                                    <div className="empty-state-text">Select a floor above to see available slots</div>
                                </div>
                            </div>
                        )}

                        {/* ── Reserve Button ── */}
                        <div className="reserve-btn-wrap animate-in" style={{ animationDelay: '0.2s' }}>
                            <button
                                id="reserve-spot-btn"
                                className={`reserve-btn ${vehicleType && selectedFloor && selectedSlot ? 'ready' : 'disabled'}`}
                                onClick={handleReserve}
                                disabled={!vehicleType || !selectedFloor || !selectedSlot}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                                Reserve This Spot
                            </button>
                            <div className="reserve-hint">
                                <span className={`step-dot ${vehicleType ? 'done' : ''}`}></span>
                                <span className={`step-dot ${entryDate ? 'done' : ''}`}></span>
                                <span className={`step-dot ${selectedFloor ? 'done' : ''}`}></span>
                                <span className={`step-dot ${selectedSlot ? 'done' : ''}`}></span>
                                &nbsp;{[!!vehicleType, !!entryDate, !!selectedFloor, !!selectedSlot].filter(Boolean).length}/4 steps completed
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BookingPage;
