import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Header from '../../components/Header/Header';
import { createQRToken } from '../../utils/qrToken';
import parkingSessionService, { ParkingSession } from '../../services/api/parkingSessionService';
import bookingService from '../../services/api/bookingService';
import { useSocket } from '../../contexts/SocketContext';

interface Ticket {
    receiptId: string;
    bookingId?: string;
    spot: {
        _id?: string;
        title: string;
        price?: number;
    };
    vehicleType: string;
    floorName: string;
    slotCode: string;
    licensePlate: string;
    entryDate: string;
    exitTime: string;
    elapsed: number;
    totalAmount: number;
    payMethod?: string;
}

// ── Live timer hook ─────────────────────────────────────────────────────────
function useLiveElapsed(entryTime: string | undefined) {
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        if (!entryTime) return;
        const update = () => setElapsed(Math.floor((Date.now() - new Date(entryTime).getTime()) / 1000));
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [entryTime]);
    return elapsed;
}

const getVehicleEmoji = (code: string) => {
    const c = (code || '').toUpperCase();
    if (c.includes('TRUCK') || c.includes('TAI')) return '🚛';
    if (c.includes('BIKE') || c.includes('BICYCLE')) return '🚲';
    if (c.includes('ELECTRIC')) return '⚡';
    if (c.includes('MOTOR') || c.includes('MOTO') || c.includes('SCOOTER') || c.includes('MAY')) return '🏍️';
    return '🚗';
};

// ── A single session card with its own live clock ───────────────────────────
const LiveSessionCard = ({ session, onClick }: { session: ParkingSession; onClick: () => void }) => {
    const elapsed = useLiveElapsed(session.entryTime);
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    const hms = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    const hourlyRate =
        typeof session.vehicleType === 'object'
            ? (session.vehicleType as any)?.pricing?.hourlyRate ?? 0
            : 0;
    const currentFee = (elapsed / 3600) * hourlyRate;

    const slotCode =
        typeof session.slot === 'object' ? (session.slot as any)?.slotCode ?? '—' : '—';
    const floorName =
        typeof session.floor === 'object'
            ? (session.floor as any)?.name ?? `Floor ${(session.floor as any)?.floorNumber}`
            : '—';
    const zoneName =
        typeof session.zone === 'object' ? (session.zone as any)?.name ?? '' : '';
    const plate = session.vehicleInfo?.licensePlate ?? '—';
    const vtName =
        typeof session.vehicleType === 'object' ? (session.vehicleType as any)?.name ?? '' : '';
    const parkingLotName =
        typeof session.parkingLot === 'object' ? (session.parkingLot as any)?.name ?? '' : '';

    return (
        <div className="t-list-item" onClick={onClick}>
            <div className="t-list-item-left">
                <div className="t-list-item-icon">
                    {getVehicleEmoji(vtName)}
                </div>
                <div className="t-list-item-info">
                    <h3 className="t-list-item-title">{parkingLotName || 'Bãi Đỗ Xe'}</h3>
                    <div className="t-list-item-subtitle">
                        <span>Plate: <strong style={{ color: '#334155' }}>{plate}</strong></span>
                        <span className="t-list-item-meta">{floorName} — {slotCode}</span>
                        <span style={{ color: '#cbd5e1' }}>|</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                            <span className="ls-pulse-dot" style={{ width: 6, height: 6 }} />
                            <span style={{ color: '#2563eb' }}>{hms}</span>
                        </span>
                    </div>
                </div>
            </div>
            <div className="t-list-item-right" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="t-badge" style={{ background: '#dcfce7', color: '#15803d' }}>
                        LIVE
                    </span>
                    <strong style={{ fontSize: 14, color: '#10b981' }}>{new Intl.NumberFormat('vi-VN').format(Math.round(currentFee))} ₫</strong>
                </div>
                <button className="t-list-item-btn" onClick={(e) => { e.stopPropagation(); onClick(); }}>Xem chi tiết</button>
            </div>
        </div>
    );
};

