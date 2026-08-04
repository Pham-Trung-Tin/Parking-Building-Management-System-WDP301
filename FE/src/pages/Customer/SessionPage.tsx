import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import Header from '../../components/Header/Header';
import parkingSessionService, { ParkingSession } from '../../services/api/parkingSessionService';
import bookingService from '../../services/api/bookingService';
import vehicleTypeService, { VehicleType, VehicleTypePricing } from '../../services/api/vehicleTypeService';
import { Floor } from '../../services/api/floorService';
import { Zone } from '../../services/api/zoneService';
import { ParkingSlot } from '../../services/api/parkingSlotService';
import paymentService from '../../services/api/paymentService';

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

    // ── Surcharge payment modal states ────────────────────────────────────────
    const [showSurchargeModal, setShowSurchargeModal] = useState(false);
    const [surchargePhase, setSurchargePhase] = useState<'method' | 'qr'>('method');
    const [surchargePayMethod, setSurchargePayMethod] = useState<'bank_transfer'>('bank_transfer');
    const [surchargeBankInfo, setSurchargeBankInfo] = useState<any>(null);
    const [surchargePolling, setSurchargePolling] = useState(false);
    const [surchargeProcessing, setSurchargeProcessing] = useState(false);
    const [showPaySuccessToast, setShowPaySuccessToast] = useState(false);

    // ── Booking data từ API (nếu có bookingId) ────────────────────────────────
    const [fullBooking, setFullBooking] = useState<any>(null);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const bookingId = typeof session?.booking === 'object' ? (session.booking as any)?._id : session?.booking;
                if (!bookingId) return;
                const res = await bookingService.getById(bookingId);
                setFullBooking(res?.data || res);
            } catch (err) {
                console.warn('Failed to fetch full booking', err);
            }
        };
        fetchBooking();
    }, [session?.booking]);

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
            .catch(() => { }); // Fail silently — sẽ dùng fallback
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

    const isCompleted = session?.status === 'completed';
    const endTimeMs = isCompleted && session?.exitTime ? new Date(session.exitTime).getTime() : (Date.now() + devTimeOffset);

    const initialElapsed = Math.floor((endTimeMs - sessionStart.current) / 1000);
    const [elapsed, setElapsed] = useState(Math.max(0, initialElapsed));

    useEffect(() => {
        if (isCompleted) {
            setElapsed(Math.floor((endTimeMs - sessionStart.current) / 1000));
            return;
        }
        const id = setInterval(() => {
            setElapsed(Math.floor((Date.now() + devTimeOffset - sessionStart.current) / 1000));
        }, 1000);
        return () => clearInterval(id);
    }, [devTimeOffset, isCompleted, session?.exitTime]);

    // ── Phí ước tính thực tế (Pre-booked Overtime logic) ────────────────────
    let overtimeFee = 0;
    let earlyOtFee = 0;
    let lateOtFee = 0;
    const bookingInfo = fullBooking || (typeof session?.booking === 'object' ? session.booking : null);

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

    const resolvedNightBlockRate = fetchedVTPricing?.nightBlockRate
        || (typeof session?.vehicleType === 'object' ? (session.vehicleType as any)?.pricing?.nightBlockRate : 0)
        || vehicleTypePricing?.nightBlockRate
        || blockRate * 1.5;

    // --- State variables for UI status
    let isOvertime = false;
    let isExpiringSoon = false;
    const feeLogs: { type: 'early' | 'late' | 'fallback', timestamp: Date, amount: number, label: string }[] = [];

    if (bookingInfo && (bookingInfo as any).endTime && (bookingInfo as any).scheduledDate) {
        const dStr = (bookingInfo as any).scheduledDate;
        const [startH, startM] = (bookingInfo as any).startTime.split(':').map(Number);
        const [endH, endM] = (bookingInfo as any).endTime.split(':').map(Number);

        const scheduledStart = new Date(dStr);
        scheduledStart.setHours(startH, startM, 0, 0);
        
        let scheduledEnd = new Date(dStr);
        scheduledEnd.setHours(endH, endM, 0, 0);

        // ── Fix cross-midnight: nếu endTime < startTime (ví dụ 22:00 → 01:03)
        //    thì scheduledEnd thực ra là ngày hôm sau ─────────────────────────
        if (scheduledEnd <= scheduledStart) {
            scheduledEnd = new Date(scheduledEnd.getTime() + 24 * 60 * 60 * 1000);
        }

        const now = new Date(endTimeMs);

        if (now > scheduledEnd) {
            isOvertime = true;
        } else if (scheduledEnd.getTime() - now.getTime() <= 15 * 60 * 1000 && scheduledEnd.getTime() - now.getTime() > 0) {
            isExpiringSoon = true;
        }

        // Early arrival logic: > 15 mins early gets charged extra blocks
        if (scheduledStart.getTime() - sessionStart.current > 15 * 60 * 1000) {
            let tempStart = new Date(sessionStart.current);
            while (tempStart < scheduledStart) {
                const blockEnd = new Date(tempStart.getTime() + 4 * 60 * 60 * 1000);
                const effectiveEnd = new Date(blockEnd.getTime() - 1);
                const startHour = tempStart.getHours();
                const endHour = effectiveEnd.getHours();
                const isNightBlock = startHour >= 18 || startHour < 6 || endHour >= 18 || endHour < 6;
                const fee = isNightBlock ? resolvedNightBlockRate : blockRate;
                earlyOtFee += fee;
                feeLogs.push({
                    type: 'early',
                    timestamp: new Date(tempStart.getTime()),
                    amount: fee,
                    label: 'Early Arrival Surcharge'
                });
                tempStart = new Date(tempStart.getTime() + 4 * 60 * 60 * 1000);
            }
        }

        if (now > scheduledEnd) {
            let tempStart = new Date(scheduledEnd.getTime());
            while (tempStart < now) {
                const blockEnd = new Date(tempStart.getTime() + 4 * 60 * 60 * 1000);
                const effectiveEnd = new Date(blockEnd.getTime() - 1);
                const startHour = tempStart.getHours();
                const endHour = effectiveEnd.getHours();
                const isNightBlock = startHour >= 18 || startHour < 6 || endHour >= 18 || endHour < 6;
                const fee = isNightBlock ? resolvedNightBlockRate : blockRate;
                lateOtFee += fee;
                feeLogs.push({
                    type: 'late',
                    timestamp: new Date(tempStart.getTime()),
                    amount: fee,
                    label: 'Late Departure Surcharge'
                });
                tempStart = new Date(tempStart.getTime() + 4 * 60 * 60 * 1000);
            }
        }
        overtimeFee = earlyOtFee + lateOtFee;
    } else {
        // Fallback: Nếu không có dữ liệu booking từ API, giả định user đã mua 1 block 4 tiếng tính từ entryTime
        const elapsedHours = elapsed / 3600;
        if (elapsedHours > 4) { // Đã lố qua 4h
            const scheduledEnd = new Date(sessionStart.current + 4 * 60 * 60 * 1000);
            const now = new Date(endTimeMs);

            let tempStart = new Date(scheduledEnd.getTime());
            let calculatedOtFee = 0;
            while (tempStart < now) {
                const blockEnd = new Date(tempStart.getTime() + 4 * 60 * 60 * 1000);
                const effectiveEnd = new Date(blockEnd.getTime() - 1);
                const startHour = tempStart.getHours();
                const endHour = effectiveEnd.getHours();
                const isNightBlock = startHour >= 18 || startHour < 6 || endHour >= 18 || endHour < 6;
                const fee = isNightBlock ? resolvedNightBlockRate : blockRate;
                calculatedOtFee += fee;
                feeLogs.push({
                    type: 'fallback',
                    timestamp: new Date(tempStart.getTime()),
                    amount: fee,
                    label: 'Overtime Surcharge'
                });
                tempStart = new Date(tempStart.getTime() + 4 * 60 * 60 * 1000);
            }
            overtimeFee = calculatedOtFee;
        }
    }

    // Vì khách đã thanh toán lúc book nên phí hiện tại chỉ hiện Overtime Fee, ngoại trừ chọn Pay at counter (pending)
    const baseUnpaidFee = bookingInfo?.paymentStatus === 'pending' ? (bookingInfo?.estimatedFee || 0) : 0;
    const currentFee = isCompleted ? (session.totalFee || 0) : (baseUnpaidFee + overtimeFee);
    // Số tiền cần thanh toán thêm cũng bao gồm tiền vé gốc nếu chưa thanh toán
    const amountDue = currentFee;

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
                            licensePlate: session?.vehicleInfo?.licensePlate || state.licensePlate,
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

    const floorName: string = (typeof session?.floor === 'object' ? ((session.floor as any)?.name || `Floor ${(session.floor as any)?.floorNumber}`) : '')
        || (floorData ? (floorData.name || `Floor ${floorData.floorNumber}`) : 'N/A');

    const zoneName: string = (typeof session?.zone === 'object' ? (session.zone as any)?.name : '') || zoneData?.name || 'N/A';
    const slotCode: string = (typeof session?.slot === 'object' ? (session.slot as any)?.slotCode : '') || slotData?.slotCode || 'N/A';
    const sessionCode: string = session?.sessionCode ?? '';
    const entryTime: Date = session?.entryTime
        ? new Date(session.entryTime)
        : new Date(sessionStart.current);

    const [qrValue, setQrValue] = useState<string>('');
    useEffect(() => {
        if (session?._id) {
            // Dùng plain prefix string thay vì HMAC token để giảm mật độ QR
            setQrValue(`co_${session._id}`);
        } else if (sessionCode) {
            // Fallback: dùng sessionCode (PS-XXXXX) — staff có thể tìm theo mã này
            setQrValue(sessionCode);
        }
        // Nếu không có cả _id lẫn sessionCode → để qrValue rỗng, UI sẽ hiện "Loading QR..."
    }, [session?._id, sessionCode]);

    const isMonthlyPassSession = !!session?.monthlyPass;

    // ── Surcharge payment polling ──────────────────────────────────────────────
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (surchargePolling && surchargeBankInfo?.payment?._id) {
            interval = setInterval(async () => {
                try {
                    const res = await paymentService.checkBankTransferStatus(surchargeBankInfo.payment._id);
                    const statusInfo = (res as any).data || res;
                    if (statusInfo.isPaid || statusInfo.matched) {
                        setSurchargePolling(false);
                        clearInterval(interval);
                        setShowSurchargeModal(false);
                        setSurchargePhase('method');
                        setSurchargeBankInfo(null);
                        setShowPaySuccessToast(true);
                        setTimeout(() => setShowPaySuccessToast(false), 4000);
                        // Refresh session data
                        if (session?._id) {
                            const sRes = await parkingSessionService.getById(session._id);
                            if (sRes?.data) setSession(sRes.data);
                        }
                    }
                } catch (err) {
                    console.error('Surcharge polling error:', err);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [surchargePolling, surchargeBankInfo, session?._id]);

    const handlePayCheckout = () => {
        setShowSurchargeModal(true);
        setSurchargePhase('method');
    };

    const handleConfirmSurchargePayment = async () => {
        if (!session?._id) return;
        setSurchargeProcessing(true);
        try {
            const paymentRes = await paymentService.initiateBankTransfer(session._id);
            const paymentInfo = (paymentRes as any).data || paymentRes;
            setSurchargeBankInfo(paymentInfo);
            setSurchargePhase('qr');
            setSurchargePolling(true);
        } catch (err) {
            console.error('Failed to initiate surcharge payment', err);
        } finally {
            setSurchargeProcessing(false);
        }
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
                        align-items: stretch;
                    }
                    .desktop-grid.monthly-pass-mode {
                        grid-template-columns: minmax(320px, 420px);
                        justify-content: center;
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
                    justify-content: space-between;
                    height: 100%;
                    gap: 20px;
                }

                /* ── Stat grid ── */
                .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; flex: 1; }
                .stat-card { 
                    background: white; border: 1px solid #e2e8f0; 
                    box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); 
                    border-radius: 20px; padding: 24px; 
                    position: relative; overflow: hidden;
                    display: flex; flex-direction: column; justify-content: center; height: 100%;
                    align-items: center; text-align: center;
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
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
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
                    background: white; border-radius: 20px;
                    border: 1px solid #e2e8f0; padding: 20px;
                    box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
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
                        <ArrowLeftIcon /> Back
                    </button>
                </div>

                <div className="session-content">
                    {sessionLoading && (
                        <div className="session-loading">
                            <div className="spin" />
                            Loading session info...
                        </div>
                    )}

                    <div className={`desktop-grid ${isMonthlyPassSession ? 'monthly-pass-mode' : ''}`}>

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
                                title="Click to enlarge QR code"
                            >
                                {qrValue ? (
                                    <QRCodeSVG
                                        value={qrValue}
                                        size={200}
                                        bgColor="#ffffff"
                                        fgColor="#0f172a"
                                        level="L"
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

                            {isMonthlyPassSession && (
                                <div style={{ width: '100%', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16, padding: '20px 16px', textAlign: 'center', marginBottom: 24 }}>
                                    <div style={{ fontSize: 11, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>Parking Location</div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>
                                        {spot.title || 'Parking Lot'}
                                    </div>
                                    <div style={{ fontSize: 14, color: '#cbd5e1' }}>
                                        {floorName} {zoneName !== 'N/A' && `— Zone ${zoneName}`}
                                    </div>
                                    <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '6px 12px', borderRadius: 8 }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                        Monthly Pass Member
                                    </div>
                                </div>
                            )}

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

                            {bookingInfo && (
                                <div className="dt-info-row" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, marginTop: 16 }}>
                                    <div className="dt-info-col">
                                        <span className="dt-info-label" style={{ color: '#fbbf24' }}>Booked Arrival</span>
                                        <span className="dt-info-value" style={{ fontSize: 13 }}>
                                            {(() => {
                                                const b = bookingInfo as any;
                                                if (!b.scheduledDate || !b.startTime) return 'N/A';
                                                const d = new Date(b.scheduledDate);
                                                const [h, m] = b.startTime.split(':').map(Number);
                                                d.setHours(h, m);

                                                // Calculate grace period start (15 mins before)
                                                const gracePeriodStart = new Date(d.getTime() - 15 * 60000);

                                                return (
                                                    <>
                                                        {d.toLocaleDateString('vi-VN')}
                                                        <br />
                                                        <span style={{ fontSize: 16, fontWeight: 700 }}>
                                                            {d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4, fontWeight: 500 }}>
                                                            (Check-in allowed from {gracePeriodStart.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </span>
                                    </div>
                                    <div className="dt-info-col right">
                                        <span className="dt-info-label" style={{ color: '#fbbf24' }}>Booked Exit</span>
                                        <span className="dt-info-value" style={{ fontSize: 13 }}>
                                            {(() => {
                                                const b = bookingInfo as any;
                                                if (!b.scheduledDate || !b.endTime) return 'N/A';
                                                const d = new Date(b.scheduledDate);
                                                const [h, m] = b.endTime.split(':').map(Number);
                                                d.setHours(h, m);
                                                
                                                const [startH, startM] = b.startTime.split(':').map(Number);
                                                const startD = new Date(b.scheduledDate);
                                                startD.setHours(startH, startM);
                                                if (d < startD) {
                                                    d.setDate(d.getDate() + 1);
                                                }
                                                return (
                                                    <>
                                                        {d.toLocaleDateString('vi-VN')}
                                                        <br />
                                                        <span style={{ fontSize: 16, fontWeight: 700 }}>
                                                            {d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </>
                                                );
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: DASHBOARD */}
                        {!isMonthlyPassSession && (
                            <div className="dashboard-panel">

                                {/* Expiring Soon Alert (Floating Toast) */}
                                {isExpiringSoon && (
                                    <div style={{
                                        position: 'fixed', top: '32px', left: '50%', transform: 'translateX(-50%)',
                                        zIndex: 9999, background: '#fffbeb', border: '1px solid #fde68a',
                                        borderRadius: '16px', padding: '16px', display: 'flex', gap: '12px',
                                        alignItems: 'flex-start', boxShadow: '0 20px 40px -10px rgba(217,119,6,0.2), 0 0 0 4px rgba(253,230,138,0.5)',
                                        width: 'max-content', maxWidth: '90vw',
                                        animation: 'slideDownFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                                    }}>
                                        <style>{`
                                        @keyframes slideDownFadeIn {
                                            from { opacity: 0; transform: translate(-50%, -20px); }
                                            to { opacity: 1; transform: translate(-50%, 0); }
                                        }
                                    `}</style>
                                        <div style={{ color: '#d97706', marginTop: '2px' }}>
                                            <WarningIcon />
                                        </div>
                                        <div>
                                            <div style={{ color: '#b45309', fontWeight: 800, fontSize: '14px', marginBottom: '4px' }}>Session Expiring Soon</div>
                                            <div style={{ color: '#b45309', fontSize: '12px', lineHeight: 1.5, fontWeight: 500, maxWidth: '280px' }}>
                                                Your parking time is almost up. Please exit before the booked time to avoid late departure surcharges.
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Stats Grid */}
                                <div className="stat-grid s-in-1">
                                    <div className="stat-card blue">
                                        <div className="stat-label blue" style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                                <TimerIcon /> Parking Duration
                                            </div>
                                        </div>
                                        <div className="stat-value blue">{formatHMS(Math.max(0, elapsed))}</div>
                                        <div className="stat-sub blue" style={{ marginBottom: '12px' }}>Hours : Mins : Secs</div>
                                        {isOvertime ? (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '9px', color: '#ef4444', background: '#fef2f2', padding: '4px 10px', borderRadius: '12px', width: 'fit-content', margin: '0 auto', border: '1px solid #fecaca' }}>
                                                <div style={{ width: '6px', height: '6px', backgroundColor: '#ef4444', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                                                OVERTIME
                                            </div>
                                        ) : isExpiringSoon ? (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '9px', color: '#d97706', background: '#fffbeb', padding: '4px 10px', borderRadius: '12px', width: 'fit-content', margin: '0 auto', border: '1px solid #fde68a' }}>
                                                <div style={{ width: '6px', height: '6px', backgroundColor: '#d97706', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                                                EXPIRING SOON
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '9px', color: '#10b981', background: '#ecfdf5', padding: '4px 10px', borderRadius: '12px', width: 'fit-content', margin: '0 auto' }}>
                                                <div style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                                                ACTIVE
                                            </div>
                                        )}
                                    </div>

                                    <div className="stat-card green">
                                        <div className="stat-label green" style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                                <CardIcon /> Current Fee
                                            </div>
                                        </div>
                                        <div className="stat-value green" style={{ color: '#059669' }}>
                                            {fmtVND(currentFee)}
                                        </div>
                                    </div>
                                </div>

                                {/* Details Card */}
                                <div className="s-card s-in-2">
                                    <div className="location-row">
                                        <div className="location-icon">
                                            <PinIcon />
                                        </div>
                                        <div>
                                            <div className="location-label">Parking Spot</div>
                                            <div className="location-value">{floorName} — {slotCode}</div>
                                            {zoneName && zoneName !== 'N/A' && (
                                                <div className="location-sub">Zone {zoneName}</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="details-grid">
                                        <div>
                                            <div className="detail-item-label">Parking Lot</div>
                                            <div className="detail-item-value">{spot.title}</div>
                                        </div>
                                        {spot.code && (
                                            <div>
                                                <div className="detail-item-label">Parking Code</div>
                                                <div className="detail-item-value">{spot.code}</div>
                                            </div>
                                        )}
                                        {slotData?.features?.hasEVCharger && (
                                            <div>
                                                <div className="detail-item-label">Features</div>
                                                <div className="detail-item-value" style={{ color: '#10b981' }}>⚡ EV Charging</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Pricing Summary */}
                                    <div className="pricing-details">
                                        <div className="pricing-row">
                                            <span className="pricing-label">Surcharge (4-hour block)</span>
                                            <span className="pricing-value" style={{ color: '#2563eb' }}>{fmtVND(blockRate)} / block</span>
                                        </div>
                                        <div className="pricing-row">
                                            <span className="pricing-label">Night Surcharge (4-hour block)</span>
                                            <span className="pricing-value" style={{ color: '#2563eb' }}>{fmtVND(resolvedNightBlockRate)} / block</span>
                                        </div>
                                        {earlyOtFee > 0 && (
                                            <div className="pricing-row">
                                                <span className="pricing-label">Early Arrival Surcharge</span>
                                                <span className="pricing-value" style={{ color: '#b45309' }}>{fmtVND(earlyOtFee)}</span>
                                            </div>
                                        )}
                                        {lateOtFee > 0 && (
                                            <div className="pricing-row">
                                                <span className="pricing-label">Late Departure Surcharge</span>
                                                <span className="pricing-value" style={{ color: '#b45309' }}>{fmtVND(lateOtFee)}</span>
                                            </div>
                                        )}
                                        {vehicleTypeData?.pricing?.dailyRate && (
                                            <div className="pricing-row">
                                                <span className="pricing-label">Daily Max Rate</span>
                                                <span className="pricing-value" style={{ color: '#64748b', fontSize: '13px' }}>
                                                    {fmtVND(vehicleTypeData.pricing.dailyRate)} / day
                                                </span>
                                            </div>
                                        )}
                                        {advancePayment > 0 && (
                                            <div className="pricing-row">
                                                <span className="pricing-label" style={{ color: '#10b981' }}>Prepaid (Booking)</span>
                                                <span className="pricing-value" style={{ color: '#10b981' }}>
                                                    - {fmtVND(advancePayment)}
                                                </span>
                                            </div>
                                        )}
                                        {baseUnpaidFee > 0 && (
                                            <div className="pricing-row">
                                                <span className="pricing-label" style={{ color: '#b45309', fontWeight: 600 }}>Unpaid Base Fee</span>
                                                <span className="pricing-value" style={{ color: '#b45309', fontWeight: 700 }}>
                                                    {fmtVND(baseUnpaidFee)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Surcharge Logs */}
                                <div className="s-card s-in-3" style={{ padding: '20px' }}>
                                    <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <TimerIcon /> Surcharge Logs
                                    </h4>
                                    {feeLogs.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
                                            {feeLogs.map((log, i) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, paddingBottom: 8, borderBottom: i < feeLogs.length - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: log.type === 'early' ? '#b45309' : '#ef4444' }}>{log.label}</div>
                                                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                                            {log.timestamp.toLocaleDateString('vi-VN')} {log.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>
                                                        + {fmtVND(log.amount)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ padding: '12px 0 4px', textAlign: 'center' }}>
                                            <div style={{ color: '#10b981', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                                                No Surcharges Incurred
                                            </div>
                                            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                                                You are parking within the valid schedule.
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Notice */}
                                <div className="notice-card s-in-3">
                                    <WarningIcon />
                                    <div>
                                        <div className="notice-title">Fee Policy & Notice</div>
                                        <div className="notice-text">
                                            <strong>Early Arrival:</strong> Check-in is allowed up to 15 mins before booked time. Arriving earlier incurs surcharges.<br />
                                            <strong>Late Departure:</strong> Surcharges apply immediately if parked past the booked exit time.
                                        </div>
                                    </div>
                                </div>


                            </div>
                        )}
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
                        <h3 style={{ margin: '0 0 24px 0', color: '#0f172a', fontSize: '20px', fontWeight: 800 }}>QR Checkout</h3>
                        {qrValue && (
                            <div style={{ background: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <QRCodeSVG
                                    id="session-qr-svg"
                                    value={qrValue}
                                    size={Math.min(window.innerWidth - 100, 320)}
                                    bgColor="#ffffff"
                                    fgColor="#0f172a"
                                    level="L"
                                    includeMargin={false}
                                />
                            </div>
                        )}
                        <p style={{ marginTop: '24px', color: '#64748b', fontSize: '14px', textAlign: 'center', maxWidth: '300px', marginBottom: '24px' }}>
                            Show this code to the staff or scan at the checkpoint to confirm the vehicle.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                            <button
                                className="btn-secondary"
                                style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0' }}
                                onClick={() => {
                                    const svg = document.getElementById('session-qr-svg');
                                    if (!svg) return;
                                    const svgData = new XMLSerializer().serializeToString(svg);
                                    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `Parking_QR_${sessionCode || 'Checkout'}.svg`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                Download QR
                            </button>
                            <button
                                className="btn-primary"
                                style={{ width: '100%', padding: '14px' }}
                                onClick={() => setShowQrModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Surcharge Payment Modal ── */}
            {showSurchargeModal && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99998, padding: 20 }}
                    onClick={() => { setShowSurchargeModal(false); setSurchargePolling(false); setSurchargePhase('method'); }}
                >
                    <div
                        style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 460, overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {surchargePhase === 'method' ? (
                            <>
                                {/* Header */}
                                <div style={{ padding: '28px 28px 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                        <span style={{ fontSize: 22 }}>💳</span>
                                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Pay Surcharge</h2>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>Select payment method to pay the surcharge fee.</p>
                                </div>

                                {/* Payment methods */}
                                <div style={{ padding: '20px 28px' }}>
                                    {[
                                        { id: 'bank_transfer', icon: '🏦', label: 'Bank Transfer (VietQR)', sub: 'Scan VietQR code to pay via Banking App' },
                                    ].map(m => (
                                        <div
                                            key={m.id}
                                            onClick={() => setSurchargePayMethod(m.id as any)}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 14, border: `2px solid ${surchargePayMethod === m.id ? '#3b82f6' : '#e2e8f0'}`, background: surchargePayMethod === m.id ? '#eff6ff' : '#fff', marginBottom: 10, cursor: 'pointer', transition: 'all 0.15s' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                <span style={{ fontSize: 24, flexShrink: 0 }}>{m.icon}</span>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{m.label}</div>
                                                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{m.sub}</div>
                                                </div>
                                            </div>
                                            <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${surchargePayMethod === m.id ? '#3b82f6' : '#cbd5e1'}`, background: surchargePayMethod === m.id ? '#3b82f6' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {surchargePayMethod === m.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Amount summary */}
                                <div style={{ margin: '0 28px 20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', fontWeight: 700 }}>Surcharge Fee</div>
                                        <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>{fmtVND(amountDue)}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#2563eb', fontWeight: 700 }}>Total Due</div>
                                        <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>{fmtVND(amountDue)}</div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ padding: '0 28px 28px', display: 'flex', gap: 12 }}>
                                    <button
                                        onClick={() => { setShowSurchargeModal(false); setSurchargePhase('method'); }}
                                        style={{ flex: 1, padding: '14px', borderRadius: 14, border: '2px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleConfirmSurchargePayment}
                                        disabled={surchargeProcessing}
                                        style={{ flex: 2, padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', fontWeight: 800, fontSize: 15, cursor: surchargeProcessing ? 'wait' : 'pointer', opacity: surchargeProcessing ? 0.7 : 1 }}
                                    >
                                        {surchargeProcessing ? 'Processing...' : 'Confirm Payment'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* QR Phase */}
                                <div style={{ padding: '28px 28px 0' }}>
                                    <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Payment</h2>
                                    <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>Scan to complete payment</p>
                                </div>
                                <div style={{ padding: 28, textAlign: 'center' }}>
                                    <div style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', borderRadius: 20, padding: 24, border: '1px solid #bfdbfe' }}>
                                        <div style={{ fontWeight: 800, fontSize: 17, color: '#1d4ed8', marginBottom: 20 }}>Scan to Pay via VietQR</div>
                                        <div style={{ background: '#fff', padding: 16, borderRadius: 16, display: 'inline-block', boxShadow: '0 8px 24px rgba(37,99,235,0.15)', marginBottom: 16 }}>
                                            {surchargeBankInfo?.qrUrl
                                                ? <img src={surchargeBankInfo.qrUrl} alt="VietQR" style={{ width: 200, height: 200, objectFit: 'contain', display: 'block' }} />
                                                : <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Loading...</div>
                                            }
                                        </div>
                                        <div style={{ fontSize: 13, color: '#475569', background: '#fff', padding: '12px 16px', borderRadius: 10, border: '1px dashed #93c5fd', wordBreak: 'break-all' }}>
                                            Transfer Content: <strong style={{ color: '#1e293b', fontSize: 16, letterSpacing: 1 }}>{surchargeBankInfo?.transferContent}</strong>
                                        </div>
                                        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                            <div style={{ width: 16, height: 16, border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                            <span style={{ fontSize: 13, color: '#2563eb', fontWeight: 600 }}>Waiting for payment confirmation...</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setShowSurchargeModal(false); setSurchargePolling(false); setSurchargePhase('method'); }}
                                        style={{ marginTop: 20, width: '100%', padding: '14px', borderRadius: 14, border: '2px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* \u2500\u2500 Payment Success Toast \u2500\u2500 */}
            {showPaySuccessToast && (
                <div style={{
                    position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 100000, background: '#10b981', color: '#fff',
                    padding: '14px 28px', borderRadius: 100, fontWeight: 700, fontSize: 15,
                    boxShadow: '0 10px 30px rgba(16,185,129,0.4)',
                    display: 'flex', alignItems: 'center', gap: 10,
                    animation: 'fadeSlideIn 0.4s ease-out'
                }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Payment successful!
                </div>
            )}
        </>
    );
};

export default SessionPage;
