import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header/Header';
import floorService, { Floor } from '../../services/api/floorService';
import zoneService, { Zone } from '../../services/api/zoneService';
import parkingSlotService, { ParkingSlot } from '../../services/api/parkingSlotService';
import vehicleTypeService, { VehicleType } from '../../services/api/vehicleTypeService';

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
    const face = (f: Floor) => selectedFloor?._id === f._id ? '#0f172a' : '#ffffff';
    const side = (f: Floor) => selectedFloor?._id === f._id ? '#334155' : '#f8fafc';
    const top  = (f: Floor) => selectedFloor?._id === f._id ? '#e2e8f0' : '#ffffff';
    const strokeColor = (f: Floor) => selectedFloor?._id === f._id ? '#0f172a' : '#94a3b8';
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
                        <polygon points={topPts} fill={top(f)} stroke={strokeColor(f)} strokeWidth="1" />
                        <polygon points={frontPts} fill={face(f)} stroke={strokeColor(f)} strokeWidth="1" />
                        <polygon points={sidePts} fill={side(f)} stroke={strokeColor(f)} strokeWidth="1" />
                        {[0, 1, 2].map(w => (
                            <rect key={w} x={startX + 18 + w * 52} y={baseY + D + 12} width={32} height={18} rx="2"
                                fill={sel ? 'rgba(255,255,255,0.15)' : 'rgba(241,245,249,0.8)'}
                                stroke={sel ? 'rgba(255,255,255,0.35)' : '#cbd5e1'} strokeWidth="0.8" />
                        ))}
                        <text x={startX + W / 2} y={baseY + D + H / 2 + 5} textAnchor="middle" fontSize="11" fontWeight="700" fill={sel ? '#ffffff' : '#475569'}>
                            {f.name || `Tầng ${f.floorNumber}`}
                        </text>
                        {sel && <text x={startX + W - 12} y={baseY + D + H / 2 + 5} textAnchor="middle" fontSize="13" fill="#ffffff">✓</text>}
                    </g>
                );
            })}
            <ellipse cx={startX + W / 2 + D / 2} cy={startY + sorted.length * (H + gap) + D + 10} rx={W / 2 + 16} ry="8" fill="rgba(0,0,0,0.05)" />
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
    const barColor = isFull ? '#ef4444' : isLow ? '#f59e0b' : '#0f172a';
    
    const VehicleIcons = () => {
        const t = zone.allowedVehicleTypes || [];
        const isCar = t.includes('car');
        const isMotor = t.includes('motorcycle');
        
        return (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', color: '#64748b', marginTop: 2 }}>
                {isCar && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                        <rect x="2" y="10" width="20" height="8" rx="2" />
                        <path d="M6 10l2-5h8l2 5" />
                        <circle cx="6" cy="18" r="1.5" />
                        <circle cx="18" cy="18" r="1.5" />
                    </svg>
                )}
                {isMotor && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                        <circle cx="5" cy="16" r="2.5" />
                        <circle cx="19" cy="16" r="2.5" />
                        <path d="M12 8l2 4h5" />
                        <path d="M8 16h6l2-6H9l-1 2" />
                    </svg>
                )}
                <span style={{ fontSize: 10, color: '#64748b', fontWeight: 500, marginLeft: 2 }}>
                    {isCar && isMotor ? 'Cả hai' : isCar ? 'Ô tô' : isMotor ? 'Xe máy' : 'Cả hai'}
                </span>
            </div>
        );
    };

    return (
        <div className={`zone-card ${selected ? 'sel' : ''} ${isFull ? 'full' : ''}`}
            onClick={() => !isFull && onSelect(zone)} style={{ cursor: isFull ? 'not-allowed' : 'pointer' }}>
            <div className="zone-card-top">
                <div className="zone-badge" style={{ background: selected ? '#0f172a' : '#f1f5f9', color: selected ? '#fff' : '#475569' }}>
                    {zone.code}
                </div>
                <div className="zone-info">
                    <div className="zone-name">{zone.name}</div>
                    <div className="zone-vehicle"><VehicleIcons /></div>
                </div>
                {selected && <div className="zone-check" style={{ background: '#0f172a' }}>✓</div>}
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

// ─── Legend Item ─────────────────────────────────────────────────────────────
const LegendItem = ({ color, border, label, icon }: { color: string; border?: string; label: string; icon?: React.ReactNode }) => (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#e2e8f0' }}>
        <span style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            background: color,
            border: `1.5px solid ${border || color}`,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {icon}
        </span>
        {label}
    </span>
);

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

    if (rows.length === 0) return (
        <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🅿️</div>
            Không có ô đỗ nào trong khu này
        </div>
    );

    return (
        <div style={{
            background: 'radial-gradient(circle at center, #1b202d 0%, #0d121c 100%)', // Dark realistic asphalt
            borderRadius: 16,
            border: '1px solid #1f2937',
            padding: '24px',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
            overflowX: 'auto',
            position: 'relative',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)'
        }}>
            {/* Glassmorphic Floating Legend Card */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '16px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                alignSelf: 'flex-start',
                minWidth: 'max-content'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px' }}>Tối Ưu Hoá Vị Trí Bởi AI &amp; ANPR</span>
                    <span style={{ fontSize: 9, background: '#2563eb', color: '#fff', padding: '2px 5px', borderRadius: 4, fontWeight: 900 }}>AI</span>
                </div>
                
                <div style={{ display: 'flex', gap: '12px 16px', flexWrap: 'wrap' }}>
                    <LegendItem color="rgba(16, 185, 129, 0.05)" border="#10b981" label="Trống" />
                    <LegendItem color="#2563eb" border="#2563eb" label="Đang chọn" icon={<span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>✓</span>} />
                    <LegendItem color="rgba(239, 68, 68, 0.05)" border="#ef4444" label="Đang đỗ" icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                            <rect x="2" y="10" width="20" height="8" rx="2" />
                            <path d="M6 10l2-5h8l2 5" />
                            <circle cx="6" cy="18" r="1.5" />
                            <circle cx="18" cy="18" r="1.5" />
                        </svg>
                    } />
                    <LegendItem color="rgba(234, 179, 8, 0.05)" border="#eab308" label="Đã đặt" icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    } />
                    <LegendItem color="rgba(202, 138, 4, 0.05)" border="#ca8a04" label="Bảo trì" icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                        </svg>
                    } />
                    <LegendItem color="rgba(100, 116, 139, 0.05)" border="#64748b" label="Khoá" icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    } />
                </div>
            </div>

            {/* Parking Layout Rows */}
            {rows.map(({ row, slots: rowSlots }) => {
                // Chunk rowSlots into pairs of top/bottom rows (max 10 slots each)
                const slotRows: ParkingSlot[][] = [];
                for (let i = 0; i < rowSlots.length; i += 10) {
                    slotRows.push(rowSlots.slice(i, i + 10));
                }

                // Group slotRows into pairs
                const pairs: { top: ParkingSlot[]; bottom?: ParkingSlot[] }[] = [];
                for (let i = 0; i < slotRows.length; i += 2) {
                    pairs.push({
                        top: slotRows[i],
                        bottom: slotRows[i + 1]
                    });
                }

                return (
                    <div key={row} style={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: '700px' }}>
                        {/* Row Header */}
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12, paddingLeft: 8 }}>
                            HÀNG {row}
                        </div>

                        {pairs.map((pair, pIdx) => (
                            <div key={pIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', margin: '12px 0' }}>
                                {/* Top slots (face down) */}
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'flex-end', width: '100%' }}>
                                    {/* Real Slots */}
                                    {pair.top.map(slot => {
                                        const isSel = selectedSlotId === slot._id;
                                        const isAvail = slot.status === 'available';
                                        const isOccupied = slot.status === 'occupied';
                                        const isReserved = slot.status === 'reserved';
                                        const isMaint = slot.status === 'maintenance';
                                        const isLocked = slot.status === 'locked';

                                        let textColor = 'rgba(255,255,255,0.7)';
                                        if (isOccupied) textColor = '#ef4444';
                                        if (isReserved || isMaint) textColor = '#fbbf24';
                                        if (isLocked) textColor = '#64748b';

                                        const borderStyle = isSel ? {
                                            borderTop: '2px solid #2563eb',
                                            borderLeft: '2px solid #2563eb',
                                            borderRight: '2px solid #2563eb',
                                            borderBottom: 'none',
                                            boxShadow: '0 -2px 10px rgba(37,99,235,0.4)',
                                        } : {
                                            borderTop: '1.5px solid rgba(255,255,255,0.25)',
                                            borderLeft: '1.5px solid rgba(255,255,255,0.25)',
                                            borderRight: '1.5px solid rgba(255,255,255,0.25)',
                                            borderBottom: 'none'
                                        };

                                        return (
                                            <button
                                                key={slot._id}
                                                disabled={!isAvail && !isSel}
                                                onClick={() => isAvail && onSelect(slot)}
                                                title={`${slot.slotCode} — ${slot.status}`}
                                                style={{
                                                    width: 48,
                                                    height: 76,
                                                    ...borderStyle,
                                                    background: isSel ? 'rgba(37, 99, 235, 0.15)' : isLocked ? 'rgba(255,255,255,0.01)' : 'rgba(255, 255, 255, 0.03)',
                                                    cursor: isAvail ? 'pointer' : 'not-allowed',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '8px 2px',
                                                    transition: 'all 0.2s',
                                                    position: 'relative',
                                                    outline: 'none',
                                                    borderRadius: 0,
                                                }}
                                            >
                                                <span style={{ fontSize: 10, fontWeight: 800, color: isSel ? '#2563eb' : textColor, fontFamily: 'monospace' }}>
                                                    {slot.slotCode.replace(/^[^-]+-/, '')}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, position: 'relative' }}>
                                                    {isSel ? (
                                                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>✓</div>
                                                    ) : isOccupied ? (
                                                        <>
                                                            <div style={{ position: 'absolute', top: -14, right: -12, width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                                                <rect x="2" y="10" width="20" height="8" rx="2" />
                                                                <path d="M6 10l2-5h8l2 5" />
                                                                <circle cx="6" cy="18" r="1.5" />
                                                                <circle cx="18" cy="18" r="1.5" />
                                                            </svg>
                                                        </>
                                                    ) : isReserved ? (
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                            <line x1="16" y1="2" x2="16" y2="6" />
                                                            <line x1="8" y1="2" x2="8" y2="6" />
                                                            <line x1="3" y1="10" x2="21" y2="10" />
                                                        </svg>
                                                    ) : isMaint ? (
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                                                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                                                        </svg>
                                                    ) : isLocked ? (
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                        </svg>
                                                    ) : slot.features?.hasEVCharger ? (
                                                        <span style={{ fontSize: 10, color: '#10b981', lineHeight: 1 }}>⚡</span>
                                                    ) : null}
                                                </div>
                                            </button>
                                        );
                                    })}

                                    {/* Pad empty spacing slots */}
                                    {pair.top.length < 10 && Array.from({ length: 10 - pair.top.length }).map((_, i) => (
                                        <div key={`empty-top-${i}`} style={{ width: 48, height: 76 }} />
                                    ))}
                                </div>

                                {/* Horizontal Driveway */}
                                <div style={{
                                    height: 44,
                                    background: '#090d14',
                                    borderTop: '1px dashed rgba(255,255,255,0.12)',
                                    borderBottom: '1px dashed rgba(255,255,255,0.12)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    position: 'relative',
                                    margin: '8px 0',
                                    width: '100%',
                                    borderRadius: '4px'
                                }}>
                                    {/* Dashed Center Road Line */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: 0,
                                        right: 0,
                                        height: 0,
                                        borderTop: '1.8px dashed rgba(255,255,255,0.18)',
                                        transform: 'translateY(-50%)',
                                        pointerEvents: 'none'
                                    }} />

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, zIndex: 1, paddingLeft: 16 }}>
                                        <span>Lối Vào</span>
                                        <span style={{ fontSize: 12 }}>↑</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, zIndex: 1, paddingRight: 16 }}>
                                        <span style={{ fontSize: 12 }}>↓</span>
                                        <span>Lối Ra</span>
                                    </div>
                                </div>

                                {/* Bottom slots (face up) */}
                                {pair.bottom && (
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'flex-start', width: '100%' }}>
                                        {/* Real Slots */}
                                        {pair.bottom.map(slot => {
                                            const isSel = selectedSlotId === slot._id;
                                            const isAvail = slot.status === 'available';
                                            const isOccupied = slot.status === 'occupied';
                                            const isReserved = slot.status === 'reserved';
                                            const isMaint = slot.status === 'maintenance';
                                            const isLocked = slot.status === 'locked';

                                            let textColor = 'rgba(255,255,255,0.7)';
                                            if (isOccupied) textColor = '#ef4444';
                                            if (isReserved || isMaint) textColor = '#fbbf24';
                                            if (isLocked) textColor = '#64748b';

                                            const borderStyle = isSel ? {
                                                borderBottom: '2px solid #2563eb',
                                                borderLeft: '2px solid #2563eb',
                                                borderRight: '2px solid #2563eb',
                                                borderTop: 'none',
                                                boxShadow: '0 2px 10px rgba(37,99,235,0.4)',
                                            } : {
                                                borderBottom: '1.5px solid rgba(255,255,255,0.25)',
                                                borderLeft: '1.5px solid rgba(255,255,255,0.25)',
                                                borderRight: '1.5px solid rgba(255,255,255,0.25)',
                                                borderTop: 'none'
                                            };

                                            return (
                                                <button
                                                    key={slot._id}
                                                    disabled={!isAvail && !isSel}
                                                    onClick={() => isAvail && onSelect(slot)}
                                                    title={`${slot.slotCode} — ${slot.status}`}
                                                    style={{
                                                        width: 48,
                                                        height: 76,
                                                        ...borderStyle,
                                                        background: isSel ? 'rgba(37, 99, 235, 0.15)' : isLocked ? 'rgba(255,255,255,0.01)' : 'rgba(255, 255, 255, 0.03)',
                                                        cursor: isAvail ? 'pointer' : 'not-allowed',
                                                        display: 'flex',
                                                        flexDirection: 'column-reverse',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '8px 2px',
                                                        transition: 'all 0.2s',
                                                        position: 'relative',
                                                        outline: 'none',
                                                        borderRadius: 0,
                                                    }}
                                                >
                                                    <span style={{ fontSize: 10, fontWeight: 800, color: isSel ? '#2563eb' : textColor, fontFamily: 'monospace' }}>
                                                        {slot.slotCode.replace(/^[^-]+-/, '')}
                                                    </span>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, position: 'relative' }}>
                                                        {isSel ? (
                                                            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>✓</div>
                                                        ) : isOccupied ? (
                                                            <>
                                                                <div style={{ position: 'absolute', top: -14, right: -12, width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                                                    <rect x="2" y="10" width="20" height="8" rx="2" />
                                                                    <path d="M6 10l2-5h8l2 5" />
                                                                    <circle cx="6" cy="18" r="1.5" />
                                                                    <circle cx="18" cy="18" r="1.5" />
                                                                </svg>
                                                            </>
                                                        ) : isReserved ? (
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                                <line x1="3" y1="10" x2="21" y2="10" />
                                                            </svg>
                                                        ) : isMaint ? (
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                                                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                                                            </svg>
                                                        ) : isLocked ? (
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                            </svg>
                                                        ) : slot.features?.hasEVCharger ? (
                                                            <span style={{ fontSize: 10, color: '#10b981', lineHeight: 1 }}>⚡</span>
                                                        ) : null}
                                                    </div>
                                                </button>
                                            );
                                        })}

                                        {/* Pad empty spacing slots */}
                                        {pair.bottom.length < 10 && Array.from({ length: 10 - pair.bottom.length }).map((_, i) => (
                                            <div key={`empty-bottom-${i}`} style={{ width: 48, height: 76 }} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
const BookingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const parkingSpot = location.state?.spot || { title: 'Bitexco Financial Tower Parking', price: 50000 };

    const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);

    // Vehicle Types from API
    const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
    const [vehicleTypesLoading, setVehicleTypesLoading] = useState(false);
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

    // Fetch vehicle types from API
    useEffect(() => {
        const fetchVehicleTypes = async () => {
            setVehicleTypesLoading(true);
            try {
                const data = await vehicleTypeService.getAll();
                const list: VehicleType[] = Array.isArray(data) ? data : (data as any)?.data ?? [];
                setVehicleTypes(list.filter(v => v.isActive && !v.isDeleted));
            } catch {
                // Fallback sang 2 loại mặc định nếu API lỗi
                setVehicleTypes([
                    { _id: 'car', name: 'Ô tô', code: 'CAR', size: 'medium', isActive: true,
                      pricing: { hourlyRate: 10000, dailyRate: 80000 } },
                    { _id: 'motorcycle', name: 'Xe máy', code: 'MOTORBIKE', size: 'small', isActive: true,
                      pricing: { hourlyRate: 5000, dailyRate: 40000 } },
                ]);
            } finally {
                setVehicleTypesLoading(false);
            }
        };
        fetchVehicleTypes();
    }, []);

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
                // Lọc zone theo loại xe đã chọn (nếu zone có cấu hình allowedVehicleTypes)
                const filtered = list.filter(z => {
                    if (!z.isDeleted && z.status === 'active') {
                        if (!vehicleType) return true;
                        if (!z.allowedVehicleTypes || z.allowedVehicleTypes.length === 0) return true;
                        // allowedVehicleTypes có thể là mảng _id strings hoặc objects
                        return z.allowedVehicleTypes.some((vt: any) => {
                            const vtId = typeof vt === 'string' ? vt : vt?._id ?? vt?.code;
                            return vtId === vehicleType._id || vtId === vehicleType.code;
                        });
                    }
                    return false;
                });
                setZones(filtered);
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

    // Giá cước từ vehicleType đã chọn
    const hourlyRate = vehicleType?.pricing?.hourlyRate ?? 0;
    const estimatedPrice = hourlyRate * duration;

    const handleReserve = () => {
        if (!vehicleType || !selectedFloor || !selectedZone || !selectedSlot) return;
        navigate('/session', {
            state: {
                spot: parkingSpot,
                vehicleType,               // full VehicleType object (có pricing, _id, code)
                vehicleTypeId: vehicleType._id,
                floor: selectedFloor,
                zone: selectedZone,
                slot: selectedSlot,
                entryDate,
                duration,
                estimatedPrice,
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

                /* Top columns layout */
                .bk-top-row {
                    display: grid;
                    grid-template-columns: 320px 1fr;
                    gap: 12px;
                    margin-bottom: 12px;
                    align-items: start;
                }
                .bk-top-col-left {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .bk-top-col-right {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                @media (max-width: 900px) {
                    .bk-top-row {
                        grid-template-columns: 1fr;
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
                .bk-step-badge.active { background: #0f172a; color: #fff; }
                .bk-step-badge.done   { background: #0f172a; color: #fff; }

                /* Vehicle */
                .bk-vehicle-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                .bk-vehicle-btn {
                    border: 1.5px solid #e2e8f0; border-radius: 10px; background: #f8fafc;
                    padding: 14px 10px; display: flex; flex-direction: column; align-items: center;
                    gap: 8px; cursor: pointer; transition: all 0.2s; position: relative;
                }
                .bk-vehicle-btn:hover { border-color: #cbd5e1; background: #f8fafc; }
                .bk-vehicle-btn.sel { border-color: #0f172a; background: #f8fafc; }
                .bk-vehicle-btn svg { color: #475569; }
                .bk-vehicle-btn.sel svg { color: #0f172a; }
                .bk-vehicle-label { font-size: 12px; font-weight: 600; color: #374151; }
                .bk-vehicle-btn.sel .bk-vehicle-label { color: #0f172a; }
                .bk-vehicle-check {
                    position: absolute; top: 7px; right: 7px;
                    width: 18px; height: 18px; background: #0f172a; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center; color: #fff; font-size: 10px;
                }

                /* Time */
                .bk-time-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
                .bk-field label { display: block; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 5px; }
                .bk-field input, .bk-field select {
                    width: 100%; padding: 9px 11px; border: 1.5px solid #e2e8f0; border-radius: 8px;
                    font-size: 13px; font-weight: 600; color: #1e293b; background: #f8fafc; outline: none; transition: border-color 0.2s;
                }
                .bk-field input:focus, .bk-field select:focus { border-color: #0f172a; background: #fff; }
                .bk-exit-info {
                    display: flex; align-items: center; gap: 8px; background: #f8fafc;
                    border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 13px;
                    font-size: 12px; font-weight: 600; color: #0f172a;
                }

                /* Floor */
                .bk-floor-inner { display: flex; gap: 14px; align-items: flex-start; }
                .bk-floor-list { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
                .bk-floor-item {
                    display: flex; align-items: center; gap: 8px; padding: 8px 12px;
                    border: 1.5px solid #e2e8f0; border-radius: 8px; cursor: pointer;
                    transition: all 0.18s; background: #fff; font-size: 12px; font-weight: 600; color: #374151;
                }
                .bk-floor-item:hover { border-color: #cbd5e1; background: #f8fafc; }
                .bk-floor-item.sel { border-color: #0f172a; background: #f8fafc; color: #0f172a; }
                .bk-floor-slots {
                    margin-left: auto; background: #475569; color: #fff;
                    font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px; white-space: nowrap;
                }
                .bk-floor-check { color: #0f172a; font-size: 13px; font-weight: 800; margin-left: 2px; }

                /* Zone card */
                .bk-zone-card {
                    background: #fff; border-radius: 14px; border: 1px solid #e2e8f0;
                    padding: 18px 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); margin-bottom: 0;
                }
                .bk-zone-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
                .bk-zone-stat { font-size: 11px; font-weight: 600; color: #64748b; background: #f1f5f9; padding: 4px 10px; border-radius: 20px; }
                .bk-zone-stat span { color: #0f172a; font-weight: 800; }
                .zone-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px; }
                .zone-card {
                    border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 12px 14px;
                    background: #fff; transition: all 0.2s; position: relative; overflow: hidden;
                }
                .zone-card:hover:not(.full) { border-color: #cbd5e1; background: #f8fafc; box-shadow: 0 4px 12px rgba(15,23,42,0.06); transform: translateY(-1px); }
                .zone-card.sel { border-color: #0f172a; background: #f8fafc; box-shadow: 0 4px 16px rgba(15,23,42,0.12); }
                .zone-card.full { background: #f9fafb; opacity: 0.65; }
                .zone-card-top { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
                .zone-badge {
                    width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center;
                    justify-content: center; font-size: 11px; font-weight: 800; flex-shrink: 0;
                }
                .zone-info { flex: 1; min-width: 0; }
                .zone-name { font-size: 13px; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .zone-card.sel .zone-name { color: #0f172a; }
                .zone-vehicle { font-size: 10px; color: #64748b; margin-top: 2px; font-weight: 500; }
                .zone-check { width: 20px; height: 20px; background: #0f172a; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 800; flex-shrink: 0; }
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
                    background: #f8fafc; color: #475569; border: 1px solid #cbd5e1;
                }
                .bk-map-stat.warn { background: #fff7ed; color: #c2410c; border-color: #fed7aa; }

                /* Loading / error */
                .bk-loading { display: flex; align-items: center; justify-content: center; padding: 28px; gap: 10px; color: #64748b; font-size: 12px; font-weight: 600; }
                .bk-spinner { width: 20px; height: 20px; border: 2.5px solid #e2e8f0; border-top-color: #0f172a; border-radius: 50%; animation: bk-spin 0.7s linear infinite; }
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
                .bk-footer-bar-fill { height: 100%; border-radius: 4px; background: #0f172a; transition: width 0.4s ease; }
                .bk-footer-summary { flex: 1; font-size: 13px; font-weight: 600; color: #475569; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
                .bk-footer-bullet { color: #94a3b8; }
                .bk-confirm-btn { padding: 13px 32px; border: none; border-radius: 10px; font-size: 14px; font-weight: 800; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
                .bk-confirm-btn.ready { background: #0f172a; color: #fff; box-shadow: 0 4px 14px rgba(15,23,42,0.3); }
                .bk-confirm-btn.ready:hover { background: #1e293b; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(15,23,42,0.4); }
                .bk-confirm-btn.disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }

                @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .fade-up { animation: fadeUp 0.3s ease-out forwards; }

                /* Slot map detail panel */
                .slot-detail {
                    display: flex; align-items: center; gap: 10px;
                    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
                    padding: 10px 14px; margin-top: 14px; flex-wrap: wrap;
                }
                .slot-detail-code { font-size: 18px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
                .slot-detail-info { font-size: 11px; color: #475569; font-weight: 600; }
                .slot-feature-badge {
                    display: inline-flex; align-items: center; gap: 3px;
                    font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px;
                    background: #f1f5f9; color: #334155;
                }
            `}</style>

            <div className="bk-page">
                <Header />

                <div className="bk-header">
                    <h1>Đặt Chỗ Gửi Xe Thông Minh</h1>
                    <span className="bk-header-sub">{parkingSpot.title}</span>
                </div>

                <div className="bk-body">
                    <div className="bk-top-row">
                        <div className="bk-top-col-left">

                            {/* ── STEP 1: Vehicle ── */}
                            <div className="bk-card">
                            <div className="bk-card-title">
                                <span className={`bk-step-badge ${vehicleType ? 'done' : 'active'}`}>{vehicleType ? '✓' : '1'}</span>
                                Chọn Loại Phương Tiện
                            </div>
                            {vehicleTypesLoading ? (
                                <div className="bk-loading"><div className="bk-spinner" /> Đang tải...</div>
                            ) : (
                                <div className="bk-vehicle-row">
                                    {vehicleTypes.map(vt => {
                                        const isSel = vehicleType?._id === vt._id;
                                        const isMotorbike = ['MOTORBIKE', 'MOTORCYCLE', 'ELECTRIC_BIKE', 'BICYCLE'].some(c => vt.code.includes(c));
                                        return (
                                            <button
                                                key={vt._id}
                                                className={`bk-vehicle-btn ${isSel ? 'sel' : ''}`}
                                                onClick={() => setVehicleType(isSel ? null : vt)}
                                            >
                                                {isSel && <span className="bk-vehicle-check">✓</span>}
                                                {/* Icon SVG theo loại xe */}
                                                {isMotorbike ? (
                                                    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="40" height="40">
                                                        <circle cx="9" cy="34" r="6" /><circle cx="39" cy="34" r="6" />
                                                        <path d="M15 34h18M24 16l4.5 10.5H16l3-6H24" /><path d="M28.5 16H35l4.5 7.5" /><circle cx="36" cy="14.5" r="2.5" />
                                                    </svg>
                                                ) : vt.code === 'SMALL_TRUCK' ? (
                                                    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="40" height="40">
                                                        <rect x="2" y="16" width="28" height="20" rx="2" />
                                                        <path d="M30 24h10l4 8v4H30V24z" />
                                                        <circle cx="10" cy="38" r="4" /><circle cx="38" cy="38" r="4" />
                                                        <path d="M2 28h28" />
                                                    </svg>
                                                ) : (
                                                    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="40" height="40">
                                                        <rect x="4" y="22" width="40" height="14" rx="3" /><path d="M10 22l4.5-9h19L37 22" />
                                                        <circle cx="13" cy="36" r="4" /><circle cx="35" cy="36" r="4" />
                                                        <rect x="18" y="14" width="12" height="8" rx="1.5" /><path d="M4 28h3M41 28h3" />
                                                    </svg>
                                                )}
                                                <span className="bk-vehicle-label">{vt.name}</span>
                                                {vt.pricing?.hourlyRate > 0 && (
                                                    <span style={{
                                                        fontSize: 10, color: isSel ? '#0f172a' : '#64748b',
                                                        fontWeight: 600, marginTop: 2,
                                                    }}>
                                                        {new Intl.NumberFormat('vi-VN').format(vt.pricing.hourlyRate)}đ/h
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* ── STEP 2: Time ── */}
                        <div className="bk-card">
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
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    Dự kiến ra: <strong>{fmtExit()}</strong>
                                </div>
                            )}
                        </div>
                        </div> {/* end bk-top-col-left */}

                        <div className="bk-top-col-right">

                            {/* ── STEP 3: Floor ── */}
                            <div className="bk-card">
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
                                                        <div style={{ fontSize: 9.5, color: isSel ? '#0f172a' : '#64748b', fontWeight: 500 }}>
                                                            {f.vehicleType === 'motorcycle' ? 'Xe máy' : f.vehicleType === 'car' ? 'Ô tô' : 'Cả hai'}
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
                        <div>
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
                        <div>
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

                                    {/* (Legend is now rendered inside SlotMapGrid) */}

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
                                                        <div style={{ color: '#0f172a' }}>✓ Sẵn sàng đặt</div>
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
                        </div> {/* end bk-top-col-right */}
                    </div> {/* end bk-top-row */}
                </div> {/* end bk-body */}

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
                        {vehicleType && <>{vehicleType.name}</>}
                        {selectedFloor && <><span className="bk-footer-bullet">•</span>{selectedFloor.name || `Tầng ${selectedFloor.floorNumber}`}</>}
                        {selectedZone && <><span className="bk-footer-bullet">•</span>{selectedZone.name}</>}
                        {selectedSlot && <><span className="bk-footer-bullet">•</span><strong style={{ color: '#0f172a' }}>Ô {selectedSlot.slotCode}</strong></>}
                        {duration && <><span className="bk-footer-bullet">•</span>{duration} giờ</>}
                        {estimatedPrice > 0 && vehicleType && (
                            <><span className="bk-footer-bullet">•</span>
                            <strong style={{ color: '#0f172a' }}>
                                ~{new Intl.NumberFormat('vi-VN').format(estimatedPrice)}đ
                            </strong></>
                        )}
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