const MyTicketsPage = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [qrTokens, setQrTokens] = useState<Record<string, string>>({});
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [zoomedQr, setZoomedQr] = useState<string | null>(null);

    // ── DATA FETCHING ─────────────────────────────────────────────────────────
    const { socket } = useSocket();
    const [activeSessions, setActiveSessions] = useState<ParkingSession[]>([]);

    // ── TỰ ĐỘNG CHUYỂN SANG SESSION PAGE KHI STAFF QUÉT VÉ VÀO ──────────────
    useEffect(() => {
        if (!socket) return;
        const handleCheckin = (notif: any) => {
            if (notif.type === 'checkin_success') {
                const sid = notif.data?.sessionId;
                if (sid) {
                    setSelectedTicket(null); // Đóng modal nếu đang mở
                    navigate('/session', { state: { sessionId: sid } });
                }
            }
        };
        socket.on('newNotification', handleCheckin);
        return () => {
            socket.off('newNotification', handleCheckin);
        };
    }, [socket, navigate]);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [sessionsError, setSessionsError] = useState<string | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchActiveSessions = useCallback(async () => {
        try {
            const res = await parkingSessionService.getSessions({ status: 'active', limit: 10 });
            const list: ParkingSession[] = Array.isArray(res)
                ? res
                : (res?.data ?? res?.docs ?? []);
            setActiveSessions(list);
            setSessionsError(null);
        } catch (err: any) {
            // silently fail on polling — only show error on first load
            setSessionsError(err?.response?.data?.message ?? err?.message ?? 'Failed to load sessions');
        } finally {
            setSessionsLoading(false);
        }
    }, []);

    const fetchUpcomingBookings = useCallback(async () => {
        setBookingsLoading(true);
        try {
            // Fetch all recent bookings and filter valid ones manually to support multiple statuses
            const res = await bookingService.getMyBookings({ limit: 50 });
            let list = Array.isArray(res) ? res : (res?.data ?? res?.docs ?? []);

            // Only show bookings that are pending (e.g. newly created) or approved
            list = list.filter((b: any) => b.status === 'pending' || b.status === 'approved');

            // Map backend booking objects to our local Ticket interface for rendering
            const mappedTickets: Ticket[] = list.map((b: any) => {
                const lotName = typeof b.parkingLot === 'object' ? b.parkingLot?.name : 'Parking Lot';
                const floorName = typeof b.floor === 'object' ? (b.floor?.name ?? `Floor ${b.floor?.floorNumber}`) : '—';
                const slotCode = typeof b.assignedSlot === 'object' ? b.assignedSlot?.slotCode : '—';
                const vTypeName = typeof b.vehicleType === 'object' ? b.vehicleType?.name : 'Vehicle';

                // Combine date and time strings into valid ISO strings
                const parseDateTime = (dStr: string, tStr: string) => {
                    if (!dStr || !tStr) return new Date().toISOString();
                    const d = new Date(dStr);
                    const [hh, mm] = tStr.split(':').map(Number);
                    if (!isNaN(hh)) d.setHours(hh);
                    if (!isNaN(mm)) d.setMinutes(mm);
                    return d.toISOString();
                };

                return {
                    receiptId: b.bookingCode || b._id,
                    bookingId: b._id,
                    spot: { title: lotName },
                    vehicleType: vTypeName,
                    floorName: floorName,
                    slotCode: slotCode,
                    licensePlate: b.vehicleInfo?.licensePlate || '—',
                    entryDate: parseDateTime(b.scheduledDate, b.startTime),
                    exitTime: parseDateTime(b.scheduledDate, b.endTime || b.startTime),
                    elapsed: 0,
                    totalAmount: b.estimatedFee || 0,
                    payMethod: b.paymentMethod || 'card',
                };
            });

            setTickets(mappedTickets);
        } catch (err) {
            console.error("Failed to load upcoming bookings:", err);
        } finally {
            setBookingsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchActiveSessions();
        fetchUpcomingBookings();
        // Poll every 15 s so the list stays fresh
        pollRef.current = setInterval(fetchActiveSessions, 15000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [fetchActiveSessions, fetchUpcomingBookings]);

    // ── REALTIME INTEGRATION (LIVE SESSION TRACKER) ───────────────────────────
    useEffect(() => {
        if (!socket) return;

        const handleNotification = (notif: any) => {
            if (notif.type === 'checkin_success' || notif.type === 'checkout_success' || notif.type === 'payment_success') {
                console.log('[Live Tracker] Received realtime update:', notif.type);
                fetchActiveSessions();
                fetchUpcomingBookings();
            }
        };

        socket.on('newNotification', handleNotification);
        return () => {
            socket.off('newNotification', handleNotification);
        };
    }, [socket, fetchActiveSessions, fetchUpcomingBookings]);

    // ── Upcoming bookings from Backend ──────────────────────────────────────
    const [bookingsLoading, setBookingsLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            setBookingsLoading(true);
            try {
                // Fetch all recent bookings and filter valid ones manually to support multiple statuses
                const res = await bookingService.getMyBookings({ limit: 50 });
                let list = Array.isArray(res) ? res : (res?.data ?? res?.docs ?? []);

                // Only show bookings that are pending (e.g. newly created) or approved
                list = list.filter((b: any) => b.status === 'pending' || b.status === 'approved');

                // Map backend booking objects to our local Ticket interface for rendering
                const mappedTickets: Ticket[] = list.map((b: any) => {
                    const lotName = typeof b.parkingLot === 'object' ? b.parkingLot?.name : 'Parking Lot';
                    const floorName = typeof b.floor === 'object' ? (b.floor?.name ?? `Floor ${b.floor?.floorNumber}`) : '—';
                    const slotCode = typeof b.assignedSlot === 'object' ? b.assignedSlot?.slotCode : '—';
                    const vTypeName = typeof b.vehicleType === 'object' ? b.vehicleType?.name : 'Vehicle';

                    // Combine date and time strings into valid ISO strings
                    const parseDateTime = (dStr: string, tStr: string) => {
                        if (!dStr || !tStr) return new Date().toISOString();
                        const d = new Date(dStr);
                        const [hh, mm] = tStr.split(':').map(Number);
                        if (!isNaN(hh)) d.setHours(hh);
                        if (!isNaN(mm)) d.setMinutes(mm);
                        return d.toISOString();
                    };

                    return {
                        receiptId: b.bookingCode || b._id,
                        bookingId: b._id,
                        spot: { title: lotName },
                        vehicleType: vTypeName,
                        floorName: floorName,
                        slotCode: slotCode,
                        licensePlate: b.vehicleInfo?.licensePlate || '—',
                        entryDate: parseDateTime(b.scheduledDate, b.startTime),
                        exitTime: parseDateTime(b.scheduledDate, b.endTime || b.startTime),
                        elapsed: 0,
                        totalAmount: b.estimatedFee || 0,
                        payMethod: b.paymentMethod || 'card',
                    };
                });

                setTickets(mappedTickets);
            } catch (err) {
                console.error("Failed to load upcoming bookings:", err);
            } finally {
                setBookingsLoading(false);
            }
        };

        fetchBookings();
    }, []);

    useEffect(() => {
        if (tickets.length === 0) return;
        const generateTokens = async () => {
            const entries = await Promise.all(
                tickets.map(async (t) => {
                    const token = await createQRToken({
                        bookingId: t.bookingId ?? t.receiptId,
                        receiptId: t.receiptId,
                        licensePlate: t.licensePlate,
                        slotCode: t.slotCode,
                    });
                    return [t.receiptId, token] as [string, string];
                })
            );
            setQrTokens(Object.fromEntries(entries));
        };
        generateTokens();
    }, [tickets]);

    const handleRemoveTicket = async (receiptId: string, bookingId?: string) => {
        if (window.confirm('Do you want to cancel this booking? This action cannot be undone.')) {
            if (bookingId) {
                try {
                    await bookingService.cancel(bookingId, 'Cancelled by user from My Tickets');
                    setTickets(prev => prev.filter(t => t.receiptId !== receiptId));
                    setSelectedTicket(null);
                    alert('Booking cancelled successfully.');
                } catch (e: any) {
                    alert('Failed to cancel booking: ' + (e?.response?.data?.message || e.message));
                }
            }
        }
    };

    const downloadQR = useCallback((receiptId: string, licensePlate: string) => {
        const svgEl = document.getElementById(`qr-svg-${receiptId}`)?.querySelector('svg');
        if (!svgEl) return;
        const SIZE = 400;
        const serialiser = new XMLSerializer();
        const svgStr = serialiser.serializeToString(svgEl);
        const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = SIZE; canvas.height = SIZE;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, SIZE, SIZE);
            ctx.drawImage(img, 0, 0, SIZE, SIZE);
            URL.revokeObjectURL(url);
            const pngUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = `parking-ticket-${licensePlate}-${receiptId}.png`;
            a.click();
        };
        img.src = url;
    }, []);

    const fmtVND = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n)) + ' ₫';

    const fmtDateTime = (iso: string) => {
        const d = new Date(iso);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };



    const getPayMethodLabel = (method: string) => {
        switch (method) {
            case 'card': return 'Credit Card';
            case 'momo': return 'MoMo Wallet';
            case 'zalopay': return 'ZaloPay';
            case 'cash': return 'Cash at Counter';
            default: return method;
        }
    };

    const handleOpenSession = (session: ParkingSession) => {
        const vtObj = typeof session.vehicleType === 'object' ? session.vehicleType as any : null;
        const floorObj = typeof session.floor === 'object' ? session.floor as any : null;
        const zoneObj = typeof session.zone === 'object' ? session.zone as any : null;
        const slotObj = typeof session.slot === 'object' ? session.slot as any : null;
        const lotObj = typeof session.parkingLot === 'object' ? session.parkingLot as any : null;

        navigate('/session', {
            state: {
                sessionId: session._id,
                spot: { title: lotObj?.name ?? 'Bãi Đỗ Xe', _id: lotObj?._id },
                vehicleType: vtObj,
                floor: floorObj,
                zone: zoneObj,
                slot: slotObj,
                licensePlate: session.vehicleInfo?.licensePlate,
                session: session,
            },
        });
    };

    const hasActiveSessions = activeSessions.length > 0;
    const hasTickets = tickets.length > 0;
    const isEmpty = !hasActiveSessions && !hasTickets && !sessionsLoading;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }

                .t-root {
                    min-height: 100vh;
                    background: linear-gradient(160deg, #f0f4ff 0%, #f8fafc 50%, #f0fdf4 100%);
                    font-family: 'Inter', 'Segoe UI', sans-serif;
                    color: #0f172a;
                }

                .t-container {
                    max-width: 860px;
                    margin: 0 auto;
                    padding: 40px 20px 100px;
                }

                .t-header-title {
                    font-size: 28px;
                    font-weight: 900;
                    color: #0f172a;
                    letter-spacing: -0.5px;
                    margin-bottom: 8px;
                }

                .t-header-sub {
                    font-size: 14px;
                    color: #64748b;
                    font-weight: 500;
                    margin-bottom: 36px;
                }

                /* ── Section heading ── */
                .t-section-heading {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 16px;
                    margin-top: 8px;
                }
                .t-section-title {
                    font-size: 16px;
                    font-weight: 800;
                    color: #0f172a;
                }
                .t-section-count {
                    font-size: 12px;
                    font-weight: 700;
                    padding: 2px 10px;
                    border-radius: 20px;
                    background: #f1f5f9;
                    color: #475569;
                }
                .t-section-count.live {
                    background: #dcfce7;
                    color: #15803d;
                }
                .t-section-divider {
                    height: 1px;
                    background: #e2e8f0;
                    margin: 32px 0 24px;
                }

                /* ═══════════════════════════════════════════════════════════
                   LIVE SESSION CARD
                ═══════════════════════════════════════════════════════════ */
                .ls-card {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1e3a5f 100%);
                    border-radius: 20px;
                    overflow: hidden;
                    cursor: pointer;
                    margin-bottom: 16px;
                    transition: transform 0.25s ease, box-shadow 0.25s ease;
                    box-shadow: 0 8px 32px rgba(15,23,42,0.25), 0 0 0 1px rgba(255,255,255,0.06);
                    position: relative;
                }
                .ls-card::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(ellipse at top left, rgba(59,130,246,0.15) 0%, transparent 60%),
                                radial-gradient(ellipse at bottom right, rgba(16,185,129,0.12) 0%, transparent 60%);
                    pointer-events: none;
                }
                .ls-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 16px 48px rgba(15,23,42,0.35), 0 0 0 1px rgba(255,255,255,0.1);
                }
                .ls-card:active { transform: scale(0.99); }

                /* Live badge */
                .ls-live-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    margin: 18px 20px 0;
                    background: rgba(16,185,129,0.2);
                    border: 1px solid rgba(16,185,129,0.4);
                    border-radius: 20px;
                    padding: 5px 12px;
                    font-size: 11px;
                    font-weight: 800;
                    color: #34d399;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                }
                .ls-pulse-dot {
                    width: 8px;
                    height: 8px;
                    background: #10b981;
                    border-radius: 50%;
                    box-shadow: 0 0 0 0 rgba(16,185,129,0.6);
                    animation: lsPulse 1.6s ease-in-out infinite;
                }
                @keyframes lsPulse {
                    0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.7); }
                    70%  { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
                    100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
                }

                /* Card body */
                .ls-card-body {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 20px;
                    padding: 16px 20px 20px;
                }

                /* Info side */
                .ls-info { flex: 1; }
                .ls-lot-name {
                    font-size: 18px;
                    font-weight: 900;
                    color: white;
                    letter-spacing: -0.2px;
                    margin-bottom: 6px;
                    line-height: 1.2;
                }
                .ls-plate {
                    font-size: 22px;
                    font-weight: 900;
                    color: #93c5fd;
                    letter-spacing: 0.08em;
                    font-family: 'Courier New', monospace;
                    margin-bottom: 10px;
                }
                .ls-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-bottom: 8px;
                }
                .ls-meta-chip {
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.15);
                    border-radius: 8px;
                    padding: 4px 10px;
                    font-size: 12px;
                    font-weight: 700;
                    color: rgba(255,255,255,0.75);
                }
                .ls-slot-chip {
                    background: rgba(59,130,246,0.2);
                    border-color: rgba(59,130,246,0.35);
                    color: #93c5fd;
                }
                .ls-vt {
                    font-size: 12px;
                    font-weight: 600;
                    color: rgba(255,255,255,0.45);
                }

                /* Stats side */
                .ls-stats {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    flex-shrink: 0;
                    min-width: 140px;
                    text-align: right;
                }
                .ls-stat-box {
                    border-radius: 12px;
                    padding: 12px 14px;
                }
                .ls-stat-time {
                    background: rgba(59,130,246,0.18);
                    border: 1px solid rgba(59,130,246,0.3);
                }
                .ls-stat-fee {
                    background: rgba(16,185,129,0.18);
                    border: 1px solid rgba(16,185,129,0.3);
                }
                .ls-stat-label {
                    font-size: 10px;
                    font-weight: 700;
                    color: rgba(255,255,255,0.5);
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    margin-bottom: 4px;
                }
                .ls-stat-value {
                    font-size: 20px;
                    font-weight: 900;
                    color: #93c5fd;
                    font-variant-numeric: tabular-nums;
                    letter-spacing: 0.02em;
                }
                .ls-fee-value { color: #6ee7b7; font-size: 16px; }

                /* CTA bar */
                .ls-cta {
                    background: rgba(59,130,246,0.15);
                    border-top: 1px solid rgba(59,130,246,0.2);
                    padding: 12px 20px;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    font-size: 13px;
                    font-weight: 700;
                    color: #93c5fd;
                    transition: background 0.2s;
                }
                .ls-card:hover .ls-cta { background: rgba(59,130,246,0.25); }

                /* Sessions loading / error */
                .ls-loading {
                    background: white;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    padding: 20px 24px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #64748b;
                    margin-bottom: 16px;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .ls-spinner {
                    width: 18px; height: 18px;
                    border: 2.5px solid #e2e8f0;
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                    flex-shrink: 0;
                }
                .ls-error {
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    border-radius: 12px;
                    padding: 14px 18px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #ef4444;
                    margin-bottom: 16px;
                }

                /* ═══════════════════════════════════════════════════════════
                   UPCOMING TICKET LIST (existing)
                ═══════════════════════════════════════════════════════════ */
                .t-list { display: flex; flex-direction: column; gap: 14px; }
                .t-list-item {
                    background: white;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    padding: 18px 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .t-list-item:hover {
                    border-color: #cbd5e1;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.05);
                }
                .t-list-item-left { display: flex; align-items: center; gap: 16px; flex: 1; }
                .t-list-item-icon {
                    width: 48px; height: 48px;
                    border-radius: 12px;
                    background: #eff6ff;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 22px;
                }
                .t-list-item-info { display: flex; flex-direction: column; gap: 4px; }
                .t-list-item-title { font-size: 16px; font-weight: 800; color: #0f172a; }
                .t-list-item-subtitle {
                    display: flex; align-items: center; flex-wrap: wrap;
                    gap: 12px; font-size: 13px; color: #64748b; font-weight: 500;
                }
                .t-list-item-meta {
                    font-size: 12px; font-weight: 700; color: #2563eb;
                    background: #f0f6ff; padding: 3px 8px; border-radius: 6px;
                }
                .t-list-item-right { display: flex; align-items: center; gap: 16px; }
                .t-badge {
                    background: #dcfce7; color: #15803d;
                    padding: 6px 12px; border-radius: 9999px;
                    font-size: 11px; font-weight: 800;
                    text-transform: uppercase; letter-spacing: 0.05em;
                }
                .t-badge.unpaid {
                    background: #fef3c7; color: #d97706;
                }
                .t-list-item-btn {
                    padding: 8px 16px; border-radius: 10px;
                    background: #2563eb; color: white;
                    font-size: 13px; font-weight: 700; border: none;
                    cursor: pointer; transition: all 0.2s;
                }
                .t-list-item-btn:hover { background: #1d4ed8; }

                /* ── Empty State ── */
                .t-empty-card {
                    background: white; border-radius: 24px;
                    border: 1px solid #e2e8f0; padding: 60px 40px;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.02);
                    max-width: 500px; margin: 40px auto 0;
                }
                .t-empty-icon {
                    font-size: 64px; margin-bottom: 20px; display: block;
                    animation: floatIcon 3s ease-in-out infinite;
                }
                @keyframes floatIcon {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                .t-empty-title { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
                .t-empty-desc { font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 24px; }
                .t-empty-btn {
                    background: #2563eb; color: white; border: none;
                    padding: 14px 28px; border-radius: 12px;
                    font-size: 14px; font-weight: 800; cursor: pointer;
                    transition: all 0.2s; box-shadow: 0 4px 14px rgba(37,99,235,0.3);
                }
                .t-empty-btn:hover {
                    background: #1d4ed8; transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(37,99,235,0.4);
                }

                /* ── Modal ── */
                .t-modal-overlay {
                    position: fixed; inset: 0;
                    background: rgba(15,23,42,0.6);
                    backdrop-filter: blur(4px);
                    display: flex; justify-content: center; align-items: center;
                    z-index: 1000; padding: 20px;
                }
                .t-modal-content {
                    width: 100%; max-width: 440px;
                    animation: tModalScale 0.25s cubic-bezier(0.34,1.56,0.64,1);
                    position: relative;
                }
                @keyframes tModalScale {
                    from { transform: scale(0.95); opacity: 0; }
                    to   { transform: scale(1);    opacity: 1; }
                }
                .t-modal-close-btn {
                    position: absolute; top: 16px; right: 16px;
                    width: 32px; height: 32px; border-radius: 50%;
                    background: rgba(255,255,255,0.9);
                    border: 1px solid #e2e8f0; color: #64748b;
                    font-size: 18px; font-weight: bold; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s; z-index: 1010;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                }
                .t-modal-close-btn:hover {
                    background: #f1f5f9; color: #0f172a; transform: scale(1.05);
                }
                .t-card {
                    background: white; border-radius: 24px;
                    border: 1px solid #e2e8f0; overflow: hidden;
                    box-shadow: 0 10px 30px -5px rgba(0,0,0,0.05);
                    display: flex; flex-direction: column; position: relative;
                }
                .t-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
                }
                .t-modal-content .t-card {
                    transform: none !important;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25) !important;
                }
                .t-card-top { padding: 24px 24px 16px; border-bottom: 2px dashed #f1f5f9; flex: 1; }
                .t-card-header {
                    display: flex; justify-content: space-between;
                    align-items: flex-start; margin-bottom: 16px;
                }
                .t-spot-title { font-size: 16px; font-weight: 850; color: #0f172a; line-height: 1.3; max-width: 70%; }
                .t-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
                .t-info-item { display: flex; flex-direction: column; }
                .t-info-label { font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
                .t-info-value { font-size: 13px; font-weight: 700; color: #334155; }
                .t-info-value.highlight { color: #2563eb; }
                .t-card-bottom {
                    background: #f8fafc; padding: 24px;
                    display: flex; flex-direction: column; align-items: center;
                    border-top: 1px solid #f1f5f9; z-index: 1;
                }
                .t-qr-label {
                    font-size: 11px; font-weight: 700; color: #64748b;
                    text-transform: uppercase; letter-spacing: 0.06em;
                    margin-bottom: 10px; display: flex; align-items: center; gap: 6px;
                }
                .t-qr-container {
                    background: white; padding: 12px; border-radius: 16px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #e2e8f0;
                    margin-bottom: 16px; display: inline-block;
                    cursor: pointer; transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
                }
                .t-qr-container:hover {
                    transform: scale(1.04);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.06);
                }
                .t-qr-expiry { font-size: 10px; color: #94a3b8; font-weight: 600; margin-top: 8px; margin-bottom: 16px; }
                .t-receipt-id { font-family: monospace; font-size: 12px; font-weight: 800; color: #64748b; letter-spacing: 0.08em; margin-bottom: 16px; }
                .t-action-btn {
                    width: 100%; background: #fee2e2; color: #ef4444;
                    border: 1px solid #fca5a5; padding: 12px; border-radius: 12px;
                    font-size: 12px; font-weight: 800; cursor: pointer; transition: all 0.2s;
                }
                .t-action-btn:hover { background: #ef4444; color: white; border-color: #ef4444; }
                .t-download-btn {
                    display: inline-flex; align-items: center; gap: 6px;
                    margin-top: 6px; margin-bottom: 4px;
                    padding: 7px 16px; border-radius: 10px;
                    border: 1.5px solid #e2e8f0; background: white;
                    color: #2563eb; font-size: 12px; font-weight: 700;
                    cursor: pointer; transition: all 0.18s; letter-spacing: 0.02em;
                }
                .t-download-btn:hover {
                    background: #eff6ff; border-color: #93c5fd;
                    transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,99,235,0.12);
                }

                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }

                @media (max-width: 640px) {
                    .ls-card-body { flex-direction: column; }
                    .ls-stats { flex-direction: row; min-width: unset; text-align: left; }
                    .ls-stat-value { font-size: 16px; }
                    .t-list-item { flex-direction: column; align-items: flex-start; gap: 14px; }
                    .t-list-item-right { width: 100%; justify-content: space-between; }
                }
            `}</style>

            <div className="t-root">
                <Header />

                <div className="t-container">
                    <h1 className="t-header-title">My Tickets &amp; Sessions</h1>
                    <p className="t-header-sub">Manage your active parking sessions and upcoming bookings.</p>

                    {/* ── SECTION 1: Active Sessions ── */}
                    <div className="t-section-heading">
                        <span className="t-section-title"> Đang Đỗ</span>
                        {hasActiveSessions && (
                            <span className="t-section-count live">{activeSessions.length} active</span>
                        )}
                    </div>

                    {sessionsLoading && (
                        <div className="ls-loading">
                            <div className="ls-spinner" />
                            Đang kiểm tra phiên đỗ xe hiện tại...
                        </div>
                    )}

                    {!sessionsLoading && sessionsError && (
                        <div className="ls-error">
                            ⚠️ {sessionsError}
                        </div>
                    )}

                    {!sessionsLoading && !hasActiveSessions && (
                        <div style={{
                            background: 'white', borderRadius: 14, border: '1.5px dashed #e2e8f0',
                            padding: '20px 24px', marginBottom: 8,
                            display: 'flex', alignItems: 'center', gap: 14,
                            color: '#94a3b8', fontSize: 14, fontWeight: 600,
                        }}>
                            <span style={{ fontSize: 24 }}>🅿️</span>
                            <span>Bạn hiện không có xe nào đang đỗ trong bãi.</span>
                        </div>
                    )}

                    {hasActiveSessions && activeSessions.map(session => (
                        <LiveSessionCard
                            key={session._id}
                            session={session}
                            onClick={() => handleOpenSession(session)}
                        />
                    ))}

                    <div className="t-section-divider" />

                    {/* ── SECTION 2: Upcoming Bookings (localStorage tickets) ── */}
                    <div className="t-section-heading">
                        <span className="t-section-title"> Vé Đặt Trước</span>
                        {bookingsLoading && (
                            <div className="ls-loading" style={{ marginTop: 10 }}>
                                <div className="ls-spinner" />
                                Đang tải danh sách vé...
                            </div>
                        )}

                        {!bookingsLoading && hasTickets && (
                            <span className="t-section-count">{tickets.length} vé</span>
                        )}
                    </div>

                    {!hasTickets ? (
                        isEmpty ? (
                            <div className="t-empty-card">
                                <span className="t-empty-icon">🎫</span>
                                <h2 className="t-empty-title">No Active Tickets</h2>
                                <p className="t-empty-desc">You don't have any booked slots yet. Book a parking slot at one of our locations to get started.</p>
                                <button className="t-empty-btn" onClick={() => navigate('/booking')}>
                                    Book a Slot Now
                                </button>
                            </div>
                        ) : (
                            <div style={{
                                background: 'white', borderRadius: 14, border: '1.5px dashed #e2e8f0',
                                padding: '20px 24px',
                                display: 'flex', alignItems: 'center', gap: 14,
                                color: '#94a3b8', fontSize: 14, fontWeight: 600,
                            }}>
                                <span style={{ fontSize: 24 }}>📭</span>
                                <span>Không có vé đặt trước nào.{' '}
                                    <span
                                        style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}
                                        onClick={() => navigate('/booking')}
                                    >Đặt ngay</span>
                                </span>
                            </div>
                        )
                    ) : (
                        <>
                            <div className="t-list">
                                {tickets.map(ticket => (
                                    <div key={ticket.receiptId} className="t-list-item" onClick={() => setSelectedTicket(ticket)}>
                                        <div className="t-list-item-left">
                                            <div className="t-list-item-icon">
                                                {getVehicleEmoji(ticket.vehicleType)}
                                            </div>
                                            <div className="t-list-item-info">
                                                <h3 className="t-list-item-title">{ticket.spot.title}</h3>
                                                <div className="t-list-item-subtitle">
                                                    <span>Plate: <strong style={{ color: '#334155' }}>{ticket.licensePlate}</strong></span>
                                                    <span className="t-list-item-meta">{ticket.floorName} — {ticket.slotCode}</span>
                                                    <span style={{ color: '#cbd5e1' }}>|</span>
                                                    <span>In: {fmtDateTime(ticket.entryDate)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="t-list-item-right">
                                            <span className={`t-badge ${ticket.payMethod === 'cash' ? 'unpaid' : ''}`}>
                                                {ticket.payMethod === 'cash' ? 'PAY LATER' : 'PAID'}
                                            </span>
                                            <button className="t-list-item-btn" onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); }}>View Ticket</button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ── Ticket Detail Modal ── */}
                            {selectedTicket && (() => {
                                const ticket = selectedTicket;
                                return (
                                    <div className="t-modal-overlay" onClick={() => setSelectedTicket(null)}>
                                        <div className="t-modal-content" onClick={e => e.stopPropagation()}>
                                            <button className="t-modal-close-btn" onClick={() => setSelectedTicket(null)}>×</button>
                                            <div className="t-card">
                                                <div className="t-card-top">
                                                    <div className="t-card-header">
                                                        <h3 className="t-spot-title">{ticket.spot.title}</h3>
                                                        <span className={`t-badge ${ticket.payMethod === 'cash' ? 'unpaid' : ''}`}>
                                                            {ticket.payMethod === 'cash' ? 'PAY LATER' : 'PAID'}
                                                        </span>
                                                    </div>

                                                    <div className="t-info-grid">
                                                        <div className="t-info-item">
                                                            <span className="t-info-label">License Plate</span>
                                                            <span className="t-info-value" style={{ fontFamily: 'monospace' }}>{ticket.licensePlate}</span>
                                                        </div>
                                                        <div className="t-info-item">
                                                            <span className="t-info-label">Vehicle Type</span>
                                                            <span className="t-info-value">
                                                                {getVehicleEmoji(ticket.vehicleType)} {ticket.vehicleType}
                                                            </span>
                                                        </div>
                                                        <div className="t-info-item">
                                                            <span className="t-info-label">Floor / Slot</span>
                                                            <span className="t-info-value highlight">
                                                                {ticket.floorName} — {ticket.slotCode}
                                                            </span>
                                                        </div>
                                                        <div className="t-info-item">
                                                            <span className="t-info-label">Payment Method</span>
                                                            <span className="t-info-value">
                                                                {getPayMethodLabel(ticket.payMethod)}
                                                            </span>
                                                        </div>
                                                        <div className="t-info-item">
                                                            <span className="t-info-label">Entry Time</span>
                                                            <span className="t-info-value" style={{ fontSize: '11px' }}>
                                                                {fmtDateTime(ticket.entryDate)}
                                                            </span>
                                                        </div>
                                                        <div className="t-info-item">
                                                            <span className="t-info-label">Exit Time</span>
                                                            <span className="t-info-value" style={{ fontSize: '11px' }}>
                                                                {fmtDateTime(ticket.exitTime)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '12px', fontSize: '12px' }}>
                                                        <span style={{ color: '#64748b', fontWeight: 600 }}>Total Amount {ticket.payMethod === 'cash' ? 'Due' : 'Paid'}:</span>
                                                        <span style={{ color: ticket.payMethod === 'cash' ? '#d97706' : '#10b981', fontWeight: 800 }}>{fmtVND(ticket.totalAmount)}</span>
                                                    </div>
                                                </div>

                                                <div className="t-card-bottom">
                                                    <p className="t-qr-label"> Scan to Enter</p>
                                                    <div 
                                                        className="t-qr-container" 
                                                        id={`qr-svg-${ticket.receiptId}`}
                                                        onClick={() => qrTokens[ticket.receiptId] && setZoomedQr(qrTokens[ticket.receiptId])}
                                                        title="Click to enlarge"
                                                    >
                                                        {qrTokens[ticket.receiptId] ? (
                                                            <QRCodeSVG
                                                                value={qrTokens[ticket.receiptId]}
                                                                size={148}
                                                                level="M"
                                                                includeMargin={false}
                                                                style={{ display: 'block' }}
                                                            />
                                                        ) : (
                                                            <div style={{
                                                                width: 148, height: 148,
                                                                background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
                                                                backgroundSize: '200% 100%',
                                                                animation: 'shimmer 1.4s infinite',
                                                                borderRadius: 8
                                                            }} />
                                                        )}
                                                    </div>

                                                    {qrTokens[ticket.receiptId] && (
                                                        <button
                                                            className="t-download-btn"
                                                            onClick={() => downloadQR(ticket.receiptId, ticket.licensePlate)}
                                                            title="Download QR as PNG"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                <polyline points="7 10 12 15 17 10" />
                                                                <line x1="12" y1="15" x2="12" y2="3" />
                                                            </svg>
                                                            Download QR
                                                        </button>
                                                    )}

                                                    <p className="t-qr-expiry">
                                                        ⏱ Valid for 24h &nbsp;·&nbsp; Show to staff at gate
                                                    </p>
                                                    <div className="t-receipt-id">ID: {ticket.receiptId}</div>

                                                    <button
                                                        className="t-action-btn"
                                                        onClick={() => handleRemoveTicket(ticket.receiptId, ticket.bookingId)}
                                                    >
                                                        Cancel Booking
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </>
                    )}
                </div>
            </div>
            {/* ── Modal Phóng To QR ── */}
            {zoomedQr && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 9999, padding: '20px'
                    }}
                    onClick={() => setZoomedQr(null)}
                >
                    <div
                        style={{
                            background: '#fff', padding: '32px', borderRadius: '24px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
                            animation: 'qrZoomIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                            maxWidth: '400px', width: '100%'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <style>{`
                            @keyframes qrZoomIn {
                                from { opacity: 0; transform: scale(0.9); }
                                to { opacity: 1; transform: scale(1); }
                            }
                        `}</style>
                        <h3 style={{ margin: '0 0 24px 0', color: '#0f172a', fontSize: '20px', fontWeight: 800 }}>QR Ticket</h3>
                        <div style={{ background: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            <QRCodeSVG
                                value={zoomedQr}
                                size={Math.min(window.innerWidth - 100, 320)}
                                bgColor="#ffffff"
                                fgColor="#0f172a"
                                level="H"
                                includeMargin={false}
                            />
                        </div>
                        <p style={{ marginTop: '24px', color: '#64748b', fontSize: '14px', textAlign: 'center' }}>
                            Show this code to the staff or scan at the checkpoint to enter.
                        </p>
                        <button
                            className="btn-primary"
                            style={{ marginTop: '24px', width: '100%', padding: '14px' }}
                            onClick={() => setZoomedQr(null)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default MyTicketsPage;
