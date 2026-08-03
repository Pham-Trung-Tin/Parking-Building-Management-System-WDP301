import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, MapPin, RefreshCw, Car, CircleCheck, Wrench, Building } from 'lucide-react';
import parkingSlotService from '../../services/api/parkingSlotService';
import parkingLotService from '../../services/api/parkingLotService';
import floorService from '../../services/api/floorService';
import zoneService from '../../services/api/zoneService';
import vehicleTypeService from '../../services/api/vehicleTypeService';
import { Toast, useToast, useConfirm } from './shared';

// ─── Status config ─────────────────────────────────────────────────────────────
const S: Record<string, { label: string; bg: string; border: string; text: string }> = {
  available:   { label: 'Available',   bg: 'bg-emerald-50',  border: 'border-emerald-300', text: 'text-emerald-700' },
  occupied:    { label: 'Occupied',    bg: 'bg-rose-50',     border: 'border-rose-400',    text: 'text-rose-700' },
  reserved:    { label: 'Reserved',    bg: 'bg-amber-50',    border: 'border-amber-300',   text: 'text-amber-700' },
  maintenance: { label: 'Maintenance', bg: 'bg-gray-100',    border: 'border-gray-300',    text: 'text-gray-500' },
  locked:      { label: 'Locked',      bg: 'bg-slate-800',   border: 'border-slate-900',   text: 'text-slate-100' },
};

