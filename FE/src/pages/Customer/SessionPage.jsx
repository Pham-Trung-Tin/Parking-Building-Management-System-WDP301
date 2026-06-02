import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header/Header';

// ── QR Code SVG (static illustrative) ────────────────────────────────────────
const QRCodeSVG = ({ value }) => {
    // Deterministic pixel pattern driven by the value string
    const seed = [...(value || 'PB001')].reduce((a, c) => a + c.charCodeAt(0), 0);
    const size = 9;
    const cell = 24;
    const pad = 16;
    const total = size * cell + pad * 2;

    const pseudo = (i) => {
        const x = ((seed * 7 + i * 13 + i * i * 3) % 97) / 97;
        return x > 0.42;
    };

    // Fixed-position finder patterns (top-left, top-right, bottom-left)
    const isFinderCell = (r, c) => {
        const inTL = r < 3 && c < 3;
        const inTR = r < 3 && c >= size - 3;
        const inBL = r >= size - 3 && c < 3;
        return inTL || inTR || inBL;
    };
    const isFinderBorder = (r, c) => {
        const bTL = (r === 0 || r === 2) && c <= 2 || c === 0 && r <= 2 || c === 2 && r <= 2;
        const bTR = (r === 0 || r === 2) && c >= size - 3 || c === size - 1 && r <= 2 || c === size - 3 && r <= 2;
        const bBL = (r === size - 3 || r === size - 1) && c <= 2 || c === 0 && r >= size - 3 || c === 2 && r >= size - 3;
        return bTL || bTR || bBL;
    };
    const isFinderCenter = (r, c) => (r === 1 && c === 1) || (r === 1 && c === size - 2) || (r === size - 2 && c === 1);

    return (
        <svg width={total} height={total} viewBox={`0 0 ${total} ${total}`} xmlns="http://www.w3.org/2000/svg">
            <rect width={total} height={total} rx="18" fill="#f0f4f8" />
            {Array.from({ length: size }).map((_, r) =>
                Array.from({ length: size }).map((_, c) => {
                    const x = pad + c * cell;
                    const y = pad + r * cell;
                    let dark = pseudo(r * size + c);
                    if (isFinderCell(r, c)) {
                        dark = isFinderCenter(r, c) ? true : isFinderBorder(r, c);
                    }
                    return dark ? (
                        <rect key={`${r}-${c}`} x={x + 2} y={y + 2} width={cell - 4} height={cell - 4} rx="5" fill="#1e293b" />
                    ) : null;
                })
            )}
        </svg>
    );
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const CarSmallIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="10" width="22" height="8" rx="2" />
        <path d="M4 10l3-5h10l3 5" />
        <circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" />
    </svg>
);

const MotoSmallIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5" cy="17" r="3" /><circle cx="19" cy="17" r="3" />
        <path d="M8 17h8M12 8l2 5H8l1.5-3H14" /><path d="M14 8h3l2 4" />
        <circle cx="18" cy="7" r="1.5" />
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
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
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

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatHMS = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// ── Main ──────────────────────────────────────────────────────────────────────
const SessionPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const data = location.state || {};

    const spot = data.spot || { title: 'Bitexco Financial Tower Parking', price: 20000 };
    const vehicleType = data.vehicleType || 'car';
    const floor = data.floor || 3;
    const slot = data.slot || 5;
    const hourlyRate = spot.price || 20000;

    // Ghi nhận đúng thời điểm user vào trang SessionPage (luôn bắt đầu từ 0)
    const sessionStart = useRef(Date.now());
    const entryDate = new Date(sessionStart.current);

    // Live elapsed seconds kể từ lúc vào trang (bắt đầu từ 00:00:00)
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            setElapsed(Math.floor((Date.now() - sessionStart.current) / 1000));
        }, 1000);
        return () => clearInterval(id);
    }, []);

    const currentFee = vehicleType === 'motorcycle' 
        ? ((elapsed / 3600) < 4 ? 2000 : 4000)
        : ((elapsed / 3600) < 4 ? 8000 : 16000);
    const licensePlate = vehicleType === 'motorcycle' ? '59T1-23456' : '51A-12345';
    const zone = floor <= 2 ? 'Zone B - Standard' : 'Zone A - Premium';
    const slotCode = `${String.fromCharCode(64 + floor)}-${floor}0${String(slot).padStart(1, '0')}`;
    const qrValue = `${spot.title}-F${floor}S${slot}-${sessionStart.current}`;

    const handlePayCheckout = () => {
        navigate('/checkout', {
            state: {
                spot,
                vehicleType,
                floor,
                slot,
                entryDate: new Date(sessionStart.current).toISOString(),
                elapsed,
                totalAmount: currentFee,
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

                /* ── Header banner ── */
                .session-banner {
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                    padding: 18px 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    box-shadow: 0 4px 20px rgba(37,99,235,0.4);
                }
                .banner-left {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }
                .banner-back {
                    background: rgba(255,255,255,0.15);
                    border: 1px solid rgba(255,255,255,0.25);
                    border-radius: 8px;
                    padding: 6px 12px;
                    color: white;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: background 0.2s;
                }
                .banner-back:hover { background: rgba(255,255,255,0.25); }
                .banner-title {
                    font-size: 18px;
                    font-weight: 800;
                    color: white;
                    letter-spacing: -0.2px;
                }
                .banner-subtitle {
                    font-size: 12px;
                    color: rgba(255,255,255,0.7);
                    font-weight: 500;
                    margin-top: 1px;
                }
                .active-badge {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    background: #10b981;
                    color: white;
                    font-size: 13px;
                    font-weight: 700;
                    padding: 7px 14px;
                    border-radius: 20px;
                    box-shadow: 0 4px 12px rgba(16,185,129,0.5);
                    letter-spacing: 0.02em;
                }
                .active-dot {
                    width: 8px; height: 8px;
                    background: white;
                    border-radius: 50%;
                    animation: pulse 1.4s ease-in-out infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.7); }
                }

                /* ── Content ── */
                .session-content {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 28px 20px 80px;
                }

                /* ── Card base ── */
                .s-card {
                    background: white;
                    border-radius: 18px;
                    border: 1px solid #e2e8f0;
                    padding: 24px;
                    margin-bottom: 16px;
                    box-shadow: 0 2px 16px rgba(0,0,0,0.05);
                }

                /* ── QR section ── */
                .qr-section {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                    padding: 32px 24px;
                }
                .qr-wrapper {
                    padding: 12px;
                    background: white;
                    border-radius: 20px;
                    border: 3px solid #1e293b;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
                }
                .qr-caption {
                    font-size: 14px;
                    color: #475569;
                    font-weight: 600;
                    letter-spacing: 0.01em;
                }

                /* ── Divider ── */
                .divider {
                    height: 1px;
                    background: #f1f5f9;
                    margin: 0 -24px 20px;
                }

                /* ── License plate ── */
                .lp-row {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }
                .lp-icon {
                    width: 52px; height: 52px;
                    background: #eff6ff;
                    border-radius: 14px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .lp-label {
                    font-size: 11px;
                    color: #94a3b8;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    margin-bottom: 4px;
                }
                .lp-value {
                    font-size: 22px;
                    font-weight: 900;
                    color: #0f172a;
                    letter-spacing: 0.06em;
                    font-variant-numeric: tabular-nums;
                }

                /* ── Two stat cards ── */
                .stat-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 16px;
                }
                .stat-card {
                    border-radius: 16px;
                    padding: 18px 16px;
                }
                .stat-card.blue {
                    background: linear-gradient(135deg, #eff6ff, #dbeafe);
                    border: 1px solid #bfdbfe;
                }
                .stat-card.green {
                    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
                    border: 1px solid #bbf7d0;
                }
                .stat-label {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    font-size: 12px;
                    font-weight: 700;
                    margin-bottom: 10px;
                }
                .stat-label.blue { color: #1d4ed8; }
                .stat-label.green { color: #059669; }
                .stat-value {
                    font-size: 28px;
                    font-weight: 900;
                    letter-spacing: -0.5px;
                    font-variant-numeric: tabular-nums;
                    line-height: 1;
                }
                .stat-value.blue { color: #1e40af; }
                .stat-value.green { color: #15803d; }
                .stat-sub {
                    font-size: 11px;
                    font-weight: 600;
                    margin-top: 5px;
                }
                .stat-sub.blue { color: #93c5fd; }
                .stat-sub.green { color: #6ee7b7; }

                /* ── Location card ── */
                .location-card {
                    border: 2px solid #fbbf24;
                    background: linear-gradient(135deg, #fffbeb, #fef3c7);
                    border-radius: 16px;
                    padding: 18px 20px;
                    margin-bottom: 16px;
                }
                .location-top {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 14px;
                }
                .location-icon {
                    width: 42px; height: 42px;
                    background: #f59e0b;
                    border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                    box-shadow: 0 4px 12px rgba(245,158,11,0.4);
                }
                .location-label {
                    font-size: 12px;
                    color: #92400e;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    margin-bottom: 2px;
                }
                .location-value {
                    font-size: 22px;
                    font-weight: 900;
                    color: #78350f;
                    letter-spacing: 0.04em;
                }
                .find-car-btn {
                    width: 100%;
                    padding: 12px;
                    background: white;
                    border: 1.5px solid #fde68a;
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: 700;
                    color: #92400e;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s;
                }
                .find-car-btn:hover { background: #fef3c7; border-color: #f59e0b; }

                /* ── Session Details ── */
                .details-title {
                    font-size: 15px;
                    font-weight: 800;
                    color: #0f172a;
                    margin-bottom: 16px;
                    letter-spacing: -0.2px;
                }
                .details-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 18px 24px;
                }
                .detail-item-label {
                    font-size: 11px;
                    color: #3b82f6;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    margin-bottom: 5px;
                }
                .detail-item-value {
                    font-size: 14px;
                    font-weight: 700;
                    color: #0f172a;
                }

                /* ── Notice ── */
                .notice-card {
                    border: 1px solid #fde68a;
                    background: #fffbeb;
                    border-radius: 14px;
                    padding: 14px 16px;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                }
                .notice-content {}
                .notice-title {
                    font-size: 13px;
                    font-weight: 700;
                    color: #92400e;
                    margin-bottom: 3px;
                }
                .notice-text {
                    font-size: 12px;
                    color: #b45309;
                    font-weight: 500;
                    line-height: 1.5;
                }

                /* ── Action buttons ── */
                .pay-btn {
                    width: 100%;
                    padding: 17px;
                    border: none;
                    border-radius: 14px;
                    background: linear-gradient(135deg, #2563eb, #1d4ed8);
                    color: white;
                    font-size: 16px;
                    font-weight: 800;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    margin-bottom: 12px;
                    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                    box-shadow: 0 6px 24px rgba(37,99,235,0.4);
                    letter-spacing: 0.01em;
                }
                .pay-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(37,99,235,0.5); }
                .pay-btn:active { transform: scale(0.98); }

                .report-btn {
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
                }
                .report-btn:hover { border-color: #ef4444; color: #ef4444; background: #fef2f2; }

                /* ── Fade in ── */
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(14px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .s-in { animation: fadeSlideIn 0.4s ease-out forwards; }
                .s-in-1 { animation: fadeSlideIn 0.4s 0.05s ease-out both; }
                .s-in-2 { animation: fadeSlideIn 0.4s 0.1s ease-out both; }
                .s-in-3 { animation: fadeSlideIn 0.4s 0.15s ease-out both; }
                .s-in-4 { animation: fadeSlideIn 0.4s 0.2s ease-out both; }
                .s-in-5 { animation: fadeSlideIn 0.4s 0.25s ease-out both; }
                .s-in-6 { animation: fadeSlideIn 0.4s 0.3s ease-out both; }
            `}</style>

            <div className="session-page">
                <Header />

                {/* Blue banner */}
                <div className="session-banner">
                    <div className="banner-left">
                        <button className="banner-back" onClick={() => navigate('/booking')}>
                            <ArrowLeftIcon /> Back
                        </button>
                        <div>
                            <div className="banner-title">Current Parking Session</div>
                            <div className="banner-subtitle">{spot.title}</div>
                        </div>
                    </div>
                    <div className="active-badge">
                        <span className="active-dot"></span>
                        Active
                    </div>
                </div>

                <div className="session-content">

                    {/* QR Code */}
                    <div className="s-card qr-section s-in">
                        <div className="qr-wrapper">
                            <QRCodeSVG value={qrValue} />
                        </div>
                        <p className="qr-caption">Scan this at the exit gate</p>
                    </div>

                    {/* License Plate */}
                    <div className="s-card s-in-1">
                        <div className="lp-row">
                            <div className="lp-icon">
                                {vehicleType === 'motorcycle' ? <MotoSmallIcon /> : <CarSmallIcon />}
                            </div>
                            <div>
                                <div className="lp-label">License Plate</div>
                                <div className="lp-value">{licensePlate}</div>
                            </div>
                        </div>
                    </div>

                    {/* Timer + Fee */}
                    <div className="stat-grid s-in-2">
                        <div className="stat-card blue">
                            <div className="stat-label blue">
                                <TimerIcon /> Parking Duration
                            </div>
                            <div className="stat-value blue">{formatHMS(Math.max(0, elapsed))}</div>
                            <div className="stat-sub blue">HH:MM:SS</div>
                        </div>
                        <div className="stat-card green">
                            <div className="stat-label green">
                                <CardIcon /> Current Fee
                            </div>
                            <div className="stat-value green" style={{ fontSize: '22px' }}>
                                {currentFee.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ₫
                            </div>
                            <div className="stat-sub green">Auto-updating</div>
                        </div>
                    </div>

                    {/* Parking Location */}
                    <div className="location-card s-in-3">
                        <div className="location-top">
                            <div className="location-icon">
                                <PinIcon />
                            </div>
                            <div>
                                <div className="location-label">Your Parking Location</div>
                                <div className="location-value">FLOOR {floor} - {slotCode}</div>
                            </div>
                        </div>
                        <button className="find-car-btn" onClick={() => alert('🗺 Opening parking map...')}>
                            <NavigateIcon /> Find My Car
                        </button>
                    </div>

                    {/* Session Details */}
                    <div className="s-card s-in-4">
                        <div className="details-title">Session Details</div>
                        <div className="divider" style={{ margin: '0 -24px 18px' }}></div>
                        <div className="details-grid">
                            <div>
                                <div className="detail-item-label">Entry Time</div>
                                <div className="detail-item-value">
                                    {entryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })},{' '}
                                    {entryDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                </div>
                            </div>
                            <div>
                                <div className="detail-item-label">Zone</div>
                                <div className="detail-item-value">{zone}</div>
                            </div>
                            <div>
                                <div className="detail-item-label">Rate Policy</div>
                                <div className="detail-item-value" style={{ fontSize: '13px' }}>
                                    {vehicleType === 'motorcycle' ? '2k (<4h) / 4k (>=4h)' : '8k (<4h) / 16k (>=4h)'}
                                </div>
                            </div>
                            <div>
                                <div className="detail-item-label">Vehicle Type</div>
                                <div className="detail-item-value">
                                    {vehicleType === 'motorcycle' ? 'Motorcycle' : 'Car'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Important Notice */}
                    <div className="notice-card s-in-5">
                        <WarningIcon />
                        <div className="notice-content">
                            <div className="notice-title">Important Notice</div>
                            <div className="notice-text">Keep this QR code accessible. You'll need it to exit. Maximum stay: 24 hours.</div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="s-in-6">
                        <button className="pay-btn" onClick={handlePayCheckout}>
                            <PayIcon />
                            Pay &amp; Checkout
                        </button>
                        <button className="report-btn" onClick={() => alert('🚩 Report submitted. Our team will assist you shortly.')}>
                            <FlagIcon />
                            Report an Issue
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SessionPage;
