import { useEffect, useCallback, useState } from 'react';
import { Plus, Pencil, Trash2, Search, X, Check, Building, MapPin, RefreshCw } from 'lucide-react';
import parkingLotService from '../../services/api/parkingLotService';
import { Toast, useToast, STATUS_BADGE } from './shared';

const EMPTY = { name: '', code: '', description: '', contactPhone: '', contactEmail: '', status: 'active', address: { street: '', district: '', city: '' } };

function LotModal({ initial, onSave, onClose, loading }: any) {
  const [form, setForm] = useState(initial);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const setAddr = (k: string, v: string) => setForm((f: any) => ({ ...f, address: { ...f.address, [k]: v } }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-7 anim-fade overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">{initial._id ? 'Edit Building' : 'Add Building'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          {[['Building Name *', 'name', 'text'], ['Code *', 'code', 'text'], ['Description', 'description', 'text'], ['Contact Phone', 'contactPhone', 'text'], ['Contact Email', 'contactEmail', 'email']].map(([lbl, k, t]) => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">{lbl}</label>
              <input type={t} value={form[k] || ''} onChange={e => set(k, e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          ))}
          <div className="grid grid-cols-3 gap-3">
            {[['Street', 'street'], ['District', 'district'], ['City', 'city']].map(([lbl, k]) => (
              <div key={k}>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">{lbl}</label>
                <input value={form.address?.[k] || ''} onChange={e => setAddr(k, e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSave(form)} disabled={loading} className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save'}
          </button>
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

  const fetchLots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await parkingLotService.getParkingLots({ limit: 100, search: search || undefined });
      setLots(res.data || res.docs || (Array.isArray(res) ? res : []));
    } catch (e: any) { showToast(e.message || 'Error loading data', false); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { const t = setTimeout(fetchLots, 300); return () => clearTimeout(t); }, [fetchLots]);

  const handleSave = async (form: any) => {
    if (!form.name || !form.code) return showToast('Name and code are required', false);
    setSaving(true);
    try {
      if (form._id) await parkingLotService.updateParkingLot(form._id, form);
      else await parkingLotService.createParkingLot(form);
      showToast(form._id ? 'Updated successfully' : 'Created successfully');
      setModal(null);
      fetchLots();
    } catch (e: any) { showToast(e.message || 'Error saving data', false); }
    finally { setSaving(false); }
  };

  const handleDelete = async (lot: any) => {
    if (!window.confirm(`Delete building "${lot.name}"?`)) return;
    try {
      await parkingLotService.deleteParkingLot(lot._id);
      showToast('Building deleted');
      fetchLots();
    } catch (e: any) { showToast(e.message || 'Error deleting', false); }
  };

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Management</p>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2"><Building className="w-6 h-6" /> Buildings</h1>
          <p className="text-sm text-gray-400 mt-1">{lots.length} buildings</p>
        </div>
        <button onClick={() => setModal({ ...EMPTY })} className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700">
          <Plus className="w-4 h-4" /> Add Building
        </button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search buildings..." className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 shadow-sm" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="grid grid-cols-[1fr_100px_160px_130px] px-6 py-3 border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-400 uppercase tracking-wider">
          {['Building', 'Code', 'Address', ''].map(h => <div key={h}>{h}</div>)}
        </div>
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />Loading...</div>
        ) : lots.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No buildings found</div>
        ) : lots.map((lot, i) => (
          <div
            key={lot._id}
            onClick={() => setGlobalLotId?.(globalLotId === lot._id ? '' : lot._id)}
            className={`grid grid-cols-[1fr_100px_160px_130px] px-6 py-4 items-center cursor-pointer transition-colors ${
              globalLotId === lot._id
                ? 'bg-indigo-50 ring-1 ring-inset ring-indigo-400 rounded-lg scale-[1.01] my-1 shadow-sm'
                : i < lots.length - 1 ? 'hover:bg-gray-50 border-b border-gray-100' : 'hover:bg-gray-50'
            }`}
          >
            <div>
              <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                {lot.name}
                {globalLotId === lot._id && <Check className="w-4 h-4 text-indigo-600" />}
              </p>
              <p className="text-xs text-gray-400">{lot.contactEmail || lot.description || '—'}</p>
            </div>
            <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">{lot.code}</span>
            <div className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="w-3 h-3 shrink-0" /><span className="truncate">{[lot.address?.district, lot.address?.city].filter(Boolean).join(', ') || '—'}</span></div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${STATUS_BADGE[lot.status] || STATUS_BADGE.inactive}`}>{lot.status}</span>
              <button onClick={(e) => { e.stopPropagation(); setModal({ ...EMPTY, ...lot, address: lot.address || {} }); }} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(lot); }} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      {modal && <LotModal initial={modal} onSave={handleSave} onClose={() => setModal(null)} loading={saving} />}
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  );
}
