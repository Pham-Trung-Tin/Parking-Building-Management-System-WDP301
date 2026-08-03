import { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, UserPlus, UserMinus, Mail, Loader2, Check, X, Phone, Search, Shield, Building } from 'lucide-react';
import parkingLotService from '../../services/api/parkingLotService';
import type { StaffMember } from '../../services/api/parkingLotService';
import { useConfirm } from '../../components/ConfirmDialog';

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 text-sm px-5 py-3.5 rounded-2xl shadow-xl ${ok ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}>
      {ok ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-red-200" />}
      {msg}
    </div>
  );
}

function getInitials(name: string) {
  return (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

/* ── Add Staff by Email Modal ── */
function AddStaffModal({ lot, onClose, onDone }: { lot: any; onClose: () => void; onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!email.trim()) return setError('Please enter an email address');
    setLoading(true); setError('');
    try {
      await parkingLotService.addStaffByEmail(lot._id, email.trim());
      onDone();
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Failed to add staff');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-7">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-violet-600" /> Add Staff Member
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">to <span className="font-medium text-gray-600">{lot.name}</span></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
            User email
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="staff@example.com"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
                autoFocus
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={loading || !email.trim()}
              className="px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition disabled:opacity-50 flex items-center gap-2 shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Add
            </button>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
          <p className="text-xs text-gray-400">
            💡 The user will be assigned as <strong>parking_staff</strong> and receive an email notification.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function StaffAssignmentTab({ globalLotId, setGlobalLotId }: { globalLotId?: string; setGlobalLotId?: any }) {
  const user = useMemo(() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } }, []);

  const [lots, setLots] = useState<any[]>([]);
  const [selectedLot, setSelectedLot] = useState<any>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loadingLots, setLoadingLots] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };
  const { askConfirm, ConfirmNode } = useConfirm();

  /* Fetch lots */
  const fetchLots = useCallback(async () => {
    setLoadingLots(true);
    try {
      const res = await parkingLotService.getParkingLots({ limit: 100 });
      let data: any[] = res.data || res.docs || (Array.isArray(res) ? res : []);
      // Manager only sees their own buildings (support both string and string[])
      if (user?.role === 'parking_manager') {
        const raw = user?.assignedParkingLot;
        const ids: string[] = Array.isArray(raw)
          ? raw.map((v: any) => (v?._id?.toString?.() || v?.toString?.() || '')).filter(Boolean)
          : (raw ? [(raw as any)?._id?.toString?.() || raw?.toString?.() || ''].filter(Boolean) : []);
        if (ids.length > 0) data = data.filter(l => ids.includes(l._id));
      }
      setLots(data);
      // Auto-select
      const target = data.find(l => l._id === (globalLotId || (Array.isArray(user?.assignedParkingLot) ? user.assignedParkingLot[0] : user?.assignedParkingLot))) || data[0];
      if (target) { setSelectedLot(target); setGlobalLotId?.(target._id); }
    } catch (e: any) { showToast(e.message || 'Failed to load buildings', false); }
    finally { setLoadingLots(false); }
  }, []);

  /* Fetch staff for selected lot */
  const fetchStaff = useCallback(async () => {
    if (!selectedLot) return;
    setLoadingStaff(true);
    try {
      const res = await parkingLotService.getStaff(selectedLot._id);
      setStaff(res.data || res || []);
    } catch (e: any) { showToast(e.message || 'Failed to load staff', false); }
    finally { setLoadingStaff(false); }
  }, [selectedLot]);

  useEffect(() => { fetchLots(); }, [fetchLots]);
  useEffect(() => { fetchStaff(); }, [fetchStaff]);
  useEffect(() => {
    if (globalLotId && lots.length > 0) {
      const found = lots.find(l => l._id === globalLotId);
      if (found && found._id !== selectedLot?._id) setSelectedLot(found);
    }
  }, [globalLotId, lots]);

  const handleRemove = async (s: StaffMember) => {
    if (!selectedLot) return;
    askConfirm(
      `Remove ${s.fullName}?`,
      async () => {
        setRemoving(s._id);
        try {
          await parkingLotService.removeStaff(selectedLot._id, s._id);
          showToast(`${s.fullName} removed`);
          fetchStaff();
        } catch (e: any) { showToast(e.message || 'Failed to remove', false); }
        finally { setRemoving(null); }
      },
      `This will unassign them from ${selectedLot.name}.`,
      'Remove'
    );
  };

  const onlyStaff = useMemo(() => staff.filter(s => s.role !== 'parking_manager'), [staff]);
  const managers = useMemo(() => staff.filter(s => s.role === 'parking_manager'), [staff]);

  const filteredStaff = useMemo(() =>
    onlyStaff.filter(s => !search || s.fullName?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase())),
    [onlyStaff, search]
  );

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">Manager Portal</p>
          <h1 className="text-3xl font-semibold text-gray-900 leading-tight">Staff Assignment</h1>
          <p className="text-sm text-gray-400 mt-1">Manage personnel for your building</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Building selector — same design as BuildingsTab */}
          <div className="relative">
            <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={selectedLot?._id || ''}
              onChange={e => {
                const lot = lots.find(l => l._id === e.target.value);
                if (lot) { setSelectedLot(lot); setGlobalLotId?.(lot._id); }
              }}
              disabled={lots.length <= 1}
              className={`pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[220px] transition-all appearance-none ${
                lots.length <= 1 ? 'opacity-70 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:border-gray-300'
              }`}
            >
              {lots.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </div>
          {selectedLot && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition shadow-sm"
            >
              <UserPlus className="w-4 h-4" /> Add Staff by Email
            </button>
          )}
        </div>
      </div>


      {/* Current building info banner */}
      {selectedLot && (
        <div className="mb-6 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{selectedLot.name}</p>
            <p className="text-xs text-gray-400">{selectedLot.code} · {[selectedLot.address?.district, selectedLot.address?.city].filter(Boolean).join(', ')}</p>
          </div>
          <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
            <span><strong className="text-gray-900">{onlyStaff.length}</strong> staff</span>
            <span><strong className="text-gray-900">{managers.length}</strong> manager{managers.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {loadingLots ? (
        <div className="py-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-gray-300 mx-auto" /></div>
      ) : !selectedLot ? (
        <div className="py-16 text-center text-sm text-gray-400">No building assigned to your account.</div>
      ) : (
        <>
          {/* Managers section */}
          {managers.length > 0 && (
            <div className="mb-6 bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-indigo-50 flex items-center gap-3 bg-indigo-50/40">
                <Shield className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-semibold text-gray-800">Assigned Managers</h2>
                <span className="ml-auto text-xs text-indigo-600 font-medium">{managers.length} manager{managers.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {managers.map(m => (
                  <div key={m._id} className="flex items-center gap-4 px-6 py-3.5">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                      {getInitials(m.fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{m.fullName}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" />{m.email}</p>
                    </div>
                    <span className="ml-auto text-[10px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 uppercase tracking-wider">Manager</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Staff list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
              <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-600" /> Staff Members
              </h2>
              {onlyStaff.length > 0 && (
                <div className="relative ml-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search staff…"
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-900 w-52"
                  />
                </div>
              )}
            </div>

            {loadingStaff ? (
              <div className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto" /></div>
            ) : filteredStaff.length === 0 ? (
              <div className="py-14 text-center">
                <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-3 border border-violet-100 border-dashed">
                  <Users className="w-6 h-6 text-violet-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">No staff assigned yet</p>
                <p className="text-xs text-gray-400 mt-1">Click "Add Staff by Email" to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredStaff.map(s => (
                  <div key={s._id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors group">
                    {s.avatar?.url || s.avatarUrl ? (
                      <img src={s.avatar?.url || s.avatarUrl} alt={s.fullName} className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-100 to-purple-200 flex items-center justify-center text-xs font-bold text-violet-700 shrink-0">
                        {getInitials(s.fullName)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800">{s.fullName}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</span>
                        {s.phone && <span className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</span>}
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border shrink-0 ${s.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      {s.status}
                    </span>
                    <button
                      onClick={() => handleRemove(s)}
                      disabled={removing === s._id}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 text-xs font-medium rounded-lg transition-all shrink-0 disabled:opacity-50"
                    >
                      {removing === s._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />}
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {showAddModal && selectedLot && (
        <AddStaffModal
          lot={selectedLot}
          onClose={() => setShowAddModal(false)}
          onDone={() => { setShowAddModal(false); showToast('Staff added successfully'); fetchStaff(); }}
        />
      )}
      {ConfirmNode}
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  );
}
