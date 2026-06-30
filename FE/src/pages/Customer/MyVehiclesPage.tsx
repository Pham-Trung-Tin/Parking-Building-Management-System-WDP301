import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { vehicleService, vehicleTypeService, parkingLotService, monthlyPassService } from '../../services/api';
import parkingSessionService from '../../services/api/parkingSessionService';
import { Clock, Car, ChevronRight } from 'lucide-react';
import type { Vehicle, VehiclePayload } from '../../services/api/vehicleService';
import type { VehicleType } from '../../services/api/vehicleTypeService';
import type { ParkingLot } from '../../services/api/parkingLotService';
import type { MonthlyPass } from '../../services/api/monthlyPassService';

// ─── Vehicle B&W SVG Icon ─────────────────────────────
const VehicleSvgIcon = ({ code, size = 48 }: { code: string; size?: number }) => {
  const c = code.toUpperCase();

  if (
    c.includes('ELECTRIC_CAR') || 
    c.includes('TRUCK') || 
    c.includes('TAI') || 
    c.includes('LORRY') || 
    c.includes('VAN') || 
    (c.includes('ELECTRIC') && c.includes('CAR'))
  ) return (
    <img 
      src="https://res.cloudinary.com/dgz3rhiv4/image/upload/v1781593889/electric-car_gittvm.png" 
      alt="Electric Car" 
      style={{ width: size, height: size, objectFit: 'contain' }} 
    />
  );

  if (c.includes('ELECTRIC') || c.includes('DIEN') || c.includes('EV')) return (
    <img 
      src="https://res.cloudinary.com/dgz3rhiv4/image/upload/v1781593348/electric-motor_tijdux.png" 
      alt="Electric Bicycle" 
      style={{ width: size, height: size, objectFit: 'contain' }} 
    />
  );

  if (c.includes('MOTOR') || c.includes('MOTO') || c.includes('SCOOTER') || c.includes('MAY')) return (
    <img 
      src="https://res.cloudinary.com/dgz3rhiv4/image/upload/v1781592993/bike_uzksng.png" 
      alt="Motorcycle" 
      style={{ width: size, height: size, objectFit: 'contain' }} 
    />
  );

  if (c.includes('BICYCLE') || c.includes('BIKE') || c.includes('DAP')) return (
    <img 
      src="https://res.cloudinary.com/dgz3rhiv4/image/upload/v1781593172/bike_1_dbeqbj.png" 
      alt="Bicycle" 
      style={{ width: size, height: size, objectFit: 'contain' }} 
    />
  );

  // Default: Car
  return (
    <img 
      src="https://res.cloudinary.com/dgz3rhiv4/image/upload/v1781593098/car_s8v0sp.png" 
      alt="Car" 
      style={{ width: size, height: size, objectFit: 'contain' }} 
    />
  );
};

const ActiveSessionWidget = ({ session, isMonthlyPass }: { session: any, isMonthlyPass: boolean }) => {
    if (!isMonthlyPass) return null; // Không hiển thị gì cho xe thường (vì đã có popup trôi nổi)

    return (
        <div className="mt-3 flex items-center gap-2 bg-emerald-50/80 text-emerald-700 px-3 py-1.5 rounded-md border border-emerald-200/60 w-fit shadow-sm backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            <span className="text-[11px] font-bold tracking-wide">
                Parked: {typeof session?.floor === 'object' ? session.floor.name : 'Unknown'}
                {(typeof session?.slot === 'object') ? ` - ${session.slot.slotCode}` : ''}
            </span>
        </div>
    );
};

