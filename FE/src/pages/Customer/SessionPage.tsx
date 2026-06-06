import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header/Header';
import parkingSessionService, { ParkingSession } from '../../services/api/parkingSessionService';
import { VehicleType } from '../../services/api/vehicleTypeService';
import { Floor } from '../../services/api/floorService';
import { Zone } from '../../services/api/zoneService';
import { ParkingSlot } from '../../services/api/parkingSlotService';

// ── QR Code SVG (deterministic, illustrative) ─────────────────────────────────
const QRCodeSVG = ({ value }: { value: string }) => {
    const seed = [...(value || 'PB001')].reduce((a, c) => a + c.charCodeAt(0), 0);
    const size = 9, cell = 24, pad = 16;
    const total = size * cell + pad * 2;
    const pseudo = (i: number) => ((seed * 7 + i * 13 + i * i * 3) % 97) / 97 > 0.42;
    const isFinderCell = (r: number, c: number) =>
        (r < 3 && c < 3) || (r < 3 && c >= size - 3) || (r >= size - 3 && c < 3);
    const isFinderCenter = (r: number, c: number) =>
        (r === 1 && c === 1) || (r === 1 && c === size - 2) || (r === size - 2 && c === 1);
    const isFinderBorder = (r: number, c: number) => {
        const bTL = ((r === 0 || r === 2) && c <= 2) || (c === 0 && r <= 2) || (c === 2 && r <= 2);
        const bTR = ((r === 0 || r === 2) && c >= size - 3) || (c === size - 1 && r <= 2) || (c === size - 3 && r <= 2);
        const bBL = ((r === size - 3 || r === size - 1) && c <= 2) || (c === 0 && r >= size - 3) || (c === 2 && r >= size - 3);
        return bTL || bTR || bBL;
    };
    return (
        <svg width={total} height={total} viewBox={`0 0 ${total} ${total}`} xmlns="http://www.w3.org/2000/svg">
            <rect width={total} height={total} rx="18" fill="#f0f4f8" />
            {Array.from({ length: size }).map((_, r) =>
                Array.from({ length: size }).map((_, c) => {
                    let dark = pseudo(r * size + c);
                    if (isFinderCell(r, c)) dark = isFinderCenter(r, c) ? true : isFinderBorder(r, c);
                    return dark ? (
                        <rect key={`${r}-${c}`} x={pad + c * cell + 2} y={pad + r * cell + 2}
                            width={cell - 4} height={cell - 4} rx="5" fill="#1e293b" />
                    ) : null;
                })
            )}
        </svg>
    );
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const CarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="10" width="22" height="8" rx="2" /><path d="M4 10l3-5h10l3 5" />
        <circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" />
    </svg>
);
const MotoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5" cy="17" r="3" /><circle cx="19" cy="17" r="3" />
        <path d="M8 17h8M12 8l2 5H8l1.5-3H14" /><path d="M14 8h3l2 4" /><circle cx="18" cy="7" r="1.5" />
    </svg>
);
const TimerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
);
const CardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </svg>
);
const PinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
    </svg>
);
const NavigateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
);
const WarningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);
const PayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </svg>
);
const FlagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
    </svg>
);
const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 18-6-6 6-6" />
    </svg>
);
const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M8 16H3v5" />
    </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatHMS = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const fmtVND = (amount: number) =>
    new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' ₫';

