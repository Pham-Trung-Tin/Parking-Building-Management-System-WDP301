import { useEffect, useCallback, useState } from 'react';
import { Plus, Pencil, Trash2, Search, X, Check, Building, MapPin, RefreshCw, Layers, Grid, ParkingSquare, DollarSign, Car, TrendingUp, Activity, Users } from 'lucide-react';
import parkingLotService from '../../services/api/parkingLotService';
import floorService from '../../services/api/floorService';
import zoneService from '../../services/api/zoneService';
import reportService, { DashboardStats } from '../../services/api/reportService';
import { Toast, useToast, STATUS_BADGE } from './shared';

const EMPTY = { name: '', code: '', description: '', contactPhone: '', contactEmail: '', status: 'active', address: { street: '', district: '', city: '' } };

const COLORS: Record<string, { bg: string; icon: string; val: string; border: string }> = {
  blue:   { bg: 'bg-blue-50',    icon: 'text-blue-500',    val: 'text-blue-800',    border: 'border-blue-100' },
  green:  { bg: 'bg-emerald-50', icon: 'text-emerald-500', val: 'text-emerald-800', border: 'border-emerald-100' },
  violet: { bg: 'bg-violet-50',  icon: 'text-violet-500',  val: 'text-violet-800',  border: 'border-violet-100' },
  amber:  { bg: 'bg-amber-50',   icon: 'text-amber-500',   val: 'text-amber-800',   border: 'border-amber-100' },
  indigo: { bg: 'bg-indigo-50',  icon: 'text-indigo-500',  val: 'text-indigo-800',  border: 'border-indigo-100' },
  rose:   { bg: 'bg-rose-50',    icon: 'text-rose-500',    val: 'text-rose-800',    border: 'border-rose-100' },
  teal:   { bg: 'bg-teal-50',    icon: 'text-teal-500',    val: 'text-teal-800',    border: 'border-teal-100' },
};