const MyVehiclesPage: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [monthlyPasses, setMonthlyPasses] = useState<MonthlyPass[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [buyPassVehicle, setBuyPassVehicle] = useState<Vehicle | null>(null);
  const [viewPass, setViewPass] = useState<MonthlyPass | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [plateError, setPlateError] = useState<string | null>(null);
  const [editHasActivePass, setEditHasActivePass] = useState(false);

  // Vehicle form
  const emptyForm: VehiclePayload = { vehicleType: '', licensePlate: '', vehicleModel: '', vehicleColor: '', vehicleBrand: '', nickname: '' };
  const [form, setForm] = useState<VehiclePayload>(emptyForm);

  // Monthly Pass form
  const [passForm, setPassForm] = useState({
      parkingLotId: '',
      startDate: new Date().toISOString().split('T')[0],
      durationMonths: 1
  });

  // License plate format: 29A-12345 (2 digits + 1 letter + dash + 4-6 chars)
  const LICENSE_PLATE_REGEX = /^[0-9]{2}[A-Z]-[A-Z0-9]{4,6}$/;

  const handleLicensePlateChange = (rawValue: string) => {
    let v = rawValue.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (v.length > 3) {
      v = v.slice(0, 3) + '-' + v.slice(3);
    }
    if (v.length > 10) v = v.slice(0, 10);
    setForm(prev => ({ ...prev, licensePlate: v }));
    if (plateError) setPlateError(null);
  };

  const validatePlate = (plate: string): boolean => {
    if (!LICENSE_PLATE_REGEX.test(plate)) {
      setPlateError('Format: 29A-12345 (2 số + 1 chữ + dấu - + 4-6 số/chữ)');
      return false;
    }
    setPlateError(null);
    return true;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, tRes, pRes, mRes, sRes] = await Promise.all([
          vehicleService.getMyVehicles(1, 50).catch(() => null),
          vehicleTypeService.getAll().catch(() => null),
          parkingLotService.getParkingLots().catch(() => null),
          monthlyPassService.getMyMonthlyPasses().catch(() => null),
          parkingSessionService.getSessions({ status: 'active' }).catch(() => null)
      ]);
      
      const extractArray = (res: any) => {
          if (!res) return [];
          if (Array.isArray(res)) return res;
          if (Array.isArray(res.data)) return res.data;
          if (Array.isArray(res.data?.docs)) return res.data.docs;
          if (Array.isArray(res.docs)) return res.docs;
          return [];
      };

      setVehicles(extractArray(vRes));
      setVehicleTypes(extractArray(tRes));
      setParkingLots(extractArray(pRes));
      setMonthlyPasses(extractArray(mRes));
      setActiveSessions(extractArray(sRes));
    } catch { setError('Failed to load data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const clearMessages = () => { setError(null); setSuccess(null); };

  const openAdd = () => { clearMessages(); setForm(emptyForm); setEditingId(null); setEditHasActivePass(false); setShowForm(true); };

  const openEdit = (v: Vehicle) => {
    clearMessages();
    const vtId = typeof v.vehicleType === 'object' ? v.vehicleType._id : v.vehicleType;
    setForm({ vehicleType: vtId, licensePlate: v.licensePlate, vehicleModel: v.vehicleModel || '', vehicleColor: v.vehicleColor || '', vehicleBrand: v.vehicleBrand || '', nickname: v.nickname || '' });
    setEditingId(v._id);
    // Check if this vehicle has an active/pending monthly pass → lock vehicleType
    const hasPass = monthlyPasses.some(p => p.licensePlate === v.licensePlate && ['active', 'pending'].includes(p.status));
    setEditHasActivePass(hasPass);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); clearMessages(); setPlateError(null);
    if (!form.vehicleType || !form.licensePlate) { setError('Please select a vehicle type and enter license plate.'); return; }
    if (!validatePlate(form.licensePlate)) return;
    try {
      if (editingId) { await vehicleService.updateVehicle(editingId, form); setSuccess('Vehicle updated successfully!'); }
      else { await vehicleService.addVehicle(form); setSuccess('Vehicle added successfully!'); }
      setShowForm(false); setEditingId(null); fetchData();
    } catch (err: any) { setError(err.message || 'An error occurred.'); }
  };

  const handleDelete = async (id: string) => {
    clearMessages();
    try { await vehicleService.deleteVehicle(id); setSuccess('Vehicle deleted.'); setDeleteConfirm(null); fetchData(); }
    catch (err: any) { setError(err.message || 'Failed to delete vehicle.'); }
  };

  const handleSetDefault = async (id: string) => {
    clearMessages();
    try { await vehicleService.setDefault(id); setSuccess('Default vehicle updated.'); fetchData(); }
    catch (err: any) { setError(err.message || 'Failed to set default.'); }
  };

  const handleBuyPassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyPassVehicle || !passForm.parkingLotId) return;
    const vtId = typeof buyPassVehicle.vehicleType === 'object' ? buyPassVehicle.vehicleType._id : buyPassVehicle.vehicleType;
    try {
        const res: any = await monthlyPassService.createMonthlyPass({
            parkingLotId: passForm.parkingLotId,
            vehicleTypeId: vtId,
            licensePlate: buyPassVehicle.licensePlate,
            startDate: passForm.startDate,
            months: Number(passForm.durationMonths)
        });
        
        const passData = res.data;
        navigate('/checkout', {
            state: {
                isMonthlyPass: true,
                monthlyPassId: passData._id,
                passCode: passData.passCode,
                parkingLotName: passData.parkingLot?.name,
                licensePlate: passData.licensePlate,
                vehicleTypeName: passData.vehicleType?.name,
                startDate: passData.startDate,
                endDate: passData.endDate,
                totalAmount: passData.price,
                durationMonths: Number(passForm.durationMonths)
            }
        });
        
        setBuyPassVehicle(null);
    } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to buy monthly pass.');
    }
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
                  <p className="text-white/70 text-sm font-medium">Manage your registered vehicles & monthly passes</p>
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
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all cursor-pointer">
                + Add Vehicle
              </button>
            </div>

            {error && <div className="mb-4 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">{error}</div>}
            {success && <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-sm font-medium">{success}</div>}

            {/* Add / Edit Vehicle Modal */}
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
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditingId(null); setPlateError(null); }}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer text-lg font-bold"
                  >✕</button>

                  <h3 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Vehicle Type *</label>
                      <select
                        value={form.vehicleType}
                        onChange={e => setForm({ ...form, vehicleType: e.target.value })}
                        className={`${inputCls} ${editHasActivePass ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
                        required
                        disabled={editHasActivePass}
                      >
                        <option value="">-- Select type --</option>
                        {vehicleTypes.map(vt => <option key={vt._id} value={vt._id}>{vt.name}</option>)}
                      </select>
                      {editHasActivePass && (
                        <p className="text-xs text-amber-600 mt-1.5 font-medium flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          Cannot change vehicle type — this vehicle has an active monthly pass
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={labelCls}>License Plate *</label>
                      <input
                        value={form.licensePlate}
                        onChange={e => handleLicensePlateChange(e.target.value)}
                        className={`${inputCls} ${plateError ? 'ring-2 ring-red-400 border-red-300' : ''}`}
                        placeholder="e.g. 29A-12345"
                        maxLength={10}
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
                    >Cancel</button>
                    <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer shadow-sm">
                      {editingId ? 'Save Changes' : 'Add Vehicle'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Buy Monthly Pass Modal */}
            {buyPassVehicle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setBuyPassVehicle(null)}>
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                <form
                  onSubmit={handleBuyPassSubmit}
                  onClick={e => e.stopPropagation()}
                  className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-5 animate-[fadeInUp_0.25s_ease-out]"
                >
                  <button
                    type="button"
                    onClick={() => setBuyPassVehicle(null)}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer text-lg font-bold"
                  >✕</button>

                  <h3 className="text-xl font-bold text-slate-900 mb-1">Buy Monthly Pass</h3>
                  <p className="text-sm text-slate-500 mb-4">For vehicle: <strong>{buyPassVehicle.licensePlate}</strong></p>

                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Parking Lot *</label>
                      <select required value={passForm.parkingLotId} onChange={e => setPassForm({ ...passForm, parkingLotId: e.target.value })} className={inputCls}>
                        <option value="">-- Select Location --</option>
                        {parkingLots.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Start Date *</label>
                      <input required type="date" value={passForm.startDate} onChange={e => setPassForm({ ...passForm, startDate: e.target.value })} className={inputCls} min={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div>
                      <label className={labelCls}>Duration *</label>
                      <select required value={passForm.durationMonths} onChange={e => setPassForm({ ...passForm, durationMonths: Number(e.target.value) })} className={inputCls}>
                        {[1, 2, 3, 6, 12].map(m => <option key={m} value={m}>{m} Month{m > 1 ? 's' : ''}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setBuyPassVehicle(null)}
                      className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer"
                    >Cancel</button>
                    <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-sm hover:from-emerald-700 hover:to-teal-700 transition-all cursor-pointer shadow-sm">
                      Confirm Purchase
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Vehicle List */}
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div></div>
            ) : (
             <>
            {/* View Pass QR Modal */}
            {viewPass && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" onClick={() => setViewPass(null)}>
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                <div
                  onClick={e => e.stopPropagation()}
                  className="relative w-full max-w-sm transform animate-[fadeInUp_0.3s_ease-out]"
                >
                  {/* Close button outside card */}
                  <button
                    type="button"
                    onClick={() => setViewPass(null)}
                    className="absolute -top-12 right-0 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition cursor-pointer text-xl"
                  >✕</button>

                  <div className="bg-white rounded-3xl shadow-2xl p-8 text-center flex flex-col items-center relative overflow-hidden">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 tracking-tight">QR Code</h3>
                    
                    <div className="p-4 bg-slate-50 border-2 border-slate-100 rounded-[2rem] shadow-sm mb-6 inline-block">
                        {viewPass.qrCode ? (
                            <img src={viewPass.qrCode} alt="Pass QR Code" className="w-56 h-56 object-contain" />
                        ) : (
                            <div className="w-56 h-56 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-medium">No QR Code</div>
                        )}
                    </div>
                    
                    {viewPass.qrCode && (
                        <a 
                            href={viewPass.qrCode} 
                            download={`Pass-${viewPass.licensePlate}.png`}
                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer no-underline"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Download QR
                        </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {vehicles.length === 0 ? (
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
              <div className="grid grid-cols-1 gap-4">
                {vehicles.map(v => {
                  // Find if there is an active or pending monthly pass for this vehicle
                  const activePass = monthlyPasses.find(p => p.licensePlate === v.licensePlate && ['active', 'pending'].includes(p.status));
                  const activeSession = activeSessions.find(s => s.vehicleInfo?.licensePlate === v.licensePlate);

                  return (
                  <div key={v._id} className={`relative p-5 rounded-2xl border transition-all hover:shadow-md ${v.isDefault ? 'border-blue-200 bg-blue-50/30 shadow-sm' : 'border-slate-100 bg-white'}`}>
                    
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                            <VehicleSvgIcon code={getTypeCode(v)} size={36} />
                          </div>
                          <div className="flex flex-col w-full">
                            <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-900 text-base tracking-wide">{v.licensePlate}</span>
                                {v.isDefault && <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-md font-bold border border-blue-200 uppercase tracking-wider">Default</span>}
                            </div>
                            {v.nickname && <p className="text-sm text-indigo-600 font-semibold mb-1 mt-0.5">"{v.nickname}"</p>}
                            <p className="text-sm text-slate-500 mt-0.5">
                              {[v.vehicleBrand, v.vehicleModel].filter(Boolean).join(' ') || 'Not specified'}
                              {v.vehicleColor && <span className="ml-1">· {v.vehicleColor}</span>}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">{getTypeName(v)}</p>
                            
                            {activeSession && (
                                <ActiveSessionWidget session={activeSession} isMonthlyPass={!!activePass} />
                            )}

                          </div>
                        </div>

                        {/* Monthly Pass Section */}
                        <div className={`sm:text-right flex flex-col justify-center min-w-[140px]`}>
                            {activePass ? (
                                <div>
                                    {activePass.status === 'active' ? (
                                        <div 
                                            className="relative w-[320px] h-[155px] rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-lg transition-all hover:scale-[1.01] flex flex-col flex-shrink-0 ml-auto"
                                            onClick={() => setBuyPassVehicle(v)}
                                            title="Click to extend pass"
                                        >
                                            {/* Top Blue Section */}
                                            <div className="bg-[#1565c0] h-[90px] w-full px-4 py-3 relative z-10 flex flex-col justify-between">
                                                <div className="flex justify-between items-start">
                                                    <div className="text-left">
                                                        <div className="text-white/70 text-[9px] font-bold uppercase tracking-widest">Monthly Pass</div>
                                                        <div className="text-white font-bold text-xs mt-0.5">{activePass.passCode}</div>
                                                    </div>
                                                    <div className="bg-emerald-400/20 border border-emerald-400/40 px-1.5 py-0.5 rounded text-[8px] font-bold text-emerald-300 flex items-center gap-1 uppercase tracking-wider">
                                                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                                                        Active
                                                    </div>
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-white font-bold text-sm leading-tight truncate">{v.licensePlate}</div>
                                                    <div className="text-white/60 text-[10px] mt-0.5">{typeof v.vehicleType === 'object' ? v.vehicleType.name : 'Vehicle'}</div>
                                                </div>
                                            </div>

                                            {/* Bottom Dark Section */}
                                            <div className="absolute bottom-0 left-0 right-0 h-[65px] bg-[#0d47a1] z-0"></div>

                                            {/* White Info Cutout */}
                                            <div className="bg-white h-[65px] w-[82%] rounded-br-[24px] px-4 py-2.5 relative z-10 flex flex-col justify-center items-start">
                                                <div className="text-[#0d47a1] font-bold text-xs uppercase truncate w-full text-left">
                                                    {typeof activePass.parkingLot === 'object' ? activePass.parkingLot.name : 'Parking Lot'}
                                                </div>
                                                <div className="text-slate-500 text-[10px] mt-1 text-left">
                                                    {new Date(activePass.startDate).toLocaleDateString()} → {new Date(activePass.endDate).toLocaleDateString()}
                                                </div>
                                            </div>

                                            {/* QR icon bottom-right */}
                                            {activePass.qrCode && (
                                                <button 
                                                    className="absolute bottom-2.5 right-3 z-20 bg-white/15 hover:bg-white/25 text-white rounded-lg p-1.5 transition-colors border border-white/20 cursor-pointer"
                                                    onClick={(e) => { e.stopPropagation(); setViewPass(activePass); }}
                                                    title="View QR Code"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center sm:justify-end gap-2 mb-1">
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Pass</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200`}>
                                                    {activePass.status}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-800">{typeof activePass.parkingLot === 'object' ? activePass.parkingLot.name : 'Parking Lot'}</p>
                                            <p className="text-xs text-slate-500 mt-1">Valid: {new Date(activePass.startDate).toLocaleDateString()} - {new Date(activePass.endDate).toLocaleDateString()}</p>
                                        </>
                                    )}
                                    
                                    {activePass.status === 'pending' && (
                                        <button
                                            onClick={() => {
                                                const vtName = typeof v.vehicleType === 'object' ? v.vehicleType.name : 'Vehicle';
                                                const passId = (activePass as any)._id || activePass.id;
                                                navigate('/checkout', {
                                                    state: {
                                                        isMonthlyPass: true,
                                                        monthlyPassId: passId,
                                                        passCode: activePass.passCode,
                                                        parkingLotName: typeof activePass.parkingLot === 'object' ? activePass.parkingLot.name : 'Parking Lot',
                                                        licensePlate: activePass.licensePlate,
                                                        vehicleTypeName: vtName,
                                                        startDate: activePass.startDate,
                                                        endDate: activePass.endDate,
                                                        totalAmount: activePass.price,
                                                        durationMonths: Math.round((new Date(activePass.endDate).getTime() - new Date(activePass.startDate).getTime()) / (30.44 * 24 * 60 * 60 * 1000)) || 1,
                                                    }
                                                });
                                            }}
                                            className="mt-2 w-full sm:w-auto px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                                        >
                                            Pay Now
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col sm:items-end justify-center mt-2 sm:mt-0">
                                    <button 
                                        onClick={() => setBuyPassVehicle(v)}
                                        className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold hover:bg-emerald-50 hover:text-emerald-600 transition-colors cursor-pointer w-fit"
                                        title="No Monthly Pass - Click to Buy"
                                    >
                                        + Buy Monthly Pass
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                      {!v.isDefault && (
                        <button onClick={() => handleSetDefault(v._id)} className="text-xs px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition cursor-pointer">Set Default</button>
                      )}
                      <button onClick={() => openEdit(v)} className="text-xs px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold transition cursor-pointer">Edit</button>
                      {deleteConfirm === v._id ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleDelete(v._id)} className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg font-semibold cursor-pointer">Confirm</button>
                          <button onClick={() => setDeleteConfirm(null)} className="text-xs px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(v._id)} className="text-xs px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg font-semibold transition cursor-pointer">Delete</button>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
            </>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyVehiclesPage;