const fmtDateTime = (d: Date) =>
    `${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

// ── Main ──────────────────────────────────────────────────────────────────────
const SessionPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state || {} as any;

    // ── Dữ liệu từ BookingPage navigate ──────────────────────────────────────
    const spot    = state.spot    || { title: 'Bãi Đỗ Xe', price: 20000 };
    const vehicleTypeData: VehicleType | null = state.vehicleType || null;
    const floorData: Floor | null = state.floor || null;
    const zoneData: Zone | null   = state.zone  || null;
    const slotData: ParkingSlot | null = state.slot || null;
    const sessionId: string | null = state.sessionId || null; // nếu có session đã tạo từ trước

    // Giá theo giờ từ VehicleType object
    const hourlyRate = vehicleTypeData?.pricing?.hourlyRate ?? spot.price ?? 20000;

    // ── Session data từ API (nếu có sessionId) ────────────────────────────────
    const [session, setSession] = useState<ParkingSession | null>(null);
    const [sessionLoading, setSessionLoading] = useState(false);

    useEffect(() => {
        if (!sessionId) return;
        const load = async () => {
            setSessionLoading(true);
            try {
                const data = await parkingSessionService.getById(sessionId);
                setSession(data as ParkingSession);
            } catch {
                // session không load được — vẫn dùng state data từ BookingPage
            } finally {
                setSessionLoading(false);
            }
        };
        load();
    }, [sessionId]);

    // ── Live timer kể từ lúc vào trang / entryTime của session ───────────────
    const sessionStart = useRef<number>(
        session?.entryTime
            ? new Date(session.entryTime).getTime()
            : Date.now()
    );

    // Khi session load xong → cập nhật start time theo entryTime thực
    useEffect(() => {
        if (session?.entryTime) {
            sessionStart.current = new Date(session.entryTime).getTime();
        }
    }, [session]);

    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        const id = setInterval(() => {
            setElapsed(Math.floor((Date.now() - sessionStart.current) / 1000));
        }, 1000);
        return () => clearInterval(id);
    }, []);

    // ── Phí ước tính thực tế: (elapsed giờ) × hourlyRate ──────────────────────
    const elapsedHours = elapsed / 3600;
    const currentFee = elapsedHours * hourlyRate;

    // ── Thông tin hiển thị ────────────────────────────────────────────────────
    // Ưu tiên data từ API session, fallback về state từ BookingPage
    const getSessionField = <T,>(apiVal: T, stateVal: T): T => apiVal ?? stateVal;

    const licensePlate: string = getSessionField(
        session?.vehicleInfo?.licensePlate ?? '',
        state.licensePlate ?? ''
    );
    const vehicleTypeName: string = getSessionField(
        typeof session?.vehicleType === 'object' ? (session.vehicleType as any)?.name : '',
        vehicleTypeData?.name ?? 'N/A'
    );
    const vtCode: string = getSessionField(
        typeof session?.vehicleType === 'object' ? (session.vehicleType as any)?.code : '',
        vehicleTypeData?.code ?? ''
    );
    const isMotorbike = ['MOTORBIKE', 'MOTORCYCLE', 'ELECTRIC_BIKE', 'BICYCLE'].some(c => vtCode.includes(c));

    const floorName: string = getSessionField(
        typeof session?.floor === 'object' ? (session.floor as any)?.name ?? `Tầng ${(session.floor as any)?.floorNumber}` : '',
        floorData ? (floorData.name || `Tầng ${floorData.floorNumber}`) : 'N/A'
    );
    const zoneName: string = getSessionField(
        typeof session?.zone === 'object' ? (session.zone as any)?.name : '',
        zoneData?.name ?? 'N/A'
    );
    const slotCode: string = getSessionField(
        typeof session?.slot === 'object' ? (session.slot as any)?.slotCode : '',
        slotData?.slotCode ?? 'N/A'
    );
    const sessionCode: string = session?.sessionCode ?? '';
    const entryTime: Date = session?.entryTime
        ? new Date(session.entryTime)
        : new Date(sessionStart.current);
    const qrValue = sessionCode || `${spot.title}-${slotCode}-${sessionStart.current}`;

    const handlePayCheckout = () => {
        navigate('/checkout', {
            state: {
                spot,
                vehicleType: vehicleTypeData,
                floor: floorData,
                zone: zoneData,
                slot: slotData,
                session,
                sessionId,
                entryDate: entryTime.toISOString(),
                elapsed,
                totalAmount: currentFee,
                hourlyRate,
                licensePlate,
            }
        });
    };

    return (
        <>
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #f0f4f8; }

                .session-page {
                    min-height: 100vh;
                    background: #f0f4f8;
                    font-family: 'Inter', 'Segoe UI', sans-serif;
                    color: #0f172a;
                }

                /* ── Banner ── */
                .session-banner {
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                    padding: 18px 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    box-shadow: 0 4px 20px rgba(37,99,235,0.4);
                }
                .banner-left { display: flex; align-items: center; gap: 14px; }
                .banner-back {
                    background: rgba(255,255,255,0.15);
                    border: 1px solid rgba(255,255,255,0.25);
                    border-radius: 8px; padding: 6px 12px;
                    color: white; font-size: 13px; font-weight: 600;
                    cursor: pointer; display: flex; align-items: center; gap: 6px;
                    transition: background 0.2s;
                }
                .banner-back:hover { background: rgba(255,255,255,0.25); }
                .banner-title { font-size: 18px; font-weight: 800; color: white; letter-spacing: -0.2px; }
                .banner-subtitle { font-size: 12px; color: rgba(255,255,255,0.7); font-weight: 500; margin-top: 1px; }
                .active-badge {
                    display: flex; align-items: center; gap: 7px;
                    background: #10b981; color: white;
                    font-size: 13px; font-weight: 700;
                    padding: 7px 14px; border-radius: 20px;
                    box-shadow: 0 4px 12px rgba(16,185,129,0.5);
                }
                .active-dot {
                    width: 8px; height: 8px; background: white; border-radius: 50%;
                    animation: pulse 1.4s ease-in-out infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.7); }
                }

                /* ── Session code chip ── */
                .session-code-chip {
                    background: rgba(255,255,255,0.15);
                    border: 1px solid rgba(255,255,255,0.3);
                    border-radius: 8px; padding: 5px 12px;
                    color: white; font-size: 11px; font-weight: 700;
                    letter-spacing: 1px; font-family: monospace;
                    margin-top: 5px;
                }

                /* ── Content ── */
                .session-content { max-width: 600px; margin: 0 auto; padding: 28px 20px 80px; }

                /* ── Cards ── */
                .s-card {
                    background: white; border-radius: 18px;
                    border: 1px solid #e2e8f0; padding: 24px;
                    margin-bottom: 16px; box-shadow: 0 2px 16px rgba(0,0,0,0.05);
                }

                /* ── QR ── */
                .qr-section { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 28px 24px; }
                .qr-wrapper {
                    padding: 12px; background: white; border-radius: 20px;
                    border: 3px solid #1e293b; box-shadow: 0 8px 32px rgba(0,0,0,0.12);
                }
                .qr-caption { font-size: 14px; color: #475569; font-weight: 600; }
                .qr-code-text {
                    font-size: 13px; font-weight: 800; color: #1e293b;
                    letter-spacing: 1.5px; font-family: monospace;
                    background: #f1f5f9; padding: 6px 16px; border-radius: 8px;
                }

                /* ── Divider ── */
                .divider { height: 1px; background: #f1f5f9; margin: 0 -24px 20px; }

                /* ── License plate ── */
                .lp-row { display: flex; align-items: center; gap: 14px; }
                .lp-icon {
                    width: 52px; height: 52px; background: #eff6ff;
                    border-radius: 14px; display: flex; align-items: center;
                    justify-content: center; flex-shrink: 0;
                }
                .lp-label { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
                .lp-value { font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: 0.06em; }
                .lp-sub { font-size: 12px; color: #64748b; font-weight: 500; margin-top: 3px; }

                /* ── Stat grid ── */
                .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
                .stat-card { border-radius: 16px; padding: 18px 16px; }
                .stat-card.blue { background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 1px solid #bfdbfe; }
                .stat-card.green { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #bbf7d0; }
                .stat-label { display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 700; margin-bottom: 10px; }
                .stat-label.blue { color: #1d4ed8; }
                .stat-label.green { color: #059669; }
                .stat-value { font-size: 28px; font-weight: 900; letter-spacing: -0.5px; font-variant-numeric: tabular-nums; line-height: 1; }
                .stat-value.blue { color: #1e40af; }
                .stat-value.green { color: #15803d; }
                .stat-sub { font-size: 11px; font-weight: 600; margin-top: 5px; }
                .stat-sub.blue { color: #93c5fd; }
                .stat-sub.green { color: #6ee7b7; }

                /* ── Location card ── */
                .location-card {
                    border: 2px solid #fbbf24;
                    background: linear-gradient(135deg, #fffbeb, #fef3c7);
                    border-radius: 16px; padding: 18px 20px; margin-bottom: 16px;
                }
                .location-top { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
                .location-icon {
                    width: 42px; height: 42px; background: #f59e0b;
                    border-radius: 12px; display: flex; align-items: center;
                    justify-content: center; flex-shrink: 0;
                    box-shadow: 0 4px 12px rgba(245,158,11,0.4);
                }
                .location-label { font-size: 12px; color: #92400e; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px; }
                .location-value { font-size: 22px; font-weight: 900; color: #78350f; letter-spacing: 0.04em; }
                .location-sub { font-size: 12px; color: #a16207; font-weight: 600; margin-top: 2px; }
                .find-car-btn {
                    width: 100%; padding: 12px;
                    background: white; border: 1.5px solid #fde68a;
                    border-radius: 10px; font-size: 13px; font-weight: 700; color: #92400e;
                    cursor: pointer; display: flex; align-items: center;
                    justify-content: center; gap: 8px; transition: all 0.2s;
                }
                .find-car-btn:hover { background: #fef3c7; border-color: #f59e0b; }

                /* ── Details grid ── */
                .details-title { font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 16px; }
                .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 24px; }
                .detail-item-label { font-size: 11px; color: #3b82f6; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 5px; }
                .detail-item-value { font-size: 14px; font-weight: 700; color: #0f172a; }

                /* ── Pricing badge ── */
                .pricing-row {
                    margin-top: 16px; padding-top: 14px;
                    border-top: 1px solid #f1f5f9;
                    display: flex; align-items: center; justify-content: space-between;
                }
                .pricing-label { font-size: 12px; color: #64748b; font-weight: 600; }
                .pricing-value { font-size: 15px; font-weight: 800; color: #2563eb; }

                /* ── Notice ── */
                .notice-card {
                    border: 1px solid #fde68a; background: #fffbeb;
                    border-radius: 14px; padding: 14px 16px; margin-bottom: 16px;
                    display: flex; align-items: flex-start; gap: 12px;
                }
                .notice-title { font-size: 13px; font-weight: 700; color: #92400e; margin-bottom: 3px; }
                .notice-text { font-size: 12px; color: #b45309; font-weight: 500; line-height: 1.5; }

                /* ── Action buttons ── */
                .pay-btn {
                    width: 100%; padding: 17px; border: none; border-radius: 14px;
                    background: linear-gradient(135deg, #2563eb, #1d4ed8);
                    color: white; font-size: 16px; font-weight: 800;
                    cursor: pointer; display: flex; align-items: center;
                    justify-content: center; gap: 10px; margin-bottom: 12px;
                    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                    box-shadow: 0 6px 24px rgba(37,99,235,0.4);
                }
                .pay-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(37,99,235,0.5); }
                .pay-btn:active { transform: scale(0.98); }
                .pay-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

                .report-btn {
                    width: 100%; padding: 14px;
                    border: 1.5px solid #e2e8f0; border-radius: 14px;
                    background: white; color: #475569;
                    font-size: 14px; font-weight: 700; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                }
                .report-btn:hover { border-color: #ef4444; color: #ef4444; background: #fef2f2; }

                /* ── Loading ── */
                .session-loading {
                    display: flex; align-items: center; justify-content: center;
                    gap: 10px; padding: 12px; margin-bottom: 12px;
                    background: #eff6ff; border-radius: 10px;
                    font-size: 12px; font-weight: 600; color: #2563eb;
                }
                .spin {
                    width: 14px; height: 14px;
                    border: 2px solid #bfdbfe;
                    border-top-color: #2563eb;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }

                /* ── Fade animations ── */
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .s-in   { animation: fadeSlideIn 0.4s ease-out forwards; }
                .s-in-1 { animation: fadeSlideIn 0.4s 0.05s ease-out both; }
                .s-in-2 { animation: fadeSlideIn 0.4s 0.10s ease-out both; }
                .s-in-3 { animation: fadeSlideIn 0.4s 0.15s ease-out both; }
                .s-in-4 { animation: fadeSlideIn 0.4s 0.20s ease-out both; }
                .s-in-5 { animation: fadeSlideIn 0.4s 0.25s ease-out both; }
                .s-in-6 { animation: fadeSlideIn 0.4s 0.30s ease-out both; }
            `}</style>

            <div className="session-page">
                <Header />

                {/* Blue banner */}
                <div className="session-banner">
                    <div className="banner-left">
                        <button className="banner-back" onClick={() => navigate(-1)}>
                            <ArrowLeftIcon /> Quay lại
                        </button>
                        <div>
                            <div className="banner-title">Phiên Đỗ Xe Hiện Tại</div>
                            <div className="banner-subtitle">{spot.title}</div>
                            {sessionCode && (
                                <div className="session-code-chip">{sessionCode}</div>
                            )}
                        </div>
                    </div>
                    <div className="active-badge">
                        <span className="active-dot" />
                        Đang đỗ
                    </div>
                </div>

                <div className="session-content">

                    {/* Loading indicator khi fetch session */}
                    {sessionLoading && (
                        <div className="session-loading">
                            <div className="spin" />
                            Đang tải thông tin phiên đỗ...
                        </div>
                    )}

                    {/* QR Code */}
                    <div className="s-card qr-section s-in">
                        <div className="qr-wrapper">
                            <QRCodeSVG value={qrValue} />
                        </div>
                        <p className="qr-caption">Quét mã tại cổng ra để thanh toán</p>
                        {sessionCode && (
                            <div className="qr-code-text">{sessionCode}</div>
                        )}
                    </div>

                    {/* License Plate + Vehicle */}
                    <div className="s-card s-in-1">
                        <div className="lp-row">
                            <div className="lp-icon">
                                {isMotorbike ? <MotoIcon /> : <CarIcon />}
                            </div>
                            <div>
                                <div className="lp-label">Biển Số Xe</div>
                                <div className="lp-value">
                                    {licensePlate || <span style={{ color: '#94a3b8', fontSize: 14 }}>Chưa có biển số</span>}
                                </div>
                                <div className="lp-sub">{vehicleTypeName}</div>
                            </div>
                        </div>
                    </div>

                    {/* Timer + Fee */}
                    <div className="stat-grid s-in-2">
                        <div className="stat-card blue">
                            <div className="stat-label blue">
                                <TimerIcon /> Thời Gian Đỗ
                            </div>
                            <div className="stat-value blue">{formatHMS(Math.max(0, elapsed))}</div>
                            <div className="stat-sub blue">HH:MM:SS</div>
                        </div>
                        <div className="stat-card green">
                            <div className="stat-label green">
                                <CardIcon /> Phí Hiện Tại
                            </div>
                            <div className="stat-value green" style={{ fontSize: '20px' }}>
                                {fmtVND(currentFee)}
                            </div>
                            <div className="stat-sub green">{fmtVND(hourlyRate)}/giờ</div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="location-card s-in-3">
                        <div className="location-top">
                            <div className="location-icon">
                                <PinIcon />
                            </div>
                            <div>
                                <div className="location-label">Vị Trí Đỗ Xe</div>
                                <div className="location-value">{floorName} — {slotCode}</div>
                                {zoneName && zoneName !== 'N/A' && (
                                    <div className="location-sub">Khu {zoneName}</div>
                                )}
                            </div>
                        </div>
                        <button className="find-car-btn" onClick={() => alert('🗺️ Tính năng bản đồ đang phát triển...')}>
                            <NavigateIcon /> Tìm Xe Của Tôi
                        </button>
                    </div>

                    {/* Session Details */}
                    <div className="s-card s-in-4">
                        <div className="details-title">Chi Tiết Phiên Đỗ</div>
                        <div className="divider" style={{ margin: '0 -24px 18px' }} />
                        <div className="details-grid">
                            <div>
                                <div className="detail-item-label">Giờ Vào</div>
                                <div className="detail-item-value" style={{ fontSize: 13 }}>
                                    {fmtDateTime(entryTime)}
                                </div>
                            </div>
                            <div>
                                <div className="detail-item-label">Khu Vực</div>
                                <div className="detail-item-value">{zoneName}</div>
                            </div>
                            <div>
                                <div className="detail-item-label">Loại Phương Tiện</div>
                                <div className="detail-item-value">{vehicleTypeName}</div>
                            </div>
                            <div>
                                <div className="detail-item-label">Ô Đỗ</div>
                                <div className="detail-item-value" style={{ color: '#2563eb' }}>{slotCode}</div>
                            </div>
                            {slotData?.features?.hasEVCharger && (
                                <div>
                                    <div className="detail-item-label">Tính Năng</div>
                                    <div className="detail-item-value" style={{ color: '#10b981' }}>⚡ Sạc EV</div>
                                </div>
                            )}
                            {spot.code && (
                                <div>
                                    <div className="detail-item-label">Mã Bãi Đỗ</div>
                                    <div className="detail-item-value">{spot.code}</div>
                                </div>
                            )}
                        </div>

                        {/* Pricing summary */}
                        <div className="pricing-row">
                            <span className="pricing-label">Đơn giá áp dụng</span>
                            <span className="pricing-value">{fmtVND(hourlyRate)} / giờ</span>
                        </div>
                        {vehicleTypeData?.pricing?.dailyRate && (
                            <div className="pricing-row" style={{ paddingTop: 8, marginTop: 0, borderTop: 'none' }}>
                                <span className="pricing-label">Giá cả ngày</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>
                                    {fmtVND(vehicleTypeData.pricing.dailyRate)} / ngày
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Important Notice */}
                    <div className="notice-card s-in-5">
                        <WarningIcon />
                        <div>
                            <div className="notice-title">Lưu Ý Quan Trọng</div>
                            <div className="notice-text">
                                Giữ mã QR để xuất trình tại cổng ra. Thời gian đỗ tối đa 24 giờ.
                                Phí được tính theo giờ thực tế với đơn giá <strong>{fmtVND(hourlyRate)}/giờ</strong>.
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="s-in-6">
                        <button
                            className="pay-btn"
                            onClick={handlePayCheckout}
                        >
                            <PayIcon />
                            Thanh Toán &amp; Ra Xe
                        </button>
                        <button className="report-btn" onClick={() => alert('🚩 Báo cáo đã được gửi. Nhân viên sẽ hỗ trợ bạn sớm nhất!')}>
                            <FlagIcon />
                            Báo Cáo Sự Cố
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SessionPage;
