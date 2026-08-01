import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Building2, MapPin, Mail, UserPlus, Search, Check, Loader2, Shield, UserMinus, Navigation } from 'lucide-react';
import parkingLotService from '../../services/api/parkingLotService';
import { useConfirm } from '../../components/ConfirmDialog';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/* ── Toast ── */
function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 text-sm px-5 py-3.5 rounded-2xl shadow-xl animate-slide-up ${ok ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}>
      {ok ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-red-200" />}
      {msg}
    </div>
  );
}

const EMPTY_LOT = { name: '', code: '', description: '', contactPhone: '', contactEmail: '', status: 'active', address: { street: '', district: '', city: '', coordinates: { lat: 10.7769, lng: 106.7009 } } };

/* ── Map click handler ── */
function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

/* ── Map controller: pan/zoom without remounting ── */
function MapController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], 15, { duration: 0.8 });
  }, [lat, lng]);
  return null;
}

/* ── Building Modal (Create / Edit) ── */
function BuildingModal({ initial, onSave, onClose, saving }: any) {
  const [form, setForm] = useState(initial);
  const [geocoding, setGeocoding] = useState(false);
  const debounceRef = useRef<any>(null);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const isEdit = !!initial._id;

  const coords = form.address?.coordinates;
  const hasPin = coords?.lat && coords?.lng;

  /* Reverse geocode via Nominatim */
  const reverseGeocode = async (lat: number, lng: number) => {
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`,
        { headers: { 'User-Agent': 'ParkingManagementApp/1.0' } }
      );
      const data = await res.json();
      if (data?.display_name) {
        const addr = data.address || {};
        const street = [addr.house_number, addr.road].filter(Boolean).join(' ');
        const district = addr.suburb || addr.quarter || addr.city_district || '';
        const city = addr.city || addr.town || addr.state || '';
        setForm((f: any) => ({
          ...f,
          address: {
            ...f.address,
            street: street || data.display_name.split(',')[0],
            district,
            city,
            coordinates: { lat, lng },
          },
        }));
      }
    } catch { /* ignore */ }
    finally { setGeocoding(false); }
  };

  const handleMapPick = (lat: number, lng: number) => {
    setForm((f: any) => ({ ...f, address: { ...f.address, coordinates: { lat, lng } } }));
    reverseGeocode(lat, lng);
  };

  /* Forward geocode: address text → coordinates */
  const forwardGeocode = async (address: string) => {
    if (!address.trim() || address.length < 5) return;
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&accept-language=vi`,
        { headers: { 'User-Agent': 'ParkingManagementApp/1.0' } }
      );
      const data = await res.json();
      if (data[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setForm((f: any) => ({ ...f, address: { ...f.address, coordinates: { lat, lng } } }));
      }
    } catch { /* ignore */ }
    finally { setGeocoding(false); }
  };

  const center: [number, number] = hasPin ? [coords.lat, coords.lng] : [10.7769, 106.7009];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-y-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{isEdit ? 'Edit Building' : 'New Building'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-7 py-5 space-y-4">
          {/* Basic fields */}
          {[['Building Name *', 'name', 'text'], ['Code *', 'code', 'text'], ['Description', 'description', 'text'], ['Contact Phone', 'contactPhone', 'text'], ['Contact Email', 'contactEmail', 'email']].map(([lbl, k, t]) => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">{lbl}</label>
              <input type={t} value={form[k] || ''} onChange={e => set(k, e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition" />
            </div>
          ))}

          {/* Map picker */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Location (click map to pick)
            </label>
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 220, zIndex: 0 }}>
              <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                />
                <MapClickHandler onPick={handleMapPick} />
                <MapController lat={coords?.lat ?? 0} lng={coords?.lng ?? 0} />
                {hasPin && <Marker position={[coords.lat, coords.lng]} />}
              </MapContainer>
            </div>
            {geocoding && (
              <p className="text-xs text-indigo-500 mt-1.5 flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" /> Getting address…
              </p>
            )}
            {hasPin && !geocoding && (
              <p className="text-[10px] text-gray-400 mt-1">
                📍 {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </p>
            )}
          </div>

          {/* Address field - single line */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Address</label>
            <input
              value={[form.address?.street, form.address?.district, form.address?.city].filter(Boolean).join(', ')}
              onChange={e => {
                const val = e.target.value;
                setForm((f: any) => ({ ...f, address: { ...f.address, street: val, district: '', city: '' } }));
                clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => forwardGeocode(val), 700);
              }}
              placeholder="Full address (auto-filled from map)"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-7 py-5 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSave(form)} disabled={saving}
            className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50">
            {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Building')}
          </button>
        </div>
      </div>
    </div>
  );
}


