import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, X, Car, RefreshCw, DollarSign } from 'lucide-react';
import vehicleTypeService from '../../services/api/vehicleTypeService';
import { Toast, useToast } from './shared';



const EMPTY = { name: '', code: '', size: 'medium', pricing: { hourlyRate: 0, dailyRate: 0, monthlyRate: 0, overtimeMultiplier: 1.5 }, description: '' };

function VehicleTypeModal({ initial, onSave, onClose, loading }: any) {
  const [form, setForm] = useState(initial);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const setPricing = (k: string, v: any) => setForm((f: any) => ({ ...f, pricing: { ...f.pricing, [k]: Number(v) } }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-7 anim-fade overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">{initial._id ? 'Edit Vehicle Type' : 'Add Vehicle Type'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Type Name *</label>
              <input type="text" value={form.name || ''} onChange={e => set('name', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Code *</label>
              <input type="text" value={form.code || ''} onChange={e => set('code', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 uppercase" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Size</label>
              <select value={form.size || 'medium'} onChange={e => set('size', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="extra_large">Extra Large</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
            <input type="text" value={form.description || ''} onChange={e => set('description', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>

          <div className="pt-3 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-600" /> Pricing Rules</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Hourly Rate (VND) *</label>
                <input type="number" min="0" value={form.pricing?.hourlyRate || 0} onChange={e => setPricing('hourlyRate', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Daily Rate (VND) *</label>
                <input type="number" min="0" value={form.pricing?.dailyRate || 0} onChange={e => setPricing('dailyRate', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Monthly Rate (VND)</label>
                <input type="number" min="0" value={form.pricing?.monthlyRate || 0} onChange={e => setPricing('monthlyRate', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Overtime Multiplier</label>
                <input type="number" min="1" step="0.1" value={form.pricing?.overtimeMultiplier || 1.5} onChange={e => setPricing('overtimeMultiplier', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
            </div>
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

export default function VehicleTypesTab() {
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<any>(null);
  const { toast, showToast } = useToast();

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vehicleTypeService.getAll();
      setTypes(Array.isArray(res) ? res : (res as any).data || []);
    } catch (e: any) { showToast(e.message || 'Error loading data', false); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSave = async (form: any) => {
    if (!form.name || !form.code || form.pricing?.hourlyRate === undefined || form.pricing?.dailyRate === undefined) return showToast('Please fill all required fields', false);
    setSaving(true);
    try {
      if (form._id) await vehicleTypeService.update(form._id, form);
      else await vehicleTypeService.create(form);
      showToast(form._id ? 'Updated successfully' : 'Created successfully');
      setModal(null);
      fetch();
    } catch (e: any) { showToast(e.message || 'Error saving data', false); }
    finally { setSaving(false); }
  };

  const handleDelete = async (vt: any) => {
    if (!window.confirm(`Delete vehicle type "${vt.name}"?`)) return;
    try {
      await vehicleTypeService.delete(vt._id);
      showToast('Vehicle type deleted');
      fetch();
    } catch (e: any) { showToast(e.message || 'Error deleting', false); }
  };

  const formatPrice = (p: number) => p.toLocaleString('vi-VN') + 'đ';

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Management</p>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2"><Car className="w-6 h-6" /> Vehicle Types</h1>
          <p className="text-sm text-gray-400 mt-1">{types.length} vehicle types & pricing policies</p>
        </div>
        <button onClick={() => setModal({ ...EMPTY })} className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700">
          <Plus className="w-4 h-4" /> Add Vehicle Type
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="grid grid-cols-[1fr_80px_200px_80px] px-6 py-3 border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-400 uppercase tracking-wider">
          {['Vehicle Type', 'Size', 'Pricing', ''].map(h => <div key={h}>{h}</div>)}
        </div>
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />Loading...</div>
        ) : types.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No data available</div>
        ) : types.map((vt, i) => (
          <div key={vt._id} className={`grid grid-cols-[1fr_80px_200px_80px] px-6 py-4 items-center hover:bg-gray-50/60 transition-colors ${i < types.length - 1 ? 'border-b border-gray-100' : ''}`}>
            <div>
              <p className="text-sm font-semibold text-gray-800">{vt.name}</p>
              <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md mt-1 inline-block">{vt.code}</span>
            </div>
            <span className="text-xs text-gray-600 capitalize">{vt.size?.replace('_', ' ')}</span>
            <div className="text-xs text-gray-500 space-y-0.5">
              <p><span className="font-medium text-gray-700">Hour:</span> {formatPrice(vt.pricing?.hourlyRate || 0)}</p>
              <p><span className="font-medium text-gray-700">Day:</span> {formatPrice(vt.pricing?.dailyRate || 0)}</p>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setModal(vt)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleDelete(vt)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      {modal && <VehicleTypeModal initial={modal} onSave={handleSave} onClose={() => setModal(null)} loading={saving} />}
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  );
}
