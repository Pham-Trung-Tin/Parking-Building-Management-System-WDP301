import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Layers, RefreshCw } from 'lucide-react';
import floorService from '../../services/api/floorService';
import parkingLotService from '../../services/api/parkingLotService';
import { Toast, useToast } from './shared';

const EMPTY = { name: '', floorNumber: 1, floorType: 'above_ground', status: 'active', parkingLot: '' };

function FloorModal({ initial, lots, onSave, onClose, loading }: any) {
  const [form, setForm] = useState(initial);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-7 anim-fade overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">{initial._id ? 'Edit Floor' : 'Add Floor'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Building *</label>
            <select value={form.parkingLot} onChange={e => set('parkingLot', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
              <option value="">-- Select Building --</option>
              {lots.map((l: any) => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Floor Name *</label>
              <input type="text" value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="e.g., Level 1" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Floor Number *</label>
              <input type="number" value={form.floorNumber || 1} onChange={e => set('floorNumber', Number(e.target.value))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Floor Type</label>
            <select value={form.floorType || 'above_ground'} onChange={e => set('floorType', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
              <option value="above_ground">Above Ground</option>
              <option value="ground">Ground Floor</option>
              <option value="basement">Basement</option>
            </select>
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

export default function FloorsTab({ globalLotId, setGlobalLotId }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const filterLot = globalLotId;
  const setFilterLot = setGlobalLotId;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<any>(null);
  const { toast, showToast } = useToast();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const isManager = user?.role === 'parking_manager';

  const fetchDeps = async () => {
    try {
      const rl = await parkingLotService.getParkingLots({ limit: 100 });
      let fetchedLots = rl.data || rl.docs || rl || [];
      if (isManager && user?.assignedParkingLot) {
        fetchedLots = fetchedLots.filter((l: any) => l._id === user.assignedParkingLot);
      }
      setLots(fetchedLots);
    } catch { }
  };

  const fetchFloors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await floorService.getFloors({ limit: 100, parkingLot: filterLot || undefined });
      setItems(res.data || res.docs || res || []);
    } catch (e: any) { showToast(e.message || 'Error loading data', false); }
    finally { setLoading(false); }
  }, [filterLot]);

  useEffect(() => { fetchDeps(); }, []);
  useEffect(() => { fetchFloors(); }, [fetchFloors]);

  const handleSave = async (form: any) => {
    if (!form.name || !form.parkingLot) return showToast('Please fill all fields', false);
    setSaving(true);
    try {
      const payload = { ...form, parkingLot: form.parkingLot._id || form.parkingLot };
      if (form._id) await floorService.updateFloor(form._id, payload);
      else await floorService.createFloor(payload);
      showToast(form._id ? 'Updated successfully' : 'Created successfully');
      setModal(null);
      fetchFloors();
    } catch (e: any) { showToast(e.message || 'Error saving data', false); }
    finally { setSaving(false); }
  };

  const handleDelete = async (item: any) => {
    if (!window.confirm(`Delete floor "${item.name}"?`)) return;
    try {
      await floorService.deleteFloor(item._id);
      showToast('Floor deleted');
      fetchFloors();
    } catch (e: any) { showToast(e.message || 'Error deleting', false); }
  };

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Management</p>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2"><Layers className="w-6 h-6" /> Floors</h1>
        </div>
        <div className="flex items-center gap-3">
          <select value={filterLot || ''} onChange={e => setFilterLot?.(e.target.value)} disabled={isManager} className={`border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none ${isManager ? 'opacity-70 cursor-not-allowed bg-gray-50' : 'bg-white'}`}>
            {!isManager && <option value="">All Buildings</option>}
            {lots.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
          <button onClick={() => setModal({ ...EMPTY, parkingLot: filterLot })} className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700">
            <Plus className="w-4 h-4" /> Add Floor
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="grid grid-cols-[1fr_100px_120px_100px_80px] px-6 py-3 border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-400 uppercase tracking-wider">
          {['Floor', 'Level', 'Building', 'Slots', ''].map(h => <div key={h}>{h}</div>)}
        </div>
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />Loading...</div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No data available</div>
        ) : items.map((item, i) => (
          <div key={item._id} className={`grid grid-cols-[1fr_100px_120px_100px_80px] px-6 py-4 items-center hover:bg-gray-50/60 transition-colors ${i < items.length - 1 ? 'border-b border-gray-100' : ''}`}>
            <div>
              <p className="text-sm font-semibold text-gray-800">{item.name}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg mt-1 inline-block ${item.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{item.status}</span>
            </div>
            <span className="text-sm text-gray-600">{item.floorNumber}</span>
            <span className="text-xs font-medium text-gray-500">{item.parkingLot?.name || '—'}</span>
            <span className="text-xs text-gray-600">{item.availableSlots} / {item.totalSlots}</span>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setModal({ ...item, parkingLot: item.parkingLot?._id || item.parkingLot })} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleDelete(item)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      {modal && <FloorModal initial={modal} lots={lots} onSave={handleSave} onClose={() => setModal(null)} loading={saving} />}
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  );
}
