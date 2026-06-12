import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Header from '../../components/Header/Header';
import { createQRToken } from '../../utils/qrToken';

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
    payMethod: string;
}

const MyTicketsPage = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    // Map: receiptId → signed QR token string
    const [qrTokens, setQrTokens] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadTickets = () => {
            const raw = localStorage.getItem('myTickets');
            if (raw) {
                try {
                    setTickets(JSON.parse(raw));
                } catch (e) {
                    setTickets([]);
                }
            }
        };

        loadTickets();

        // Sync state if localStorage changes in other tabs
        window.addEventListener('storage', loadTickets);
        window.addEventListener('bookingUpdated', loadTickets);
        return () => {
            window.removeEventListener('storage', loadTickets);
            window.removeEventListener('bookingUpdated', loadTickets);
        };
    }, []);

    // Tạo HMAC-signed token cho từng ticket (async vì dùng Web Crypto)
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

    const handleRemoveTicket = (receiptId: string) => {
        if (window.confirm("Are you sure you want to clear/complete this ticket?")) {
            const updated = tickets.filter(t => t.receiptId !== receiptId);
            setTickets(updated);
            localStorage.setItem('myTickets', JSON.stringify(updated));

            // Sync activeBooking (latest ticket)
            if (updated.length > 0) {
                localStorage.setItem('activeBooking', JSON.stringify(updated[0]));
            } else {
                localStorage.removeItem('activeBooking');
            }

            window.dispatchEvent(new Event('bookingUpdated'));
        }
    };

    /**
     * Download QR code as PNG image.
     * Finds the <svg> inside the wrapper div by id, serialises it,
     * draws onto a canvas, then triggers a file download.
     */
    const downloadQR = useCallback((receiptId: string, licensePlate: string) => {
        const svgEl = document.getElementById(`qr-svg-${receiptId}`)?.querySelector('svg');
        if (!svgEl) return;

        const SIZE = 400; // export at higher resolution
        const serialiser = new XMLSerializer();
        const svgStr = serialiser.serializeToString(svgEl);
        const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = SIZE;
            canvas.height = SIZE;
            const ctx = canvas.getContext('2d')!;

            // White background
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

    const getVehicleEmoji = (code: string) => {
        const c = code.toUpperCase();
        if (c.includes('TRUCK') || c.includes('TAI')) return '🚛';
        if (c.includes('BIKE') || c.includes('BICYCLE')) return '🚲';
        if (c.includes('ELECTRIC')) return '⚡';
        if (c.includes('MOTOR') || c.includes('MOTO') || c.includes('SCOOTER') || c.includes('MAY')) return '🏍️';
        return '🚗';
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
                    max-width: 1000px;
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
                    margin-bottom: 32px;
                }

                /* ── Tickets list layout ── */
                .t-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 28px;
                }

                /* ── Ticket Card stub design ── */
                .t-card {
                    background: white;
                    border-radius: 24px;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                    box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
                    transition: transform 0.25s ease, box-shadow 0.25s ease;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                }
                .t-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.1), 0 10px 20px -10px rgba(0, 0, 0, 0.05);
                }

                /* Ticket stub jagged divider visual */
                .t-card::after {
                    content: '';
                    position: absolute;
                    left: -10px;
                    right: -10px;
                    height: 16px;
                    background-image: radial-gradient(circle, transparent 6px, white 6px);
                    background-size: 20px 20px;
                    bottom: 220px; /* Aligns right above the QR section */
                }

                .t-card-top {
                    padding: 24px 24px 16px;
                    border-bottom: 2px dashed #f1f5f9;
                    flex: 1;
                }

                .t-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 16px;
                }

                .t-spot-title {
                    font-size: 16px;
                    font-weight: 850;
                    color: #0f172a;
                    line-height: 1.3;
                    max-width: 70%;
                }

                .t-badge {
                    background: #dcfce7;
                    color: #15803d;
                    padding: 6px 12px;
                    border-radius: 9999px;
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .t-info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .t-info-item {
                    display: flex;
                    flex-direction: column;
                }

                .t-info-label {
                    font-size: 10px;
                    color: #94a3b8;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 2px;
                }

                .t-info-value {
                    font-size: 13px;
                    font-weight: 700;
                    color: #334155;
                }

                .t-info-value.highlight {
                    color: #2563eb;
                }

                .t-card-bottom {
                    background: #f8fafc;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    border-top: 1px solid #f1f5f9;
                    z-index: 1;
                }

                .t-qr-container {
                    background: white;
                    padding: 12px;
                    border-radius: 16px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                    border: 1px solid #e2e8f0;
                    margin-bottom: 16px;
                    display: inline-block;
                }

                .t-qr-img {
                    width: 140px;
                    height: 140px;
                    display: block;
                }

                .t-receipt-id {
                    font-family: monospace;
                    font-size: 12px;
                    font-weight: 800;
                    color: #64748b;
                    letter-spacing: 0.08em;
                    margin-bottom: 16px;
                }

                .t-action-btn {
                    width: 100%;
                    background: #fee2e2;
                    color: #ef4444;
                    border: 1px solid #fca5a5;
                    padding: 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .t-action-btn:hover {
                    background: #ef4444;
                    color: white;
                    border-color: #ef4444;
                }

                /* ── Empty State ── */
                .t-empty-card {
                    background: white;
                    border-radius: 24px;
                    border: 1px solid #e2e8f0;
                    padding: 60px 40px;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.02);
                    max-width: 500px;
                    margin: 40px auto 0;
                }

                .t-empty-icon {
                    font-size: 64px;
                    margin-bottom: 20px;
                    display: block;
                    animation: floatIcon 3s ease-in-out infinite;
                }
                @keyframes floatIcon {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }

                .t-empty-title {
                    font-size: 20px;
                    font-weight: 800;
                    color: #0f172a;
                    margin-bottom: 8px;
                }

                .t-empty-desc {
                    font-size: 13px;
                    color: #64748b;
                    line-height: 1.5;
                    margin-bottom: 24px;
                }

                .t-empty-btn {
                    background: #2563eb;
                    color: white;
                    border: none;
                    padding: 14px 28px;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 14px rgba(37,99,235,0.3);
                }
                .t-empty-btn:hover {
                    background: #1d4ed8;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(37,99,235,0.4);
                }

                /* ── QR section ── */
                .t-qr-label {
                    font-size: 11px;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .t-qr-expiry {
                    font-size: 10px;
                    color: #94a3b8;
                    font-weight: 600;
                    margin-top: 8px;
                    margin-bottom: 16px;
                }

                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }

                /* ── Download button ── */
                .t-download-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 6px;
                    margin-bottom: 4px;
                    padding: 7px 16px;
                    border-radius: 10px;
                    border: 1.5px solid #e2e8f0;
                    background: white;
                    color: #2563eb;
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.18s;
                    letter-spacing: 0.02em;
                }
                .t-download-btn:hover {
                    background: #eff6ff;
                    border-color: #93c5fd;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(37,99,235,0.12);
                }
                .t-download-btn:active {
                    transform: translateY(0);
                    box-shadow: none;
                }
            `}</style>

            <div className="t-root">
                <Header />

                <div className="t-container">
                    <h1 className="t-header-title">My Parking Tickets</h1>
                    <p className="t-header-sub">View, scan, and manage your booked tickets and active parking sessions.</p>

                    {tickets.length === 0 ? (
                        <div className="t-empty-card">
                            <span className="t-empty-icon">🎫</span>
                            <h2 className="t-empty-title">No Active Tickets</h2>
                            <p className="t-empty-desc">You don't have any booked slots or active parking sessions. Book a slot at one of our locations to get started.</p>
                            <button className="t-empty-btn" onClick={() => navigate('/booking')}>
                                Book a Slot Now
                            </button>
                        </div>
                    ) : (
                        <div className="t-grid">
                            {tickets.map(ticket => (
                                <div key={ticket.receiptId} className="t-card">
                                    <div className="t-card-top">
                                        <div className="t-card-header">
                                            <h3 className="t-spot-title">{ticket.spot.title}</h3>
                                            <span className="t-badge">Paid</span>
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
                                            <span style={{ color: '#64748b', fontWeight: 600 }}>Total Amount Paid:</span>
                                            <span style={{ color: '#10b981', fontWeight: 800 }}>{fmtVND(ticket.totalAmount)}</span>
                                        </div>
                                    </div>

                                    <div className="t-card-bottom">
                                        <p className="t-qr-label">🔏 Scan to Enter</p>
                                        <div className="t-qr-container" id={`qr-svg-${ticket.receiptId}`}>
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

                                        {/* Download button — only when token is ready */}
                                        {qrTokens[ticket.receiptId] && (
                                            <button
                                                className="t-download-btn"
                                                onClick={() => downloadQR(ticket.receiptId, ticket.licensePlate)}
                                                title="Download QR as PNG"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                                    <polyline points="7 10 12 15 17 10"/>
                                                    <line x1="12" y1="15" x2="12" y2="3"/>
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
                                            onClick={() => handleRemoveTicket(ticket.receiptId)}
                                        >
                                            Clear Ticket / Checkout
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default MyTicketsPage;
