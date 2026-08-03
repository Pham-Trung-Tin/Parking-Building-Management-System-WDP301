import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, Car, RefreshCw, DollarSign, Building } from 'lucide-react';
import vehicleTypeService from '../../services/api/vehicleTypeService';
import parkingLotService from '../../services/api/parkingLotService';
import { Toast, useToast } from './shared';
import { useConfirm } from '../../components/ConfirmDialog';

const EMPTY = { name: '', code: '', size: 'medium', pricing: { dayBlockRate: 0, nightBlockRate: '' as any, dailyRate: 0, monthlyRate: 0 }, description: '' };

const PRESET_TYPES = [
  { name: 'Xe ô tô',      code: 'CAR',           size: 'large' },
  { name: 'Xe máy',       code: 'MOTORBIKE',      size: 'small' },
  { name: 'Xe đạp',       code: 'BICYCLE',        size: 'small' },
  { name: 'Ô tô điện',    code: 'ELECTRIC_CAR',   size: 'large' },
  { name: 'Xe đạp điện',  code: 'ELECTRIC_BIKE',  size: 'small' },
];

function VehicleTypeModal({ initial, onSave, onClose, loading }: any) {
  const [form, setForm] = useState(initial);
  const [codeError, setCodeError] = useState('');
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const setPricing = (k: string, v: any) =>
    setForm((f: any) => ({ ...f, pricing: { ...f.pricing, [k]: v === '' ? 0 : (parseInt(v, 10) || 0) } }));

  const handleNameSelect = (name: string) => {
    const preset = PRESET_TYPES.find(p => p.name === name);
    if (preset) setForm((f: any) => ({ ...f, name: preset.name, code: preset.code, size: preset.size }));
    else set('name', name);
  };

  // Auto-format code: uppercase, spaces → underscore, strip invalid chars
  const handleCodeChange = (raw: string) => {
    const formatted = raw.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
    set('code', formatted);
    setCodeError('');
  };

  const handleCodeBlur = () => {
    const code = form.code || '';
    if (code && !/^[A-Z][A-Z0-9_]*$/.test(code)) {
      setCodeError('Code must start with a letter, only A–Z, 0–9, _ allowed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-7 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">{initial._id ? 'Edit Vehicle Type' : 'Add Vehicle Type'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Preset selector */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Preset Types</label>
            <select value={form.name || ''} onChange={e => handleNameSelect(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
              <option value="">-- Select preset or type custom below --</option>
              {PRESET_TYPES.map(p => <option key={p.code} value={p.name}>{p.name} ({p.code})</option>)}
            </select>
          </div>

          {/* Custom code input */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              Code <span className="text-gray-400 font-normal normal-case">(DB identifier — UPPERCASE, underscore only)</span>
            </label>
            <input
              value={form.code || ''}
              onChange={e => handleCodeChange(e.target.value)}
              onBlur={handleCodeBlur}
              placeholder="e.g. ELECTRIC_TRUCK"
              className={`w-full border rounded-xl px-4 py-2.5 text-sm font-mono font-bold uppercase tracking-widest focus:outline-none focus:ring-2 ${
                codeError ? 'border-red-300 focus:ring-red-400 bg-red-50' : 'border-gray-200 focus:ring-gray-900'
              }`}
            />
            {codeError && <p className="text-[11px] text-red-500 mt-1">{codeError}</p>}
            {!codeError && form.code && (
              <p className="text-[11px] text-emerald-600 mt-1">✓ Will be saved as <span className="font-mono font-bold">{form.code}</span></p>
            )}
          </div>

          {/* Size */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Size</label>
            <select value={form.size || 'medium'} onChange={e => set('size', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
              <option value="small">Small (bicycle, motorbike)</option>
              <option value="medium">Medium (sedan, SUV)</option>
              <option value="large">Large (truck, bus)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" /> Pricing
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Day Block Rate (VND) *</label>
                <input type="number" min="0" value={form.pricing?.dayBlockRate || 0}
                  onChange={e => setPricing('dayBlockRate', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                <p className="text-[10px] text-gray-400 mt-1">Per 4-hour daytime block</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Night Block Rate (VND)</label>
                <input
                  type="number" min="0"
                  value={form.pricing?.nightBlockRate ?? ''}
                  onChange={e => setForm((f: any) => ({
                    ...f,
                    pricing: { ...f.pricing, nightBlockRate: e.target.value === '' ? '' : Number(e.target.value) }
                  }))}
                  placeholder={form.pricing?.dayBlockRate ? `Auto: ${Math.round(form.pricing.dayBlockRate * 1.5).toLocaleString('vi-VN')}` : 'Auto = ×1.5'}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <p className="text-[10px] text-gray-400 mt-1">Leave blank → auto ×1.5</p>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Monthly Rate (VND)</label>
                <input type="number" min="0" value={form.pricing?.monthlyRate || 0}
                  onChange={e => setPricing('monthlyRate', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSave(form)} disabled={loading || !!codeError || !form.code}
            className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VehicleTypesTab({ globalLotId, setGlobalLotId }: { globalLotId?: string; setGlobalLotId?: (id: string) => void }) {
  const [types, setTypes] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<any>(null);
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
        const ids: string[] = Array.isArray(raw)
          ? raw.map((v: any) => (v?._id?.toString?.() || v?.toString?.() || '')).filter(Boolean)
          : (raw ? [(raw as any)?._id?.toString?.() || raw?.toString?.() || ''].filter(Boolean) : []);
        if (ids.length) ls = ls.filter((l: any) => ids.includes(l._id));
      }
      setLots(ls);
    }).catch(() => {});
  }, []);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vehicleTypeService.getAll(globalLotId ? { parkingLot: globalLotId } : undefined);
      setTypes(Array.isArray(res) ? res : (res as any).data || []);
    } catch (e: any) { showToast(e.message || 'Error loading data', false); }
    finally { setLoading(false); }
  }, [globalLotId]);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  const handleSave = async (form: any) => {
    if (!form.name || form.pricing?.dayBlockRate === undefined)
      return showToast('Please select a vehicle type and enter pricing', false);
    const payload = {
      ...form,
      parkingLot: globalLotId || form.parkingLot || null,
      pricing: {
        ...form.pricing,
        dailyRate: form.pricing?.dailyRate ?? 0,
        nightBlockRate: form.pricing.nightBlockRate === '' ? null : form.pricing.nightBlockRate,
      },
    };
    setSaving(true);
    try {
      if (form._id) await vehicleTypeService.update(form._id, payload);
      else await vehicleTypeService.create(payload);
      showToast(form._id ? 'Updated successfully' : 'Created successfully');
      setModal(null);
      fetchTypes();
    } catch (e: any) { showToast(e.message || 'Error saving data', false); }
    finally { setSaving(false); }
  };

  const handleDelete = async (vt: any) => {
    askConfirm(
      `Delete vehicle type "${vt.name}"?`,
      async () => {
        try {
          await vehicleTypeService.delete(vt._id);
          showToast('Vehicle type deleted');
          fetchTypes();
        } catch (e: any) { showToast(e.message || 'Error deleting', false); }
      }
    );
  };

  const fmt = (p: number) => p.toLocaleString('vi-VN') + 'đ';

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Management</p>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Car className="w-6 h-6" /> Vehicle Types
          </h1>
          <p className="text-sm text-gray-400 mt-1">{types.length} vehicle types &amp; pricing policies</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Building selector dropdown */}
          <div className="relative">
            <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={globalLotId || ''}
              onChange={e => setGlobalLotId?.(e.target.value)}
              disabled={isManager && lots.length <= 1}
              className={`pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 min-w-[200px] appearance-none ${
                isManager && lots.length <= 1 ? 'opacity-70 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:border-gray-300'
              }`}
            >
              {!isManager && <option value="">-- All Buildings --</option>}
              {lots.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </div>
          <button
            onClick={() => setModal({ ...EMPTY })}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700"
          >
            <Plus className="w-4 h-4" /> Add Vehicle Type
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="grid grid-cols-[1fr_80px_200px_80px] px-6 py-3 border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-400 uppercase tracking-wider">
          {['Vehicle Type', 'Size', 'Pricing', ''].map(h => <div key={h}>{h}</div>)}
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />Loading...
          </div>
        ) : types.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No vehicle types configured</div>
        ) : types.map((vt, i) => (
          <div key={vt._id}
            className={`grid grid-cols-[1fr_80px_200px_80px] px-6 py-4 items-center hover:bg-gray-50/60 transition-colors ${i < types.length - 1 ? 'border-b border-gray-100' : ''}`}>
            <div>
              <p className="text-sm font-bold text-gray-800 font-mono">{vt.code}</p>
            </div>
            <span className="text-xs text-gray-600 capitalize">{vt.size?.replace('_', ' ')}</span>
            <div className="text-xs text-gray-500 space-y-0.5">
              <p className="text-[10px] text-indigo-500 font-medium mb-1">1 block / 4 hours</p>
              <p><span className="font-medium text-gray-700">Day:</span> {fmt(vt.pricing?.dayBlockRate || 0)}</p>
              <p>
                <span className="font-medium text-gray-700">Night:</span>{' '}
                {vt.pricing?.nightBlockRate ? fmt(vt.pricing.nightBlockRate) : <span className="text-gray-400 italic">auto ×1.5</span>}
              </p>
              {(vt.pricing?.monthlyRate > 0) && (
                <p><span className="font-medium text-gray-700">Monthly:</span> {fmt(vt.pricing.monthlyRate)}</p>
              )}
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setModal(vt)}
                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handleDelete(vt)}
                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && <VehicleTypeModal initial={modal} onSave={handleSave} onClose={() => setModal(null)} loading={saving} />}
      {ConfirmNode}
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  );
}