function StatCard({ icon: Icon, label, value, sub, color, loading }: { icon: any; label: string; value: any; sub?: string; color: string; loading?: boolean }) {
  const c = COLORS[color] ?? COLORS.blue;
  return (
    <div className={`bg-white rounded-2xl border ${c.border} shadow-sm p-4 flex items-start gap-3 hover:shadow-md transition-shadow`}>
      <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-[17px] h-[17px] ${c.icon}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        {loading ? <div className="h-6 w-14 bg-gray-100 rounded animate-pulse" /> : <p className={`text-lg font-bold ${c.val} leading-tight`}>{value}</p>}
        {sub && <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{sub}</p>}
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
          {[['Building Name *','name','text'],['Code *','code','text'],['Description','description','text'],['Contact Phone','contactPhone','text'],['Contact Email','contactEmail','email']].map(([lbl,k,t]) => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">{lbl}</label>
              <input type={t} value={form[k]||''} onChange={e=>set(k,e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          ))}
          <div className="grid grid-cols-3 gap-3">
            {[['Street','street'],['District','district'],['City','city']].map(([lbl,k])=>(
              <div key={k}>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">{lbl}</label>
                <input value={form.address?.[k]||''} onChange={e=>setAddr(k,e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
            <select value={form.status} onChange={e=>set('status',e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={()=>onSave(form)} disabled={loading} className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50">{loading?'Saving...':'Save'}</button>
        </div>
      </div>
    </div>
  );
}

export default function BuildingsTab({ globalLotId, setGlobalLotId }: any) {
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<any>(null);
  const { toast, showToast } = useToast();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [floorCount, setFloorCount] = useState<number | null>(null);
  const [zoneCount, setZoneCount] = useState<number | null>(null);
  const [dashLoading, setDashLoading] = useState(true);

  const fetchLots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await parkingLotService.getParkingLots({ limit: 100, search: search || undefined });
      setLots(res.data || res.docs || (Array.isArray(res) ? res : []));
    } catch (e: any) { showToast(e.message || 'Error loading', false); }
    finally { setLoading(false); }
  }, [search]);

  const fetchDash = useCallback(async () => {
    setDashLoading(true);
    try {
      const [sr, fr, zr] = await Promise.allSettled([
        reportService.getDashboardStats(),
        floorService.getFloors({ limit: 2000 }),
        zoneService.getZones({ limit: 2000 }),
      ]);
      if (sr.status === 'fulfilled') { const d = sr.value; setStats((d as any).data ?? d); }
      if (fr.status === 'fulfilled') { const d = fr.value; const a = d?.data?.docs ?? d?.docs ?? d?.data ?? (Array.isArray(d)?d:[]); setFloorCount(Array.isArray(a)?a.length:(d?.total??d?.totalDocs??null)); }
      if (zr.status === 'fulfilled') { const d = zr.value; const a = d?.data?.docs ?? d?.docs ?? d?.data ?? (Array.isArray(d)?d:[]); setZoneCount(Array.isArray(a)?a.length:(d?.total??d?.totalDocs??null)); }
    } catch { /* ignore */ }
    finally { setDashLoading(false); }
  }, []);

  useEffect(() => { const t = setTimeout(fetchLots, 300); return () => clearTimeout(t); }, [fetchLots]);
  useEffect(() => { fetchDash(); }, [fetchDash]);

  const activeBuildings = lots.filter(l => l.status === 'active').length;
  const fmt = (n: number) => n >= 1_000_000 ? `₫${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `₫${(n/1_000).toFixed(0)}K` : `₫${n}`;

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
    if (!window.confirm(`Delete "${lot.name}"?`)) return;
    try { await parkingLotService.deleteParkingLot(lot._id); showToast('Deleted'); fetchLots(); fetchDash(); }
    catch (e: any) { showToast(e.message || 'Error', false); }
  };

  return (
    <div>
      {/* ── Header with Building Dropdown & Add Button ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        {/* Title */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-0.5">Management</p>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Building className="w-6 h-6 text-gray-700" /> Buildings
            {!loading && <span className="text-sm font-normal text-gray-400">({lots.length})</span>}
          </h1>
        </div>

        {/* Dropdown & Add Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={globalLotId || ''}
            onChange={(e) => setGlobalLotId?.(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer min-w-[220px]"
          >
            <option value="">All Buildings</option>
            {lots.map((lot) => (
              <option key={lot._id} value={lot._id}>
                {lot.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setModal({ ...EMPTY })}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 shrink-0 shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Add Building
          </button>
        </div>
      </div>

      {/* ── Dashboard ── */}
      <div className="mb-7">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">System Overview</span>
          </div>
          <button onClick={() => { fetchDash(); fetchLots(); }} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600">
            <RefreshCw className={`w-3 h-3 ${dashLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Row 1 – Structure */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <StatCard icon={Building} label="Buildings" value={loading ? '…' : lots.length} sub={`${activeBuildings} active`} color="blue" loading={loading} />
          <StatCard icon={Layers} label="Floors" value={floorCount ?? '…'} sub="Across all buildings" color="indigo" loading={dashLoading && floorCount === null} />
          <StatCard icon={Grid} label="Zones" value={zoneCount ?? '…'} sub="Parking zones" color="violet" loading={dashLoading && zoneCount === null} />
        </div>

        {/* Row 2 – Slots compound + Sessions + Revenue */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {/* Slots */}
          <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                <ParkingSquare className="w-[17px] h-[17px] text-teal-500" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Parking Slots</p>
                {dashLoading ? <div className="h-5 w-10 bg-gray-100 rounded animate-pulse mt-0.5" /> : <p className="text-lg font-bold text-teal-800">{stats?.slots?.total ?? '—'}</p>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[['Available','available','text-emerald-700 bg-emerald-50'],['Occupied','occupied','text-rose-700 bg-rose-50'],['Maint.','maintenance','text-amber-700 bg-amber-50']].map(([lbl,key,cls])=>(
                <div key={key} className={`rounded-lg py-1.5 text-center ${cls.split(' ')[1]}`}>
                  <p className={`text-xs font-bold ${cls.split(' ')[0]}`}>{dashLoading?'…':(stats?.slots?.[key]??0)}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{lbl}</p>
                </div>
              ))}
            </div>
          </div>
          <StatCard icon={Activity} label="Active Sessions" value={stats?.activeSessions ?? '—'} sub={`${stats?.todaySessions ?? 0} check-ins today`} color="amber" loading={dashLoading} />
          <StatCard icon={DollarSign} label="Today Revenue" value={dashLoading ? '…' : fmt(stats?.todayRevenue ?? 0)} sub="All buildings" color="green" loading={dashLoading} />
        </div>

        {/* Row 3 – Users + Total sessions */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Users} label="Registered Users" value={stats?.totalUsers ?? '—'} sub="Customer accounts" color="rose" loading={dashLoading} />
          <StatCard icon={Car} label="Total Sessions" value={stats?.totalSessions ?? '—'} sub="All-time parking sessions" color="teal" loading={dashLoading} />
        </div>
      </div>



      {modal && <LotModal initial={modal} onSave={handleSave} onClose={() => setModal(null)} loading={saving} />}
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  );
}
