import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, MapPin, RefreshCw, Search, Car, CircleCheck, Wrench, Lock } from 'lucide-react';
import parkingSlotService from '../../services/api/parkingSlotService';
import parkingLotService from '../../services/api/parkingLotService';
import floorService from '../../services/api/floorService';
import zoneService from '../../services/api/zoneService';
import vehicleTypeService from '../../services/api/vehicleTypeService';
import { Toast, useToast } from './shared';


const EMPTY = { slotCode: '', status: 'available', parkingLot: '', floor: '', zone: '', vehicleType: '' };

const STATUS_MAP: Record<string, { l: string, c: string }> = {
  available: { l: 'Available', c: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  occupied: { l: 'Occupied', c: 'bg-rose-50 text-rose-700 border-rose-200' },
  reserved: { l: 'Reserved', c: 'bg-amber-50 text-amber-700 border-amber-200' },
  maintenance: { l: 'Maintenance', c: 'bg-gray-100 text-gray-600 border-gray-300' },
  locked: { l: 'Locked', c: 'bg-slate-800 text-slate-100 border-slate-900' },
};

function SlotModal({ initial, lots, floors, zones, vTypes, onSave, onClose, loading }: any) {
  const [form, setForm] = useState(initial);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const lotFloors = floors.filter((f: any) => f.parkingLot?._id === form.parkingLot || f.parkingLot === form.parkingLot);
  const floorZones = zones.filter((z: any) => z.floor?._id === form.floor || z.floor === form.floor);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-7 anim-fade overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">{initial._id ? 'Edit Slot' : 'Add Slot'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Building *</label>
            <select value={form.parkingLot} onChange={e => { set('parkingLot', e.target.value); set('floor', ''); set('zone', ''); }} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
              <option value="">-- Select --</option>
              {lots.map((l: any) => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Floor *</label>
              <select value={form.floor} onChange={e => { set('floor', e.target.value); set('zone', ''); }} disabled={!form.parkingLot} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white disabled:bg-gray-50">
                <option value="">-- Select --</option>
                {lotFloors.map((f: any) => <option key={f._id} value={f._id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Zone</label>
              <select value={form.zone} onChange={e => set('zone', e.target.value)} disabled={!form.floor} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white disabled:bg-gray-50">
                <option value="">-- None --</option>
                {floorZones.map((z: any) => <option key={z._id} value={z._id}>{z.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Slot Code (e.g. A12) *</label>
              <input type="text" value={form.slotCode || ''} onChange={e => set('slotCode', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 uppercase" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Vehicle Type *</label>
              <select value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                <option value="">-- Select --</option>
                {vTypes.map((v: any) => <option key={v._id} value={v._id}>{v.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
              {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
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

export default function SlotsTab({ globalLotId, setGlobalLotId }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [vTypes, setVTypes] = useState<any[]>([]);

  const filterLot = globalLotId;
  const setFilterLot = setGlobalLotId;
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<any>(null);
  const { toast, showToast } = useToast();

  const fetchDeps = async () => {
    try {
      const rl = await parkingLotService.getParkingLots({ limit: 100 });
      const ls = rl.data || rl.docs || rl || [];
      setLots(ls);
      
      const [rf, rz, rv] = await Promise.all([
        floorService.getFloors({ limit: 500 }),
        zoneService.getZones({ limit: 500 }),
        vehicleTypeService.getAll()
      ]);
      setFloors(rf.data || rf.docs || rf || []);
      setZones(rz.data || rz.docs || rz || []);
      setVTypes(Array.isArray(rv) ? rv : (rv as any).data || []);
    } catch (e: any) { }
  };

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await parkingSlotService.getSlots({ limit: 100, parkingLot: filterLot || undefined, search: search || undefined });
      setItems(res.data || res.docs || res || []);
    } catch (e: any) { showToast(e.message || 'Error loading data', false); }
    finally { setLoading(false); }
  }, [filterLot, search]);

  useEffect(() => { fetchDeps(); }, []);
  useEffect(() => {
    const t = setTimeout(() => { fetchSlots(); }, 300);
    return () => clearTimeout(t);
  }, [fetchSlots]);

  const handleSave = async (form: any) => {
    if (!form.slotCode || !form.parkingLot || !form.floor || !form.vehicleType) return showToast('Please fill all required fields', false);
    setSaving(true);
    try {
      const payload = { ...form, parkingLot: form.parkingLot._id || form.parkingLot, floor: form.floor._id || form.floor, zone: form.zone?._id || form.zone || undefined, vehicleType: form.vehicleType._id || form.vehicleType };
      if (form._id) await parkingSlotService.updateSlot(form._id, payload);
      else await parkingSlotService.createSlot(payload);
      showToast(form._id ? 'Updated successfully' : 'Created successfully');
      setModal(null);
      fetchSlots();
    } catch (e: any) { showToast(e.message || 'Error saving data', false); }
    finally { setSaving(false); }
  };

  const handleDelete = async (item: any) => {
    if (!window.confirm(`Delete slot "${item.slotCode}"?`)) return;
    try {
      await parkingSlotService.deleteSlot(item._id);
      showToast('Slot deleted');
      fetchSlots();
    } catch (e: any) { showToast(e.message || 'Error deleting', false); }
  };

  const stats = useMemo(() => ({
    total:       items.length,
    occupied:    items.filter(s => s.status === 'occupied').length,
    available:   items.filter(s => s.status === 'available').length,
    reserved:    items.filter(s => s.status === 'reserved').length,
    maintenance: items.filter(s => s.status === 'maintenance').length,
    locked:      items.filter(s => s.status === 'locked').length,
  }), [items]);

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Management</p>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2"><MapPin className="w-6 h-6" /> Parking Slots</h1>
        </div>
        <div className="flex items-center gap-3">
          <select value={filterLot || ''} onChange={e => setFilterLot?.(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-white">
            <option value="">All Buildings</option>
            {lots.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
          <button onClick={() => setModal({ ...EMPTY, parkingLot: filterLot })} className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700">
            <Plus className="w-4 h-4" /> Add Slot
          </button>
        </div>
      </div>

      {/* Stats summary */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Slots</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <Car className="w-3 h-3 text-rose-500" />
              <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">Occupied</p>
            </div>
            <p className="text-2xl font-bold text-rose-600">{stats.occupied}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <CircleCheck className="w-3 h-3 text-emerald-500" />
              <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Available</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{stats.available}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1">Reserved</p>
            <p className="text-2xl font-bold text-amber-600">{stats.reserved}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <Wrench className="w-3 h-3 text-gray-400" />
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Maintenance</p>
            </div>
            <p className="text-2xl font-bold text-gray-600">{stats.maintenance}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <Lock className="w-3 h-3 text-slate-400" />
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Locked</p>
            </div>
            <p className="text-2xl font-bold text-slate-100">{stats.locked}</p>
          </div>
        </div>
      )}

      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by code..." className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 shadow-sm" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="grid grid-cols-[80px_1fr_100px_100px_100px_80px] px-6 py-3 border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-400 uppercase tracking-wider">
          {['Code', 'Status', 'Type', 'Floor', 'Zone', ''].map(h => <div key={h}>{h}</div>)}
        </div>
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />Loading...</div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No data available</div>
        ) : items.map((item, i) => {
          const st = STATUS_MAP[item.status] || STATUS_MAP.available;
          return (
            <div key={item._id} className={`grid grid-cols-[80px_1fr_100px_100px_100px_80px] px-6 py-4 items-center hover:bg-gray-50/60 transition-colors ${i < items.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <span className="text-sm font-mono font-bold text-gray-900">{item.slotCode}</span>
              <div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${st.c}`}>{st.l}</span>
              </div>
              <span className="text-xs text-gray-600">{item.vehicleType?.name || '—'}</span>
              <span className="text-xs font-medium text-gray-500">{item.floor?.name || '—'}</span>
              <span className="text-xs font-medium text-gray-500">{item.zone?.code || '—'}</span>
              <div className="flex items-center gap-2 justify-end">
                <button onClick={() => setModal({ ...item, parkingLot: item.parkingLot?._id || item.parkingLot, floor: item.floor?._id || item.floor, zone: item.zone?._id || item.zone, vehicleType: item.vehicleType?._id || item.vehicleType })} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(item)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && <SlotModal initial={modal} lots={lots} floors={floors} zones={zones} vTypes={vTypes} onSave={handleSave} onClose={() => setModal(null)} loading={saving} />}
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  );
}
