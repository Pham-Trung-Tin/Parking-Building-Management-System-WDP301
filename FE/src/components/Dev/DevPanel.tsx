/**
 * DevPanel — Floating developer toolbar.
 * Only rendered when import.meta.env.DEV === true.
 *
 * Features:
 *  - Fetch your "approved" bookings and simulate a check-in immediately
 *    (bypasses booking date/time window — great for testing session flow)
 *  - Clear all localStorage tickets
 *  - End (check-out) any active session
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import bookingService from '../../services/api/bookingService';
import parkingSessionService, { ParkingSession } from '../../services/api/parkingSessionService';

// ── tiny helpers ─────────────────────────────────────────────────────────────
const fmtDate = (dStr: string, tStr: string) => {
    if (!dStr || !tStr) return '—';
    const d = new Date(dStr);
    const [hh, mm] = tStr.split(':').map(Number);
    if (!isNaN(hh)) d.setHours(hh);
    if (!isNaN(mm)) d.setMinutes(mm);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

interface Booking {
    _id: string;
    bookingCode: string;
    status: string;
    scheduledDate: string;
    startTime: string;
    vehicleInfo?: { licensePlate?: string };
    parkingLot?: { _id: string; name: string } | string;
    floor?: { name: string; floorNumber?: number } | string;
    assignedSlot?: { slotCode: string } | string;
}

const DevPanel: React.FC = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState<'checkin' | 'sessions'>('checkin');

    // ── bookings ─────────────────────────────────────────────────────────────
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [bookingsLoading, setBookingsLoading] = useState(false);
    const [checkInLoading, setCheckInLoading] = useState<string | null>(null);
    const [checkInMsg, setCheckInMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    // ── active sessions ───────────────────────────────────────────────────────
    const [sessions, setSessions] = useState<ParkingSession[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [checkOutLoading, setCheckOutLoading] = useState<string | null>(null);
    const [sessionMsg, setSessionMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    const loadBookings = async () => {
        setBookingsLoading(true);
        setCheckInMsg(null);
        try {
            const res = await bookingService.getMyBookings({ limit: 50 });
            let list: Booking[] = Array.isArray(res)
                ? res
                : (res?.data ?? res?.docs ?? []);
            
            list = list.filter((b: any) => b.status === 'pending' || b.status === 'approved');
            setBookings(list);
        } catch (e: any) {
            setCheckInMsg({ type: 'err', text: e?.response?.data?.message ?? e?.message ?? 'Error' });
        } finally {
            setBookingsLoading(false);
        }
    };

    const loadSessions = async () => {
        setSessionsLoading(true);
        setSessionMsg(null);
        try {
            const res = await parkingSessionService.getSessions({ status: 'active', limit: 10 });
            const list: ParkingSession[] = Array.isArray(res) ? res : (res?.data ?? res?.docs ?? []);
            setSessions(list);
        } catch (e: any) {
            setSessionMsg({ type: 'err', text: e?.response?.data?.message ?? e?.message ?? 'Error' });
        } finally {
            setSessionsLoading(false);
        }
    };

    useEffect(() => {
        if (!open) return;
        if (tab === 'checkin') loadBookings();
        else loadSessions();
    }, [open, tab]);

    const handleSimulateCheckIn = async (booking: Booking) => {
        setCheckInLoading(booking._id);
        setCheckInMsg(null);
        try {
            const lotId = typeof booking.parkingLot === 'object'
                ? (booking.parkingLot as any)?._id
                : booking.parkingLot;

            const session = await parkingSessionService.checkIn({
                bookingId: booking._id,
                parkingLotId: lotId,
                licensePlate: booking.vehicleInfo?.licensePlate,
            });

            setCheckInMsg({ type: 'ok', text: `✅ Check-in thành công! Session: ${session?.sessionCode ?? session?._id ?? 'OK'}` });

            // Navigate to the session page
            setTimeout(() => {
                navigate('/session', {
                    state: {
                        sessionId: session?._id ?? session?.data?._id,
                        spot: { title: typeof booking.parkingLot === 'object' ? (booking.parkingLot as any)?.name : 'Bãi Đỗ Xe' },
                    },
                });
                setOpen(false);
            }, 800);
        } catch (e: any) {
            setCheckInMsg({ type: 'err', text: `❌ ${e?.response?.data?.message ?? e?.message ?? 'Check-in failed'}` });
        } finally {
            setCheckInLoading(null);
        }
    };

    const handleCheckOut = async (session: ParkingSession) => {
        setCheckOutLoading(session._id);
        setSessionMsg(null);
        try {
            await parkingSessionService.checkOut(session._id);
            setSessionMsg({ type: 'ok', text: `✅ Check-out thành công: ${session.sessionCode}` });
            loadSessions();
        } catch (e: any) {
            setSessionMsg({ type: 'err', text: `❌ ${e?.response?.data?.message ?? e?.message ?? 'Failed'}` });
        } finally {
            setCheckOutLoading(null);
        }
    };

    const handleClearTickets = () => {
        if (window.confirm('Xóa toàn bộ vé trong localStorage?')) {
            localStorage.removeItem('myTickets');
            localStorage.removeItem('activeBooking');
            window.dispatchEvent(new Event('bookingUpdated'));
            setCheckInMsg({ type: 'ok', text: '🗑️ Đã xóa toàn bộ vé.' });
        }
    };

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <>
            <style>{`
                /* ── Dev panel trigger button ── */
                .dev-trigger {
                    position: fixed;
                    bottom: 28px;
                    right: 28px;
                    z-index: 99990;
                    width: 48px; height: 48px;
                    border-radius: 50%;
                    background: #7c3aed;
                    border: 2px solid #a78bfa;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 4px 20px rgba(124,58,237,0.5);
                    transition: all 0.2s;
                    font-family: monospace;
                    font-weight: 900;
                }
                .dev-trigger:hover { transform: scale(1.1); background: #6d28d9; }
                .dev-trigger.active { background: #dc2626; border-color: #fca5a5; }

                /* ── Panel ── */
                .dev-panel {
                    position: fixed;
                    bottom: 88px;
                    right: 28px;
                    z-index: 99989;
                    width: 420px;
                    max-height: 70vh;
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 16px;
                    overflow: hidden;
                    display: flex; flex-direction: column;
                    box-shadow: 0 24px 60px rgba(0,0,0,0.6);
                    font-family: 'Inter', 'Segoe UI', monospace;
                    animation: devSlideUp 0.2s ease-out;
                }
                @keyframes devSlideUp {
                    from { opacity: 0; transform: translateY(12px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                .dev-header {
                    background: #7c3aed;
                    padding: 10px 16px;
                    display: flex; align-items: center; justify-content: space-between;
                }
                .dev-header-title {
                    font-size: 13px; font-weight: 800; color: white; letter-spacing: 0.04em;
                }
                .dev-header-badge {
                    font-size: 10px; font-weight: 700; background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    border-radius: 6px; padding: 2px 8px; color: white;
                    letter-spacing: 0.06em;
                }
                .dev-tabs {
                    display: flex;
                    background: #1e293b;
                    border-bottom: 1px solid #334155;
                }
                .dev-tab {
                    flex: 1; padding: 8px;
                    font-size: 11px; font-weight: 700;
                    color: #64748b; cursor: pointer;
                    text-align: center; border: none; background: transparent;
                    transition: all 0.15s;
                    letter-spacing: 0.04em;
                }
                .dev-tab.active { color: #a78bfa; border-bottom: 2px solid #7c3aed; }
                .dev-tab:hover:not(.active) { color: #94a3b8; }
                .dev-body {
                    flex: 1; overflow-y: auto; padding: 12px;
                    scrollbar-width: thin; scrollbar-color: #334155 transparent;
                }
                .dev-msg {
                    font-size: 11px; font-weight: 600; padding: 8px 12px;
                    border-radius: 8px; margin-bottom: 10px;
                }
                .dev-msg.ok { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34d399; }
                .dev-msg.err { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #f87171; }

                .dev-loading { color: #64748b; font-size: 12px; padding: 12px; text-align: center; }

                /* ── Booking / session rows ── */
                .dev-row {
                    background: #1e293b;
                    border: 1px solid #334155;
                    border-radius: 10px;
                    padding: 10px 12px;
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .dev-row-info { flex: 1; min-width: 0; }
                .dev-row-title {
                    font-size: 12px; font-weight: 800; color: #e2e8f0;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .dev-row-sub { font-size: 10px; color: #64748b; font-weight: 600; margin-top: 2px; }
                .dev-row-sub span { color: #94a3b8; }
                .dev-row-btn {
                    flex-shrink: 0;
                    font-size: 11px; font-weight: 700;
                    padding: 6px 12px; border-radius: 8px; border: none;
                    cursor: pointer; transition: all 0.15s;
                }
                .dev-row-btn.green {
                    background: rgba(16,185,129,0.2);
                    color: #34d399;
                    border: 1px solid rgba(16,185,129,0.3);
                }
                .dev-row-btn.green:hover { background: rgba(16,185,129,0.35); }
                .dev-row-btn.red {
                    background: rgba(239,68,68,0.15);
                    color: #f87171;
                    border: 1px solid rgba(239,68,68,0.25);
                }
                .dev-row-btn.red:hover { background: rgba(239,68,68,0.3); }
                .dev-row-btn:disabled { opacity: 0.4; cursor: wait; }

                /* ── Utility buttons ── */
                .dev-util-row {
                    display: flex; gap: 8px; padding: 10px 12px;
                    border-top: 1px solid #1e293b;
                    background: #0f172a;
                }
                .dev-util-btn {
                    flex: 1; padding: 7px 10px; border-radius: 8px;
                    font-size: 11px; font-weight: 700;
                    border: 1px solid #334155;
                    background: #1e293b; color: #94a3b8;
                    cursor: pointer; transition: all 0.15s;
                }
                .dev-util-btn:hover { background: #334155; color: #e2e8f0; }

                .dev-empty { color: #475569; font-size: 12px; text-align: center; padding: 20px; }

                @media (max-width: 480px) {
                    .dev-panel { width: calc(100vw - 40px); right: 20px; }
                    .dev-trigger { right: 20px; bottom: 20px; }
                }
            `}</style>

            {/* Trigger button */}
            <button
                className={`dev-trigger ${open ? 'active' : ''}`}
                onClick={() => setOpen(o => !o)}
                title="Dev Tools Panel"
            >
                {open ? '✕' : '⚡'}
            </button>

            {open && (
                <div className="dev-panel">
                    {/* Header */}
                    <div className="dev-header">
                        <div className="dev-header-title">⚡ Dev Tools</div>
                        <div className="dev-header-badge">DEV ONLY</div>
                    </div>

                    {/* Tabs */}
                    <div className="dev-tabs">
                        <button
                            className={`dev-tab ${tab === 'checkin' ? 'active' : ''}`}
                            onClick={() => setTab('checkin')}
                        >
                            🚀 Simulate Check-in
                        </button>
                        <button
                            className={`dev-tab ${tab === 'sessions' ? 'active' : ''}`}
                            onClick={() => setTab('sessions')}
                        >
                            🔴 Active Sessions
                        </button>
                    </div>

                    {/* Body */}
                    <div className="dev-body">
                        {/* ── TAB: Simulate Check-in ── */}
                        {tab === 'checkin' && (
                            <>
                                {checkInMsg && (
                                    <div className={`dev-msg ${checkInMsg.type}`}>{checkInMsg.text}</div>
                                )}
                                {bookingsLoading ? (
                                    <div className="dev-loading">⏳ Loading approved bookings...</div>
                                ) : bookings.length === 0 ? (
                                    <div className="dev-empty">
                                        No approved bookings found.<br />
                                        Create &amp; approve a booking first.
                                    </div>
                                ) : (
                                    bookings.map(b => {
                                        const lotName = typeof b.parkingLot === 'object'
                                            ? (b.parkingLot as any)?.name ?? 'Parking Lot'
                                            : 'Parking Lot';
                                        const floorName = typeof b.floor === 'object'
                                            ? (b.floor as any)?.name ?? `Floor ${(b.floor as any)?.floorNumber}`
                                            : '—';
                                        const slotCode = typeof b.assignedSlot === 'object'
                                            ? (b.assignedSlot as any)?.slotCode ?? '—'
                                            : '—';
                                        return (
                                            <div key={b._id} className="dev-row">
                                                <div className="dev-row-info">
                                                    <div className="dev-row-title">{b.bookingCode}</div>
                                                    <div className="dev-row-sub">
                                                        <span>{lotName}</span> · {floorName} · {slotCode}
                                                        <br />
                                                        🗓 {fmtDate(b.scheduledDate, b.startTime)} · {b.vehicleInfo?.licensePlate ?? '—'}
                                                    </div>
                                                </div>
                                                <button
                                                    className="dev-row-btn green"
                                                    disabled={checkInLoading === b._id}
                                                    onClick={() => handleSimulateCheckIn(b)}
                                                >
                                                    {checkInLoading === b._id ? '...' : 'Check-in now'}
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </>
                        )}

                        {/* ── TAB: Active Sessions ── */}
                        {tab === 'sessions' && (
                            <>
                                {sessionMsg && (
                                    <div className={`dev-msg ${sessionMsg.type}`}>{sessionMsg.text}</div>
                                )}
                                {sessionsLoading ? (
                                    <div className="dev-loading">⏳ Loading active sessions...</div>
                                ) : sessions.length === 0 ? (
                                    <div className="dev-empty">No active sessions right now.</div>
                                ) : (
                                    sessions.map(s => {
                                        const slotCode = typeof s.slot === 'object' ? (s.slot as any)?.slotCode ?? '—' : '—';
                                        const floorName = typeof s.floor === 'object'
                                            ? (s.floor as any)?.name ?? `F${(s.floor as any)?.floorNumber}`
                                            : '—';
                                        const elapsed = Math.floor((Date.now() - new Date(s.entryTime).getTime()) / 60000);
                                        return (
                                            <div key={s._id} className="dev-row">
                                                <div className="dev-row-info">
                                                    <div className="dev-row-title">{s.sessionCode}</div>
                                                    <div className="dev-row-sub">
                                                        <span>{s.vehicleInfo?.licensePlate ?? '—'}</span> · {floorName} · 🅿️ {slotCode}
                                                        <br />
                                                        ⏱ {elapsed} min ago
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                    <button
                                                        className="dev-row-btn green"
                                                        onClick={() => {
                                                            navigate('/session', { state: { sessionId: s._id, spot: { title: 'Session' } } });
                                                            setOpen(false);
                                                        }}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        className="dev-row-btn red"
                                                        disabled={checkOutLoading === s._id}
                                                        onClick={() => handleCheckOut(s)}
                                                    >
                                                        {checkOutLoading === s._id ? '...' : 'End'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </>
                        )}
                    </div>

                    {/* Utility bar */}
                    <div className="dev-util-row">
                        <button className="dev-util-btn" onClick={() => tab === 'checkin' ? loadBookings() : loadSessions()}>
                            🔄 Refresh
                        </button>
                        <button className="dev-util-btn" onClick={handleClearTickets}>
                            🗑️ Clear localStorage
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default DevPanel;
