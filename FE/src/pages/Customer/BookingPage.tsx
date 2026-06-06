import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header/Header';
import floorService, { Floor } from '../../services/api/floorService';
import zoneService, { Zone } from '../../services/api/zoneService';
import parkingSlotService, { ParkingSlot } from '../../services/api/parkingSlotService';

// ─── Helpers ────────────────────────────────────────────────────────────────
const getZoneId = (z: ParkingSlot['zone']): string =>
    typeof z === 'string' ? z : (z as any)?._id ?? '';
const getVehicleTypeName = (vt: ParkingSlot['vehicleType']): string =>
    typeof vt === 'string' ? '' : (vt as any)?.name ?? '';

// ─── Isometric Building ──────────────────────────────────────────────────────
const IsoBuilding = ({ floors, selectedFloor, onSelect }: {
    floors: Floor[];
    selectedFloor: Floor | null;
    onSelect: (f: Floor) => void;
}) => {
    const sorted = [...floors].sort((a, b) => b.floorNumber - a.floorNumber);
    const W = 180, H = 44, D = 26, startX = 70, startY = 20, gap = 4;
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
                        {[0, 1, 2].map(w => (
                            <rect key={w} x={startX + 18 + w * 52} y={baseY + D + 12} width={32} height={18} rx="2"
                                fill={sel ? 'rgba(255,255,255,0.25)' : 'rgba(219,234,254,0.6)'}
                                stroke={sel ? 'rgba(255,255,255,0.5)' : '#cbd5e1'} strokeWidth="0.5" />
                        ))}
                        <text x={startX + W / 2} y={baseY + D + H / 2 + 5} textAnchor="middle" fontSize="11" fontWeight="700" fill={sel ? '#fff' : '#1e40af'}>
                            {f.name || `Tầng ${f.floorNumber}`}
                        </text>
                        {sel && <text x={startX + W - 12} y={baseY + D + H / 2 + 5} textAnchor="middle" fontSize="13" fill="#fff">✓</text>}
                    </g>
                );
            })}
            <ellipse cx={startX + W / 2 + D / 2} cy={startY + sorted.length * (H + gap) + D + 10} rx={W / 2 + 16} ry="8" fill="rgba(0,0,0,0.07)" />
        </svg>
    );
};

// ─── Zone Card ───────────────────────────────────────────────────────────────
const ZoneCard = ({ zone, selected, onSelect }: {
    zone: Zone; selected: boolean; onSelect: (z: Zone) => void;
}) => {
    const pct = zone.totalSlots > 0 ? Math.round((zone.availableSlots / zone.totalSlots) * 100) : 0;
    const isFull = zone.availableSlots === 0;
    const isLow = zone.availableSlots <= 5 && !isFull;
    const barColor = isFull ? '#ef4444' : isLow ? '#f59e0b' : '#10b981';
    const vehicleLabel = () => {
        const t = zone.allowedVehicleTypes || [];
        if (t.includes('motorcycle') && t.includes('car')) return '🚗🏍️ Cả hai';
        if (t.includes('motorcycle')) return '🏍️ Xe máy';
        if (t.includes('car')) return '🚗 Ô tô';
        return '🚗🏍️ Cả hai';
    };
    return (
        <div className={`zone-card ${selected ? 'sel' : ''} ${isFull ? 'full' : ''}`}
            onClick={() => !isFull && onSelect(zone)} style={{ cursor: isFull ? 'not-allowed' : 'pointer' }}>
            <div className="zone-card-top">
                <div className="zone-badge" style={{ background: selected ? '#2563eb' : '#f1f5f9', color: selected ? '#fff' : '#475569' }}>
                    {zone.code}
                </div>
                <div className="zone-info">
                    <div className="zone-name">{zone.name}</div>
                    <div className="zone-vehicle">{vehicleLabel()}</div>
                </div>
                {selected && <div className="zone-check">✓</div>}
                {isFull && <div className="zone-full-badge">Hết chỗ</div>}
            </div>
            <div className="zone-slot-info">
                <div className="zone-slot-bar-bg">
                    <div className="zone-slot-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                </div>
                <div className="zone-slot-text">
                    <span style={{ color: barColor, fontWeight: 700 }}>{zone.availableSlots}</span>
                    <span style={{ color: '#94a3b8' }}>/{zone.totalSlots} chỗ trống</span>
                </div>
            </div>
        </div>
    );
};

