import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header/Header';
import floorService, { Floor } from '../../services/api/floorService';

// ── Helpers ────────────────────────────────────────────────────────────────────
const generateSlots = (totalSlots: number, floorIndex: number) => {
    const rows = ['A', 'B', 'C', 'D', 'E'];
    const occupiedSets: number[][] = [
        [2, 5, 8, 12, 17, 23, 30, 35],
        [1, 4, 9, 11, 15, 19, 25, 28, 33],
        [3, 6, 10, 13, 16, 22, 27, 32],
        [2, 7, 8, 14, 18, 20, 26, 31],
    ];
    const occupied = occupiedSets[floorIndex % occupiedSets.length] || [];
    return Array.from({ length: totalSlots }, (_, i) => {
        const rowIdx = Math.floor(i / 10);
        const colNum = (i % 10) + 1;
        const rowLabel = rows[rowIdx] || String.fromCharCode(65 + rowIdx);
        return {
            id: i + 1,
            label: `${rowLabel}${String(colNum).padStart(2, '0')}`,
            row: rowLabel,
            col: colNum,
            status: occupied.includes(i + 1) ? 'occupied' : 'available',
        };
    });
};

// ── Isometric Building ─────────────────────────────────────────────────────────
const IsoBuilding = ({ floors, selectedFloor, onSelect }: {
    floors: Floor[];
    selectedFloor: Floor | null;
    onSelect: (f: Floor) => void;
}) => {
    const sorted = [...floors].sort((a, b) => b.floorNumber - a.floorNumber);
    const W = 180, H = 44, D = 26, startX = 70, startY = 20, gap = 4;

    // Tất cả tầng đều có thể chọn — không lọc theo loại xe
    const isSelectable = (_f: Floor) => true;

    const face = (f: Floor) => selectedFloor?._id === f._id ? '#2563eb' : '#dbeafe';
    const side = (f: Floor) => selectedFloor?._id === f._id ? '#1d4ed8' : '#bfdbfe';
    const top  = (f: Floor) => selectedFloor?._id === f._id ? '#93c5fd' : '#e0f2fe';

    if (sorted.length === 0) return (
        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
            Không có tầng
        </div>
    );

    const totalH = sorted.length * (H + gap) + D + 30;

    return (
        <svg viewBox={`0 0 ${startX + W + D + 20} ${totalH}`} width="100%" style={{ maxWidth: 280 }}>
            {sorted.map((f, idx) => {
                const baseY = startY + idx * (H + gap);
                const sel = selectedFloor?._id === f._id;
                const frontPts = `${startX},${baseY + D} ${startX + W},${baseY + D} ${startX + W},${baseY + D + H} ${startX},${baseY + D + H}`;
                const topPts = `${startX},${baseY + D} ${startX + W},${baseY + D} ${startX + W + D},${baseY} ${startX + D},${baseY}`;
                const sidePts = `${startX + W},${baseY + D} ${startX + W + D},${baseY} ${startX + W + D},${baseY + H} ${startX + W},${baseY + D + H}`;
                return (
                    <g key={f._id} onClick={() => onSelect(f)} style={{ cursor: 'pointer' }}>
                        <polygon points={topPts} fill={top(f)} stroke="#94a3b8" strokeWidth="0.8" />
                        <polygon points={frontPts} fill={face(f)} stroke="#94a3b8" strokeWidth="0.8" />
                        <polygon points={sidePts} fill={side(f)} stroke="#94a3b8" strokeWidth="0.8" />
                        {/* windows */}
                        {[0, 1, 2].map(w => (
                            <rect key={w} x={startX + 18 + w * 52} y={baseY + D + 12} width={32} height={18} rx="2"
                                fill={sel ? 'rgba(255,255,255,0.25)' : 'rgba(219,234,254,0.6)'}
                                stroke={sel ? 'rgba(255,255,255,0.5)' : '#cbd5e1'} strokeWidth="0.5" />
                        ))}
                        {/* label */}
                        <text x={startX + W / 2} y={baseY + D + H / 2 + 5} textAnchor="middle"
                            fontSize="11" fontWeight="700"
                            fill={sel ? '#fff' : '#1e40af'}>
                            {f.name || `Tầng ${f.floorNumber}`}
                        </text>
                        {/* check on selected */}
                        {sel && (
                            <text x={startX + W - 12} y={baseY + D + H / 2 + 5} textAnchor="middle" fontSize="13" fill="#fff">✓</text>
                        )}
                    </g>
                );
            })}
            {/* ground shadow */}
            <ellipse cx={startX + W / 2 + D / 2} cy={startY + sorted.length * (H + gap) + D + 10}
                rx={W / 2 + 16} ry="8" fill="rgba(0,0,0,0.07)" />
        </svg>
    );
};

