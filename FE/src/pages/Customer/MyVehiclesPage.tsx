import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { vehicleService, vehicleTypeService } from '../../services/api';
import type { Vehicle, VehiclePayload } from '../../services/api/vehicleService';
import type { VehicleType } from '../../services/api/vehicleTypeService';

// ─── Vehicle B&W SVG Icon ─────────────────────────────
const VehicleSvgIcon = ({ code, size = 48 }: { code: string; size?: number }) => {
  const c = code.toUpperCase();
  const stroke = '#0f172a';
  const sw = '2';
  const lc = 'round';
  const lj = 'round';

  if (c.includes('BICYCLE') || c.includes('BIKE') || (c.includes('DAP') && !c.includes('DIEN'))) return (
    <svg viewBox="0 0 48 48" width={size} height={size} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap={lc as any} strokeLinejoin={lj as any}>
      <circle cx="12" cy="34" r="9" /><circle cx="36" cy="34" r="9" /><circle cx="24" cy="12" r="3" />
      <path d="M12 34 L20 16 L28 16" /><path d="M12 34 L28 22 L36 34" /><path d="M20 16 L36 34" /><path d="M22 12 L30 12" />
    </svg>
  );

  if (c.includes('ELECTRIC') || c.includes('DIEN') || c.includes('EV')) return (
    <svg viewBox="0 0 48 48" width={size} height={size} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap={lc as any} strokeLinejoin={lj as any}>
      <circle cx="12" cy="34" r="8" /><circle cx="36" cy="34" r="8" />
      <path d="M12 34 L20 16 L28 16" /><path d="M20 16 L36 34" /><path d="M12 34 L28 22 L36 34" />
      <path d="M26 8 L22 18 L27 18 L23 28" strokeWidth="2.2" />
    </svg>
  );

  if (c.includes('MOTOR') || c.includes('MOTO') || c.includes('SCOOTER') || c.includes('MAY')) return (
    <svg viewBox="0 0 48 48" width={size} height={size} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap={lc as any} strokeLinejoin={lj as any}>
      <circle cx="10" cy="32" r="8" /><circle cx="38" cy="32" r="8" />
      <path d="M10 32 C14 20 20 16 26 16" /><path d="M26 16 L32 16 L38 24 L38 32" />
      <path d="M18 24 L30 24 L34 32" /><path d="M24 16 L26 10 L32 10" /><path d="M18 24 L14 28" />
    </svg>
  );

  if (c.includes('TRUCK') || c.includes('TAI') || c.includes('LORRY') || c.includes('VAN')) return (
    <svg viewBox="0 0 48 48" width={size} height={size} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap={lc as any} strokeLinejoin={lj as any}>
      <rect x="2" y="14" width="28" height="20" rx="2" />
      <path d="M30 20 L44 20 L46 34 L30 34" /><path d="M30 20 L36 14 L44 14 L44 20" />
      <circle cx="10" cy="36" r="4" /><circle cx="36" cy="36" r="4" /><line x1="2" y1="22" x2="30" y2="22" />
    </svg>
  );

  // Default: Car
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap={lc as any} strokeLinejoin={lj as any}>
      <rect x="3" y="22" width="42" height="16" rx="3" />
      <path d="M8 22 L13 12 L35 12 L40 22" />
      <circle cx="12" cy="38" r="4" /><circle cx="36" cy="38" r="4" />
      <rect x="14" y="14" width="10" height="8" rx="1.5" /><rect x="25" y="14" width="10" height="8" rx="1.5" />
      <line x1="3" y1="29" x2="45" y2="29" />
    </svg>
  );
};

const MyVehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [plateError, setPlateError] = useState<string | null>(null);

  const emptyForm: VehiclePayload = { vehicleType: '', licensePlate: '', vehicleModel: '', vehicleColor: '', vehicleBrand: '', nickname: '' };
  const [form, setForm] = useState<VehiclePayload>(emptyForm);

  // License plate format: 29A-12345 (2 digits + 1 letter + dash + 4-5 digits)
  const LICENSE_PLATE_REGEX = /^[0-9]{2}[A-Z]-[0-9]{4,5}$/;

  const handleLicensePlateChange = (rawValue: string) => {
    let v = rawValue.toUpperCase().replace(/[^A-Z0-9]/g, '');
    // Auto-insert dash after 3 chars (2 digits + 1 letter)
    if (v.length > 3) {
      v = v.slice(0, 3) + '-' + v.slice(3);
    }
    // Max length: 29A-12345 = 9 chars
    if (v.length > 9) v = v.slice(0, 9);
    setForm(prev => ({ ...prev, licensePlate: v }));
    if (plateError) setPlateError(null);
  };

  const validatePlate = (plate: string): boolean => {
    if (!LICENSE_PLATE_REGEX.test(plate)) {
      setPlateError('Format: 29A-12345 (2 số + 1 chữ + dấu - + 4-5 số)');
      return false;
    }
    setPlateError(null);
    return true;
  };

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res: any = await vehicleService.getMyVehicles(1, 50);
      const list = Array.isArray(res?.data) ? res.data : (res?.data?.docs || res?.docs || (Array.isArray(res) ? res : []));
      setVehicles(list);
    } catch { setError('Failed to load vehicles.'); }
    finally { setLoading(false); }
  };

  const fetchTypes = async () => {
    try {
      const res: any = await vehicleTypeService.getAll();
      setVehicleTypes(res?.data || res || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchVehicles(); fetchTypes(); }, []);

  const clearMessages = () => { setError(null); setSuccess(null); };

  const openAdd = () => { clearMessages(); setForm(emptyForm); setEditingId(null); setShowForm(true); };

  const openEdit = (v: Vehicle) => {
    clearMessages();
    const vtId = typeof v.vehicleType === 'object' ? v.vehicleType._id : v.vehicleType;
    setForm({ vehicleType: vtId, licensePlate: v.licensePlate, vehicleModel: v.vehicleModel || '', vehicleColor: v.vehicleColor || '', vehicleBrand: v.vehicleBrand || '', nickname: v.nickname || '' });
    setEditingId(v._id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); clearMessages(); setPlateError(null);
    if (!form.vehicleType || !form.licensePlate) { setError('Please select a vehicle type and enter license plate.'); return; }
    if (!validatePlate(form.licensePlate)) return;
    try {
      if (editingId) { await vehicleService.updateVehicle(editingId, form); setSuccess('Vehicle updated successfully!'); }
      else { await vehicleService.addVehicle(form); setSuccess('Vehicle added successfully!'); }
      setShowForm(false); setEditingId(null); fetchVehicles();
    } catch (err: any) { setError(err.message || 'An error occurred.'); }
  };

  const handleDelete = async (id: string) => {
    clearMessages();
    try { await vehicleService.deleteVehicle(id); setSuccess('Vehicle deleted.'); setDeleteConfirm(null); fetchVehicles(); }
    catch (err: any) { setError(err.message || 'Failed to delete vehicle.'); }
  };

  const handleSetDefault = async (id: string) => {
    clearMessages();
    try { await vehicleService.setDefault(id); setSuccess('Default vehicle updated.'); fetchVehicles(); }
    catch (err: any) { setError(err.message || 'Failed to set default.'); }
  };

  const getTypeName = (v: Vehicle) => typeof v.vehicleType === 'object' ? v.vehicleType.name : 'N/A';
  const getTypeCode = (v: Vehicle) => typeof v.vehicleType === 'object' ? v.vehicleType.code : '';

  const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white text-slate-800 font-medium";
  const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-md duration-300">

          {/* Cover Header */}
          <div className="h-36 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 relative">
            <Link
              to="/"
              className="absolute top-6 left-6 text-white/90 hover:text-white flex items-center gap-1.5 font-semibold text-sm no-underline bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-lg transition-all"
            >
              &larr; Back to Home
            </Link>
            <div className="absolute bottom-6 left-8">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-2xl font-extrabold text-white tracking-tight">My Vehicles</h1>
                  <p className="text-white/70 text-sm font-medium">Manage your registered vehicles</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 pb-10 pt-8">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">My Vehicles</h2>
                <p className="text-sm text-slate-400 mt-0.5">{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} registered</p>
              </div>
              <button onClick={openAdd}
                className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer">
                + Vehicle
              </button>
            </div>

            {error && <div className="mb-4 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">{error}</div>}
            {success && <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-sm font-medium">{success}</div>}

            {/* Add / Edit Modal */}
            {showForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setShowForm(false); setEditingId(null); setPlateError(null); }}>
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                {/* Modal */}
                <form
                  onSubmit={handleSubmit}
                  onClick={e => e.stopPropagation()}
                  className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 space-y-5 animate-[fadeInUp_0.25s_ease-out]"
                >
                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditingId(null); setPlateError(null); }}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer text-lg font-bold"
                  >
                    ✕
                  </button>

                  <h3 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Vehicle Type *</label>
                      <select value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })} className={inputCls} required>
                        <option value="">-- Select type --</option>
                        {vehicleTypes.map(vt => <option key={vt._id} value={vt._id}>{vt.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>License Plate *</label>
                      <input
                        value={form.licensePlate}
                        onChange={e => handleLicensePlateChange(e.target.value)}
                        className={`${inputCls} ${plateError ? 'ring-2 ring-red-400 border-red-300' : ''}`}
                        placeholder="e.g. 29A-12345"
                        maxLength={9}
                        required
                      />
                      {plateError && <p className="text-xs text-red-500 mt-1 font-medium">{plateError}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Brand</label>
                      <input value={form.vehicleBrand} onChange={e => setForm({ ...form, vehicleBrand: e.target.value })} className={inputCls} placeholder="e.g. Honda" />
                    </div>
                    <div>
                      <label className={labelCls}>Model</label>
                      <input value={form.vehicleModel} onChange={e => setForm({ ...form, vehicleModel: e.target.value })} className={inputCls} placeholder="e.g. Civic 2024" />
                    </div>
                    <div>
                      <label className={labelCls}>Color</label>
                      <input value={form.vehicleColor} onChange={e => setForm({ ...form, vehicleColor: e.target.value })} className={inputCls} placeholder="e.g. White" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Nickname</label>
                      <input value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} className={inputCls} placeholder="e.g. Daily commute" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); setEditingId(null); setPlateError(null); }}
                      className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer shadow-sm">
                      {editingId ? 'Save Changes' : 'Add Vehicle'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Vehicle List */}
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div></div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <VehicleSvgIcon code="CAR" size={36} />
                </div>
                <p className="text-slate-500 font-medium">You have no vehicles yet.</p>
                <button onClick={openAdd} className="mt-4 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm cursor-pointer shadow-sm">
                  Add Your First Vehicle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicles.map(v => (
                  <div key={v._id} className={`relative p-5 rounded-2xl border transition-all hover:shadow-md ${v.isDefault ? 'border-blue-200 bg-blue-50/30 shadow-sm' : 'border-slate-100 bg-white'}`}>
                    {v.isDefault && <span className="absolute top-3 right-3 bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-bold border border-blue-200"> Default</span>}
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                        <VehicleSvgIcon code={getTypeCode(v)} size={36} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-extrabold text-slate-900 text-base tracking-wide">{v.licensePlate}</span>
                        {v.nickname && <p className="text-sm text-indigo-600 font-semibold mb-1">"{v.nickname}"</p>}
                        <p className="text-sm text-slate-500">
                          {[v.vehicleBrand, v.vehicleModel].filter(Boolean).join(' ') || 'Not specified'}
                          {v.vehicleColor && <span className="ml-1">· {v.vehicleColor}</span>}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{getTypeName(v)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                      {!v.isDefault && (
                        <button onClick={() => handleSetDefault(v._id)} className="text-xs px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition cursor-pointer">Set Default</button>
                      )}
                      <button onClick={() => openEdit(v)} className="text-xs px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold transition cursor-pointer">Edit</button>
                      {deleteConfirm === v._id ? (
                        <div className="flex gap-1 ml-auto">
                          <button onClick={() => handleDelete(v._id)} className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg font-semibold cursor-pointer">Confirm</button>
                          <button onClick={() => setDeleteConfirm(null)} className="text-xs px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(v._id)} className="text-xs px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg font-semibold transition cursor-pointer ml-auto">Delete</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyVehiclesPage;
