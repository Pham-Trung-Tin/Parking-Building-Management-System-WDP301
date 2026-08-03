import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, Layers, RefreshCw, ChevronRight, Grid3x3, Car, Building } from 'lucide-react';
import floorService from '../../services/api/floorService';
import zoneService from '../../services/api/zoneService';
import parkingLotService from '../../services/api/parkingLotService';
import vehicleTypeService from '../../services/api/vehicleTypeService';
import { Toast, useToast, useConfirm } from './shared';

// ─── Floor Modal ───────────────────────────────────────────────────────────────
function FloorModal({ initial, lotId, onSave, onClose, loading }: any) {
  const [form, setForm] = useState({ name: '', floorNumber: 1, floorType: 'above_ground', status: 'active', ...initial });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-7">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">{initial?._id ? 'Edit Floor' : 'Add Floor'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Floor Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Floor 1" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Floor Number *</label>
              <input type="number" value={form.floorNumber} onChange={e => set('floorNumber', parseInt(e.target.value) || 0)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Type</label>
              <select value={form.floorType} onChange={e => set('floorType', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                <option value="above_ground">Above Ground</option>
                <option value="ground">Ground Floor</option>
                <option value="basement">Basement</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSave({ ...form, parkingLot: lotId })} disabled={loading} className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50">{loading ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Zone Modal ────────────────────────────────────────────────────────────────
function ZoneModal({ initial, floorId, lotId, vTypes, onSave, onClose, loading }: any) {
  const [form, setForm] = useState({ name: '', code: '', status: 'active', allowedVehicleTypes: [] as string[], ...initial });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const toggleVT = (id: string) => setForm((f: any) => {
    const arr: string[] = f.allowedVehicleTypes || [];
    return { ...f, allowedVehicleTypes: arr.includes(id) ? arr.filter((x: string) => x !== id) : [...arr, id] };
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-7">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">{initial?._id ? 'Edit Zone' : 'Add Zone'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Zone Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Zone A" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Code *</label>
              <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="e.g. A" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 uppercase" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Allowed Vehicle Types</label>
            <div className="flex flex-wrap gap-2">
              {vTypes.map((vt: any) => {
                const sel = (form.allowedVehicleTypes || []).includes(vt._id);
                return (
                  <button key={vt._id} onClick={() => toggleVT(vt._id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${sel ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                    {vt.code}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSave({ ...form, floor: floorId, parkingLot: lotId })} disabled={loading} className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50">{loading ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function FloorsTab({ globalLotId, setGlobalLotId }: any) {
  const [floors, setFloors] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [vTypes, setVTypes] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [floorModal, setFloorModal] = useState<any>(null);
  const [zoneModal, setZoneModal] = useState<any>(null);
  const { toast, showToast } = useToast();
  const { askConfirm, ConfirmNode } = useConfirm();

  const user = useMemo(() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } }, []);
  const isManager = user?.role === 'parking_manager';

  // Fetch lots for dropdown
  useEffect(() => {
    parkingLotService.getParkingLots({ limit: 100 }).then(res => {
      let ls = res.data || res.docs || res || [];
      if (isManager) {
        const raw = user?.assignedParkingLot;
        const ids: string[] = Array.isArray(raw) ? raw.filter(Boolean) : (raw ? [raw] : []);
        if (ids.length) ls = ls.filter((l: any) => ids.includes(l._id));
      }
      setLots(ls);
    }).catch(() => {});
  }, []);

  // Fetch vehicle types for zone modal
  useEffect(() => {
    vehicleTypeService.getAll(globalLotId ? { parkingLot: globalLotId } : undefined)
      .then(res => setVTypes(Array.isArray(res) ? res : (res as any).data || []))
      .catch(() => {});
  }, [globalLotId]);

  // Fetch floors for current lot
  const fetchFloors = useCallback(async () => {
    if (!globalLotId) { setFloors([]); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await floorService.getFloors({ limit: 100, parkingLot: globalLotId });
      const list = res.data || res.docs || res || [];
      // Sort: basement first (floorNumber < 0), then ascending
      list.sort((a: any, b: any) => a.floorNumber - b.floorNumber);
      setFloors(list);
      if (!selectedFloor && list.length) setSelectedFloor(list[0]);
    } catch (e: any) { showToast(e.message || 'Error', false); }
    finally { setLoading(false); }
  }, [globalLotId]);

  useEffect(() => { fetchFloors(); }, [fetchFloors]);

  // Fetch zones for selected floor
  const fetchZones = useCallback(async () => {
    if (!selectedFloor) { setZones([]); return; }
    try {
      const res = await zoneService.getZones({ floor: selectedFloor._id, limit: 100 });
      setZones(res.data || res.docs || res || []);
    } catch { setZones([]); }
  }, [selectedFloor?._id]);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  // ── Floor CRUD ──
  const saveFloor = async (form: any) => {
    if (!form.name) return showToast('Floor name is required', false);
    if (!globalLotId) return showToast('Please select a building first', false);
    setSaving(true);
    try {
      if (form._id) await floorService.updateFloor(form._id, form);
      else await floorService.createFloor(form);
      showToast(form._id ? 'Floor updated' : 'Floor created');
      setFloorModal(null);
      fetchFloors();
    } catch (e: any) { showToast(e.message || 'Error', false); }
    finally { setSaving(false); }
  };

  const deleteFloor = async (floor: any) => {
    askConfirm(
      `Delete floor "${floor.name}"?`,
      async () => {
        try {
          await floorService.deleteFloor(floor._id);
          showToast('Floor deleted');
          if (selectedFloor?._id === floor._id) setSelectedFloor(null);
          fetchFloors();
        } catch (e: any) { showToast(e.message || 'Error', false); }
      },
      'This will remove all its zones and slots.',
      'Delete Floor'
    );
  };

  // ── Zone CRUD ──
  const saveZone = async (form: any) => {
    if (!form.name || !form.code) return showToast('Zone name and code are required', false);
    setSaving(true);
    try {
      if (form._id) await zoneService.updateZone(form._id, form);
      else await zoneService.createZone(form);
      showToast(form._id ? 'Zone updated' : 'Zone created');
      setZoneModal(null);
      fetchZones();
    } catch (e: any) { showToast(e.message || 'Error', false); }
    finally { setSaving(false); }
  };

  const deleteZone = async (zone: any) => {
    askConfirm(
      `Delete zone "${zone.name}"?`,
      async () => {
        try {
          await zoneService.deleteZone(zone._id);
          showToast('Zone deleted');
          fetchZones();
        } catch (e: any) { showToast(e.message || 'Error', false); }
      }
    );
  };

  // ── Floor type helpers ──
  const floorLabel = (f: any) => {
    if (f.floorType === 'basement') return `Basement B${Math.abs(f.floorNumber)}`;
    if (f.floorNumber === 0) return 'Ground Floor';
    return `Floor ${f.floorNumber}`;
  };

  const floorColor = (f: any, selected: boolean) => {
    if (selected) return 'bg-gray-900 text-white border-gray-900';
    if (f.floorType === 'basement') return 'bg-slate-700/10 text-slate-700 border-slate-300 hover:bg-slate-700/20';
    if (f.floorNumber === 0) return 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100';
    return 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100';
  };

  const noLot = !globalLotId;

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Management</p>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2"><Layers className="w-6 h-6" /> Floors & Zones</h1>
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
          {!noLot && (
            <button onClick={() => setFloorModal({})} className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700">
              <Plus className="w-4 h-4" /> Add Floor
            </button>
          )}
        </div>
      </div>

      {noLot ? (
        <div className="py-24 text-center text-gray-400">
          <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a building to manage floors & zones</p>
        </div>
      ) : loading ? (
        <div className="py-24 text-center text-gray-400"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />Loading...</div>
      ) : (
        <div className="flex gap-5 min-h-[520px]">

          {/* ── Left: 3D Building Visualization ──────────── */}
          <div className="w-72 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Building Floors</p>
                <p className="text-xs text-gray-400 mt-0.5">{floors.length} floors total</p>
              </div>

              {/* 3D Stacked floor visualization */}
              <div className="p-4 space-y-1" style={{ perspective: '600px' }}>
                {/* Render from top floor to basement (reversed) */}
                {[...floors].reverse().map((floor, idx) => {
                  const isSel = selectedFloor?._id === floor._id;
                  const depth = idx * 3;
                  return (
                    <div key={floor._id}
                      onClick={() => setSelectedFloor(floor)}
                      style={{ transform: `translateZ(-${depth}px)`, boxShadow: isSel ? '0 4px 12px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.06)' }}
                      className={`relative cursor-pointer rounded-xl border px-3 py-2.5 transition-all duration-200 ${floorColor(floor, isSel)}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold">{floorLabel(floor)}</p>
                          <p className="text-[10px] opacity-70 mt-0.5">{floor.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-[10px] opacity-60">{floor.totalSlots || 0} slots</p>
                            <p className={`text-[10px] font-semibold ${floor.status === 'active' ? (isSel ? 'text-emerald-300' : 'text-emerald-600') : 'opacity-50'}`}>{floor.status}</p>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <button onClick={e => { e.stopPropagation(); setFloorModal(floor); }}
                              className={`w-5 h-5 flex items-center justify-center rounded ${isSel ? 'hover:bg-white/20' : 'hover:bg-gray-200'}`}>
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button onClick={e => { e.stopPropagation(); deleteFloor(floor); }}
                              className={`w-5 h-5 flex items-center justify-center rounded ${isSel ? 'hover:bg-red-400/40' : 'hover:bg-red-50'}`}>
                              <Trash2 className={`w-3 h-3 ${isSel ? '' : 'text-red-400'}`} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Zone count badge */}
                      {isSel && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-white/70">
                          <ChevronRight className="w-3 h-3" />
                          <span>Managing zones →</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {floors.length === 0 && (
                  <div className="py-8 text-center text-xs text-gray-400">No floors yet</div>
                )}

                {/* Ground base */}
                <div className="mx-2 mt-2 h-2 rounded-b-lg bg-gradient-to-r from-gray-200 to-gray-300" style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.15)' }} />
              </div>
            </div>
          </div>

          {/* ── Right: Zones Panel ────────────────────── */}
          <div className="flex-1">
            {!selectedFloor ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Grid3x3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Click a floor to manage its zones</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-full">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Zones on</p>
                    <h2 className="text-base font-semibold text-gray-900">{floorLabel(selectedFloor)} — {selectedFloor.name}</h2>
                  </div>
                  <button onClick={() => setZoneModal({})}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700">
                    <Plus className="w-4 h-4" /> Add Zone
                  </button>
                </div>

                <div className="p-6">
                  {zones.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                      <Grid3x3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No zones configured for this floor</p>
                      <button onClick={() => setZoneModal({})} className="mt-3 text-xs text-gray-900 underline">Create first zone</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {zones.map(zone => (
                        <div key={zone._id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:shadow-sm transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">{zone.code}</span>
                                <p className="text-sm font-semibold text-gray-800">{zone.name}</p>
                              </div>
                              <span className={`text-[10px] font-semibold mt-1 inline-block px-1.5 py-0.5 rounded ${zone.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{zone.status}</span>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => setZoneModal({ ...zone, allowedVehicleTypes: zone.allowedVehicleTypes?.map((v: any) => v._id || v) })}
                                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => deleteZone(zone)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                            <span className="flex items-center gap-1"><Grid3x3 className="w-3 h-3" />{zone.totalSlots || 0} slots</span>
                            <span className="flex items-center gap-1 text-emerald-600">{zone.availableSlots || 0} avail</span>
                          </div>

                          {/* Allowed vehicle types */}
                          {zone.allowedVehicleTypes?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {zone.allowedVehicleTypes.map((vt: any) => (
                                <span key={vt._id || vt} className="flex items-center gap-1 text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                                  <Car className="w-2.5 h-2.5" />{vt.code || vt}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {floorModal !== null && (
        <FloorModal initial={floorModal} lotId={globalLotId} onSave={saveFloor} onClose={() => setFloorModal(null)} loading={saving} />
      )}
      {zoneModal !== null && (
        <ZoneModal initial={zoneModal} floorId={selectedFloor?._id} lotId={globalLotId} vTypes={vTypes} onSave={saveZone} onClose={() => setZoneModal(null)} loading={saving} />
      )}
      {ConfirmNode}
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  );
}