// ── Parking Map ────────────────────────────────────────────────────────────────
const ParkingMap = ({ slots, selectedSlot, onSelect }: {
    slots: { id: number; label: string; row: string; col: number; status: string }[];
    selectedSlot: number | null;
    onSelect: (id: number) => void;
}) => {
    const rows = [...new Set(slots.map(s => s.row))];
    const maxCol = Math.max(...slots.map(s => s.col));
    const midCol = Math.ceil(maxCol / 2);

    return (
        <div style={{ overflowX: 'auto', padding: '0 4px' }}>
            <div style={{ display: 'flex', gap: 8, minWidth: 'max-content' }}>
                {/* Row labels */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 28 }}>
                    {rows.map(row => (
                        <div key={row} style={{
                            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, color: '#475569'
                        }}>{row}</div>
                    ))}
                </div>
                {/* Slot columns split by aisle */}
                <div style={{ display: 'flex', gap: 12 }}>
                    {[Array.from({ length: midCol }, (_, i) => i + 1), Array.from({ length: maxCol - midCol }, (_, i) => i + midCol + 1)].map((colGroup, gi) => (
                        <div key={gi}>
                            {/* Column headers */}
                            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                                {colGroup.map(col => (
                                    <div key={col} style={{
                                        width: 28, fontSize: 9, textAlign: 'center', color: '#94a3b8', fontWeight: 600
                                    }}>
                                        {String(col).padStart(2, '0')}
                                    </div>
                                ))}
                            </div>
                            {/* Rows */}
                            {rows.map(row => (
                                <div key={row} style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                                    {colGroup.map(col => {
                                        const slot = slots.find(s => s.row === row && s.col === col);
                                        if (!slot) return <div key={col} style={{ width: 28 }} />;
                                        const isSel = selectedSlot === slot.id;
                                        const isOcc = slot.status === 'occupied';
                                        return (
                                            <button
                                                key={slot.id}
                                                disabled={isOcc}
                                                onClick={() => !isOcc && onSelect(slot.id)}
                                                title={slot.label}
                                                style={{
                                                    width: 28, height: 28,
                                                    border: isSel ? '2px solid #2563eb' : isOcc ? '1.5px solid #e2e8f0' : '1.5px solid #cbd5e1',
                                                    borderRadius: 4,
                                                    background: isSel ? '#2563eb' : isOcc ? '#f1f5f9' : '#fff',
                                                    color: isSel ? '#fff' : isOcc ? '#cbd5e1' : '#475569',
                                                    fontSize: 8,
                                                    fontWeight: 700,
                                                    cursor: isOcc ? 'not-allowed' : 'pointer',
                                                    padding: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.15s',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {isSel ? '✓' : isOcc ? '' : slot.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ── Main ───────────────────────────────────────────────────────────────────────
const BookingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const parkingSpot = location.state?.spot || { title: 'Bitexco Financial Tower Parking', price: 50000 };

    const [vehicleType, setVehicleType] = useState<string | null>(null);
    const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
    const [slots, setSlots] = useState<{ id: number; label: string; row: string; col: number; status: string }[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 16));
    const [duration, setDuration] = useState(2);

    const [floors, setFloors] = useState<Floor[]>([]);
    const [floorsLoading, setFloorsLoading] = useState(false);
    const [floorsError, setFloorsError] = useState<string | null>(null);

    useEffect(() => {
        const fetch = async () => {
            setFloorsLoading(true);
            setFloorsError(null);
            try {
                const params: any = { status: 'active' };
                if (parkingSpot._id) params.parkingLot = parkingSpot._id;
                const data = await floorService.getFloors(params);
                const list: Floor[] = Array.isArray(data) ? data : (data as any)?.data ?? [];
                setFloors(list);
            } catch (err: any) {
                setFloorsError(err?.message || 'Không thể tải dữ liệu tầng.');
            } finally {
                setFloorsLoading(false);
            }
        };
        fetch();
    }, [parkingSpot._id]);

    useEffect(() => {
        setSelectedFloor(null);
        setSelectedSlot(null);
        setSlots([]);
    }, [vehicleType]);

    useEffect(() => {
        if (selectedFloor) {
            const idx = floors.findIndex(f => f._id === selectedFloor._id);
            setSlots(generateSlots(selectedFloor.totalSlots || 40, idx));
            setSelectedSlot(null);
        }
    }, [selectedFloor]);

    // Không còn lọc tầng theo loại xe — tất cả tầng đều hiển thị

    const availableCount = slots.filter(s => s.status === 'available').length;
    const exitTime = new Date(new Date(entryDate).getTime() + duration * 3600000);
    const selectedSlotLabel = slots.find(s => s.id === selectedSlot)?.label || null;

    const step = !vehicleType ? 1 : !selectedFloor ? 3 : !selectedSlot ? 4 : 4;
    const stepsDone = [!!vehicleType, true, !!selectedFloor, !!selectedSlot].filter(Boolean).length;

    const handleReserve = () => {
        if (!vehicleType || !selectedFloor || !selectedSlot) return;
        navigate('/session', {
            state: { spot: parkingSpot, vehicleType, floor: selectedFloor, slot: selectedSlot, entryDate, duration }
        });
    };

    const fmtDate = (iso: string) => {
        const d = new Date(iso);
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    };
    const fmtExit = () => {
        const d = exitTime;
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }

                .bk-page {
                    min-height: 100vh;
                    background: #f0f4f8;
                    font-family: 'Inter', 'Segoe UI', sans-serif;
                    color: #1e293b;
                    padding-bottom: 80px;
                }

                /* Page header */
                .bk-header {
                    background: #fff;
                    border-bottom: 1px solid #e2e8f0;
                    padding: 18px 32px;
                    display: flex;
                    align-items: baseline;
                    justify-content: space-between;
                }
                .bk-header h1 {
                    font-size: 22px;
                    font-weight: 800;
                    color: #0f172a;
                    letter-spacing: -0.4px;
                }
                .bk-header-sub {
                    font-size: 13px;
                    color: #64748b;
                    font-weight: 500;
                }

                /* Main grid */
                .bk-body {
                    max-width: 1100px;
                    margin: 0 auto;
                    padding: 24px 20px 0;
                }

                /* Top 3-col */
                .bk-top {
                    display: grid;
                    grid-template-columns: 260px 1fr 1fr;
                    gap: 16px;
                    margin-bottom: 16px;
                }
                @media(max-width: 900px) {
                    .bk-top { grid-template-columns: 1fr; }
                }

                /* Cards */
                .bk-card {
                    background: #fff;
                    border-radius: 14px;
                    border: 1px solid #e2e8f0;
                    padding: 18px 20px;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
                }
                .bk-card-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 16px;
                    font-size: 13px;
                    font-weight: 700;
                    color: #374151;
                }
                .bk-step-badge {
                    width: 22px; height: 22px;
                    border-radius: 50%;
                    background: #e2e8f0;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 11px;
                    font-weight: 800;
                    color: #64748b;
                    flex-shrink: 0;
                }
                .bk-step-badge.active {
                    background: #2563eb;
                    color: #fff;
                }
                .bk-step-badge.done {
                    background: #10b981;
                    color: #fff;
                }

                /* Vehicle selector */
                .bk-vehicle-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }
                .bk-vehicle-btn {
                    border: 1.5px solid #e2e8f0;
                    border-radius: 10px;
                    background: #f8fafc;
                    padding: 14px 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                }
                .bk-vehicle-btn:hover { border-color: #93c5fd; background: #eff6ff; }
                .bk-vehicle-btn.sel {
                    border-color: #2563eb;
                    background: #eff6ff;
                }
                .bk-vehicle-btn svg { color: #475569; }
                .bk-vehicle-btn.sel svg { color: #2563eb; }
                .bk-vehicle-label { font-size: 12px; font-weight: 600; color: #374151; }
                .bk-vehicle-btn.sel .bk-vehicle-label { color: #1d4ed8; }
                .bk-vehicle-check {
                    position: absolute; top: 7px; right: 7px;
                    width: 18px; height: 18px;
                    background: #2563eb;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    color: #fff;
                    font-size: 10px;
                }

                /* Time inputs */
                .bk-time-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 12px;
                }
                .bk-field label {
                    display: block;
                    font-size: 10px;
                    font-weight: 700;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    margin-bottom: 5px;
                }
                .bk-field input, .bk-field select {
                    width: 100%;
                    padding: 9px 11px;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #1e293b;
                    background: #f8fafc;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .bk-field input:focus, .bk-field select:focus {
                    border-color: #2563eb;
                    background: #fff;
                }
                .bk-exit-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: #eff6ff;
                    border: 1px solid #bfdbfe;
                    border-radius: 8px;
                    padding: 9px 13px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #1d4ed8;
                }

                /* Floor section */
                .bk-floor-inner {
                    display: flex;
                    gap: 14px;
                    align-items: flex-start;
                }
                .bk-floor-list {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    min-width: 0;
                }
                .bk-floor-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.18s;
                    background: #fff;
                    font-size: 12px;
                    font-weight: 600;
                    color: #374151;
                }
                .bk-floor-item:hover { border-color: #93c5fd; background: #eff6ff; }
                .bk-floor-item.disabled { opacity: 0.45; cursor: not-allowed; }
                .bk-floor-item.sel { border-color: #2563eb; background: #eff6ff; color: #1d4ed8; }
                .bk-floor-slots {
                    margin-left: auto;
                    background: #10b981;
                    color: #fff;
                    font-size: 11px;
                    font-weight: 700;
                    padding: 2px 8px;
                    border-radius: 20px;
                    white-space: nowrap;
                }
                .bk-floor-check {
                    color: #2563eb;
                    font-size: 13px;
                    font-weight: 800;
                    margin-left: 2px;
                }

                /* Slot grid card */
                .bk-slot-card {
                    background: #fff;
                    border-radius: 14px;
                    border: 1px solid #e2e8f0;
                    padding: 18px 20px;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
                    margin-bottom: 16px;
                }
                .bk-slot-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 14px;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .bk-slot-legend {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                .bk-legend-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    color: #64748b;
                }
                .bk-legend-dot {
                    width: 14px; height: 14px;
                    border-radius: 3px;
                }
                .ld-free { background: #fff; border: 1.5px solid #cbd5e1; }
                .ld-sel { background: #2563eb; }
                .ld-occ { background: #f1f5f9; border: 1.5px solid #e2e8f0; }

                /* Bottom bar */
                .bk-footer {
                    position: fixed;
                    bottom: 0; left: 0; right: 0;
                    background: #fff;
                    border-top: 1px solid #e2e8f0;
                    padding: 14px 32px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    z-index: 100;
                    box-shadow: 0 -4px 16px rgba(0,0,0,0.06);
                }
                .bk-footer-steps {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    min-width: 180px;
                }
                .bk-footer-label {
                    font-size: 12px;
                    font-weight: 700;
                    color: #1e293b;
                }
                .bk-footer-bar {
                    height: 4px;
                    border-radius: 4px;
                    background: #e2e8f0;
                    overflow: hidden;
                    width: 160px;
                }
                .bk-footer-bar-fill {
                    height: 100%;
                    border-radius: 4px;
                    background: #2563eb;
                    transition: width 0.4s ease;
                }
                .bk-footer-summary {
                    flex: 1;
                    font-size: 13px;
                    font-weight: 600;
                    color: #475569;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    flex-wrap: wrap;
                }
                .bk-footer-bullet { color: #94a3b8; }
                .bk-confirm-btn {
                    padding: 13px 32px;
                    border: none;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                    letter-spacing: 0.01em;
                }
                .bk-confirm-btn.ready {
                    background: #2563eb;
                    color: #fff;
                    box-shadow: 0 4px 14px rgba(37,99,235,0.35);
                }
                .bk-confirm-btn.ready:hover {
                    background: #1d4ed8;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(37,99,235,0.45);
                }
                .bk-confirm-btn.disabled {
                    background: #f1f5f9;
                    color: #94a3b8;
                    cursor: not-allowed;
                }

                /* Loading / error */
                .bk-loading {
                    display: flex; align-items: center; justify-content: center;
                    padding: 28px; gap: 10px;
                    color: #64748b; font-size: 12px; font-weight: 600;
                }
                .bk-spinner {
                    width: 20px; height: 20px;
                    border: 2.5px solid #e2e8f0;
                    border-top-color: #2563eb;
                    border-radius: 50%;
                    animation: bk-spin 0.7s linear infinite;
                }
                @keyframes bk-spin { to { transform: rotate(360deg); } }
                .bk-error {
                    text-align: center; padding: 20px; color: #ef4444;
                    font-size: 12px; font-weight: 600;
                }
                .bk-retry {
                    margin-top: 8px; background: none; border: 1.5px solid #ef4444;
                    border-radius: 6px; padding: 5px 14px; color: #ef4444; font-weight: 700;
                    cursor: pointer; font-size: 12px;
                }

                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fade-up { animation: fadeUp 0.3s ease-out forwards; }
            `}</style>

            <div className="bk-page">
                <Header />

                {/* Page Title Bar */}
                <div className="bk-header">
                    <h1>Đặt Chỗ Gửi Xe Thông Minh</h1>
                    <span className="bk-header-sub">{parkingSpot.title}</span>
                </div>

                <div className="bk-body">
                    {/* ── TOP 3 COLUMNS ── */}
                    <div className="bk-top">

                        {/* ── STEP 1: Vehicle ── */}
                        <div className="bk-card">
                            <div className="bk-card-title">
                                <span className={`bk-step-badge ${vehicleType ? 'done' : 'active'}`}>
                                    {vehicleType ? '✓' : '1'}
                                </span>
                                Chọn Loại Phương Tiện
                            </div>
                            <div className="bk-vehicle-row">
                                {/* Motorcycle */}
                                <button
                                    className={`bk-vehicle-btn ${vehicleType === 'motorcycle' ? 'sel' : ''}`}
                                    onClick={() => setVehicleType('motorcycle')}
                                >
                                    {vehicleType === 'motorcycle' && <span className="bk-vehicle-check">✓</span>}
                                    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="40" height="40">
                                        <circle cx="9" cy="34" r="6" />
                                        <circle cx="39" cy="34" r="6" />
                                        <path d="M15 34h18M24 16l4.5 10.5H16l3-6H24" />
                                        <path d="M28.5 16H35l4.5 7.5" />
                                        <circle cx="36" cy="14.5" r="2.5" />
                                    </svg>
                                    <span className="bk-vehicle-label">Xe máy</span>

                                </button>
                                {/* Car */}
                                <button
                                    className={`bk-vehicle-btn ${vehicleType === 'car' ? 'sel' : ''}`}
                                    onClick={() => setVehicleType('car')}
                                >
                                    {vehicleType === 'car' && <span className="bk-vehicle-check">✓</span>}
                                    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="40" height="40">
                                        <rect x="4" y="22" width="40" height="14" rx="3" />
                                        <path d="M10 22l4.5-9h19L37 22" />
                                        <circle cx="13" cy="36" r="4" />
                                        <circle cx="35" cy="36" r="4" />
                                        <rect x="18" y="14" width="12" height="8" rx="1.5" />
                                        <path d="M4 28h3M41 28h3" />
                                    </svg>
                                    <span className="bk-vehicle-label">Ô tô</span>

                                </button>
                            </div>
                        </div>

                        {/* ── STEP 2: Time ── */}
                        <div className="bk-card">
                            <div className="bk-card-title">
                                <span className={`bk-step-badge ${entryDate && duration ? 'done' : 'active'}`}>
                                    {entryDate && duration ? '✓' : '2'}
                                </span>
                                Thời Gian Vào &amp; Thời Lượng
                            </div>
                            <div className="bk-time-grid">
                                <div className="bk-field">
                                    <label>Ngày &amp; Giờ Vào</label>
                                    <input
                                        type="datetime-local"
                                        value={entryDate}
                                        onChange={e => setEntryDate(e.target.value)}
                                    />
                                </div>
                                <div className="bk-field">
                                    <label>Thời Lượng</label>
                                    <select value={duration} onChange={e => setDuration(Number(e.target.value))}>
                                        {[1, 2, 3, 4, 5, 6, 8, 10, 12, 24].map(h => (
                                            <option key={h} value={h}>{h} giờ</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {entryDate && (
                                <div className="bk-exit-info">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    Dự kiến ra: <strong>{fmtExit()}</strong>
                                </div>
                            )}
                        </div>

                        {/* ── STEP 3: Floor ── */}
                        <div className="bk-card">
                            <div className="bk-card-title">
                                <span className={`bk-step-badge ${selectedFloor ? 'done' : vehicleType ? 'active' : ''}`}>
                                    {selectedFloor ? '✓' : '3'}
                                </span>
                                Chọn Tầng
                            </div>

                            {floorsLoading ? (
                                <div className="bk-loading"><div className="bk-spinner" /> Đang tải...</div>
                            ) : floorsError ? (
                                <div className="bk-error">
                                    ⚠️ {floorsError}
                                    <br />
                                    <button className="bk-retry" onClick={() => window.location.reload()}>Thử lại</button>
                                </div>
                            ) : (
                                <div className="bk-floor-inner">
                                    {/* 3D iso */}
                                    <div style={{ flexShrink: 0 }}>
                                        <IsoBuilding
                                            floors={floors}
                                            selectedFloor={selectedFloor}
                                            onSelect={f => setSelectedFloor(f)}
                                        />
                                    </div>

                                    {/* Floor list */}
                                    <div className="bk-floor-list">
                                        {floors.length === 0 ? (
                                            <div style={{ color: '#94a3b8', fontSize: 12, padding: '8px 0' }}>Không có tầng</div>
                                        ) : (
                                            floors.map(f => {
                                                const isSel = selectedFloor?._id === f._id;
                                                return (
                                                    <div
                                                        key={f._id}
                                                        className={`bk-floor-item ${isSel ? 'sel' : ''}`}
                                                        onClick={() => setSelectedFloor(f)}
                                                    >
                                                        <span>{f.name || `Tầng ${f.floorNumber}`}</span>
                                                        {isSel && <span className="bk-floor-check">✓</span>}
                                                        <span className="bk-floor-slots">
                                                            {isSel ? `${availableCount} chỗ` : `${f.totalSlots ?? '?'} chỗ`}
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── STEP 4: Slot grid ── */}
                    {selectedFloor && (
                        <div className="bk-slot-card fade-up">
                            <div className="bk-slot-header">
                                <div className="bk-card-title" style={{ marginBottom: 0 }}>
                                    <span className={`bk-step-badge ${selectedSlot ? 'done' : 'active'}`}>
                                        {selectedSlot ? '✓' : '4'}
                                    </span>
                                    Chọn Vị Trí Đỗ ({selectedFloor.name || `Tầng ${selectedFloor.floorNumber}`})
                                </div>
                                <div className="bk-slot-legend">
                                    <span className="bk-legend-item">
                                        <span className="bk-legend-dot ld-free" /> Trống
                                    </span>
                                    <span className="bk-legend-item">
                                        <span className="bk-legend-dot ld-sel" /> Đang chọn
                                    </span>
                                    <span className="bk-legend-item">
                                        <span className="bk-legend-dot ld-occ" /> Đã đặt
                                    </span>
                                </div>
                            </div>
                            <ParkingMap
                                slots={slots}
                                selectedSlot={selectedSlot}
                                onSelect={setSelectedSlot}
                            />
                        </div>
                    )}

                    {!selectedFloor && (
                        <div className="bk-slot-card" style={{ opacity: 0.5, textAlign: 'center', padding: '28px', color: '#94a3b8' }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>🅿️</div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>Chọn tầng để xem vị trí đỗ xe</div>
                        </div>
                    )}
                </div>

                {/* ── BOTTOM FOOTER BAR ── */}
                <div className="bk-footer">
                    <div className="bk-footer-steps">
                        <div className="bk-footer-label">
                            Bước {Math.min(stepsDone + 1, 4)}/4 —{' '}
                            {!vehicleType ? 'Chọn loại phương tiện'
                                : !selectedFloor ? 'Chọn tầng đỗ xe'
                                    : !selectedSlot ? 'Chọn vị trí đỗ'
                                        : 'Hoàn tất chọn vị trí'}
                        </div>
                        <div className="bk-footer-bar">
                            <div className="bk-footer-bar-fill" style={{ width: `${(stepsDone / 4) * 100}%` }} />
                        </div>
                    </div>

                    <div className="bk-footer-summary">
                        {vehicleType && (
                            <>{vehicleType === 'car' ? 'Ô tô' : 'Xe máy'}</>
                        )}
                        {selectedFloor && (
                            <>
                                <span className="bk-footer-bullet">•</span>
                                {selectedFloor.name || `Tầng ${selectedFloor.floorNumber}`}
                            </>
                        )}
                        {selectedSlotLabel && (
                            <>
                                <span className="bk-footer-bullet">•</span>
                                Vị trí {selectedSlotLabel}
                            </>
                        )}
                        {duration && (
                            <>
                                <span className="bk-footer-bullet">•</span>
                                {duration} giờ
                            </>
                        )}
                    </div>

                    <button
                        id="confirm-booking-btn"
                        className={`bk-confirm-btn ${vehicleType && selectedFloor && selectedSlot ? 'ready' : 'disabled'}`}
                        onClick={handleReserve}
                        disabled={!vehicleType || !selectedFloor || !selectedSlot}
                    >
                        Xác nhận đặt chỗ
                    </button>
                </div>
            </div>
        </>
    );
};

export default BookingPage;
