import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header/Header';

// ── Icons ─────────────────────────────────────────────────────────────────────
const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 18-6-6 6-6" />
    </svg>
);
const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);
const ChevronRight = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 18 6-6-6-6" />
    </svg>
);
const CheckCircle = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

// Payment method icons
const CreditCardIcon = ({ size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </svg>
);
const WalletIcon = ({ size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
        <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </svg>
);
const MomoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#ae2070" />
        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="8" fontWeight="900" fontFamily="sans-serif">MoMo</text>
    </svg>
);
const ZaloPayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#0068ff" />
        <text x="12" y="15" textAnchor="middle" fill="white" fontSize="6" fontWeight="900" fontFamily="sans-serif">ZaloPay</text>
    </svg>
);
const CashIcon = ({ size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <circle cx="12" cy="12" r="3" /><path d="M5 12h.01M19 12h.01" />
    </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const formatExpiry = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};
const formatCVV = (v) => v.replace(/\D/g, '').slice(0, 3);

// ── Main ──────────────────────────────────────────────────────────────────────
const CheckoutPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const data = location.state || {};

    // Session data passed from SessionPage
    const spot = data.spot || { title: 'Bitexco Financial Tower Parking', price: 20000 };
    const vehicleType = data.vehicleType || 'car';
    const floor = data.floor || 3;
    const slot = data.slot || 5;
    const entryDate = data.entryDate ? new Date(data.entryDate) : new Date(Date.now() - 7200000);
    const elapsed = data.elapsed || 7200; // seconds
    const totalAmount = data.totalAmount !== undefined 
        ? data.totalAmount 
        : (vehicleType === 'motorcycle'
            ? ((elapsed / 3600) < 4 ? 2000 : 4000)
            : ((elapsed / 3600) < 4 ? 8000 : 16000));

    const slotCode = `${String.fromCharCode(64 + floor)}-${floor}0${String(slot).padStart(1, '0')}`;
    const licensePlate = vehicleType === 'motorcycle' ? '59T1-23456' : '51A-12345';
    const exitTime = new Date();

    // Payment state
    const [payMethod, setPayMethod] = useState('card'); // 'card' | 'momo' | 'zalopay' | 'cash'
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [saveCard, setSaveCard] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const e: Record<string, string> = {};
        if (payMethod === 'card') {
            if (cardNumber.replace(/\s/g, '').length < 16) e.cardNumber = 'Enter a valid 16-digit card number';
            if (!cardName.trim()) e.cardName = 'Cardholder name is required';
            if (expiry.length < 5) e.expiry = 'Enter valid expiry MM/YY';
            if (cvv.length < 3) e.cvv = 'Enter valid CVV';
        }
        return e;
    };

    const handlePay = () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        setErrors({});
        setProcessing(true);
        setTimeout(() => {
            setProcessing(false);
            navigate('/checkoutsuccess', {
                state: {
                    spot, vehicleType, floor, slot, slotCode,
                    licensePlate, entryDate: entryDate.toISOString(),
                    exitTime: exitTime.toISOString(),
                    elapsed, totalAmount,
                    payMethod,
                    cardLast4: payMethod === 'card' ? cardNumber.replace(/\s/g, '').slice(-4) : null,
                }
            });
        }, 1800);
    };

    const formatTime = (d) => d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    const formatHMS = (s) => {
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const serviceFee = Math.round(totalAmount * 0.05);
    const grandTotal = Math.round(totalAmount) + serviceFee;

    const payMethods = [
        { id: 'card', label: 'Credit / Debit Card', icon: <CreditCardIcon size={22} />, color: '#2563eb' },
        { id: 'momo', label: 'MoMo Wallet', icon: <MomoIcon />, color: '#ae2070' },
        { id: 'zalopay', label: 'ZaloPay', icon: <ZaloPayIcon />, color: '#0068ff' },
        { id: 'cash', label: 'Pay at Counter', icon: <CashIcon size={22} />, color: '#10b981' },
    ];

    return (
        <>
            <style>{`
                * { box-sizing: border-box; }
                .co-page {
                    min-height: 100vh;
                    background: linear-gradient(160deg, #f0f4f8 0%, #e8f0fe 100%);
                    font-family: 'Inter', 'Segoe UI', sans-serif;
                    color: #0f172a;
                }

                /* ── Top strip ── */
                .co-topbar {
                    background: white;
                    border-bottom: 1px solid #e2e8f0;
                    padding: 16px 28px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
                    position: sticky;
                    top: 72px;
                    z-index: 20;
                }
                .co-back-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: #f8fafc;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 10px;
                    padding: 8px 14px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #475569;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .co-back-btn:hover { background: white; border-color: #94a3b8; transform: translateX(-2px); }
                .co-topbar-title {
                    font-size: 18px;
                    font-weight: 800;
                    color: #0f172a;
                    letter-spacing: -0.2px;
                }
                .co-secure-badge {
                    margin-left: auto;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #10b981;
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    padding: 5px 12px;
                    border-radius: 20px;
                }

                /* ── Layout ── */
                .co-layout {
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 28px 20px 80px;
                    display: grid;
                    grid-template-columns: 1fr 340px;
                    gap: 24px;
                    align-items: start;
                }
                @media(max-width: 768px) {
                    .co-layout { grid-template-columns: 1fr; }
                }

                /* ── Card ── */
                .co-card {
                    background: white;
                    border-radius: 18px;
                    border: 1px solid #e2e8f0;
                    padding: 24px;
                    margin-bottom: 16px;
                    box-shadow: 0 2px 16px rgba(0,0,0,0.05);
                }
                .co-card-title {
                    font-size: 15px;
                    font-weight: 800;
                    color: #0f172a;
                    margin-bottom: 18px;
                    letter-spacing: -0.2px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .co-divider {
                    height: 1px;
                    background: #f1f5f9;
                    margin: 0 -24px 20px;
                }

                /* ── Order summary rows ── */
                .co-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 9px 0;
                    border-bottom: 1px dashed #f1f5f9;
                    font-size: 13px;
                }
                .co-row:last-child { border-bottom: none; }
                .co-row-label { color: #64748b; font-weight: 500; }
                .co-row-value { color: #0f172a; font-weight: 700; }
                .co-total-row {
                    margin-top: 14px;
                    padding: 16px;
                    background: linear-gradient(135deg, #eff6ff, #dbeafe);
                    border-radius: 14px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border: 1px solid #bfdbfe;
                }
                .co-total-label { font-size: 14px; font-weight: 700; color: #1d4ed8; }
                .co-total-amount { font-size: 24px; font-weight: 900; color: #1e40af; letter-spacing: -0.5px; }

                /* ── Payment methods ── */
                .pay-methods { display: flex; flex-direction: column; gap: 10px; }
                .pay-method {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 14px 16px;
                    border: 2px solid #e2e8f0;
                    border-radius: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: white;
                }
                .pay-method:hover { border-color: #93c5fd; background: #f8fafc; }
                .pay-method.selected { border-color: #3b82f6; background: linear-gradient(135deg, #eff6ff, #f0f9ff); }
                .pay-method-icon {
                    width: 42px; height: 42px;
                    border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                    background: #f8fafc;
                    flex-shrink: 0;
                }
                .pay-method.selected .pay-method-icon { background: #eff6ff; }
                .pay-method-info { flex: 1; }
                .pay-method-name { font-size: 14px; font-weight: 700; color: #1e293b; }
                .pay-method-sub { font-size: 11px; color: #94a3b8; font-weight: 500; margin-top: 1px; }
                .pay-method-radio {
                    width: 20px; height: 20px;
                    border: 2px solid #cbd5e1;
                    border-radius: 50%;
                    flex-shrink: 0;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.15s;
                }
                .pay-method.selected .pay-method-radio { border-color: #3b82f6; }
                .pay-radio-dot {
                    width: 10px; height: 10px;
                    background: #3b82f6;
                    border-radius: 50%;
                    transform: scale(0);
                    transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .pay-method.selected .pay-radio-dot { transform: scale(1); }

                /* ── Card form ── */
                .card-form { margin-top: 20px; display: flex; flex-direction: column; gap: 14px; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                .form-field { display: flex; flex-direction: column; gap: 6px; }
                .form-label {
                    font-size: 11px;
                    font-weight: 700;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.07em;
                }
                .form-input {
                    padding: 13px 16px;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 600;
                    color: #0f172a;
                    background: #f8fafc;
                    outline: none;
                    transition: all 0.2s;
                    font-variant-numeric: tabular-nums;
                    letter-spacing: 0.04em;
                    width: 100%;
                }
                .form-input:focus { border-color: #3b82f6; background: white; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
                .form-input.error { border-color: #ef4444; background: #fef2f2; }
                .form-error { font-size: 11px; color: #ef4444; font-weight: 600; }

                .card-visual {
                    height: 140px;
                    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #6366f1 100%);
                    border-radius: 16px;
                    padding: 20px 24px;
                    position: relative;
                    overflow: hidden;
                    margin-bottom: 20px;
                    box-shadow: 0 8px 32px rgba(59,130,246,0.35);
                }
                .card-visual::before {
                    content: '';
                    position: absolute;
                    top: -30px; right: -30px;
                    width: 140px; height: 140px;
                    background: rgba(255,255,255,0.08);
                    border-radius: 50%;
                }
                .card-visual::after {
                    content: '';
                    position: absolute;
                    bottom: -50px; right: 60px;
                    width: 180px; height: 180px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 50%;
                }
                .card-chip {
                    width: 36px; height: 26px;
                    background: linear-gradient(135deg, #fbbf24, #f59e0b);
                    border-radius: 5px;
                    margin-bottom: 20px;
                    position: relative;
                    z-index: 1;
                }
                .card-number-display {
                    font-size: 16px;
                    font-weight: 700;
                    color: white;
                    letter-spacing: 0.12em;
                    font-variant-numeric: tabular-nums;
                    position: relative;
                    z-index: 1;
                    margin-bottom: 12px;
                    opacity: cardNumber ? 1 : 0.5;
                }
                .card-bottom {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    position: relative;
                    z-index: 1;
                }
                .card-holder {
                    font-size: 11px;
                    color: rgba(255,255,255,0.7);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                }
                .card-holder-name {
                    font-size: 13px;
                    color: white;
                    font-weight: 700;
                    letter-spacing: 0.04em;
                }
                .card-exp-label { font-size: 9px; color: rgba(255,255,255,0.6); letter-spacing: 0.06em; font-weight: 600; }
                .card-exp-value { font-size: 13px; color: white; font-weight: 700; letter-spacing: 0.06em; }

                /* ── Save card checkbox ── */
                .save-card-row {
                    display: flex; align-items: center; gap: 10px;
                    padding: 12px 14px;
                    background: #f8fafc;
                    border-radius: 10px;
                    cursor: pointer;
                    margin-top: 4px;
                    border: 1px solid #e2e8f0;
                    transition: all 0.2s;
                }
                .save-card-row:hover { background: #eff6ff; border-color: #93c5fd; }
                .save-checkbox {
                    width: 18px; height: 18px;
                    border: 2px solid #cbd5e1;
                    border-radius: 5px;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s;
                    flex-shrink: 0;
                    background: white;
                }
                .save-checkbox.checked { background: #3b82f6; border-color: #3b82f6; }
                .save-card-text { font-size: 13px; font-weight: 600; color: #475569; }

                /* ── Right column: order summary ── */
                .order-summary { position: sticky; top: 148px; }

                /* ── Pay button ── */
                .co-pay-btn {
                    width: 100%;
                    padding: 18px;
                    border: none;
                    border-radius: 14px;
                    font-size: 16px;
                    font-weight: 800;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
                    letter-spacing: 0.02em;
                    margin-top: 4px;
                }
                .co-pay-btn.active {
                    background: linear-gradient(135deg, #2563eb, #4f46e5);
                    color: white;
                    box-shadow: 0 8px 28px rgba(79,70,229,0.4);
                }
                .co-pay-btn.active:hover { transform: translateY(-3px); box-shadow: 0 14px 36px rgba(79,70,229,0.5); }
                .co-pay-btn.active:active { transform: scale(0.98); }
                .co-pay-btn.processing {
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    color: white;
                    cursor: wait;
                    box-shadow: 0 8px 28px rgba(99,102,241,0.4);
                }
                .co-pay-note {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    font-size: 11px;
                    color: #94a3b8;
                    font-weight: 500;
                    margin-top: 10px;
                }

                /* ── Processing spinner ── */
                @keyframes spin { to { transform: rotate(360deg); } }
                .spinner {
                    width: 20px; height: 20px;
                    border: 3px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                /* ── Fade-in ── */
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(14px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .co-in { animation: fadeSlideIn 0.35s ease-out forwards; }
                .co-in-1 { animation: fadeSlideIn 0.35s 0.05s ease-out both; }
                .co-in-2 { animation: fadeSlideIn 0.35s 0.1s ease-out both; }
                .co-in-3 { animation: fadeSlideIn 0.35s 0.15s ease-out both; }
            `}</style>

            <div className="co-page">
                <Header />

                {/* Topbar */}
                <div className="co-topbar">
                    <button className="co-back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeftIcon /> Back
                    </button>
                    <span className="co-topbar-title">Checkout</span>
                    <span className="co-secure-badge"><LockIcon /> Secure Payment</span>
                </div>

                <div className="co-layout">
                    {/* ── LEFT: Payment Form ── */}
                    <div>
                        {/* Payment methods */}
                        <div className="co-card co-in">
                            <div className="co-card-title">
                                <CreditCardIcon size={20} />
                                Select Payment Method
                            </div>
                            <div className="co-divider"></div>
                            <div className="pay-methods">
                                {payMethods.map(m => (
                                    <div
                                        key={m.id}
                                        className={`pay-method ${payMethod === m.id ? 'selected' : ''}`}
                                        onClick={() => { setPayMethod(m.id); setErrors({}); }}
                                    >
                                        <div className="pay-method-icon" style={{ color: m.color }}>{m.icon}</div>
                                        <div className="pay-method-info">
                                            <div className="pay-method-name">{m.label}</div>
                                            <div className="pay-method-sub">
                                                {m.id === 'card' && 'Visa, Mastercard, JCB, Amex'}
                                                {m.id === 'momo' && 'Instant payment via MoMo app'}
                                                {m.id === 'zalopay' && 'Instant payment via ZaloPay app'}
                                                {m.id === 'cash' && 'Pay at parking booth before exit'}
                                            </div>
                                        </div>
                                        <div className="pay-method-radio">
                                            <div className="pay-radio-dot"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Card form */}
                            {payMethod === 'card' && (
                                <div className="card-form">
                                    {/* Visual card */}
                                    <div className="card-visual">
                                        <div className="card-chip"></div>
                                        <div className="card-number-display">
                                            {cardNumber || '•••• •••• •••• ••••'}
                                        </div>
                                        <div className="card-bottom">
                                            <div>
                                                <div className="card-holder">Card Holder</div>
                                                <div className="card-holder-name">{cardName || 'YOUR NAME'}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div className="card-exp-label">EXPIRES</div>
                                                <div className="card-exp-value">{expiry || 'MM/YY'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-field">
                                        <label className="form-label">Card Number</label>
                                        <input
                                            id="card-number"
                                            className={`form-input ${errors.cardNumber ? 'error' : ''}`}
                                            placeholder="1234 5678 9012 3456"
                                            value={cardNumber}
                                            onChange={e => setCardNumber(formatCard(e.target.value))}
                                            maxLength={19}
                                        />
                                        {errors.cardNumber && <span className="form-error">{errors.cardNumber}</span>}
                                    </div>

                                    <div className="form-field">
                                        <label className="form-label">Cardholder Name</label>
                                        <input
                                            id="card-name"
                                            className={`form-input ${errors.cardName ? 'error' : ''}`}
                                            placeholder="NGUYEN VAN A"
                                            value={cardName}
                                            onChange={e => setCardName(e.target.value.toUpperCase())}
                                        />
                                        {errors.cardName && <span className="form-error">{errors.cardName}</span>}
                                    </div>

                                    <div className="form-row">
                                        <div className="form-field">
                                            <label className="form-label">Expiry Date</label>
                                            <input
                                                id="card-expiry"
                                                className={`form-input ${errors.expiry ? 'error' : ''}`}
                                                placeholder="MM/YY"
                                                value={expiry}
                                                onChange={e => setExpiry(formatExpiry(e.target.value))}
                                                maxLength={5}
                                            />
                                            {errors.expiry && <span className="form-error">{errors.expiry}</span>}
                                        </div>
                                        <div className="form-field">
                                            <label className="form-label">CVV</label>
                                            <input
                                                id="card-cvv"
                                                className={`form-input ${errors.cvv ? 'error' : ''}`}
                                                placeholder="•••"
                                                value={cvv}
                                                type="password"
                                                onChange={e => setCvv(formatCVV(e.target.value))}
                                                maxLength={3}
                                            />
                                            {errors.cvv && <span className="form-error">{errors.cvv}</span>}
                                        </div>
                                    </div>

                                    <div className="save-card-row" onClick={() => setSaveCard(!saveCard)}>
                                        <div className={`save-checkbox ${saveCard ? 'checked' : ''}`}>
                                            {saveCard && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                                        </div>
                                        <span className="save-card-text">Save this card for future payments</span>
                                    </div>
                                </div>
                            )}

                            {/* QR instruction for e-wallets */}
                            {(payMethod === 'momo' || payMethod === 'zalopay') && (
                                <div style={{
                                    marginTop: 20, padding: '24px',
                                    background: payMethod === 'momo' ? 'linear-gradient(135deg,#fdf2f8,#fce7f3)' : 'linear-gradient(135deg,#eff6ff,#dbeafe)',
                                    borderRadius: 14,
                                    border: `1px solid ${payMethod === 'momo' ? '#f9a8d4' : '#bfdbfe'}`,
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: 48, marginBottom: 12 }}>
                                        {payMethod === 'momo' ? '📱' : '📲'}
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: 15, color: payMethod === 'momo' ? '#9d174d' : '#1d4ed8', marginBottom: 6 }}>
                                        Open {payMethod === 'momo' ? 'MoMo' : 'ZaloPay'} app and confirm payment
                                    </div>
                                    <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                                        Amount: <strong>{grandTotal.toLocaleString('vi-VN')} ₫</strong> will be deducted from your wallet
                                    </div>
                                </div>
                            )}

                            {/* Cash instructions */}
                            {payMethod === 'cash' && (
                                <div style={{
                                    marginTop: 20, padding: '24px',
                                    background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
                                    borderRadius: 14,
                                    border: '1px solid #86efac',
                                }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#166534', lineHeight: 1.7 }}>
                                        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 10 }}>📋 Instructions</div>
                                        <div>1. Proceed to the parking booth on Floor G</div>
                                        <div>2. Show your QR ticket to the attendant</div>
                                        <div>3. Pay <strong>{grandTotal.toLocaleString('vi-VN')} ₫</strong> in cash</div>
                                        <div>4. Receive your exit receipt</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT: Order Summary ── */}
                    <div className="order-summary">
                        <div className="co-card co-in-1">
                            <div className="co-card-title">🧾 Order Summary</div>
                            <div className="co-divider"></div>

                            <div style={{ marginBottom: 16, padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                                <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 3 }}>Parking Facility</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#1d4ed8' }}>{spot.title}</div>
                            </div>

                            <div className="co-row">
                                <span className="co-row-label">License Plate</span>
                                <span className="co-row-value" style={{ fontFamily: 'monospace', letterSpacing: '0.06em' }}>{licensePlate}</span>
                            </div>
                            <div className="co-row">
                                <span className="co-row-label">Floor / Slot</span>
                                <span className="co-row-value">Floor {floor} — {slotCode}</span>
                            </div>
                            <div className="co-row">
                                <span className="co-row-label">Entry</span>
                                <span className="co-row-value" style={{ fontSize: 12 }}>{formatTime(entryDate)}</span>
                            </div>
                            <div className="co-row">
                                <span className="co-row-label">Exit</span>
                                <span className="co-row-value" style={{ fontSize: 12 }}>{formatTime(exitTime)}</span>
                            </div>
                            <div className="co-row">
                                <span className="co-row-label">Duration</span>
                                <span className="co-row-value">{Math.floor(elapsed / 3600)}h {Math.floor((elapsed % 3600) / 60)}m</span>
                            </div>
                            <div className="co-row">
                                <span className="co-row-label">Parking Fee</span>
                                <span className="co-row-value">{Math.round(totalAmount).toLocaleString('vi-VN')} ₫</span>
                            </div>
                            <div className="co-row">
                                <span className="co-row-label">Service Fee (5%)</span>
                                <span className="co-row-value">{serviceFee.toLocaleString('vi-VN')} ₫</span>
                            </div>

                            <div className="co-total-row">
                                <span className="co-total-label">Grand Total</span>
                                <span className="co-total-amount">{grandTotal.toLocaleString('vi-VN')} ₫</span>
                            </div>
                        </div>

                        {/* Pay button */}
                        <div className="co-card co-in-2" style={{ padding: '20px' }}>
                            <button
                                id="confirm-payment-btn"
                                className={`co-pay-btn ${processing ? 'processing' : 'active'}`}
                                onClick={handlePay}
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <div className="spinner"></div>
                                        Processing Payment...
                                    </>
                                ) : (
                                    <>
                                        <LockIcon />
                                        Pay {grandTotal.toLocaleString('vi-VN')} ₫
                                    </>
                                )}
                            </button>
                            <div className="co-pay-note">
                                <LockIcon />
                                256-bit SSL encrypted · Safe & Secure
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CheckoutPage;
