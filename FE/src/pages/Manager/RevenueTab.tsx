import React, { useEffect, useState, useMemo } from 'react';
import axiosClient from '../../services/api/axiosClient';
import parkingLotService from '../../services/api/parkingLotService';
import { CalendarDays, Tag, DollarSign, RefreshCw, ChevronLeft, ChevronRight, AlertCircle, Calendar, X, User, CreditCard, Receipt, Clock, Hash, Building } from 'lucide-react';

type Tab = 'session_checkout' | 'booking' | 'monthly_pass';

interface TxPayment {
  _id: string;
  invoiceCode: string;
  amount: number;
  baseFee?: number;
  overtimeFee?: number;
  method: string;
  status: string;
  paymentType: string;
  paidAt?: string;
  createdAt: string;
  user?: { fullName: string; email: string };
  parkingSession?: { sessionCode?: string; vehicleInfo?: { licensePlate?: string } };
  booking?: { bookingCode?: string };
  monthlyPass?: any;
  transferContent?: string;
}

const METHOD_LABEL: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  momo: 'MoMo',
  vnpay: 'VNPay',
  card: 'Card',
};

const STATUS_COLOR: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-gray-100 text-gray-500',
};

function TransactionDetailModal({ tx, onClose, fmt, fmtDate, activeTab }: {
  tx: TxPayment;
  onClose: () => void;
  fmt: (n: number) => string;
  fmtDate: (d?: string) => string;
  activeTab: Tab;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Payment Detail</p>
            <p className="font-mono text-sm font-bold text-gray-900 mt-0.5">{tx.invoiceCode || '—'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Amount */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-600 font-medium uppercase tracking-wider mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-emerald-700">{fmt(tx.amount || 0)}</p>
            </div>
            {(tx.baseFee != null && tx.baseFee > 0) && (
              <div className="text-right text-xs text-gray-500 space-y-0.5">
                <p>Base Fee: <span className="font-semibold text-gray-700">{fmt(tx.baseFee)}</span></p>
                {(tx.overtimeFee != null && tx.overtimeFee > 0) && (
                  <p className="text-red-500">Overtime: <span className="font-semibold">+{fmt(tx.overtimeFee)}</span></p>
                )}
              </div>
            )}
          </div>

          {/* Status + Method */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Hash className="w-3 h-3 text-gray-400" />
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</p>
              </div>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLOR[tx.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {tx.status}
              </span>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <CreditCard className="w-3 h-3 text-gray-400" />
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Method</p>
              </div>
              <p className="text-sm font-semibold text-gray-800">{METHOD_LABEL[tx.method] ?? tx.method}</p>
            </div>
          </div>

          {/* Customer */}
          {tx.user && (
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <User className="w-3 h-3 text-gray-400" />
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Customer</p>
              </div>
              <p className="text-sm font-semibold text-gray-800">{tx.user.fullName}</p>
              <p className="text-xs text-gray-400">{tx.user.email}</p>
            </div>
          )}

          {/* Reference info */}
          {(tx.booking?.bookingCode || tx.parkingSession?.sessionCode || tx.parkingSession?.vehicleInfo?.licensePlate || tx.monthlyPass?.passCode || tx.transferContent) && (
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Receipt className="w-3 h-3 text-gray-400" />
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  {activeTab === 'session_checkout' ? 'Session Info' : activeTab === 'booking' ? 'Booking Info' : 'Pass Info'}
                </p>
              </div>
              {tx.booking?.bookingCode && <p className="text-sm font-mono font-semibold text-blue-600">{tx.booking.bookingCode}</p>}
              {tx.parkingSession?.sessionCode && <p className="text-xs text-gray-500">Session: <span className="font-mono">{tx.parkingSession.sessionCode}</span></p>}
              {tx.parkingSession?.vehicleInfo?.licensePlate && <p className="text-xs text-gray-500">Plate: <span className="font-semibold text-gray-700">{tx.parkingSession.vehicleInfo.licensePlate}</span></p>}
              {tx.monthlyPass?.passCode && <p className="text-sm font-mono font-semibold text-amber-600">{tx.monthlyPass.passCode}</p>}
              {tx.transferContent && <p className="text-xs font-mono text-gray-500 mt-1 break-all">{tx.transferContent}</p>}
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Created</p>
              </div>
              <p className="text-xs font-medium text-gray-700">{fmtDate(tx.createdAt)}</p>
            </div>
            {tx.paidAt && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Paid At</p>
                </div>
                <p className="text-xs font-medium text-emerald-700">{fmtDate(tx.paidAt)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function RevenueTab({ globalLotId, setGlobalLotId }: { globalLotId?: string; setGlobalLotId?: (id: string) => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('session_checkout');
  const [allTransactions, setAllTransactions] = useState<TxPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<TxPayment | null>(null);
  const [lots, setLots] = useState<any[]>([]);
  const LIMIT = 10;

  const user = useMemo(() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } }, []);
  const isManager = user?.role === 'parking_manager';

  // Fetch lots for dropdown
  useEffect(() => {
    parkingLotService.getParkingLots({ limit: 100 }).then(res => {
      let ls: any[] = res.data || res.docs || (Array.isArray(res) ? res : []);
      if (isManager) {
        const raw = user?.assignedParkingLot;
        const ids: string[] = Array.isArray(raw)
          ? raw.map((v: any) => (v?._id?.toString?.() || v?.toString?.() || '')).filter(Boolean)
          : (raw ? [(raw as any)?._id?.toString?.() || raw?.toString?.() || ''].filter(Boolean) : []);
        if (ids.length) ls = ls.filter((l: any) => ids.includes(l._id));
      }
      setLots(ls);
    }).catch(() => {});
  }, []);

  const [allTabDocs, setAllTabDocs] = useState<Record<Tab, TxPayment[]>>({
    session_checkout: [],
    booking: [],
    monthly_pass: [],
  });

  const [grandTotal, setGrandTotal] = useState(0);
  const [grandCount, setGrandCount] = useState(0);
  const [tabTotals, setTabTotals] = useState<Record<Tab, number>>({
    session_checkout: 0,
    booking: 0,
    monthly_pass: 0,
  });

  // Single date picker – default = '' (shows full month)
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDay, setSelectedDay] = useState<string>('');

  const fmt = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  const fmtDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const fetchOneTab = async (type: Tab, startDate: string, endDate: string): Promise<TxPayment[]> => {
    const params: Record<string, any> = {
      paymentType: type,
      limit: 10000,
      page: 1,
      sort: '-createdAt',
      status: 'completed',
      startDate,
      endDate,
    };
    if (globalLotId) params.parkingLot = globalLotId;
    const res: any = await axiosClient.get('/payments', { params });
    let docs = res.data?.docs ?? res.docs ?? res.data ?? [];
    if (!Array.isArray(docs)) return [];
    // Sort by paidAt (or createdAt) descending so display order matches the DATE column
    docs.sort((a: TxPayment, b: TxPayment) => {
      const da = new Date(a.paidAt ?? a.createdAt).getTime();
      const db = new Date(b.paidAt ?? b.createdAt).getTime();
      return db - da;
    });
    return docs;
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Always fetch the full current month
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

      // Fetch all 3 tabs in parallel
      const [sessionDocs, bookingDocs, passDocs] = await Promise.all([
        fetchOneTab('session_checkout', startDate, endDate),
        fetchOneTab('booking', startDate, endDate),
        fetchOneTab('monthly_pass', startDate, endDate),
      ]);

      const allDocs: Record<Tab, TxPayment[]> = {
        session_checkout: sessionDocs,
        booking: bookingDocs,
        monthly_pass: passDocs,
      };

      setAllTabDocs(allDocs);
      setAllTransactions(allDocs[activeTab]);
      setPage(1);

      // Compute per-tab totals for month
      const totals = {} as Record<Tab, number>;
      let grand = 0;
      let count = 0;
      (['session_checkout', 'booking', 'monthly_pass'] as Tab[]).forEach(t => {
        const sum = allDocs[t].reduce((acc, tx) => acc + (tx.amount || 0), 0);
        totals[t] = sum;
        grand += sum;
        count += allDocs[t].length;
      });
      setTabTotals(totals);
      setGrandTotal(grand);
      setGrandCount(count);
    } catch (err: any) {
      setError(err.message || 'Error loading transactions.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch only when building changes (NOT on tab change — all tabs fetched at once)
  useEffect(() => {
    fetchTransactions();
  }, [globalLotId]);

  // Switch displayed data when tab changes (no API call needed)
  useEffect(() => {
    if (allTabDocs[activeTab].length > 0 || Object.values(allTabDocs).some(d => d.length > 0)) {
      setAllTransactions(allTabDocs[activeTab]);
      setPage(1);
    }
  }, [activeTab]);

  const handleTabChange = (tab: Tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
  };

  // Calculate filtered results & totals based on selectedDay
  const { displayTransactions, displayTabTotals, displayGrandTotal, displayGrandCount } = useMemo(() => {
    if (!selectedDay) {
      return {
        displayTransactions: allTransactions,
        displayTabTotals: tabTotals,
        displayGrandTotal: grandTotal,
        displayGrandCount: grandCount,
      };
    }

    const filteredDocs: Record<Tab, TxPayment[]> = {
      session_checkout: (allTabDocs.session_checkout || []).filter(tx => (tx.paidAt ?? tx.createdAt ?? '').slice(0, 10) === selectedDay),
      booking: (allTabDocs.booking || []).filter(tx => (tx.paidAt ?? tx.createdAt ?? '').slice(0, 10) === selectedDay),
      monthly_pass: (allTabDocs.monthly_pass || []).filter(tx => (tx.paidAt ?? tx.createdAt ?? '').slice(0, 10) === selectedDay),
    };

    const totals = {} as Record<Tab, number>;
    let grand = 0;
    let count = 0;
    (['session_checkout', 'booking', 'monthly_pass'] as Tab[]).forEach(t => {
      const sum = filteredDocs[t].reduce((acc, tx) => acc + (tx.amount || 0), 0);
      totals[t] = sum;
      grand += sum;
      count += filteredDocs[t].length;
    });

    return {
      displayTransactions: filteredDocs[activeTab],
      displayTabTotals: totals,
      displayGrandTotal: grand,
      displayGrandCount: count,
    };
  }, [selectedDay, allTransactions, tabTotals, grandTotal, grandCount, allTabDocs, activeTab]);

  const { paginatedTransactions, totalPages } = useMemo(() => {
    const totalPages = Math.ceil(displayTransactions.length / LIMIT) || 1;
    const paginatedTransactions = displayTransactions.slice((page - 1) * LIMIT, page * LIMIT);
    return { paginatedTransactions, totalPages };
  }, [displayTransactions, page]);

  const activeTabRevenue = displayTabTotals[activeTab] ?? 0;
  const activeTabCount = displayTransactions.length;

  const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string; activeClass: string }[] = [
    {
      key: 'session_checkout',
      label: 'Parking Sessions',
      icon: <CalendarDays className="w-5 h-5" />,
      color: 'text-gray-900',
      activeClass: 'bg-gray-900 text-white shadow-md shadow-gray-300',
    },
    {
      key: 'booking',
      label: 'Bookings',
      icon: <CalendarDays className="w-5 h-5" />,
      color: 'text-gray-900',
      activeClass: 'bg-gray-900 text-white shadow-md shadow-gray-300',
    },
    {
      key: 'monthly_pass',
      label: 'Monthly Pass',
      icon: <Tag className="w-5 h-5" />,
      color: 'text-gray-900',
      activeClass: 'bg-gray-900 text-white shadow-md shadow-gray-300',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Reports</p>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            Revenue
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Building selector — same design as other tabs */}
          <div className="relative">
            <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={globalLotId || ''}
              onChange={e => setGlobalLotId?.(e.target.value)}
              disabled={isManager && lots.length <= 1}
              className={`pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[220px] transition-all appearance-none ${
                isManager && lots.length <= 1 ? 'opacity-70 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:border-gray-300'
              }`}
            >
              {!isManager && <option value="">-- All Buildings --</option>}
              {lots.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </div>

          {/* Single date picker */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="date"
              value={selectedDay}
              max={todayStr}
              onChange={e => { setSelectedDay(e.target.value); setPage(1); }}
              className="text-sm text-gray-700 outline-none bg-transparent cursor-pointer"
            />
            {selectedDay && (
              <button onClick={() => { setSelectedDay(''); setPage(1); }} title="Show full month" className="text-gray-400 hover:text-gray-700 ml-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 transition disabled:opacity-40 shadow-sm bg-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Revenue Summary Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        {/* Grand total row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 mb-5 border-b border-gray-100">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
              {selectedDay ? 'Daily Total' : 'Monthly Total'}
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-emerald-600">{fmt(displayGrandTotal)}</h3>
              <span className="text-gray-400 text-sm font-medium">
                / {selectedDay ? new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-100 px-5 py-3 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-lg border border-gray-100 shadow-sm flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Total Transactions</p>
              <p className="text-xl font-bold text-gray-900">{displayGrandCount}</p>
            </div>
          </div>
        </div>

        {/* Per-tab breakdown */}
        <div className="grid grid-cols-3 gap-3">
          {([
            { key: 'session_checkout' as Tab, label: 'Parking Sessions' },
            { key: 'booking' as Tab, label: 'Bookings' },
            { key: 'monthly_pass' as Tab, label: 'Monthly Pass' },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`text-left p-4 rounded-xl border transition-all ${activeTab === key
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                }`}
            >
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-lg font-bold ${activeTab === key ? 'text-emerald-700' : 'text-gray-700'
                }`}>{fmt(displayTabTotals[key] ?? 0)}</p>
            </button>
          ))}
        </div>
      </div>



      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm border border-red-100">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="font-semibold text-gray-700">
            {activeTab === 'session_checkout' ? 'Parking Session Payments' : activeTab === 'booking' ? 'Booking Payments' : 'Monthly Pass Payments'}
            {!loading && (
              <span className="ml-2 text-xs font-normal text-gray-400">({displayTransactions.length} records)</span>
            )}
          </h3>
          {!loading && displayTransactions.length > 0 && (
            <span className="text-sm font-semibold text-emerald-600">{fmt(activeTabRevenue)}</span>
          )}
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
            <RefreshCw className="w-8 h-8 animate-spin opacity-40" />
            <p className="text-sm">Loading transactions...</p>
          </div>
        ) : displayTransactions.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
            <DollarSign className="w-10 h-10 opacity-20" />
            <p className="text-sm">No transactions found for this period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-3 text-left">Invoice</th>
                  {activeTab === 'booking'
                    ? <th className="px-4 py-3 text-left">Reference</th>
                    : <th className="px-4 py-3 text-left">Pass Info</th>
                  }
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Method</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedTransactions.map(tx => (
                  <tr
                    key={tx._id}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {/* Invoice */}
                    <td className="px-6 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">
                      {tx.invoiceCode || '—'}
                    </td>

                    {/* Reference */}
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {activeTab === 'booking' ? (
                        <div>
                          {tx.booking?.bookingCode && (
                            <p className="font-medium text-blue-600">{tx.booking.bookingCode}</p>
                          )}
                          {tx.parkingSession?.vehicleInfo?.licensePlate && (
                            <p className="text-xs text-gray-400">{tx.parkingSession.vehicleInfo.licensePlate}</p>
                          )}
                          {tx.transferContent && (
                            <p className="text-xs text-gray-400 font-mono">{tx.transferContent}</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          {tx.transferContent && (
                            <p className="font-mono text-xs text-amber-600">{tx.transferContent}</p>
                          )}
                          {tx.monthlyPass?.passCode && (
                            <p className="text-xs text-gray-400">{tx.monthlyPass.passCode}</p>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      {tx.user ? (
                        <div>
                          <p className="font-medium text-gray-800 truncate max-w-[140px]">{tx.user.fullName}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[140px]">{tx.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Method */}
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {METHOD_LABEL[tx.method] ?? tx.method}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="font-semibold text-gray-900">
                        {fmt(tx.amount || 0)}
                      </div>
                      {/* Overtime-only badge: baseFee=0 means base was pre-paid via booking */}
                      {activeTab === 'session_checkout' && (tx.baseFee === 0 || tx.baseFee == null) && tx.overtimeFee > 0 && (
                        <div className="flex flex-col items-end mt-0.5 gap-0.5">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-orange-50 text-orange-500 border border-orange-200">
                            Overtime Only
                          </span>
                          <span className="text-[10px] text-gray-400">Base pre-paid via booking</span>
                        </div>
                      )}
                      {(tx.baseFee != null && tx.baseFee > 0) && (
                        <div className="text-[10px] text-gray-400 flex flex-col items-end mt-0.5">
                          <span>Base Fee: {fmt(tx.baseFee)}</span>
                          {(tx.overtimeFee != null && tx.overtimeFee > 0) && (
                            <span className="text-red-400">+{fmt(tx.overtimeFee)} Overtime</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLOR[tx.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {tx.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {fmtDate(tx.paidAt ?? tx.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 bg-white">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedTx && (
        <TransactionDetailModal
          tx={selectedTx}
          onClose={() => setSelectedTx(null)}
          fmt={fmt}
          fmtDate={fmtDate}
          activeTab={activeTab}
        />
      )}
    </div>
  );
}