/* ── Assign Manager Modal ── */
function AssignManagerModal({ lot, onClose, onDone }: { lot: any; onClose: () => void; onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState(false);

  const handleAssign = async () => {
    if (!email.trim()) return setError('Please enter an email address');
    setLoading(true); setError('');
    try {
      await parkingLotService.assignManagerByEmail(lot._id, email.trim());
      onDone();
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Failed to assign manager');
    } finally { setLoading(false); }
  };

  const [confirmRemove, setConfirmRemove] = useState(false);

  const handleRemove = async () => {
    if (!confirmRemove) { setConfirmRemove(true); return; }
    setRemoving(true);
    try {
      await parkingLotService.updateManager(lot._id, null);
      onDone();
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Failed to remove manager');
    } finally { setRemoving(false); setConfirmRemove(false); }
  };

  const mgr = lot.manager;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-7">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" /> Assign Manager
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">for <span className="font-medium text-gray-600">{lot.name}</span></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>

        {/* Current manager */}
        {mgr && (
          <div className="mb-5 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700">
                {(mgr.fullName || mgr.email || 'M').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{mgr.fullName || 'Manager'}</p>
                <p className="text-xs text-gray-500">{mgr.email}</p>
              </div>
            </div>
            <button onClick={handleRemove} disabled={removing}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                confirmRemove ? 'bg-red-500 text-white hover:bg-red-600' : 'text-red-600 bg-red-50 hover:bg-red-100'
              }`}>
              {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />}
              {confirmRemove ? 'Confirm?' : 'Remove'}
            </button>
          </div>
        )}

        <div className="space-y-3">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
            {mgr ? 'Replace with new manager (email)' : 'Enter user email to promote as manager'}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleAssign()}
                placeholder="user@example.com"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
              />
            </div>
            <button onClick={handleAssign} disabled={loading || !email.trim()}
              className="px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition disabled:opacity-50 flex items-center gap-2 shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Assign
            </button>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
          <p className="text-xs text-gray-400">
            💡 User will be promoted to <strong>parking_manager</strong> role and receive an email notification.
          </p>
        </div>
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  inactive: 'bg-gray-100 text-gray-500 border-gray-200',
  maintenance: 'bg-amber-50 text-amber-700 border-amber-100',
};

/* ── Main ── */
export default function AdminBuildingTab() {
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<any>(null);         // null | lot-form-obj
  const [managerModal, setManagerModal] = useState<any>(null); // null | lot-obj
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };
  const { askConfirm, ConfirmNode } = useConfirm();

  const fetchLots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await parkingLotService.getParkingLots({ limit: 100, search: search || undefined });
      setLots(res.data || res.docs || (Array.isArray(res) ? res : []));
    } catch (e: any) { showToast(e.message || 'Error loading buildings', false); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { const t = setTimeout(fetchLots, 300); return () => clearTimeout(t); }, [fetchLots]);

  const handleSave = async (form: any) => {
    if (!form.name || !form.code) return showToast('Name and code are required', false);
    setSaving(true);
    try {
      if (form._id) await parkingLotService.updateParkingLot(form._id, form);
      else await parkingLotService.createParkingLot(form);
      showToast(form._id ? 'Building updated' : 'Building created');
      setModal(null); fetchLots();
    } catch (e: any) { showToast(e?.response?.data?.message || e.message || 'Error saving', false); }
    finally { setSaving(false); }
  };

  const handleDelete = async (lot: any) => {
    askConfirm(
      `Delete "${lot.name}"?`,
      async () => {
        try {
          await parkingLotService.deleteParkingLot(lot._id);
          showToast('Building deleted');
          fetchLots();
        } catch (e: any) { showToast(e.message || 'Error deleting', false); }
      },
      'This action cannot be undone.',
      'Delete Building'
    );
  };

  const filtered = lots.filter(l =>
    !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">System Admin</p>
          <h1 className="text-3xl font-semibold text-gray-900 leading-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-indigo-600" /> Building Management
          </h1>
          <p className="text-sm text-gray-400 mt-1">{lots.length} building{lots.length !== 1 ? 's' : ''} registered in system</p>
        </div>
        <button
          onClick={() => setModal({ ...EMPTY_LOT })}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Building
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 relative max-w-sm">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or code…"
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_1fr_160px] px-6 py-3 border-b border-gray-100 bg-gray-50">
          {['Building', 'Status', 'Address', 'Actions'].map(h => (
            <div key={h} className="text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</div>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Loading buildings…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No buildings found.</p>
            <button onClick={() => setModal({ ...EMPTY_LOT })} className="mt-3 text-sm text-indigo-600 hover:underline">Create one →</button>
          </div>
        ) : (
          filtered.map((lot, i) => {
            const mgr = lot.manager;
            return (
              <div key={lot._id}
                className={`grid grid-cols-[1fr_100px_1fr_160px] px-6 py-4 items-center hover:bg-gray-50/60 transition-colors ${i !== filtered.length - 1 ? 'border-b border-gray-100' : ''}`}>
                {/* Building info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{lot.name}</p>
                    <p className="text-xs text-gray-400">{lot.code}</p>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-lg border ${STATUS_STYLE[lot.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {lot.status}
                  </span>
                </div>

                {/* Address */}
                <div className="min-w-0">
                  {lot.address?.street || lot.address?.district || lot.address?.city ? (
                    <p className="text-xs text-gray-500 flex items-start gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
                      {[lot.address?.street, lot.address?.district, lot.address?.city].filter(Boolean).join(', ')}
                    </p>
                  ) : (
                    <span className="text-xs text-gray-300 italic">No address</span>
                  )}
                  {lot.address?.coordinates?.lat ? (
                    <p className="text-[10px] text-gray-400 mt-0.5 ml-4">
                      {lot.address.coordinates.lat.toFixed(4)}, {lot.address.coordinates.lng.toFixed(4)}
                    </p>
                  ) : null}
                </div>


                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setManagerModal(lot)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors text-xs font-medium"
                    title="Manage manager"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Manager</span>
                  </button>
                  <button
                    onClick={() => setModal({ ...lot, address: lot.address || { street: '', district: '', city: '', coordinates: { lat: 0, lng: 0 } } })}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                    title="Edit building"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(lot)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                    title="Delete building"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      {modal && <BuildingModal initial={modal} onSave={handleSave} onClose={() => setModal(null)} saving={saving} />}
      {managerModal && (
        <AssignManagerModal
          lot={managerModal}
          onClose={() => setManagerModal(null)}
          onDone={() => { setManagerModal(null); showToast('Manager updated successfully'); fetchLots(); }}
        />
      )}
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
      {ConfirmNode}
    </div>
  );
}
