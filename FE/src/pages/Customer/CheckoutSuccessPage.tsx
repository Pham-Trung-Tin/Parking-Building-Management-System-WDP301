import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header/Header';
import { useSocket } from '../../contexts/SocketContext';

// ── Confetti particle system ───────────────────────────────────────────────────
const Confetti = () => {
    const colors = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    const pieces = Array.from({ length: 60 }, (_, i) => ({
        id: i,
        color: colors[i % colors.length],
        left: `${(i * 17 + 3) % 100}%`,
        delay: `${(i * 0.09) % 2}s`,
        duration: `${2.5 + (i % 3) * 0.5}s`,
        shape: i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'square' : 'rect',
        size: 6 + (i % 4) * 2,
    }));
    return (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
            {pieces.map(p => (
                <div
                    key={p.id}
                    style={{
                        position: 'absolute',
                        left: p.left,
                        top: '-20px',
                        width: p.shape === 'rect' ? p.size * 2 : p.size,
                        height: p.size,
                        background: p.color,
                        borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'square' ? '2px' : '2px',
                        opacity: 0,
                        animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards`,
                    }}
                />
            ))}
        </div>
    );
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const HomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);
const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);
const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
);
const CarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="10" width="22" height="8" rx="2" /><path d="M4 10l3-5h10l3 5" />
        <circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" />
    </svg>
);
const MotoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5" cy="17" r="3" /><circle cx="19" cy="17" r="3" />
        <path d="M8 17h8M12 8l2 5H8l1.5-3H14" /><path d="M14 8h3l2 4" /><circle cx="18" cy="7" r="1.5" />
    </svg>
);

// ── Big animated checkmark ────────────────────────────────────────────────────
const AnimatedCheck = () => (
    <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="38" fill="url(#checkGrad)" />
        <defs>
            <linearGradient id="checkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
            </linearGradient>
        </defs>
        <polyline
            points="22,42 35,55 58,28"
            fill="none"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
                strokeDasharray: 60,
                strokeDashoffset: 0,
                animation: 'drawCheck 0.6s 0.3s cubic-bezier(0.65,0,0.35,1) both',
            }}
        />
    </svg>
);

// ── Main ──────────────────────────────────────────────────────────────────────
const CheckoutSuccessPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const data = location.state || {};

    const isMonthlyPass = data.isMonthlyPass === true;

    const spot = data.spot || { title: 'Bitexco Financial Tower Parking', price: 20000 };
    const vehicleType = data.vehicleType || 'car';
    const floorObj = data.floor;
    const slotObj = data.slot;

    const isMoto = typeof vehicleType === 'object' ? vehicleType.code === 'motorcycle' : vehicleType === 'motorcycle';
    const vehicleTypeName = data.vehicleTypeName || (typeof vehicleType === 'object' ? vehicleType.name : (isMoto ? 'Motorcycle' : 'Car'));

    const floorName = data.floorName || (typeof floorObj === 'object' && floorObj !== null ? (floorObj.name || `Floor ${floorObj.floorNumber}`) : `Floor ${floorObj || 3}`);
    const slotCode = data.slotCode || (typeof slotObj === 'object' && slotObj !== null ? slotObj.slotCode : `${String.fromCharCode(64 + Number(floorObj || 3))}-${floorObj || 3}05`);

    const licensePlate = data.licensePlate || (isMoto ? '59T1-23456' : '51A-12345');
    const entryDate = data.entryDate ? new Date(data.entryDate) : new Date(Date.now() - 7200000);
    const exitTime = data.exitTime ? new Date(data.exitTime) : new Date();
    const elapsed = data.elapsed || 7200;
    const totalAmount = data.totalAmount !== undefined
        ? data.totalAmount
        : (isMoto
            ? ((elapsed / 3600) < 4 ? 2000 : 4000)
            : ((elapsed / 3600) < 4 ? 8000 : 16000));
    const grandTotal = Math.round(totalAmount);
    const payMethod = data.payMethod || 'card';
    const cardLast4 = data.cardLast4;

    // Receipt ID
    const receiptId = data.transactionId || `PB-${Date.now().toString(36).toUpperCase().slice(-8)}`;

    const [showConfetti, setShowConfetti] = useState(true);
    const { socket } = useSocket();

    useEffect(() => {
        const t = setTimeout(() => setShowConfetti(false), 3500);
        return () => clearTimeout(t);
    }, [data, navigate]);

    useEffect(() => {
        if (!socket) return;
        const handleNotification = (notif: any) => {
            if (notif.type === 'checkin_success' && notif.data?.sessionId) {
                console.log('[Live Tracker] Check-in confirmed! Navigating to SessionPage:', notif.data.sessionId);
                navigate(`/session/${notif.data.sessionId}`);
            }
        };
        socket.on('newNotification', handleNotification);
        return () => {
            socket.off('newNotification', handleNotification);
        };
    }, [socket, navigate]);

    const payMethodLabel = {
        bank_transfer: 'Bank Transfer (VietQR)',
        cash: 'Cash at Counter',
    }[payMethod] || 'Bank Transfer (VietQR)';

    const formatTime = (d) => d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

    return (
        <>
            <style>{`
                * { box-sizing: border-box; }

                /* ── Confetti animation ── */
                @keyframes confettiFall {
                    0%   { transform: translateY(0) rotate(0deg);   opacity: 1; }
                    80%  { opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }

                /* ── Checkmark animation ── */
                @keyframes drawCheck {
                    from { stroke-dashoffset: 60; }
                    to   { stroke-dashoffset: 0; }
                }

                /* ── Page ── */
                .cs-page {
                    min-height: 100vh;
                    background: linear-gradient(160deg, #f0f9ff 0%, #e0f2fe 40%, #f0fdf4 100%);
                    font-family: 'Inter', 'Segoe UI', sans-serif;
                    color: #0f172a;
                    position: relative;
                }

                /* ── Hero section ── */
                .cs-hero {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    padding: 52px 24px 80px;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                .cs-hero::before {
                    content: '';
                    position: absolute;
                    top: -60px; right: -60px;
                    width: 260px; height: 260px;
                    background: rgba(255,255,255,0.08);
                    border-radius: 50%;
                }
                .cs-hero::after {
                    content: '';
                    position: absolute;
                    bottom: -80px; left: -40px;
                    width: 220px; height: 220px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 50%;
                }
                .cs-check-wrap {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 20px;
                    position: relative;
                    z-index: 1;
                    animation: popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
                }
                @keyframes popIn {
                    from { transform: scale(0); opacity: 0; }
                    to   { transform: scale(1); opacity: 1; }
                }
                .cs-hero-title {
                    font-size: 26px;
                    font-weight: 900;
                    color: white;
                    letter-spacing: -0.5px;
                    margin-bottom: 8px;
                    position: relative;
                    z-index: 1;
                    animation: fadeUp 0.5s 0.2s ease-out both;
                }
                .cs-hero-sub {
                    font-size: 14px;
                    color: rgba(255,255,255,0.8);
                    font-weight: 500;
                    position: relative;
                    z-index: 1;
                    animation: fadeUp 0.5s 0.3s ease-out both;
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                /* ── Content (floats above hero) ── */
                .cs-content {
                    max-width: 560px;
                    margin: -44px auto 0;
                    padding: 0 20px 80px;
                    position: relative;
                    z-index: 5;
                }

                /* ── Card ── */
                .cs-card {
                    background: white;
                    border-radius: 20px;
                    border: 1px solid #e2e8f0;
                    padding: 24px;
                    margin-bottom: 16px;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
                }

                /* ── Receipt ID ── */
                .receipt-id-bar {
                    background: linear-gradient(135deg, #f8fafc, #eff6ff);
                    border: 1px dashed #bfdbfe;
                    border-radius: 12px;
                    padding: 12px 18px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px;
                }
                .receipt-id-label { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
                .receipt-id-value { font-size: 14px; font-weight: 900; color: #1d4ed8; letter-spacing: 0.08em; font-family: monospace; }

                /* ── Receipt rows ── */
                .r-section-title {
                    font-size: 13px;
                    font-weight: 800;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.07em;
                    margin-bottom: 12px;
                }
                .r-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 9px 0;
                    border-bottom: 1px solid #f8fafc;
                    font-size: 13px;
                }
                .r-row:last-child { border-bottom: none; }
                .r-label { color: #64748b; font-weight: 500; }
                .r-value { color: #0f172a; font-weight: 700; text-align: right; }
                .r-divider {
                    height: 1px;
                    background: repeating-linear-gradient(90deg, #e2e8f0 0, #e2e8f0 6px, transparent 6px, transparent 12px);
                    margin: 16px 0;
                }

                /* ── Total bar ── */
                .r-total {
                    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
                    border: 1px solid #86efac;
                    border-radius: 14px;
                    padding: 16px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 4px;
                }
                .r-total-label { font-size: 15px; font-weight: 800; color: #166534; }
                .r-total-amount { font-size: 26px; font-weight: 900; color: #15803d; letter-spacing: -0.5px; }

                /* ── Payment method chip ── */
                .pay-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: linear-gradient(135deg, #eff6ff, #dbeafe);
                    border: 1px solid #bfdbfe;
                    border-radius: 20px;
                    padding: 5px 12px;
                    font-size: 12px;
                    font-weight: 700;
                    color: #1d4ed8;
                }
                .pay-chip-dot { width: 7px; height: 7px; background: #10b981; border-radius: 50%; }

                /* ── Action buttons ── */
                .cs-btn-primary {
                    width: 100%;
                    padding: 17px;
                    border: none;
                    border-radius: 14px;
                    background: linear-gradient(135deg, #2563eb, #4f46e5);
                    color: white;
                    font-size: 15px;
                    font-weight: 800;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    margin-bottom: 10px;
                    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                    box-shadow: 0 6px 24px rgba(79,70,229,0.35);
                    letter-spacing: 0.01em;
                }
                .cs-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(79,70,229,0.45); }
                .cs-btn-primary:active { transform: scale(0.98); }

                .cs-btn-secondary {
                    width: 100%;
                    padding: 14px;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 14px;
                    background: white;
                    color: #475569;
                    font-size: 14px;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                    margin-bottom: 10px;
                }
                .cs-btn-secondary:hover { border-color: #3b82f6; color: #2563eb; background: #eff6ff; }

                /* ── Star rating ── */
                .rating-section {
                    text-align: center;
                    padding: 4px 0 8px;
                }
                .rating-title {
                    font-size: 15px;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 14px;
                }
                .stars {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    margin-bottom: 10px;
                }
                .star-btn {
                    background: none;
                    border: none;
                    font-size: 32px;
                    cursor: pointer;
                    transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1);
                    line-height: 1;
                }
                .star-btn:hover { transform: scale(1.2); }

                /* ── Fade-in ── */
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .cs-in   { animation: fadeSlideIn 0.4s 0.1s ease-out both; }
                .cs-in-1 { animation: fadeSlideIn 0.4s 0.2s ease-out both; }
                .cs-in-2 { animation: fadeSlideIn 0.4s 0.3s ease-out both; }
                .cs-in-3 { animation: fadeSlideIn 0.4s 0.4s ease-out both; }
            `}</style>

            <div className="cs-page">
                {showConfetti && <Confetti />}
                <Header />

                {/* Hero */}
                <div className="cs-hero">
                    <div className="cs-check-wrap">
                        <AnimatedCheck />
                    </div>
                    <div className="cs-hero-title">{isMonthlyPass ? 'Purchase Successful!' : 'Payment Successful!'} </div>
                    <div className="cs-hero-sub">
                        {isMonthlyPass
                            ? "Your monthly pass has been successfully registered. Thank you!"
                            : data.isBooking
                                ? "Your parking slot has been successfully booked. Thank you!"
                                : "Your parking session has been checked out. Thank you!"}
                    </div>
                </div>

                <div className="cs-content">
                    {/* Receipt card */}
                    <div className="cs-card cs-in">
                        <div className="receipt-id-bar">
                            <div>
                                <div className="receipt-id-label">{isMonthlyPass ? 'Pass Code' : 'Receipt ID'}</div>
                                <div className="receipt-id-value">{isMonthlyPass ? data.passCode : receiptId}</div>
                            </div>
                            <div className="pay-chip">
                                <span className="pay-chip-dot"></span>
                                {isMonthlyPass ? 'Pending Payment / Active' : 'Paid'}
                            </div>
                        </div>

                        {/* Parking info */}
                        <div className="r-section-title"> {isMonthlyPass ? 'Pass Details' : 'Parking Details'}</div>
                        <div className="r-row">
                            <span className="r-label">Facility</span>
                            <span className="r-value" style={{ maxWidth: '55%', textAlign: 'right', fontSize: 12 }}>
                                {isMonthlyPass ? data.parkingLotName : spot.title}
                            </span>
                        </div>
                        <div className="r-row">
                            <span className="r-label">Vehicle</span>
                            <span className="r-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {isMoto ? <MotoIcon /> : <CarIcon />}
                                {vehicleTypeName}
                            </span>
                        </div>
                        <div className="r-row">
                            <span className="r-label">License Plate</span>
                            <span className="r-value" style={{ fontFamily: 'monospace', letterSpacing: '0.06em' }}>{licensePlate}</span>
                        </div>
                        
                        {!isMonthlyPass && data.isBooking ? (
                            <>
                                <div className="r-row">
                                    <span className="r-label">Booking Code</span>
                                    <span className="r-value" style={{ fontFamily: 'monospace' }}>{data.bookingCode || '—'}</span>
                                </div>
                                <div className="r-row">
                                    <span className="r-label">Floor / Slot</span>
                                    <span className="r-value">{data.floorName || '—'} — {data.slotCode || '—'}</span>
                                </div>
                            </>
                        ) : !isMonthlyPass ? (
                            <div className="r-row">
                                <span className="r-label">Floor / Slot</span>
                                <span className="r-value">{floorName} — {slotCode}</span>
                            </div>
                        ) : null}

                        <div className="r-divider"></div>

                        {/* Time info */}
                        {!isMonthlyPass && data.isBooking ? (
                            <>
                                <div className="r-section-title"> Booking Time</div>
                                <div className="r-row">
                                    <span className="r-label">Entry</span>
                                    <span className="r-value" style={{ fontSize: 12 }}>{data.entryDate ? formatTime(new Date(data.entryDate)) : '—'}</span>
                                </div>
                                <div className="r-row">
                                    <span className="r-label">Est. Exit</span>
                                    <span className="r-value" style={{ fontSize: 12 }}>{data.exitDate ? formatTime(new Date(data.exitDate)) : '—'}</span>
                                </div>
                            </>
                        ) : !isMonthlyPass ? (
                            <>
                                <div className="r-section-title"> Time Details</div>
                                <div className="r-row">
                                    <span className="r-label">Entry</span>
                                    <span className="r-value" style={{ fontSize: 12 }}>{formatTime(entryDate)}</span>
                                </div>
                                <div className="r-row">
                                    <span className="r-label">Exit</span>
                                    <span className="r-value" style={{ fontSize: 12 }}>{formatTime(exitTime)}</span>
                                </div>
                                <div className="r-row">
                                    <span className="r-label">Total Duration</span>
                                    <span className="r-value">{Math.floor(elapsed / 3600)}h {Math.floor((elapsed % 3600) / 60)}m</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="r-section-title">Validity Period</div>
                                <div className="r-row">
                                    <span className="r-label">Start Date</span>
                                    <span className="r-value" style={{ fontSize: 12 }}>{new Date(data.startDate).toLocaleDateString('en-GB')}</span>
                                </div>
                                <div className="r-row">
                                    <span className="r-label">End Date</span>
                                    <span className="r-value" style={{ fontSize: 12 }}>{new Date(data.endDate).toLocaleDateString('en-GB')}</span>
                                </div>
                                <div className="r-row">
                                    <span className="r-label">Duration</span>
                                    <span className="r-value">{data.durationMonths} Month{data.durationMonths > 1 ? 's' : ''}</span>
                                </div>
                            </>
                        )}

                        <div className="r-divider"></div>

                        {/* Payment info */}
                        <div className="r-section-title"> Payment</div>
                        {!isMonthlyPass ? (
                            <>
                                <div className="r-row">
                                    <span className="r-label">
                                        {data.isBooking && payMethod === 'cash' ? 'Estimated Fee' : 'Parking Fee'}
                                    </span>
                                    <span className="r-value">{Math.round(totalAmount).toLocaleString('vi-VN')} ₫</span>
                                </div>

                                <div className="r-row">
                                    <span className="r-label">Payment Method</span>
                                    <span className="r-value">{payMethodLabel}</span>
                                </div>

                                {data.isBooking && payMethod === 'cash' ? (
                                    <div style={{
                                        marginTop: 10,
                                        padding: '10px 14px',
                                        background: '#fffbeb',
                                        border: '1px solid #fde68a',
                                        borderRadius: 10,
                                        fontSize: 12,
                                        color: '#92400e',
                                        fontWeight: 600,
                                        lineHeight: 1.6,
                                    }}>
                                        ⚠️ The fee above is an estimate. The <strong>actual</strong> fee will be calculated based on the actual parking duration upon exit and collected at the counter.
                                    </div>
                                ) : (
                                    <div className="r-total">
                                        <span className="r-total-label">Total Paid</span>
                                        <span className="r-total-amount">{grandTotal.toLocaleString('vi-VN')} ₫</span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="r-row">
                                    <span className="r-label">Monthly Rate</span>
                                    <span className="r-value">{Math.round((data.price ?? data.totalAmount) / data.durationMonths).toLocaleString('vi-VN')} ₫ / month</span>
                                </div>
                                <div className="r-total">
                                    <span className="r-total-label">Total Fee</span>
                                    <span className="r-total-amount">{Math.round(data.price ?? data.totalAmount).toLocaleString('vi-VN')} ₫</span>
                                </div>
                            </>
                        )}
                    </div>



                    <div className="cs-in-2">
                        <button
                            className="cs-btn-primary"
                            onClick={() => navigate(isMonthlyPass ? '/my-vehicles' : '/')}
                        >
                            <HomeIcon /> {isMonthlyPass ? 'Back to My Vehicles' : 'Back to Home'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

// ── Star Rating sub-component ─────────────────────────────────────────────────
const RatingStars = () => {
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];

    if (submitted) return (
        <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981', padding: '8px 0' }}>
            ✅ Thank you for your feedback!
        </div>
    );

    return (
        <div>
            <div className="stars">
                {[1, 2, 3, 4, 5].map(n => (
                    <button
                        key={n}
                        className="star-btn"
                        onMouseEnter={() => setHovered(n)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => { setRating(n); setTimeout(() => setSubmitted(true), 600); }}
                    >
                        {(hovered || rating) >= n ? '⭐' : '☆'}
                    </button>
                ))}
            </div>
            {(hovered || rating) > 0 && (
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginTop: 4 }}>
                    {labels[hovered || rating]}
                </div>
            )}
        </div>
    );
};

export default CheckoutSuccessPage;
