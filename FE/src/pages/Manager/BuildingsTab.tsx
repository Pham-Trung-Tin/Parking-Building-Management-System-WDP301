import { useEffect, useCallback, useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, X, Check, Building, MapPin, RefreshCw, Layers, Grid, ParkingSquare, DollarSign, Car, TrendingUp, Activity, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import parkingLotService from '../../services/api/parkingLotService';
import floorService from '../../services/api/floorService';
import zoneService from '../../services/api/zoneService';
import reportService, { DashboardStats } from '../../services/api/reportService';
import { Toast, useToast, STATUS_BADGE } from './shared';
import { useConfirm } from '../../components/ConfirmDialog';

const EMPTY = { name: '', code: '', description: '', contactPhone: '', contactEmail: '', status: 'active', address: { street: '', district: '', city: '' } };

const COLORS: Record<string, { bg: string; icon: string; val: string; border: string }> = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-500', val: 'text-blue-800', border: 'border-blue-100' },
  green: { bg: 'bg-emerald-50', icon: 'text-emerald-500', val: 'text-emerald-800', border: 'border-emerald-100' },
  violet: { bg: 'bg-violet-50', icon: 'text-violet-500', val: 'text-violet-800', border: 'border-violet-100' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-500', val: 'text-amber-800', border: 'border-amber-100' },
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-500', val: 'text-indigo-800', border: 'border-indigo-100' },
  rose: { bg: 'bg-rose-50', icon: 'text-rose-500', val: 'text-rose-800', border: 'border-rose-100' },
  teal: { bg: 'bg-teal-50', icon: 'text-teal-500', val: 'text-teal-800', border: 'border-teal-100' },
};

function StatCard({ icon: Icon, label, value, sub, color, loading, onClick }: { icon: any; label: string; value: any; sub?: string; color: string; loading?: boolean; onClick?: () => void }) {
  const c = COLORS[color] ?? COLORS.blue;
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border ${c.border} shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-all group relative overflow-hidden ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
        <Icon className="w-24 h-24" />
      </div>
      <div className="flex items-center gap-3 relative z-10">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-[20px] h-[20px] ${c.icon}`} />
        </div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      </div>
      <div className="relative z-10 mt-1">
        {loading ? <div className="h-7 w-20 bg-gray-100 rounded animate-pulse" /> : <p className={`text-2xl font-bold ${c.val} leading-tight`}>{value}</p>}
        {sub && <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">{sub}</p>}
      </div>
    </div>
  );
}

function LotModal({ initial, onSave, onClose, loading }: any) {
  const [form, setForm] = useState(initial);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const setAddr = (k: string, v: string) => setForm((f: any) => ({ ...f, address: { ...f.address, [k]: v } }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-7 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">{initial._id ? 'Edit Building' : 'Add Building'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          {[['Building Name *', 'name', 'text'], ['Code *', 'code', 'text'], ['Description', 'description', 'text'], ['Contact Phone', 'contactPhone', 'text'], ['Contact Email', 'contactEmail', 'email']].map(([lbl, k, t]) => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">{lbl}</label>
              <input type={t} value={form[k] || ''} onChange={e => set(k, e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow" />
            </div>
          ))}
          <div className="grid grid-cols-3 gap-3">
            {[['Street', 'street'], ['District', 'district'], ['City', 'city']].map(([lbl, k]) => (
              <div key={k}>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">{lbl}</label>
                <input value={form.address?.[k] || ''} onChange={e => setAddr(k, e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-shadow">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={() => onSave(form)} disabled={loading} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">{loading ? 'Saving...' : 'Save Building'}</button>
        </div>
      </div>
    </div>
  );
}

export default function BuildingsTab({ globalLotId, setGlobalLotId, setTab }: any) {
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<any>(null);
  const { toast, showToast } = useToast();
  const { askConfirm, ConfirmNode } = useConfirm();

  const user = useMemo(() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } }, []);
  const isManager = user?.role === 'parking_manager';

  const assignedIds: string[] = useMemo(() => {
    const raw = user?.assignedParkingLot;
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw.map((v: any) => v?._id?.toString?.() || v?.toString?.() || '').filter(Boolean);
    }
    return [(raw as any)?._id?.toString?.() || raw?.toString?.() || ''].filter(Boolean);
  }, [user]);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [floorCount, setFloorCount] = useState<number | null>(null);
  const [zoneCount, setZoneCount] = useState<number | null>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [revenuePeriod, setRevenuePeriod] = useState<'this_month' | 'last_7_days' | 'last_30_days' | 'this_year'>('this_month');
  const [dashLoading, setDashLoading] = useState(true);

  const fetchLots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await parkingLotService.getParkingLots({ limit: 100, search: search || undefined });
      let fetchedLots = res.data || res.docs || (Array.isArray(res) ? res : []);
      if (isManager && assignedIds.length > 0) {
        fetchedLots = fetchedLots.filter((l: any) => assignedIds.includes(l._id));
      }
      setLots(fetchedLots);
    } catch (e: any) { showToast(e.message || 'Error loading', false); }
    finally { setLoading(false); }
  }, [search]);

  const fetchDash = useCallback(async () => {
    // Don't fetch if manager hasn't selected a lot yet
    if (isManager && !globalLotId) {
      setFloorCount(0);
      setZoneCount(0);
      setRevenueData([]);
      setDashLoading(false);
      return;
    }
    setDashLoading(true);
    try {
      const [sr, fr, zr, revR] = await Promise.allSettled([
        reportService.getDashboardStats(globalLotId || undefined),
        floorService.getFloors({ limit: 2000, ...(globalLotId ? { parkingLot: globalLotId } : {}) }),
        zoneService.getZones({ limit: 2000, ...(globalLotId ? { parkingLot: globalLotId } : {}) }),
        reportService.getRevenueReport({ period: revenuePeriod, ...(globalLotId ? { parkingLotId: globalLotId } : {}) })
      ]);

      if (sr.status === 'fulfilled') { const d = sr.value; setStats((d as any).data ?? d); }
      if (fr.status === 'fulfilled') { const d = fr.value; const a = d?.data?.docs ?? d?.docs ?? d?.data ?? (Array.isArray(d) ? d : []); setFloorCount(Array.isArray(a) ? a.length : (d?.total ?? d?.totalDocs ?? null)); }
      if (zr.status === 'fulfilled') { const d = zr.value; const a = d?.data?.docs ?? d?.docs ?? d?.data ?? (Array.isArray(d) ? d : []); setZoneCount(Array.isArray(a) ? a.length : (d?.total ?? d?.totalDocs ?? null)); }

      if (revR.status === 'fulfilled') {
        const d = revR.value;
        const chartData = (d as any).data?.chart || (d as any).chart || [];
        const formattedData = chartData.map((item: any) => ({
          date: `${String(item._id.day).padStart(2, '0')}/${String(item._id.month).padStart(2, '0')}`,
          revenue: item.totalRevenue || 0,
          sortKey: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`
        })).sort((a: any, b: any) => a.sortKey.localeCompare(b.sortKey));
        setRevenueData(formattedData);
      } else {
        setRevenueData([]);
      }

    } catch { /* ignore */ }
    finally { setDashLoading(false); }
  }, [globalLotId, revenuePeriod]);

  useEffect(() => { const t = setTimeout(fetchLots, 300); return () => clearTimeout(t); }, [fetchLots]);
  useEffect(() => { fetchDash(); }, [fetchDash]);

  const activeBuildings = lots.filter(l => l.status === 'active').length;
  const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  // Sum of chart data = total revenue for selected period
  const periodTotal = revenueData.reduce((sum: number, d: any) => sum + (d.revenue || 0), 0);
  const periodLabel = revenuePeriod === 'this_month'
    ? new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : revenuePeriod === 'last_7_days' ? 'Last 7 Days'
    : revenuePeriod === 'last_30_days' ? 'Last 30 Days'
    : 'This Year';

  const handleSave = async (form: any) => {
    if (!form.name || !form.code) return showToast('Name and code are required', false);
    setSaving(true);
    try {
      if (form._id) await parkingLotService.updateParkingLot(form._id, form);
      else await parkingLotService.createParkingLot(form);
      showToast(form._id ? 'Updated' : 'Created');
      setModal(null); fetchLots(); fetchDash();
    } catch (e: any) { showToast(e.message || 'Error saving', false); }
    finally { setSaving(false); }
  };

  const handleDelete = async (lot: any) => {
    askConfirm(
      `Delete "${lot.name}"?`,
      async () => {
        try { await parkingLotService.deleteParkingLot(lot._id); showToast('Deleted'); fetchLots(); fetchDash(); }
        catch (e: any) { showToast(e.message || 'Error', false); }
      },
      'This action cannot be undone.',
      'Delete Building'
    );
  };

  return (
    <div className="pb-10 max-w-[1600px] mx-auto">
      {/* ── Header with Building Dropdown & Add Button ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2 tracking-tight">
            <Building className="w-8 h-8 text-indigo-600" /> Building Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Monitor and manage your parking infrastructure across all locations.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative">
            <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={globalLotId || ''}
              onChange={(e) => setGlobalLotId?.(e.target.value)}
              disabled={isManager && assignedIds.length <= 1}
              className={`pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[220px] transition-all appearance-none ${(isManager && assignedIds.length <= 1) ? 'opacity-70 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:border-gray-300'}`}
            >
              {!isManager && <option value="">All Buildings Overview</option>}
              {lots.map((lot) => (
                <option key={lot._id} value={lot._id}>
                  {lot.name}
                </option>
              ))}
            </select>
          </div>

          {!isManager && (
            <button
              onClick={() => setModal({ ...EMPTY })}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shrink-0 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" /> Add Building
            </button>
          )}
        </div>
      </div>

      {/* ── Dashboard Grid ── */}
      <div className="mb-5 flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">System Overview</h2>
        </div>
        <button onClick={() => { fetchDash(); fetchLots(); }} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
          <RefreshCw className={`w-4 h-4 ${dashLoading ? 'animate-spin text-indigo-500' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: Main Stats & Chart */}
        <div className="lg:col-span-2 space-y-6">

          {/* Core Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Parking Slots Compound Card — click to go to Slots tab */}
            <div
              onClick={() => setTab?.('slots')}
              className="bg-white rounded-2xl border border-teal-100 shadow-sm p-5 hover:shadow-md transition-all relative overflow-hidden group cursor-pointer hover:-translate-y-0.5"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                <ParkingSquare className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-3 relative z-10 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                  <ParkingSquare className="w-[20px] h-[20px] text-teal-600" />
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Slots</p>
              </div>
              <div className="relative z-10">
                {dashLoading ? <div className="h-7 w-16 bg-gray-100 rounded animate-pulse" /> : <p className="text-2xl font-bold text-teal-900 leading-tight mb-3">{stats?.slots?.total ?? '—'}</p>}
                <div className="flex gap-2 w-full">
                  <div className="flex-1 bg-emerald-50 rounded-lg py-1.5 px-2 text-center border border-emerald-100/50">
                    <p className="text-[10px] text-emerald-600/70 font-medium mb-0.5">Avail</p>
                    <p className="text-sm font-bold text-emerald-700">{dashLoading ? '…' : (stats?.slots?.available ?? 0)}</p>
                  </div>
                  <div className="flex-1 bg-rose-50 rounded-lg py-1.5 px-2 text-center border border-rose-100/50">
                    <p className="text-[10px] text-rose-600/70 font-medium mb-0.5">Occup</p>
                    <p className="text-sm font-bold text-rose-700">{dashLoading ? '…' : (stats?.slots?.occupied ?? 0)}</p>
                  </div>
                </div>
              </div>
            </div>

            <StatCard icon={Activity} label="Active Sessions" value={stats?.activeSessions ?? '—'} sub={`${stats?.todaySessions ?? 0} check-ins today`} color="amber" loading={dashLoading} onClick={() => setTab?.('revenue')} />
          </div>

          {/* Revenue Growth Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> Revenue Growth
              </h3>
              <select
                className="text-xs font-medium bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border-none outline-none cursor-pointer hover:bg-emerald-200 transition-colors"
                value={revenuePeriod}
                onChange={(e) => setRevenuePeriod(e.target.value as any)}
              >
                <option value="this_month">This Month</option>
                <option value="last_7_days">Last 7 Days</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="this_year">This Year</option>
              </select>
            </div>
            <div className="p-5 h-[320px] w-full">
              {dashLoading ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-50/50 rounded-xl">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                    <span className="text-sm text-gray-500 font-medium">Loading chart data...</span>
                  </div>
                </div>
              ) : revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      tickFormatter={(val) => `₫${(val / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value), 'Revenue']}
                      labelStyle={{ color: '#6b7280', fontWeight: 600, marginBottom: '4px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No revenue data available</div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Secondary Stats & Highlights */}
        <div className="space-y-4 pt-0 lg:pt-8">

          {/* Highlighted Revenue Card — shows period total, click to go to Revenue tab */}
          <div
            onClick={() => setTab?.('revenue')}
            className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group cursor-pointer hover:-translate-y-0.5 transition-transform"
          >
            <div className="absolute -right-4 -bottom-4 opacity-10 transform group-hover:scale-110 transition-transform duration-500">
              <DollarSign className="w-40 h-40" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <p className="text-emerald-50 text-xs font-bold uppercase tracking-widest">{periodLabel} Revenue</p>
              </div>
              {dashLoading ? (
                <div className="h-10 w-32 bg-white/20 rounded animate-pulse" />
              ) : (
                <p className="text-4xl font-extrabold tracking-tight drop-shadow-sm">
                  {fmt(periodTotal)}
                </p>
              )}
              <div className="mt-4 flex items-center gap-2 text-sm text-emerald-100 bg-black/10 w-fit px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <Building className="w-3.5 h-3.5" /> {isManager ? 'Assigned building only' : 'All buildings combined'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            {!isManager && <StatCard icon={Users} label="Total Users" value={stats?.totalUsers ?? '—'} sub="Registered customers" color="blue" loading={dashLoading} />}
            <StatCard icon={Car} label="Total Sessions" value={stats?.totalSessions ?? '—'} sub="All-time parking sessions" color="violet" loading={dashLoading} onClick={() => setTab?.('revenue')} />

            <div className="col-span-2 lg:col-span-1 grid grid-cols-2 gap-4">
              {/* Floors mini-card → Floors tab */}
              <div
                onClick={() => setTab?.('floors')}
                className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col items-center justify-center text-center shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <Layers className="w-6 h-6 text-indigo-400 mb-2" />
                {dashLoading ? <div className="h-6 w-8 bg-gray-100 rounded animate-pulse" /> : <p className="text-xl font-bold text-gray-900">{(globalLotId || !isManager) ? (floorCount ?? '—') : '—'}</p>}
                <p className="text-[10px] font-medium text-gray-500 uppercase mt-1">Floors</p>
              </div>
              {/* Zones mini-card → Floors tab */}
              <div
                onClick={() => setTab?.('floors')}
                className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col items-center justify-center text-center shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <Grid className="w-6 h-6 text-violet-400 mb-2" />
                {dashLoading ? <div className="h-6 w-8 bg-gray-100 rounded animate-pulse" /> : <p className="text-xl font-bold text-gray-900">{(globalLotId || !isManager) ? (zoneCount ?? '—') : '—'}</p>}
                <p className="text-[10px] font-medium text-gray-500 uppercase mt-1">Zones</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {modal && <LotModal initial={modal} onSave={handleSave} onClose={() => setModal(null)} loading={saving} />}
      {ConfirmNode}
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  );
}


