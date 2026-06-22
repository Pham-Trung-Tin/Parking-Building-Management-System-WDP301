import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import Header from '../../components/Header/Header';
import parkingSessionService, { ParkingSession } from '../../services/api/parkingSessionService';
import vehicleTypeService, { VehicleType, VehicleTypePricing } from '../../services/api/vehicleTypeService';
import { Floor } from '../../services/api/floorService';
import { Zone } from '../../services/api/zoneService';
import { ParkingSlot } from '../../services/api/parkingSlotService';
import { createQRToken } from '../../utils/qrToken';
import { QRCodeSVG } from 'qrcode.react';

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
    const { socket } = useSocket();
    const state = location.state || {} as any;

    // ── Dữ liệu từ BookingPage navigate ──────────────────────────────────────
    const spot = state.spot || { title: 'Bãi Đỗ Xe', price: 20000 };
    const vehicleTypeData: VehicleType | null = state.vehicleType || null;
    const floorData: Floor | null = state.floor || null;
    const zoneData: Zone | null = state.zone || null;
    const slotData: ParkingSlot | null = state.slot || null;
    const sessionId: string | null = state.sessionId || null; // nếu có session đã tạo từ trước

    // estimatedPrice, duration, blockRate — do BookingPage tính và truyền sang
    const stateEstimatedPrice: number = state.estimatedPrice || 0;
    const stateDuration: number = state.duration || 4;
    const stateBlockRate: number = state.blockRate || 0; // Giá 1 block mà user đã thanh toán

    // ── Session data từ API (nếu có sessionId) ────────────────────────────────
    const initialSession = state.session || null;
    const [session, setSession] = useState<ParkingSession | null>(initialSession);
    const [sessionLoading, setSessionLoading] = useState(true);
    const [showQrModal, setShowQrModal] = useState(false);

    // ── Fetch vehicle type pricing trực tiếp từ API (vì navigate state có thể thiếu pricing) ─
    const [fetchedVTPricing, setFetchedVTPricing] = useState<VehicleTypePricing | null>(null);

    useEffect(() => {
        const vtId = vehicleTypeData?._id || state.vehicleTypeId;
        if (!vtId) return;
        vehicleTypeService.getById(vtId)
            .then((res: any) => {
                const vt = res?.data || res;
                if (vt?.pricing?.dayBlockRate) {
                    setFetchedVTPricing(vt.pricing as VehicleTypePricing);
                }
            })
            .catch(() => {}); // Fail silently — sẽ dùng fallback
    }, [vehicleTypeData?._id, state.vehicleTypeId]);

    useEffect(() => {
        if (!sessionId) return;
        const load = async () => {
            setSessionLoading(true);
            try {
                const data = await parkingSessionService.getById(sessionId);
                setSession((data.data || data) as ParkingSession);
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

    // ── Dev Tool Time Offset ──────────────────────────────────────────────────
    const [devTimeOffset, setDevTimeOffset] = useState<number>(() => {
        const stored = localStorage.getItem('devTimeOffset');
        return stored ? parseInt(stored, 10) : 0;
    });

    useEffect(() => {
        const handleOffsetChange = (e: any) => {
            if (e.detail !== undefined) {
                setDevTimeOffset(e.detail);
            }
        };
        window.addEventListener('devTimeOffsetChanged', handleOffsetChange);
        return () => window.removeEventListener('devTimeOffsetChanged', handleOffsetChange);
    }, []);

    const initialElapsed = Math.floor((Date.now() + devTimeOffset - sessionStart.current) / 1000);
    const [elapsed, setElapsed] = useState(Math.max(0, initialElapsed));

    useEffect(() => {
        const id = setInterval(() => {
            setElapsed(Math.floor((Date.now() + devTimeOffset - sessionStart.current) / 1000));
        }, 1000);
        return () => clearInterval(id);
    }, [devTimeOffset]);

    // ── Phí ước tính thực tế (Pre-booked Overtime logic) ────────────────────
    let overtimeFee = 0;
    const bookingInfo = typeof session?.booking === 'object' ? session.booking : null;
    
    const vtCodeForPricing = (typeof session?.vehicleType === 'object' ? (session.vehicleType as any)?.code : '') || vehicleTypeData?.code || '';
    const isMotorbikeType = ['MOTORBIKE', 'MOTORCYCLE', 'ELECTRIC_BIKE', 'BICYCLE'].some(c => vtCodeForPricing.toUpperCase().includes(c));
    
    // Rút trích đúng giá tiền từ API thay vì fallback cứng
    const vehicleTypePricing = (typeof session?.vehicleType === 'object' ? (session.vehicleType as any)?.pricing : null) || vehicleTypeData?.pricing;
    const hourlyRate = vehicleTypePricing?.hourlyRate ?? spot.price ?? 20000;

    // advancePayment từ session API (nếu có)
    const advancePayment = session?.advancePayment ?? 0;

    // blockRate = giá 1 block lố giờ, ưu tiên theo thứ tự:
    // 1. fetchedVTPricing.dayBlockRate — fetch trực tiếp từ API vehicleType (CHÍNH XÁC NHẤT)
    // 2. stateBlockRate — BookingPage đã tính đúng và truyền sang
    // 3. session.advancePayment — tiền thực tế đã thanh toán
    // 4. estimatedPrice / bookedBlocks — tính ngược
    // 5. hourlyRate * 4 (fallback cuối)
    const bookedBlocks = Math.max(1, Math.ceil(stateDuration / 4));
    const resolvedDayBlockRate = fetchedVTPricing?.dayBlockRate
        || (typeof session?.vehicleType === 'object' ? (session.vehicleType as any)?.pricing?.dayBlockRate : 0)
        || vehicleTypePricing?.dayBlockRate;
    const blockRate = resolvedDayBlockRate
        ? resolvedDayBlockRate
        : stateBlockRate > 0
            ? stateBlockRate
            : advancePayment > 0
                ? advancePayment
                : stateEstimatedPrice > 0
                    ? Math.round(stateEstimatedPrice / bookedBlocks)
                    : hourlyRate * 4;

    if (bookingInfo && (bookingInfo as any).endTime && (bookingInfo as any).scheduledDate) {
        const scheduledDateStr = (bookingInfo as any).scheduledDate.split('T')[0];
        const scheduledEnd = new Date(`${scheduledDateStr}T${(bookingInfo as any).endTime}:00`);
        const now = new Date(Date.now() + devTimeOffset);
        
        if (now > scheduledEnd) {
            const otHours = (now.getTime() - scheduledEnd.getTime()) / (1000 * 60 * 60);
            // 15 mins grace period
            if (otHours > (15 / 60)) {
                // Đậu lố: mỗi block thêm tính bằng blockRate
                overtimeFee = Math.ceil(otHours / 4) * blockRate;
            }
        }
    } else {
        // Fallback: Nếu không có dữ liệu booking từ API, giả định user đã mua 1 block 4 tiếng tính từ entryTime
        const elapsedHours = elapsed / 3600;
        if (elapsedHours > 4.25) { // Đã lố qua 4h + 15p (grace period)
            const otHours = elapsedHours - 4;
            overtimeFee = Math.ceil(otHours / 4) * blockRate;
        }
    }

    // Vì khách đã thanh toán lúc book nên phí hiện tại chỉ hiện Overtime Fee
    const currentFee = overtimeFee;
    // Số tiền cần thanh toán thêm cũng chỉ là phần overtime chưa thanh toán
    const amountDue = overtimeFee;

    // ── Lắng nghe sự kiện Checkout từ Staff qua Socket ────────────────────────
    useEffect(() => {
        if (!socket) return;
        const handleCheckout = (notif: any) => {
            if (notif.type === 'checkout_success') {
                const notifSessionId = notif.sessionId || notif.session?._id || notif.data?.sessionId || notif.data?._id;
                // Chỉ chuyển cảnh nếu không có session ID trong notif (fallback) hoặc đúng bằng sessionId hiện tại
                if (!notifSessionId || String(notifSessionId) === String(sessionId)) {
                    navigate('/checkoutsuccess', {
                        state: {
                            spot,
                            vehicleType: vehicleTypeData,
                            floor: floorData,
                            slot: slotData,
                            licensePlate: session?.licensePlate || state.licensePlate,
                            entryDate: session?.entryTime || sessionStart.current,
                            exitTime: Date.now(),
                            elapsed: elapsed,
                            totalAmount: session?.totalFee || (currentFee + overtimeFee),
                            transactionId: notif.transactionId || session?._id,
                        }
                    });
                }
            }
        };
        socket.on('newNotification', handleCheckout);
        return () => {
            socket.off('newNotification', handleCheckout);
        };
    }, [socket, sessionId, navigate, spot, vehicleTypeData, floorData, slotData, session, state.licensePlate, elapsed, currentFee, overtimeFee]);

    // ── Tải dữ liệu ─────────────────────────────────────────────────────────────
    // Ưu tiên data từ API session, fallback về state từ BookingPage
    const licensePlate: string = session?.vehicleInfo?.licensePlate || state.licensePlate || '';

    const vehicleTypeName: string = (typeof session?.vehicleType === 'object' ? (session.vehicleType as any)?.name : '') || vehicleTypeData?.name || 'N/A';
    const vtCode: string = (typeof session?.vehicleType === 'object' ? (session.vehicleType as any)?.code : '') || vehicleTypeData?.code || '';
    const isMotorbike = ['MOTORBIKE', 'MOTORCYCLE', 'ELECTRIC_BIKE', 'BICYCLE'].some(c => vtCode.includes(c));

    const floorName: string = (typeof session?.floor === 'object' ? ((session.floor as any)?.name || `Tầng ${(session.floor as any)?.floorNumber}`) : '')
        || (floorData ? (floorData.name || `Tầng ${floorData.floorNumber}`) : 'N/A');

    const zoneName: string = (typeof session?.zone === 'object' ? (session.zone as any)?.name : '') || zoneData?.name || 'N/A';
    const slotCode: string = (typeof session?.slot === 'object' ? (session.slot as any)?.slotCode : '') || slotData?.slotCode || 'N/A';
    const sessionCode: string = session?.sessionCode ?? '';
    const entryTime: Date = session?.entryTime
        ? new Date(session.entryTime)
        : new Date(sessionStart.current);

    const [qrValue, setQrValue] = useState<string>('');
    useEffect(() => {
        if (session?._id) {
            // Có session._id → tạo JWT token có chữ ký HMAC
            createQRToken({
                type: 'checkout',
                sessionId: session._id,
                licensePlate,
                slotCode,
                receiptId: sessionCode
            }).then(setQrValue).catch(err => console.error("Failed to generate QR token", err));
        } else if (sessionCode) {
            // Fallback: dùng sessionCode (PS-XXXXX) — staff có thể tìm theo mã này
            setQrValue(sessionCode);
        }
        // Nếu không có cả _id lẫn sessionCode → để qrValue rỗng, UI sẽ hiện "Loading QR..."
    }, [session?._id, sessionCode, licensePlate, slotCode]);

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
                totalAmount: amountDue, // The remaining due amount to pay
                currentFee,
                advancePayment,
                hourlyRate,
                licensePlate,
            }
        });
    };

    return (
        <>
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #f4f7f6; }

                .session-page {
                    min-height: 100vh;
                    background: #f4f7f6;
                    font-family: 'Inter', 'Segoe UI', sans-serif;
                    color: #0f172a;
                }

                /* ── Banner ── */
                .session-banner {
                    max-width: 1100px;
                    margin: 0 auto;
                    padding: 24px 24px 0;
                    display: flex;
                    align-items: center;
                }
                .banner-back {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px; padding: 8px 14px;
                    color: #475569; font-size: 13px; font-weight: 700;
                    cursor: pointer; display: flex; align-items: center; gap: 8px;
                    transition: all 0.2s;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                }
                .banner-back:hover { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; }

                /* ── Content Grid ── */
                .session-content { 
                    max-width: 1100px; 
                    margin: 0 auto; 
                    padding: 24px 20px 80px; 
                }

                .desktop-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 24px;
                }

                @media (min-width: 800px) {
                    .desktop-grid {
                        grid-template-columns: 380px 1fr;
                        align-items: start;
                    }
                }

                /* ── Loading ── */
                .session-loading {
                    display: flex; align-items: center; justify-content: center;
                    gap: 10px; padding: 12px; margin-bottom: 24px;
                    background: #eff6ff; border-radius: 10px;
                    font-size: 13px; font-weight: 600; color: #2563eb;
                }
                .spin {
                    width: 16px; height: 16px;
                    border: 2px solid #bfdbfe;
                    border-top-color: #2563eb;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }

                /* ══════════════════════════════════════════════════════
                   LEFT COLUMN: DIGITAL TICKET
                ══════════════════════════════════════════════════════ */
                .digital-ticket {
                    background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%);
                    border-radius: 24px;
                    padding: 32px 24px;
                    color: white;
                    box-shadow: 0 20px 40px -10px rgba(15,23,42,0.3);
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .digital-ticket::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 6px;
                    background: linear-gradient(90deg, #3b82f6, #10b981);
                }
                
                .dt-header {
                    width: 100%;
                    text-align: center;
                    margin-bottom: 24px;
                }
                .dt-title {
                    font-size: 13px;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    font-weight: 700;
                    margin-bottom: 4px;
                }
                .dt-session-id {
                    font-family: monospace;
                    font-size: 16px;
                    color: #e2e8f0;
                    font-weight: 800;
                    letter-spacing: 1px;
                }

                .dt-qr-wrapper {
                    background: white;
                    padding: 16px;
                    border-radius: 20px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                    margin-bottom: 32px;
                    border: 4px solid #334155;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .dt-qr-wrapper:hover {
                    transform: scale(1.05) translateY(-4px);
                    box-shadow: 0 25px 45px rgba(0,0,0,0.7);
                    border-color: #475569;
                }

                .dt-plate-box {
                    width: 100%;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 16px;
                    padding: 16px;
                    text-align: center;
                    margin-bottom: 16px;
                }
                .dt-plate-label {
                    font-size: 11px;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-weight: 600;
                    margin-bottom: 4px;
                }
                .dt-plate-number {
                    font-size: 28px;
                    font-weight: 900;
                    color: #ffffff;
                    letter-spacing: 2px;
                }
                .dt-vehicle-type {
                    font-size: 13px;
                    color: #3b82f6;
                    font-weight: 600;
                    margin-top: 4px;
                }

                .dt-info-row {
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    background: rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 16px;
                }
                .dt-info-col {
                    display: flex;
                    flex-direction: column;
                }
                .dt-info-col.right {
                    text-align: right;
                }
                .dt-info-label {
                    font-size: 11px;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 4px;
                }
                .dt-info-value {
                    font-size: 14px;
                    font-weight: 700;
                    color: #f8fafc;
                }

                /* ══════════════════════════════════════════════════════
                   RIGHT COLUMN: DASHBOARD & ACTIONS
                ══════════════════════════════════════════════════════ */
                .dashboard-panel {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                /* ── Stat grid ── */
                .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .stat-card { 
                    background: white; border: 1px solid #e2e8f0; 
                    box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); 
                    border-radius: 20px; padding: 24px; 
                    position: relative; overflow: hidden;
                }
                .stat-card::after {
                    content: ''; position: absolute; right: -20px; bottom: -20px;
                    width: 100px; height: 100px; border-radius: 50%; opacity: 0.1;
                }
                .stat-card.blue::after { background: #3b82f6; }
                .stat-card.green::after { background: #10b981; }

                .stat-label { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
                .stat-label.blue { color: #3b82f6; }
                .stat-label.green { color: #10b981; }
                .stat-value { font-size: 36px; font-weight: 900; letter-spacing: -1px; font-variant-numeric: tabular-nums; line-height: 1; color: #0f172a; }
                .stat-sub { font-size: 13px; font-weight: 600; margin-top: 8px; color: #64748b; }

                /* ── Details Card ── */
                .s-card {
                    background: white; border-radius: 20px;
                    border: 1px solid #e2e8f0; padding: 28px;
                    box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
                }

                .location-row {
                    display: flex; align-items: center; gap: 16px; margin-bottom: 24px;
                    padding-bottom: 24px; border-bottom: 1px solid #f1f5f9;
                }
                .location-icon {
                    width: 56px; height: 56px; background: #fffbeb;
                    border-radius: 16px; display: flex; align-items: center;
                    justify-content: center; flex-shrink: 0; color: #d97706;
                }
                .location-label { font-size: 12px; color: #d97706; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
                .location-value { font-size: 24px; font-weight: 900; color: #0f172a; }
                .location-sub { font-size: 14px; color: #64748b; font-weight: 600; margin-top: 2px; }

                .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 24px; }
                .detail-item-label { font-size: 11px; color: #3b82f6; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
                .detail-item-value { font-size: 15px; font-weight: 700; color: #0f172a; }

                /* Pricing */
                .pricing-section {
                    margin-top: 24px; padding-top: 20px;
                    border-top: 1px solid #f1f5f9;
                }
                .pricing-row {
                    display: flex; align-items: center; justify-content: space-between;
                    margin-bottom: 8px;
                }
                .pricing-row:last-child { margin-bottom: 0; }
                .pricing-label { font-size: 13px; color: #64748b; font-weight: 600; }
                .pricing-value { font-size: 15px; font-weight: 800; color: #0f172a; }

                /* ── Notice ── */
                .notice-card {
                    background: #fff8f1; border: 1px solid #fed7aa; 
                    border-radius: 16px; padding: 16px 20px;
                    display: flex; align-items: flex-start; gap: 14px;
                }
                .notice-title { font-size: 14px; font-weight: 800; color: #9a3412; margin-bottom: 4px; }
                .notice-text { font-size: 13px; color: #c2410c; font-weight: 500; line-height: 1.5; }

                /* ── Actions ── */
                .action-group {
                    display: flex; flex-direction: column; gap: 12px;
                }
                @media (min-width: 800px) {
                    .action-group { flex-direction: row; }
                    .btn-primary { flex: 2; }
                    .btn-secondary { flex: 1; }
                }

                .btn-primary, .btn-secondary {
                    padding: 16px 24px; border-radius: 16px; border: none;
                    font-size: 16px; font-weight: 800; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .btn-primary {
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white; box-shadow: 0 10px 25px rgba(16,185,129,0.3);
                }
                .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 15px 35px rgba(16,185,129,0.4); }
                .btn-primary:active { transform: scale(0.98); }
                
                .btn-secondary {
                    background: white; color: #475569;
                    border: 2px solid #e2e8f0;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                }
                .btn-secondary:hover { border-color: #ef4444; color: #ef4444; background: #fef2f2; }

                /* ── Fade animations ── */
                @keyframes pulse {
                    0% { transform: scale(0.95); opacity: 0.5; }
                    50% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(0.95); opacity: 0.5; }
                }
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .s-in   { animation: fadeSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .s-in-1 { animation: fadeSlideIn 0.5s 0.05s cubic-bezier(0.16, 1, 0.3, 1) both; }
                .s-in-2 { animation: fadeSlideIn 0.5s 0.10s cubic-bezier(0.16, 1, 0.3, 1) both; }
                .s-in-3 { animation: fadeSlideIn 0.5s 0.15s cubic-bezier(0.16, 1, 0.3, 1) both; }
            `}</style>

            <div className="session-page">
                <Header />

                {/* Back button */}
                <div className="session-banner">
                    <button className="banner-back" onClick={() => navigate(-1)}>
                        <ArrowLeftIcon /> Quay lại
                    </button>
                </div>

                <div className="session-content">
                    {sessionLoading && (
                        <div className="session-loading">
                            <div className="spin" />
                            Đang tải thông tin phiên đỗ...
                        </div>
                    )}

                    <div className="desktop-grid">
                        
                        {/* LEFT COLUMN: DIGITAL TICKET */}
                        <div className="digital-ticket s-in">
                            <div className="dt-header">
                                <div className="dt-title">Parking Ticket</div>
                                {sessionCode && <div className="dt-session-id">#{sessionCode}</div>}
                            </div>

                            <div 
                                className="dt-qr-wrapper" 
                                onClick={() => qrValue && setShowQrModal(true)}
                                style={{ cursor: qrValue ? 'pointer' : 'default' }}
                                title="Click để phóng to mã QR"
                            >
                                {qrValue ? (
                                    <QRCodeSVG
                                        value={qrValue}
                                        size={200}
                                        bgColor="#ffffff"
                                        fgColor="#0f172a"
                                        level="H"
                                        includeMargin={false}
                                    />
                                ) : (
                                    <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                        Loading QR...
                                    </div>
                                )}
                            </div>

                            <div className="dt-plate-box">
                                <div className="dt-plate-label">License Plate</div>
                                <div className="dt-plate-number">
                                    {licensePlate || <span style={{ opacity: 0.5, fontSize: 18 }}>N/A</span>}
                                </div>
                                <div className="dt-vehicle-type">
                                    {vehicleTypeName}
                                </div>
                            </div>

                            <div className="dt-info-row">
                                <div className="dt-info-col">
                                    <span className="dt-info-label">Entry Date</span>
                                    <span className="dt-info-value">
                                        {entryTime.toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                                <div className="dt-info-col right">
                                    <span className="dt-info-label">Entry Time</span>
                                    <span className="dt-info-value">
                                        {entryTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: DASHBOARD */}
                        <div className="dashboard-panel">
                            
                            {/* Stats Grid */}
                            <div className="stat-grid s-in-1">
                                <div className="stat-card blue">
                                    <div className="stat-label blue" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                            <TimerIcon /> Thời Gian Đỗ
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#10b981', background: '#ecfdf5', padding: '4px 10px', borderRadius: '12px' }}>
                                            <div style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                                            ĐANG TÍNH
                                        </div>
                                    </div>
                                    <div className="stat-value blue">{formatHMS(Math.max(0, elapsed))}</div>
                                    <div className="stat-sub blue">Giờ : Phút : Giây</div>
                                </div>
                                
                                <div className="stat-card green">
                                    <div className="stat-label green">
                                        <CardIcon /> Phí Hiện Tại
                                    </div>
                                    <div className="stat-value green" style={{ color: '#059669' }}>
                                        {fmtVND(currentFee)}
                                    </div>
                                    <div className="stat-sub green">{fmtVND(blockRate)} / block 4 tiếng</div>
                                </div>
                            </div>

                            {/* Details Card */}
                            <div className="s-card s-in-2">
                                <div className="location-row">
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

                                <div className="details-grid">
                                    <div>
                                        <div className="detail-item-label">Khu Vực Bãi</div>
                                        <div className="detail-item-value">{spot.title}</div>
                                    </div>
                                    {spot.code && (
                                        <div>
                                            <div className="detail-item-label">Mã Bãi Đỗ</div>
                                            <div className="detail-item-value">{spot.code}</div>
                                        </div>
                                    )}
                                    {slotData?.features?.hasEVCharger && (
                                        <div>
                                            <div className="detail-item-label">Tính Năng</div>
                                            <div className="detail-item-value" style={{ color: '#10b981' }}>⚡ Sạc EV</div>
                                        </div>
                                    )}
                                </div>

                                {/* Pricing Summary */}
                                <div className="pricing-details">
                                    <div className="pricing-row">
                                        <span className="pricing-label">Phí phát sinh (Block 4 tiếng)</span>
                                        <span className="pricing-value" style={{ color: '#2563eb' }}>{fmtVND(blockRate)} / block</span>
                                    </div>
                                    {vehicleTypeData?.pricing?.dailyRate && (
                                        <div className="pricing-row">
                                            <span className="pricing-label">Giá tối đa ngày</span>
                                            <span className="pricing-value" style={{ color: '#64748b', fontSize: '13px' }}>
                                                {fmtVND(vehicleTypeData.pricing.dailyRate)} / ngày
                                            </span>
                                        </div>
                                    )}
                                    {advancePayment > 0 && (
                                        <div className="pricing-row">
                                            <span className="pricing-label" style={{ color: '#10b981' }}>Đã thanh toán trước (Booking)</span>
                                            <span className="pricing-value" style={{ color: '#10b981' }}>
                                                - {fmtVND(advancePayment)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notice */}
                            <div className="notice-card s-in-3">
                                <WarningIcon />
                                <div>
                                    <div className="notice-title">Lưu Ý Quan Trọng</div>
                                    <div className="notice-text">
                                        Giữ mã QR để xuất trình tại cổng ra. 
                                        Vui lòng thanh toán trực tiếp cho nhân viên hoặc thanh toán online trước khi lấy xe.
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="action-group s-in-3">
                                {amountDue > 0 ? (
                                    <button className="btn-primary" onClick={handlePayCheckout}>
                                        <PayIcon /> Thanh Toán Online: {fmtVND(amountDue)}
                                    </button>
                                ) : (
                                    <button className="btn-primary" style={{ cursor: 'default' }} disabled>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
                                        </svg>
                                        Đã Thanh Toán Đủ
                                    </button>
                                )}
                                <button className="btn-secondary" onClick={() => alert('🚩 Báo cáo đã được gửi. Nhân viên sẽ hỗ trợ bạn sớm nhất!')}>
                                    <FlagIcon /> Báo Cáo
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
            {/* ── Modal Phóng To QR ── */}
            {showQrModal && (
                <div 
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 99999, padding: '20px'
                    }}
                    onClick={() => setShowQrModal(false)}
                >
                    <div 
                        style={{
                            background: '#fff', padding: '32px', borderRadius: '24px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            transform: 'scale(1)', animation: 'qrZoomIn 0.2s ease-out'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <style>{`
                            @keyframes qrZoomIn {
                                from { opacity: 0; transform: scale(0.9); }
                                to { opacity: 1; transform: scale(1); }
                            }
                        `}</style>
                        <h3 style={{ margin: '0 0 24px 0', color: '#0f172a', fontSize: '20px', fontWeight: 800 }}>Mã QR Chuyến Đi</h3>
                        {qrValue && (
                            <div style={{ background: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <QRCodeSVG
                                    value={qrValue}
                                    size={Math.min(window.innerWidth - 100, 320)}
                                    bgColor="#ffffff"
                                    fgColor="#0f172a"
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>
                        )}
                        <p style={{ marginTop: '24px', color: '#64748b', fontSize: '14px', textAlign: 'center', maxWidth: '300px' }}>
                            Đưa mã này cho nhân viên hoặc quét tại trạm kiểm soát để xác nhận xe.
                        </p>
                        <button 
                            className="btn-primary" 
                            style={{ marginTop: '24px', width: '100%', padding: '14px' }}
                            onClick={() => setShowQrModal(false)}
                        >
                            Đóng Lại
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default SessionPage;