// ─── Add Slots Modal (Bulk + Single) ──────────────────────────────────────────
function AddSlotsModal({ floorId, zoneId, zones, vTypes, lotId, onDone, onClose }: any) {
  const [mode, setMode] = useState<'bulk' | 'single'>('bulk');
  // Shared
  const [selZone, setSelZone] = useState(zoneId || '');
  const [selVT, setSelVT] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  // Bulk
  const [prefix, setPrefix] = useState('');
  const [count, setCount] = useState(10);
  const [startNum, setStartNum] = useState(1);
  // Single
  const [slotCode, setSlotCode] = useState('');

  // Compute available vehicle types based on selected zone
  const availableVTypes = useMemo(() => {
    if (!selZone) return vTypes;
    const zone = zones.find((z: any) => z._id === selZone);
    if (!zone || !zone.allowedVehicleTypes?.length) return vTypes;
    const allowedIds = zone.allowedVehicleTypes.map((v: any) => v._id || v);
    return vTypes.filter((vt: any) => allowedIds.includes(vt._id));
  }, [selZone, zones, vTypes]);

  // Auto-select vehicle type when zone changes
  useEffect(() => {
    if (availableVTypes.length === 1) {
      setSelVT(availableVTypes[0]._id);
    } else if (!availableVTypes.find((vt: any) => vt._id === selVT)) {
      setSelVT('');
    }
  }, [availableVTypes]);

  const preview = useMemo(() => {
    if (!prefix || count < 1) return [];
    return Array.from({ length: Math.min(count, 6) }, (_, i) =>
      `${prefix.toUpperCase()}-${String(startNum + i).padStart(3, '0')}`
    );
  }, [prefix, count, startNum]);

  const handleBulk = async () => {
    if (!prefix || !selVT) return showToast('Prefix and vehicle type are required', false);
    if (count < 1 || count > 200) return showToast('Count must be 1–200', false);
    setSaving(true);
    try {
      const slots = Array.from({ length: count }, (_, i) => ({
        slotCode: `${prefix.toUpperCase()}-${String(startNum + i).padStart(3, '0')}`,
        floor: floorId,
        zone: selZone || undefined,
        vehicleType: selVT,
        status: 'available',
      }));
      const res = await parkingSlotService.bulkCreate(slots, lotId);
      showToast(`Created ${(res as any[]).length || count} slots`);
      onDone();
    } catch (e: any) { showToast(e.message || 'Error', false); }
    finally { setSaving(false); }
  };

  const handleSingle = async () => {
    if (!slotCode.trim() || !selVT) return showToast('Slot code and vehicle type are required', false);
    setSaving(true);
    try {
      await parkingSlotService.createSlot({
        slotCode: slotCode.trim().toUpperCase(),
        parkingLot: lotId,
        floor: floorId,
        zone: selZone || undefined,
        vehicleType: selVT,
      });
      showToast('Slot created');
      onDone();
    } catch (e: any) { showToast(e.message || 'Error', false); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Add Slots</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
          {(['bulk', 'single'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                mode === m ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {m === 'bulk' ? '⚡ Bulk (auto generate)' : '+ Single slot'}
            </button>
          ))}
        </div>

        {/* Shared: Zone + VehicleType */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Zone</label>
            <select value={selZone} onChange={e => setSelZone(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
              <option value="">None</option>
              {zones.map((z: any) => <option key={z._id} value={z._id}>{z.name} ({z.code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Vehicle Type *</label>
            <select value={selVT} onChange={e => setSelVT(e.target.value)}
              disabled={availableVTypes.length === 1}
              className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 ${availableVTypes.length === 1 ? 'opacity-70 cursor-not-allowed bg-gray-50' : ''}` }>
              <option value="">{selZone ? '-- Select --' : '-- Select zone first --'}</option>
              {availableVTypes.map((v: any) => <option key={v._id} value={v._id}>{v.code}</option>)}
            </select>
            {selZone && availableVTypes.length === 1 && (
              <p className="text-[10px] text-emerald-600 mt-1">Auto-selected from zone settings</p>
            )}
          </div>
        </div>

        {mode === 'bulk' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Prefix *</label>
                <input value={prefix} onChange={e => setPrefix(e.target.value)} placeholder="e.g. A" maxLength={5}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Start #</label>
                <input type="number" min={1} value={startNum} onChange={e => setStartNum(parseInt(e.target.value) || 1)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Quantity *</label>
                <input type="number" min={1} max={200} value={count} onChange={e => setCount(parseInt(e.target.value) || 1)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
            </div>
            {preview.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Preview — {count} slots total</p>
                <div className="flex flex-wrap gap-1.5">
                  {preview.map(code => (
                    <span key={code} className="text-xs font-mono font-bold bg-white border border-gray-200 px-2 py-0.5 rounded-md text-gray-700">{code}</span>
                  ))}
                  {count > 6 && <span className="text-xs text-gray-400 self-center">+{count - 6} more…</span>}
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleBulk} disabled={saving || !prefix || !selVT}
                className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50">
                {saving ? 'Creating...' : `Create ${count} Slots`}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Slot Code * (e.g. A-001)</label>
              <input value={slotCode} onChange={e => setSlotCode(e.target.value)} placeholder="A-001"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSingle} disabled={saving || !slotCode || !selVT}
                className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Add Slot'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Edit Slot Modal ───────────────────────────────────────────────────────────
function EditSlotModal({ slot, vTypes, onSave, onClose, loading }: any) {
  const [form, setForm] = useState({ status: slot.status, vehicleType: slot.vehicleType?._id || slot.vehicleType, slotCode: slot.slotCode, notes: slot.notes || '' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Edit Slot <span className="font-mono text-gray-500">{slot.slotCode}</span></h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
              {Object.entries(S).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Vehicle Type</label>
            <select value={form.vehicleType} onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
              <option value="">-- Select --</option>
              {vTypes.map((v: any) => <option key={v._id} value={v._id}>{v.code}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Notes</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSave(form)} disabled={loading} className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50">{loading ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function SlotsTab({ globalLotId, setGlobalLotId }: any) {
  const [floors, setFloors] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [vTypes, setVTypes] = useState<any[]>([]);

  const [selFloor, setSelFloor] = useState<any>(null);
  const [selZone, setSelZone] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editModal, setEditModal] = useState<any>(null);
  const [addModal, setAddModal] = useState(false);
  const [vehicleInfoModal, setVehicleInfoModal] = useState<any>(null);
  const { toast, showToast } = useToast();
  const { askConfirm, ConfirmNode } = useConfirm();

  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const isManager = user?.role === 'parking_manager';

  // Fetch lots
  useEffect(() => {
    parkingLotService.getParkingLots({ limit: 100 }).then(res => {
      let ls = res.data || res.docs || res || [];
      if (isManager) {
        const raw = user?.assignedParkingLot;
        // assignedParkingLot can be string[], ObjectId[], or populated objects [{_id, name}]
        const ids: string[] = Array.isArray(raw)
          ? raw.map((v: any) => (v?._id?.toString?.() || v?.toString?.() || '')).filter(Boolean)
          : (raw ? [(raw as any)?._id?.toString?.() || raw?.toString?.() || ''].filter(Boolean) : []);
        if (ids.length) ls = ls.filter((l: any) => ids.includes(l._id?.toString?.() || l._id));
      }
      setLots(ls);
    }).catch(() => {});
  }, []);

  // Fetch vehicle types for this lot
  useEffect(() => {
    vehicleTypeService.getAll(globalLotId ? { parkingLot: globalLotId } : undefined)
      .then(res => setVTypes(Array.isArray(res) ? res : (res as any).data || []))
      .catch(() => {});
  }, [globalLotId]);

  // Fetch floors when lot changes
  useEffect(() => {
    if (!globalLotId) { setFloors([]); setSelFloor(null); return; }
    // Immediately reset so fetchSlots doesn't fire with old floor + new lot
    setFloors([]);
    setSelFloor(null);
    floorService.getFloors({ limit: 100, parkingLot: globalLotId }).then(res => {
      const list = (res.data || res.docs || res || []).sort((a: any, b: any) => a.floorNumber - b.floorNumber);
      setFloors(list);
      setSelFloor(list[0] || null);
    }).catch(() => {});
  }, [globalLotId]);

  // Fetch zones when floor changes
  useEffect(() => {
    if (!selFloor) { setZones([]); setSelZone(''); return; }
    zoneService.getZones({ floor: selFloor._id, limit: 100 }).then(res => {
      setZones(res.data || res.docs || res || []);
      setSelZone('');
    }).catch(() => {});
  }, [selFloor?._id]);

  // Fetch slots
  const fetchSlots = useCallback(async () => {
    if (!globalLotId || !selFloor) { setSlots([]); return; }
    setLoading(true);
    try {
      const res = await parkingSlotService.getSlots({
        parkingLot: globalLotId,
        floor: selFloor._id,
        zone: selZone || undefined,
        limit: 500,
      });
      setSlots(res.data || res.docs || res || []);
    } catch (e: any) { showToast(e.message || 'Error', false); }
    finally { setLoading(false); }
  }, [globalLotId, selFloor?._id, selZone]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const handleEdit = async (form: any) => {
    setSaving(true);
    try {
      await parkingSlotService.updateSlot(editModal._id, form);
      showToast('Slot updated');
      setEditModal(null);
      fetchSlots();
    } catch (e: any) { showToast(e.message || 'Error', false); }
    finally { setSaving(false); }
  };

  const handleDelete = async (slot: any) => {
    if (slot.status === 'occupied') return showToast('Cannot delete an occupied slot', false);
    askConfirm(
      `Delete slot "${slot.slotCode}"?`,
      async () => {
        try {
          await parkingSlotService.deleteSlot(slot._id);
          showToast('Slot deleted');
          fetchSlots();
        } catch (e: any) { showToast(e.message || 'Error', false); }
      }
    );
  };

  // Stats
  const stats = useMemo(() => ({
    total: slots.length,
    available: slots.filter(s => s.status === 'available').length,
    occupied: slots.filter(s => s.status === 'occupied').length,
    maintenance: slots.filter(s => s.status === 'maintenance').length,
  }), [slots]);

  const floorLabel = (f: any) => {
    if (f.floorType === 'basement') return `B${Math.abs(f.floorNumber)}`;
    if (f.floorNumber === 0) return 'G';
    return `F${f.floorNumber}`;
  };

  const noLot = !globalLotId;

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Management</p>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2"><MapPin className="w-6 h-6" /> Parking Slots</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Building selector — same design as BuildingsTab */}
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
              {!isManager && <option value="">-- Select Building --</option>}
              {lots.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </div>
          {!noLot && selFloor && (
            <button onClick={() => setAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700">
              <Plus className="w-4 h-4" /> Add Slots
            </button>
          )}
        </div>
      </div>

      {noLot ? (
        <div className="py-24 text-center text-gray-400">
          <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a building to view parking slots</p>
        </div>
      ) : (
        <>
          {/* Floor tabs */}
          <div className="flex gap-1 border-b border-gray-100 mb-0 overflow-x-auto pb-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as any}>
            {floors.map(f => (
              <button key={f._id} onClick={() => setSelFloor(f)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${selFloor?._id === f._id ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {f.floorType === 'basement' ? `Basement B${Math.abs(f.floorNumber)}` : f.floorNumber === 0 ? `Ground Floor` : `Floor ${f.floorNumber}`}
                {f.name !== floorLabel(f) && ` (${f.name})`}
              </button>
            ))}
          </div>

          {/* Zone filter chips */}
          {zones.length > 0 && (
            <div className="flex gap-2 mt-3 mb-4 flex-wrap">
              <button onClick={() => setSelZone('')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!selZone ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                All Zones
              </button>
              {zones.map(z => (
                <button key={z._id} onClick={() => setSelZone(z._id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selZone === z._id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {z.name}
                </button>
              ))}
            </div>
          )}

          {/* Stats bar */}
          {!loading && slots.length > 0 && (
            <div className="flex items-center gap-4 mb-4 px-1 text-xs text-gray-500">
              <span className="font-semibold text-gray-800">{stats.total} slots</span>
              <span className="flex items-center gap-1 text-emerald-600"><CircleCheck className="w-3.5 h-3.5" />{stats.available} available</span>
              <span className="flex items-center gap-1 text-rose-500"><Car className="w-3.5 h-3.5" />{stats.occupied} occupied</span>
              {stats.maintenance > 0 && <span className="flex items-center gap-1 text-gray-400"><Wrench className="w-3.5 h-3.5" />{stats.maintenance} maintenance</span>}
            </div>
          )}

          {/* Legend */}
          {!loading && slots.length > 0 && (
            <div className="flex items-center gap-3 mb-4 text-xs text-gray-500 flex-wrap">
              {Object.entries(S).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded border ${v.bg} ${v.border}`} />
                  <span>{v.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Visual Slot Grid */}
          {loading ? (
            <div className="py-16 text-center text-gray-400"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />Loading slots...</div>
          ) : slots.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No slots on this floor/zone</p>
              {selFloor && (
                <button onClick={() => setAddModal(true)} className="mt-3 flex items-center gap-1.5 text-xs text-gray-700 font-semibold mx-auto hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Add slots
                </button>
              )}
            </div>
          ) : (() => {

            // Build slot card helper
            const SlotCard = ({ slot }: { slot: any }) => {
              const st = S[slot.status] || S.available;
              const isOccupied = slot.status === 'occupied';
              const isReserved = slot.status === 'reserved';
              const isLocked = isOccupied || isReserved;

              const handleClick = () => {
                if (isOccupied) return setVehicleInfoModal(slot);
                if (isReserved) return setVehicleInfoModal({ ...slot, _showBooking: true });
                setEditModal(slot);
              };

              return (
                <div className="group relative">
                  <div
                    onClick={handleClick}
                    className={`cursor-pointer rounded-xl border-2 p-2 text-center transition-all hover:shadow-md hover:-translate-y-0.5 ${st.bg} ${st.border}`}
                  >
                    <p className={`text-[10px] font-mono font-bold leading-tight ${st.text}`}>{slot.slotCode}</p>
                    {slot.vehicleType?.code && (
                      <p className={`text-[9px] mt-0.5 opacity-60 ${st.text}`}>{slot.vehicleType.code}</p>
                    )}
                  </div>
                  {/* Delete — disabled when occupied or reserved */}
                  {isLocked ? (
                    <div
                      className="absolute -top-1 -right-1 w-4 h-4 bg-gray-300 text-white rounded-full text-[8px] items-center justify-center hidden group-hover:flex shadow-sm z-10 cursor-not-allowed"
                      title={isOccupied ? 'Cannot delete: slot is occupied' : 'Cannot delete: slot is reserved'}>
                      ×
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDelete(slot)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] items-center justify-center hidden group-hover:flex shadow-sm z-10">
                      ×
                    </button>
                  )}
                </div>
              );
            };

            // When a specific zone is selected → flat grid (unchanged)
            if (selZone) {
              return (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex justify-between text-xs font-bold text-gray-400 mb-3 px-1">
                    <span>← ENTRY</span><span>EXIT →</span>
                  </div>
                  <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))' }}>
                    {slots.map(slot => <SlotCard key={slot._id} slot={slot} />)}
                  </div>
                  <div className="my-4 flex items-center gap-2">
                    <div className="flex-1 border-t border-dashed border-gray-200" />
                    <span className="text-[10px] text-gray-300 font-medium">AISLE</span>
                    <div className="flex-1 border-t border-dashed border-gray-200" />
                  </div>
                </div>
              );
            }

            // All Zones → group by zone, each zone gets its own labeled row
            const grouped: Record<string, { name: string; slots: any[] }> = {};
            const noZone: any[] = [];

            slots.forEach(slot => {
              const zId = slot.zone?._id || slot.zone;
              if (!zId) {
                noZone.push(slot);
              } else {
                if (!grouped[zId]) {
                  const zoneObj = zones.find((z: any) => z._id === zId);
                  grouped[zId] = { name: zoneObj?.name || 'Zone', slots: [] };
                }
                grouped[zId].slots.push(slot);
              }
            });

            const groups = [
              ...Object.entries(grouped).map(([id, g]) => ({ id, name: g.name, slots: g.slots })),
              ...(noZone.length > 0 ? [{ id: '__none__', name: 'No Zone', slots: noZone }] : []),
            ];

            return (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <div className="flex justify-between text-xs font-bold text-gray-400 px-1">
                  <span>← ENTRY</span><span>EXIT →</span>
                </div>
                {groups.map((group, idx) => (
                  <div key={group.id}>
                    {/* Zone label */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{group.name}</span>
                      <div className="flex-1 border-t border-gray-100" />
                      <span className="text-[10px] text-gray-300">{group.slots.length} slots</span>
                    </div>
                    {/* Slots row */}
                    <div className="flex flex-wrap gap-2">
                      {group.slots.map(slot => <SlotCard key={slot._id} slot={slot} />)}
                    </div>
                    {/* Divider between zones */}
                    {idx < groups.length - 1 && (
                      <div className="mt-4 flex items-center gap-2">
                        <div className="flex-1 border-t border-dashed border-gray-200" />
                        <span className="text-[10px] text-gray-300 font-medium">AISLE</span>
                        <div className="flex-1 border-t border-dashed border-gray-200" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </>
      )}

      {addModal && selFloor && (
        <AddSlotsModal
          floorId={selFloor._id}
          zoneId={selZone}
          zones={zones}
          vTypes={vTypes}
          lotId={globalLotId}
          onDone={() => { setAddModal(false); fetchSlots(); }}
          onClose={() => setAddModal(false)}
        />
      )}
      {editModal && (
        <EditSlotModal slot={editModal} vTypes={vTypes} onSave={handleEdit} onClose={() => setEditModal(null)} loading={saving} />
      )}

      {/* Slot Info Modal — click on occupied or reserved slot */}
      {vehicleInfoModal && (() => {
        const slot = vehicleInfoModal;
        const isReserved = slot._showBooking;
        const booking = slot.currentBooking;
        const close = () => setVehicleInfoModal(null);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs mx-4 overflow-hidden">

              {/* Header */}
              <div className={`flex items-center justify-between px-5 py-4 border-b ${isReserved ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100'}`}>
                <div>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider ${isReserved ? 'text-amber-500' : 'text-rose-400'}`}>
                    {isReserved ? 'Reserved Slot' : 'Occupied Slot'}
                  </p>
                  <p className="font-mono text-xl font-black text-gray-900">{slot.slotCode}</p>
                </div>
                <button onClick={close} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-white/60">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-5 text-center space-y-2">
                {isReserved ? (
                  // Reserved: show booking info
                  <>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Booked By</p>
                    <p className="text-xl font-black font-mono text-gray-900 tracking-wider">
                      {booking?.vehicleInfo?.licensePlate || '—'}
                    </p>
                    {booking?.user?.fullName && (
                      <p className="text-xs text-gray-500">{booking.user.fullName}</p>
                    )}
                    {booking?.scheduledDate && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(booking.scheduledDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {booking.startTime ? ` · ${booking.startTime}` : ''}
                        {booking.endTime ? ` – ${booking.endTime}` : ''}
                      </p>
                    )}
                    {booking?.bookingCode && (
                      <p className="text-[10px] text-gray-300 font-mono mt-2">{booking.bookingCode}</p>
                    )}
                    {!booking && <p className="text-xs text-gray-400">No booking info found</p>}
                  </>
                ) : (
                  // Occupied: show license plate from currentSession
                  <>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Vehicle Parked</p>
                    <p className="text-3xl font-black tracking-widest font-mono text-gray-900">
                      {slot.currentSession?.vehicleInfo?.licensePlate || '—'}
                    </p>
                    {slot.vehicleType?.name && (
                      <p className="text-xs text-gray-400 mt-1">{slot.vehicleType.name}</p>
                    )}
                  </>
                )}
              </div>

            </div>
          </div>
        );
      })()}


      {ConfirmNode}
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  );
}
