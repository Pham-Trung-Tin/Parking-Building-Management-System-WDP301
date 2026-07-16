import React, { useEffect, useState, useMemo } from 'react';
import axiosClient from '../../services/api/axiosClient';
import { CalendarDays, Tag, DollarSign, RefreshCw, ChevronLeft, ChevronRight, AlertCircle, Calendar } from 'lucide-react';

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
  pending:   'bg-amber-100 text-amber-700',
  failed:    'bg-red-100 text-red-700',
  refunded:  'bg-gray-100 text-gray-600',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default function RevenueTab({ globalLotId }: { globalLotId?: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('session_checkout');
  const [allTransactions, setAllTransactions] = useState<TxPayment[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [page, setPage]         = useState(1);
  const LIMIT = 10;

  // Month & Year state
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const fmt = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  const fmtDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
      
      const params: Record<string, any> = {
        paymentType: activeTab,
        limit: 10000, // Fetch all for the month to calculate total
        page: 1,
        sort: '-createdAt',
        status: 'completed',
        startDate,
        endDate
      };
      if (globalLotId) params.parkingLot = globalLotId;

      const res: any = await axiosClient.get('/payments', { params });
      if (res.success !== false) {
        let docs = res.data?.docs ?? res.docs ?? res.data ?? [];
        if (!Array.isArray(docs)) docs = [];
        setAllTransactions(docs);
        setPage(1);
      } else {
        setError(res.message || 'Failed to load transactions.');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [activeTab, globalLotId, month, year]);

  const handleTabChange = (tab: Tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
  };

  // Calculations & Pagination
  const { totalRevenue, successfulCount, paginatedTransactions, totalPages } = useMemo(() => {
    let revenue = 0;
    let successCount = 0;
    
    allTransactions.forEach(tx => {
      if (tx.status === 'completed') {
        revenue += (tx.amount || tx.baseFee || 0);
        successCount++;
      }
    });

    const totalPages = Math.ceil(allTransactions.length / LIMIT) || 1;
    const paginatedTransactions = allTransactions.slice((page - 1) * LIMIT, page * LIMIT);

    return { totalRevenue: revenue, successfulCount: successCount, paginatedTransactions, totalPages };
  }, [allTransactions, page]);

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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-400 ml-2" />
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-2 py-1 bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer hover:text-emerald-600"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>Month {m}</option>
              ))}
            </select>
            <span className="text-gray-300">|</span>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-2 py-1 bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer hover:text-emerald-600"
            >
              {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map(y => (
                <option key={y} value={y}>Year {y}</option>
              ))}
            </select>
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
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Total Revenue</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-emerald-600">{fmt(totalRevenue)}</h3>
            <span className="text-gray-400 text-sm font-medium">/ {month}-{year}</span>
          </div>
        </div>
        
        <div className="mt-4 sm:mt-0 bg-gray-50 border border-gray-100 px-5 py-3 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 bg-white rounded-lg border border-gray-100 shadow-sm flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Successful Transactions</p>
            <p className="text-xl font-bold text-gray-900">{successfulCount}</p>
          </div>
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-3">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
              activeTab === tab.key
                ? tab.activeClass
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
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
            {activeTab === 'booking' ? 'Parking Session Payments' : 'Monthly Pass Payments'}
            {!loading && (
              <span className="ml-2 text-xs font-normal text-gray-400">({allTransactions.length} records)</span>
            )}
          </h3>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
            <RefreshCw className="w-8 h-8 animate-spin opacity-40" />
            <p className="text-sm">Loading transactions...</p>
          </div>
        ) : allTransactions.length === 0 ? (
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
                  <tr key={tx._id} className="hover:bg-gray-50 transition-colors">
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
                        {fmt(tx.amount || tx.baseFee || 0)}
                      </div>
                      {(tx.overtimeFee && tx.overtimeFee > 0) ? (
                        <div className="text-[10px] text-gray-400 flex flex-col items-end mt-0.5">
                          <span>Base: {fmt(tx.baseFee || 0)}</span>
                          <span className="text-red-400">Overtime: +{fmt(tx.overtimeFee)}</span>
                        </div>
                      ) : null}
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
    </div>
  );
}