// ─── Parking Slot Map Grid ───────────────────────────────────────────────────
const SlotMapGrid = ({ slots, selectedSlotId, onSelect }: {
    slots: ParkingSlot[];
    selectedSlotId: string | null;
    onSelect: (s: ParkingSlot) => void;
}) => {
    // Group by row → then column
    const rows = useMemo(() => {
        const rowMap: Record<string, ParkingSlot[]> = {};
        slots.forEach(s => {
            const row = s.position?.row ?? s.slotCode[0] ?? 'A';
            if (!rowMap[row]) rowMap[row] = [];
            rowMap[row].push(s);
        });
        // Sort rows alphabetically, sort slots within row by column
        const sorted: { row: string; slots: ParkingSlot[] }[] = Object.entries(rowMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([row, s]) => ({
                row,
                slots: [...s].sort((a, b) => (a.position?.column ?? 0) - (b.position?.column ?? 0)),
            }));
        return sorted;
    }, [slots]);

    const maxCols = useMemo(() => Math.max(...rows.map(r => r.slots.length), 0), [rows]);
    const midCol = Math.ceil(maxCols / 2);

    const statusStyle = (slot: ParkingSlot, isSel: boolean) => {
        if (isSel) return { bg: '#2563eb', border: '#1d4ed8', color: '#fff', cursor: 'pointer' };
        switch (slot.status) {
            case 'available':   return { bg: '#fff',    border: '#cbd5e1', color: '#475569', cursor: 'pointer' };
            case 'occupied':    return { bg: '#fef2f2', border: '#fca5a5', color: '#dc2626', cursor: 'not-allowed' };
            case 'reserved':    return { bg: '#fff7ed', border: '#fed7aa', color: '#c2410c', cursor: 'not-allowed' };
            case 'maintenance': return { bg: '#fefce8', border: '#fde68a', color: '#92400e', cursor: 'not-allowed' };
            case 'locked':      return { bg: '#f1f5f9', border: '#e2e8f0', color: '#94a3b8', cursor: 'not-allowed' };
            default:            return { bg: '#fff',    border: '#cbd5e1', color: '#475569', cursor: 'pointer' };
        }
    };

    const statusIcon = (status: string, isSel: boolean) => {
        if (isSel) return '✓';
        if (status === 'occupied')    return '🚗';
        if (status === 'reserved')    return '📅';
        if (status === 'maintenance') return '🔧';
        if (status === 'locked')      return '🔒';
        return '';
    };

    if (rows.length === 0) return (
        <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🅿️</div>
            Không có ô đỗ nào trong khu này
        </div>
    );

    return (
        <div style={{ overflowX: 'auto', padding: '0 4px' }}>
            <div style={{ display: 'flex', gap: 10, minWidth: 'max-content' }}>
                {/* Row label column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 28, flexShrink: 0 }}>
                    {rows.map(({ row }) => (
                        <div key={row} style={{
                            width: 26, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 800, color: '#64748b', letterSpacing: '-0.5px'
                        }}>{row}</div>
                    ))}
                </div>

                {/* Slot columns — split by aisle */}
                {[
                    Array.from({ length: midCol }, (_, i) => i),
                    Array.from({ length: maxCols - midCol }, (_, i) => i + midCol),
                ].map((colIdxGroup, gi) => (
                    <div key={gi}>
                        {/* Column headers */}
                        <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                            {colIdxGroup.map(ci => (
                                <div key={ci} style={{
                                    width: 32, fontSize: 9, textAlign: 'center',
                                    color: '#94a3b8', fontWeight: 700
                                }}>
                                    {String(ci + 1).padStart(2, '0')}
                                </div>
                            ))}
                        </div>
                        {/* Rows */}
                        {rows.map(({ row, slots: rowSlots }) => (
                            <div key={row} style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                                {colIdxGroup.map(ci => {
                                    const slot = rowSlots[ci];
                                    if (!slot) return <div key={ci} style={{ width: 32 }} />;
                                    const isSel = selectedSlotId === slot._id;
                                    const isAvail = slot.status === 'available';
                                    const st = statusStyle(slot, isSel);
                                    const icon = statusIcon(slot.status, isSel);
                                    return (
                                        <button
                                            key={slot._id}
                                            disabled={!isAvail && !isSel}
                                            onClick={() => isAvail && onSelect(slot)}
                                            title={`${slot.slotCode}${slot.status !== 'available' ? ` — ${slot.status}` : ''}`}
                                            style={{
                                                width: 32, height: 30,
                                                border: `1.5px solid ${st.border}`,
                                                borderRadius: 5,
                                                background: st.bg,
                                                color: st.color,
                                                fontSize: icon && !isSel ? 11 : 7,
                                                fontWeight: 700,
                                                cursor: st.cursor,
                                                padding: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.15s',
                                                flexShrink: 0,
                                                boxShadow: isSel ? '0 0 0 2px rgba(37,99,235,0.3)' : 'none',
                                                transform: isSel ? 'scale(1.08)' : 'scale(1)',
                                                position: 'relative',
                                            }}
                                        >
                                            {icon || (
                                                <span style={{ fontSize: 7, lineHeight: 1, textAlign: 'center', display: 'block' }}>
                                                    {slot.slotCode}
                                                </span>
                                            )}
                                            {/* EV badge */}
                                            {slot.features?.hasEVCharger && !isSel && isAvail && (
                                                <span style={{
                                                    position: 'absolute', top: -4, right: -4,
                                                    fontSize: 7, background: '#10b981', color: '#fff',
                                                    borderRadius: 3, padding: '0 2px', lineHeight: '12px'
                                                }}>⚡</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                ))}

                {/* Aisle divider label */}
                <div style={{ display: 'flex', alignItems: 'center', paddingTop: 28 }}>
                    <div style={{
                        writingMode: 'vertical-rl', fontSize: 9, color: '#94a3b8',
                        fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
                        padding: '8px 4px', background: '#f8fafc',
                        borderRadius: 4, border: '1px dashed #e2e8f0'
                    }}>Lối đi</div>
                </div>
            </div>
        </div>
    );
};

// ─── Legend Item ─────────────────────────────────────────────────────────────
const LegendItem = ({ color, border, label }: { color: string; border?: string; label: string }) => (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#64748b' }}>
        <span style={{
            width: 14, height: 14, borderRadius: 3, background: color,
            border: `1.5px solid ${border || color}`, flexShrink: 0
        }} />
        {label}
    </span>
);

// ─── Main Page ───────────────────────────────────────────────────────────────
const BookingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const parkingSpot = location.state?.spot || { title: 'Bitexco Financial Tower Parking', price: 50000 };

    const [vehicleType, setVehicleType] = useState<string | null>(null);
    const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
    const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 16));
    const [duration, setDuration] = useState(2);

    // Floors
    const [floors, setFloors] = useState<Floor[]>([]);
    const [floorsLoading, setFloorsLoading] = useState(false);
    const [floorsError, setFloorsError] = useState<string | null>(null);

    // Zones
    const [zones, setZones] = useState<Zone[]>([]);
    const [zonesLoading, setZonesLoading] = useState(false);
    const [zonesError, setZonesError] = useState<string | null>(null);

    // Parking Slots (floor map)
    const [floorSlots, setFloorSlots] = useState<ParkingSlot[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [slotsError, setSlotsError] = useState<string | null>(null);

    // Fetch floors
    useEffect(() => {
        const fetch = async () => {
            setFloorsLoading(true); setFloorsError(null);
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

    // Fetch zones khi chọn floor
    useEffect(() => {
        if (!selectedFloor) { setZones([]); setSelectedZone(null); setFloorSlots([]); setSelectedSlot(null); return; }
        const fetch = async () => {
            setZonesLoading(true); setZonesError(null);
            setSelectedZone(null); setSelectedSlot(null); setFloorSlots([]);
            try {
                const params: any = { floor: selectedFloor._id };
                if (parkingSpot._id) params.parkingLot = parkingSpot._id;
                const data = await zoneService.getZones(params);
                const list: Zone[] = Array.isArray(data) ? data : (data as any)?.data ?? [];
                setZones(list.filter(z => !z.isDeleted && z.status === 'active'));
            } catch (err: any) {
                setZonesError(err?.message || 'Không thể tải dữ liệu khu đỗ.');
            } finally {
                setZonesLoading(false);
            }
        };
        fetch();
    }, [selectedFloor]);

    // Fetch floor slot map khi chọn floor (để chuẩn bị slot map cho step 5)
    useEffect(() => {
        if (!selectedFloor) return;
        const fetch = async () => {
            setSlotsLoading(true); setSlotsError(null);
            try {
                const data = await parkingSlotService.getFloorMap(selectedFloor._id);
                const list: ParkingSlot[] = Array.isArray(data) ? data : (data as any)?.data ?? [];
                setFloorSlots(list.filter(s => !s.isDeleted));
            } catch (err: any) {
                setSlotsError(err?.message || 'Không thể tải bản đồ ô đỗ.');
            } finally {
                setSlotsLoading(false);
            }
        };
        fetch();
    }, [selectedFloor]);

    // Reset zone/slot khi đổi vehicle
    useEffect(() => {
        setSelectedFloor(null); setSelectedZone(null);
        setFloorSlots([]); setSelectedSlot(null); setZones([]);
    }, [vehicleType]);

    // Reset slot khi đổi zone
    useEffect(() => {
        setSelectedSlot(null);
    }, [selectedZone]);

    // Slots filtered by selected zone
    const zoneSlots = useMemo(() => {
        if (!selectedZone) return [];
        return floorSlots.filter(s => getZoneId(s.zone) === selectedZone._id);
    }, [floorSlots, selectedZone]);

    const availableZoneSlots = zoneSlots.filter(s => s.status === 'available').length;

    const exitTime = new Date(new Date(entryDate).getTime() + duration * 3600000);
    const stepsDone = [!!vehicleType, true, !!selectedFloor, !!selectedZone, !!selectedSlot].filter(Boolean).length;

    const handleReserve = () => {
        if (!vehicleType || !selectedFloor || !selectedZone || !selectedSlot) return;
        navigate('/session', {
            state: {
                spot: parkingSpot,
                vehicleType,
                floor: selectedFloor,
                zone: selectedZone,
                slot: selectedSlot,
                entryDate,
                duration,
            }
        });
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
                    padding-bottom: 90px;
                }
                .bk-header {
                    background: #fff;
                    border-bottom: 1px solid #e2e8f0;
                    padding: 18px 32px;
                    display: flex;
                    align-items: baseline;
                    justify-content: space-between;
                }
                .bk-header h1 { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.4px; }
                .bk-header-sub { font-size: 13px; color: #64748b; font-weight: 500; }

                .bk-body { max-width: 1140px; margin: 0 auto; padding: 24px 20px 0; }

                /* Top grid */
                .bk-top {
                    display: grid;
                    grid-template-columns: 210px 1fr 1.6fr;
                    grid-template-rows: auto auto auto;
                    grid-template-areas:
                        "veh  time  floor"
                        "zone zone  floor"
                        "map  map   map  ";
                    gap: 12px;
                    margin-bottom: 12px;
                    align-items: start;
                }
                .bk-area-veh   { grid-area: veh; }
                .bk-area-time  { grid-area: time; }
                .bk-area-floor { grid-area: floor; align-self: stretch; }
                .bk-area-zone  { grid-area: zone; }
                .bk-area-map   { grid-area: map; }
                @media (max-width: 900px) {
                    .bk-top {
                        grid-template-columns: 1fr;
                        grid-template-areas: "veh" "time" "floor" "zone" "map";
                    }
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
                    display: flex; align-items: center; gap: 10px;
                    margin-bottom: 16px; font-size: 13px; font-weight: 700; color: #374151;
                }
                .bk-step-badge {
                    width: 22px; height: 22px; border-radius: 50%;
                    background: #e2e8f0; display: flex; align-items: center;
                    justify-content: center; font-size: 11px; font-weight: 800; color: #64748b; flex-shrink: 0;
                }
                .bk-step-badge.active { background: #2563eb; color: #fff; }
                .bk-step-badge.done   { background: #10b981; color: #fff; }

                /* Vehicle */
                .bk-vehicle-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                .bk-vehicle-btn {
                    border: 1.5px solid #e2e8f0; border-radius: 10px; background: #f8fafc;
                    padding: 14px 10px; display: flex; flex-direction: column; align-items: center;
                    gap: 8px; cursor: pointer; transition: all 0.2s; position: relative;
                }
                .bk-vehicle-btn:hover { border-color: #93c5fd; background: #eff6ff; }
                .bk-vehicle-btn.sel { border-color: #2563eb; background: #eff6ff; }
                .bk-vehicle-btn svg { color: #475569; }
                .bk-vehicle-btn.sel svg { color: #2563eb; }
                .bk-vehicle-label { font-size: 12px; font-weight: 600; color: #374151; }
                .bk-vehicle-btn.sel .bk-vehicle-label { color: #1d4ed8; }
                .bk-vehicle-check {
                    position: absolute; top: 7px; right: 7px;
                    width: 18px; height: 18px; background: #2563eb; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center; color: #fff; font-size: 10px;
                }

                /* Time */
                .bk-time-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
                .bk-field label { display: block; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 5px; }
                .bk-field input, .bk-field select {
                    width: 100%; padding: 9px 11px; border: 1.5px solid #e2e8f0; border-radius: 8px;
                    font-size: 13px; font-weight: 600; color: #1e293b; background: #f8fafc; outline: none; transition: border-color 0.2s;
                }
                .bk-field input:focus, .bk-field select:focus { border-color: #2563eb; background: #fff; }
                .bk-exit-info {
                    display: flex; align-items: center; gap: 8px; background: #eff6ff;
                    border: 1px solid #bfdbfe; border-radius: 8px; padding: 9px 13px;
                    font-size: 12px; font-weight: 600; color: #1d4ed8;
                }

                /* Floor */
                .bk-floor-inner { display: flex; gap: 14px; align-items: flex-start; }
                .bk-floor-list { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
                .bk-floor-item {
                    display: flex; align-items: center; gap: 8px; padding: 8px 12px;
                    border: 1.5px solid #e2e8f0; border-radius: 8px; cursor: pointer;
                    transition: all 0.18s; background: #fff; font-size: 12px; font-weight: 600; color: #374151;
                }
                .bk-floor-item:hover { border-color: #93c5fd; background: #eff6ff; }
                .bk-floor-item.sel { border-color: #2563eb; background: #eff6ff; color: #1d4ed8; }
                .bk-floor-slots {
                    margin-left: auto; background: #10b981; color: #fff;
                    font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px; white-space: nowrap;
                }
                .bk-floor-check { color: #2563eb; font-size: 13px; font-weight: 800; margin-left: 2px; }

                /* Zone card */
                .bk-zone-card {
                    background: #fff; border-radius: 14px; border: 1px solid #e2e8f0;
                    padding: 18px 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); margin-bottom: 0;
                }
                .bk-zone-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
                .bk-zone-stat { font-size: 11px; font-weight: 600; color: #64748b; background: #f1f5f9; padding: 4px 10px; border-radius: 20px; }
                .bk-zone-stat span { color: #10b981; font-weight: 800; }
                .zone-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px; }
                .zone-card {
                    border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 12px 14px;
                    background: #fff; transition: all 0.2s; position: relative; overflow: hidden;
                }
                .zone-card:hover:not(.full) { border-color: #93c5fd; background: #f8fbff; box-shadow: 0 4px 12px rgba(37,99,235,0.1); transform: translateY(-1px); }
                .zone-card.sel { border-color: #2563eb; background: #eff6ff; box-shadow: 0 4px 16px rgba(37,99,235,0.18); }
                .zone-card.full { background: #f9fafb; opacity: 0.65; }
                .zone-card-top { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
                .zone-badge {
                    width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center;
                    justify-content: center; font-size: 11px; font-weight: 800; flex-shrink: 0;
                }
                .zone-info { flex: 1; min-width: 0; }
                .zone-name { font-size: 13px; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .zone-card.sel .zone-name { color: #1d4ed8; }
                .zone-vehicle { font-size: 10px; color: #64748b; margin-top: 2px; font-weight: 500; }
                .zone-check { width: 20px; height: 20px; background: #2563eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 800; flex-shrink: 0; }
                .zone-full-badge { background: #fee2e2; color: #dc2626; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px; flex-shrink: 0; }
                .zone-slot-info { display: flex; flex-direction: column; gap: 4px; }
                .zone-slot-bar-bg { height: 5px; border-radius: 5px; background: #f1f5f9; overflow: hidden; }
                .zone-slot-bar-fill { height: 100%; border-radius: 5px; transition: width 0.4s ease; }
                .zone-slot-text { font-size: 11px; display: flex; gap: 3px; }

                /* Slot map card (Step 5) */
                .bk-map-card {
                    background: #fff; border-radius: 14px; border: 1px solid #e2e8f0;
                    padding: 18px 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
                }
                .bk-map-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 10px; }
                .bk-map-legend { display: flex; gap: 14px; flex-wrap: wrap; }
                .bk-map-stat {
                    font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px;
                    background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0;
                }
                .bk-map-stat.warn { background: #fff7ed; color: #c2410c; border-color: #fed7aa; }

                /* Loading / error */
                .bk-loading { display: flex; align-items: center; justify-content: center; padding: 28px; gap: 10px; color: #64748b; font-size: 12px; font-weight: 600; }
                .bk-spinner { width: 20px; height: 20px; border: 2.5px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: bk-spin 0.7s linear infinite; }
                @keyframes bk-spin { to { transform: rotate(360deg); } }
                .bk-error { text-align: center; padding: 20px; color: #ef4444; font-size: 12px; font-weight: 600; }
                .bk-retry { margin-top: 8px; background: none; border: 1.5px solid #ef4444; border-radius: 6px; padding: 5px 14px; color: #ef4444; font-weight: 700; cursor: pointer; font-size: 12px; }

                /* Footer */
                .bk-footer {
                    position: fixed; bottom: 0; left: 0; right: 0; background: #fff;
                    border-top: 1px solid #e2e8f0; padding: 14px 32px; display: flex;
                    align-items: center; gap: 20px; z-index: 100; box-shadow: 0 -4px 16px rgba(0,0,0,0.06);
                }
                .bk-footer-steps { display: flex; flex-direction: column; gap: 4px; min-width: 200px; }
                .bk-footer-label { font-size: 12px; font-weight: 700; color: #1e293b; }
                .bk-footer-bar { height: 4px; border-radius: 4px; background: #e2e8f0; overflow: hidden; width: 180px; }
                .bk-footer-bar-fill { height: 100%; border-radius: 4px; background: #2563eb; transition: width 0.4s ease; }
                .bk-footer-summary { flex: 1; font-size: 13px; font-weight: 600; color: #475569; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
                .bk-footer-bullet { color: #94a3b8; }
                .bk-confirm-btn { padding: 13px 32px; border: none; border-radius: 10px; font-size: 14px; font-weight: 800; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
                .bk-confirm-btn.ready { background: #2563eb; color: #fff; box-shadow: 0 4px 14px rgba(37,99,235,0.35); }
                .bk-confirm-btn.ready:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.45); }
                .bk-confirm-btn.disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }

                @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .fade-up { animation: fadeUp 0.3s ease-out forwards; }

                /* Slot map detail panel */
                .slot-detail {
                    display: flex; align-items: center; gap: 10px;
                    background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px;
                    padding: 10px 14px; margin-top: 14px; flex-wrap: wrap;
                }
                .slot-detail-code { font-size: 18px; font-weight: 900; color: #1d4ed8; letter-spacing: -0.5px; }
                .slot-detail-info { font-size: 11px; color: #3b82f6; font-weight: 600; }
                .slot-feature-badge {
                    display: inline-flex; align-items: center; gap: 3px;
                    font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px;
                    background: #e0f2fe; color: #0369a1;
                }
            `}</style>

            <div className="bk-page">
                <Header />

                <div className="bk-header">
                    <h1>Đặt Chỗ Gửi Xe Thông Minh</h1>
                    <span className="bk-header-sub">{parkingSpot.title}</span>
                </div>

                <div className="bk-body">
                    <div className="bk-top">

                        {/* ── STEP 1: Vehicle ── */}
                        <div className="bk-card bk-area-veh">
                            <div className="bk-card-title">
                                <span className={`bk-step-badge ${vehicleType ? 'done' : 'active'}`}>{vehicleType ? '✓' : '1'}</span>
                                Chọn Loại Phương Tiện
                            </div>
                            <div className="bk-vehicle-row">
                                <button className={`bk-vehicle-btn ${vehicleType === 'motorcycle' ? 'sel' : ''}`} onClick={() => setVehicleType('motorcycle')}>
                                    {vehicleType === 'motorcycle' && <span className="bk-vehicle-check">✓</span>}
                                    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="40" height="40">
                                        <circle cx="9" cy="34" r="6" /><circle cx="39" cy="34" r="6" />
                                        <path d="M15 34h18M24 16l4.5 10.5H16l3-6H24" /><path d="M28.5 16H35l4.5 7.5" /><circle cx="36" cy="14.5" r="2.5" />
                                    </svg>
                                    <span className="bk-vehicle-label">Xe máy</span>
                                </button>
                                <button className={`bk-vehicle-btn ${vehicleType === 'car' ? 'sel' : ''}`} onClick={() => setVehicleType('car')}>
                                    {vehicleType === 'car' && <span className="bk-vehicle-check">✓</span>}
                                    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="40" height="40">
                                        <rect x="4" y="22" width="40" height="14" rx="3" /><path d="M10 22l4.5-9h19L37 22" />
                                        <circle cx="13" cy="36" r="4" /><circle cx="35" cy="36" r="4" />
                                        <rect x="18" y="14" width="12" height="8" rx="1.5" /><path d="M4 28h3M41 28h3" />
                                    </svg>
                                    <span className="bk-vehicle-label">Ô tô</span>
                                </button>
                            </div>
                        </div>

                        {/* ── STEP 2: Time ── */}
                        <div className="bk-card bk-area-time">
                            <div className="bk-card-title">
                                <span className={`bk-step-badge ${entryDate && duration ? 'done' : 'active'}`}>{entryDate && duration ? '✓' : '2'}</span>
                                Thời Gian Vào &amp; Thời Lượng
                            </div>
                            <div className="bk-time-grid">
                                <div className="bk-field">
                                    <label>Ngày &amp; Giờ Vào</label>
                                    <input type="datetime-local" value={entryDate} onChange={e => setEntryDate(e.target.value)} />
                                </div>
                                <div className="bk-field">
                                    <label>Thời Lượng</label>
                                    <select value={duration} onChange={e => setDuration(Number(e.target.value))}>
                                        {[1, 2, 3, 4, 5, 6, 8, 10, 12, 24].map(h => <option key={h} value={h}>{h} giờ</option>)}
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
                        <div className="bk-card bk-area-floor">
                            <div className="bk-card-title">
                                <span className={`bk-step-badge ${selectedFloor ? 'done' : vehicleType ? 'active' : ''}`}>{selectedFloor ? '✓' : '3'}</span>
                                Chọn Tầng
                            </div>
                            {floorsLoading ? (
                                <div className="bk-loading"><div className="bk-spinner" /> Đang tải...</div>
                            ) : floorsError ? (
                                <div className="bk-error">⚠️ {floorsError}<br /><button className="bk-retry" onClick={() => window.location.reload()}>Thử lại</button></div>
                            ) : !vehicleType ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', textAlign: 'center', color: '#64748b', minHeight: 200 }}>
                                    <div style={{ fontSize: 32, marginBottom: 8 }}>🏢</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Vui lòng chọn phương tiện</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8', maxWidth: 220, lineHeight: 1.4 }}>Chọn loại phương tiện ở Bước 1 để hiển thị danh sách tầng.</div>
                                </div>
                            ) : (
                                <div className="bk-floor-inner">
                                    <div style={{ flexShrink: 0 }}>
                                        <IsoBuilding floors={floors} selectedFloor={selectedFloor} onSelect={f => setSelectedFloor(f)} />
                                    </div>
                                    <div className="bk-floor-list">
                                        {floors.length === 0 ? (
                                            <div style={{ color: '#94a3b8', fontSize: 12 }}>Không có tầng</div>
                                        ) : floors.map(f => {
                                            const isSel = selectedFloor?._id === f._id;
                                            return (
                                                <div key={f._id} className={`bk-floor-item ${isSel ? 'sel' : ''}`} onClick={() => setSelectedFloor(f)}>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: 12, fontWeight: 700 }}>{f.name || `Tầng ${f.floorNumber}`}</div>
                                                        <div style={{ fontSize: 9.5, color: isSel ? '#2563eb' : '#64748b', fontWeight: 500 }}>
                                                            {f.vehicleType === 'motorcycle' ? '🏍️ Xe máy' : f.vehicleType === 'car' ? '🚗 Ô tô' : '🚗🏍️ Cả hai'}
                                                        </div>
                                                    </div>
                                                    {isSel && <span className="bk-floor-check">✓</span>}
                                                    <span className="bk-floor-slots">{f.availableSlots ?? f.totalSlots ?? '?'} chỗ</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── STEP 4: Zone ── */}
                        <div className="bk-area-zone">
                            {selectedFloor ? (
                                <div className="bk-zone-card fade-up">
                                    <div className="bk-zone-header">
                                        <div className="bk-card-title" style={{ marginBottom: 0 }}>
                                            <span className={`bk-step-badge ${selectedZone ? 'done' : 'active'}`}>{selectedZone ? '✓' : '4'}</span>
                                            Chọn Khu Đỗ ({selectedFloor.name || `Tầng ${selectedFloor.floorNumber}`})
                                        </div>
                                        {!zonesLoading && zones.length > 0 && (
                                            <div className="bk-zone-stat">
                                                <span>{zones.filter(z => z.availableSlots > 0).length}</span>/{zones.length} khu còn chỗ
                                            </div>
                                        )}
                                    </div>
                                    {zonesLoading ? (
                                        <div className="bk-loading"><div className="bk-spinner" /> Đang tải khu đỗ...</div>
                                    ) : zonesError ? (
                                        <div className="bk-error">⚠️ {zonesError}<br />
                                            <button className="bk-retry" onClick={() => setSelectedFloor({ ...selectedFloor })}>Thử lại</button>
                                        </div>
                                    ) : zones.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '24px 20px', color: '#94a3b8' }}>
                                            <div style={{ fontSize: 30, marginBottom: 8 }}>🏢</div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Không có khu đỗ nào</div>
                                        </div>
                                    ) : (
                                        <div className="zone-grid">
                                            {zones.map(zone => (
                                                <ZoneCard key={zone._id} zone={zone} selected={selectedZone?._id === zone._id} onSelect={setSelectedZone} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bk-zone-card" style={{ opacity: 0.45, textAlign: 'center', padding: '28px', color: '#94a3b8' }}>
                                    <div style={{ fontSize: 28, marginBottom: 8 }}>🏢</div>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>Chọn tầng để xem khu đỗ</div>
                                </div>
                            )}
                        </div>

                        {/* ── STEP 5: Slot Map ── */}
                        <div className="bk-area-map">
                            {selectedZone ? (
                                <div className="bk-map-card fade-up">
                                    <div className="bk-map-header">
                                        <div className="bk-card-title" style={{ marginBottom: 0 }}>
                                            <span className={`bk-step-badge ${selectedSlot ? 'done' : 'active'}`}>{selectedSlot ? '✓' : '5'}</span>
                                            Chọn Ô Đỗ — {selectedZone.name} ({selectedZone.code})
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                            {!slotsLoading && (
                                                <div className={`bk-map-stat ${availableZoneSlots <= 5 ? 'warn' : ''}`}>
                                                    {availableZoneSlots} ô trống / {zoneSlots.length} tổng
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Legend */}
                                    <div className="bk-map-legend" style={{ marginBottom: 14 }}>
                                        <LegendItem color="#fff" border="#cbd5e1" label="Trống" />
                                        <LegendItem color="#2563eb" border="#2563eb" label="Đang chọn" />
                                        <LegendItem color="#fef2f2" border="#fca5a5" label="Đang đỗ" />
                                        <LegendItem color="#fff7ed" border="#fed7aa" label="Đã đặt" />
                                        <LegendItem color="#fefce8" border="#fde68a" label="Bảo trì" />
                                        <LegendItem color="#f1f5f9" border="#e2e8f0" label="Khoá" />
                                    </div>

                                    {slotsLoading ? (
                                        <div className="bk-loading"><div className="bk-spinner" /> Đang tải bản đồ ô đỗ...</div>
                                    ) : slotsError ? (
                                        <div className="bk-error">⚠️ {slotsError}<br />
                                            <button className="bk-retry" onClick={() => setSelectedFloor({ ...selectedFloor! })}>Thử lại</button>
                                        </div>
                                    ) : (
                                        <>
                                            <SlotMapGrid
                                                slots={zoneSlots}
                                                selectedSlotId={selectedSlot?._id ?? null}
                                                onSelect={s => setSelectedSlot(prev => prev?._id === s._id ? null : s)}
                                            />

                                            {/* Selected slot detail panel */}
                                            {selectedSlot && (
                                                <div className="slot-detail fade-up">
                                                    <div className="slot-detail-code">{selectedSlot.slotCode}</div>
                                                    <div className="slot-detail-info">
                                                        <div>Hàng {selectedSlot.position?.row ?? '?'} · Cột {selectedSlot.position?.column ?? '?'}</div>
                                                        <div style={{ color: '#10b981' }}>✓ Sẵn sàng đặt</div>
                                                    </div>
                                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                        {selectedSlot.features?.hasEVCharger && <span className="slot-feature-badge">⚡ EV</span>}
                                                        {selectedSlot.features?.isVIP && <span className="slot-feature-badge">⭐ VIP</span>}
                                                        {selectedSlot.features?.isHandicapped && <span className="slot-feature-badge">♿ Khuyết tật</span>}
                                                        {selectedSlot.features?.hasCCTV && <span className="slot-feature-badge">📷 CCTV</span>}
                                                        {getVehicleTypeName(selectedSlot.vehicleType) && (
                                                            <span className="slot-feature-badge">🚗 {getVehicleTypeName(selectedSlot.vehicleType)}</span>
                                                        )}
                                                    </div>
                                                    <button
                                                        style={{ marginLeft: 8, background: 'none', border: '1.5px solid #bfdbfe', borderRadius: 7, padding: '4px 10px', color: '#3b82f6', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                                        onClick={() => setSelectedSlot(null)}
                                                    >Bỏ chọn</button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="bk-map-card" style={{ opacity: 0.45, textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                                    <div style={{ fontSize: 36, marginBottom: 10 }}>🅿️</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Chọn khu đỗ để xem bản đồ ô đỗ</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Bản đồ hiển thị trạng thái realtime từng ô đỗ</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── FOOTER ── */}
                <div className="bk-footer">
                    <div className="bk-footer-steps">
                        <div className="bk-footer-label">
                            Bước {Math.min(stepsDone + 1, 5)}/5 —{' '}
                            {!vehicleType ? 'Chọn loại phương tiện'
                                : !selectedFloor ? 'Chọn tầng đỗ xe'
                                    : !selectedZone ? 'Chọn khu đỗ'
                                        : !selectedSlot ? 'Chọn ô đỗ cụ thể'
                                            : 'Hoàn tất — Sẵn sàng đặt chỗ 🎉'}
                        </div>
                        <div className="bk-footer-bar">
                            <div className="bk-footer-bar-fill" style={{ width: `${(stepsDone / 5) * 100}%` }} />
                        </div>
                    </div>

                    <div className="bk-footer-summary">
                        {vehicleType && <>{vehicleType === 'car' ? '🚗 Ô tô' : '🏍️ Xe máy'}</>}
                        {selectedFloor && <><span className="bk-footer-bullet">•</span>{selectedFloor.name || `Tầng ${selectedFloor.floorNumber}`}</>}
                        {selectedZone && <><span className="bk-footer-bullet">•</span>{selectedZone.name}</>}
                        {selectedSlot && <><span className="bk-footer-bullet">•</span><strong style={{ color: '#2563eb' }}>Ô {selectedSlot.slotCode}</strong></>}
                        {duration && <><span className="bk-footer-bullet">•</span>{duration} giờ</>}
                    </div>

                    <button
                        id="confirm-booking-btn"
                        className={`bk-confirm-btn ${vehicleType && selectedFloor && selectedZone && selectedSlot ? 'ready' : 'disabled'}`}
                        onClick={handleReserve}
                        disabled={!vehicleType || !selectedFloor || !selectedZone || !selectedSlot}
                    >
                        Xác nhận đặt chỗ
                    </button>
                </div>
            </div>
        </>
    );
};

export default BookingPage;
