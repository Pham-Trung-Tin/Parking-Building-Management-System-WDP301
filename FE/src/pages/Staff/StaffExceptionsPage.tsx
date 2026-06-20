import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LogIn,
  LogOut,
  Eye,
  AlertTriangle,
  Bell,
  User,
  Ticket,
  ChevronDown,
  Users,
  LayoutGrid,
  CheckCircle2,
  X,
  Search,
  Camera,
  Upload
} from 'lucide-react';
import useProfile from '../../hooks/useProfile';
import incidentService, { IncidentCreateData } from '../../services/api/incidentService';
import parkingSessionService from '../../services/api/parkingSessionService';

const INCIDENT_TYPES = [
  { value: 'lost_ticket', label: 'Lost Ticket' },
  { value: 'wrong_license_plate', label: 'LPR Mismatch' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'wrong_zone', label: 'Wrong Zone' },
  { value: 'slot_occupied', label: 'Slot Occupied' },
  { value: 'slot_damaged', label: 'Slot Damaged' },
  { value: 'vehicle_damage', label: 'Vehicle Damage' },
  { value: 'theft', label: 'Theft' },
  { value: 'other', label: 'Other' }
];

const StaffExceptionsPage = () => {
  const { profile } = useProfile();
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Report Form State
  const [reportData, setReportData] = useState<Partial<IncidentCreateData>>({
    type: 'other',
    title: '',
    description: '',
    severity: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resolution Modal State
  const [resolveModal, setResolveModal] = useState<{ isOpen: boolean, incident: any }>({ isOpen: false, incident: null });
  const [resolveDescription, setResolveDescription] = useState('');
  const [resolveCharge, setResolveCharge] = useState<number | string>('');
  const [isResolving, setIsResolving] = useState(false);

  const [viewModal, setViewModal] = useState<{ isOpen: boolean, incident: any }>({ isOpen: false, incident: null });

  // Lost Ticket Specific State
  const [searchPlate, setSearchPlate] = useState('');
  const [foundSession, setFoundSession] = useState<any>(null);
  const [isSearchingSession, setIsSearchingSession] = useState(false);
  const [identityData, setIdentityData] = useState<{
    idCard: string;
    fullName: string;
    phone: string;
    paymentMethod: string;
    documentFile: File | null;
  }>({
    idCard: '',
    fullName: '',
    phone: '',
    paymentMethod: 'cash',
    documentFile: null
  });

  // Notification
  const [notification, setNotification] = useState<{ show: boolean, message: string, type: 'success' | 'error' } | null>(null);

  const buildingName = (profile?.assignedParkingLot as any)?.name || 'Main Street Garage';
  const lotId = (profile?.assignedParkingLot as any)?._id || (profile?.assignedParkingLot as any);

  const fetchIncidents = async () => {
    setIsLoading(true);
    try {
      const params: any = { limit: 50 };
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      const res = await incidentService.getAll(params);
      setIncidents(res.data?.docs || res.data || []);
    } catch (error) {
      console.error('Failed to fetch incidents', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 30000);
    return () => clearInterval(interval);
  }, [filterStatus]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleSubmitReport = async () => {
    if (!lotId) {
      showNotification('No parking lot assigned to your profile.', 'error');
      return;
    }
    if (!reportData.title || !reportData.description) {
      showNotification('Please fill in title and description.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await incidentService.create({
        parkingLot: lotId,
        type: reportData.type || 'other',
        title: reportData.title,
        description: reportData.description,
        severity: reportData.severity as any
      });
      showNotification('Exception reported successfully.', 'success');
      setReportData({ type: 'other', title: '', description: '', severity: 'medium' });
      fetchIncidents();
    } catch (error: any) {
      showNotification(error?.response?.data?.message || 'Failed to report exception', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async () => {
    if (!resolveModal.incident) return;
    if (!resolveDescription) {
      showNotification('Please provide a resolution description.', 'error');
      return;
    }

    setIsResolving(true);
    try {
      await incidentService.resolve(resolveModal.incident._id, {
        description: resolveDescription,
        extraCharge: Number(resolveCharge) || 0
      });
      showNotification('Exception resolved successfully.', 'success');
      setResolveModal({ isOpen: false, incident: null });
      setResolveDescription('');
      setResolveCharge('');
      fetchIncidents();
    } catch (error: any) {
      showNotification(error?.response?.data?.message || 'Failed to resolve exception', 'error');
    } finally {
      setIsResolving(false);
    }
  };

  const handleSearchSession = async () => {
    if (!searchPlate.trim()) {
      showNotification('Please enter a license plate.', 'error');
      return;
    }
    setIsSearchingSession(true);
    try {
      const res = await parkingSessionService.findActive({ licensePlate: searchPlate.trim(), parkingLotId: lotId });
      if (res.data) {
        setFoundSession(res.data);
        showNotification('Session found.', 'success');
      }
    } catch (err: any) {
      setFoundSession(null);
      showNotification(err?.response?.data?.message || 'No active session found for this plate.', 'error');
    } finally {
      setIsSearchingSession(false);
    }
  };

  const handleConfirmLostTicket = async () => {
    if (!resolveModal.incident) return;
    if (!foundSession) {
      showNotification('Please search and confirm the active session first.', 'error');
      return;
    }
    if (!identityData.idCard || !identityData.fullName || !identityData.phone) {
      showNotification('Please fill in all mandatory identity verification fields.', 'error');
      return;
    }

    setIsResolving(true);
    try {
      const desc = `Identity Verified: ${identityData.fullName}\nID: ${identityData.idCard}\nPhone: ${identityData.phone}\nPayment Method: ${identityData.paymentMethod.toUpperCase()}`;

      const formData = new FormData();
      formData.append('description', desc);
      formData.append('extraCharge', String(Number(resolveCharge) || 0));
      if (identityData.documentFile) {
        formData.append('image', identityData.documentFile);
      }

      // Resolve incident
      await incidentService.resolve(resolveModal.incident._id, formData);

      // Attempt checkout automatically
      await parkingSessionService.checkOut(foundSession._id);

      showNotification('Lost ticket processed and vehicle released.', 'success');
      setResolveModal({ isOpen: false, incident: null });
      setFoundSession(null);
      setSearchPlate('');
      setIdentityData({ idCard: '', fullName: '', phone: '', paymentMethod: 'cash', documentFile: null });
      setResolveCharge('');
      fetchIncidents();
    } catch (err: any) {
      showNotification(err?.response?.data?.message || 'Failed to process lost ticket.', 'error');
    } finally {
      setIsResolving(false);
    }
  };

  const renderResolveModal = () => {
    if (!resolveModal.isOpen) return null;
    const isLostTicket = resolveModal.incident?.type === 'lost_ticket';

    if (isLostTicket) {
      return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Process Lost Ticket</h3>
                <p className="text-xs text-gray-500">Ref: {resolveModal.incident?.incidentCode}</p>
              </div>
              <button onClick={() => { setResolveModal({ isOpen: false, incident: null }); setFoundSession(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <section>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">1. Lookup Information</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchPlate}
                      onChange={e => setSearchPlate(e.target.value.toUpperCase())}
                      placeholder="Enter License Plate"
                      className="flex-1 border border-gray-200 p-3 text-sm outline-none focus:border-gray-400 uppercase"
                    />
                    <button
                      onClick={handleSearchSession}
                      disabled={isSearchingSession}
                      className="bg-black text-white px-6 py-3 text-sm font-bold flex items-center hover:bg-gray-900 disabled:opacity-50"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </button>
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">2. System Match Information</h4>
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded text-sm space-y-3">
                    {foundSession ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Entry Time:</span>
                          <span className="font-bold">{new Date(foundSession.entryTime).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Old Ticket ID:</span>
                          <span className="font-bold">{foundSession.sessionCode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Vehicle Type:</span>
                          <span className="font-bold">{foundSession.vehicleType?.name}</span>
                        </div>
                        <div className="pt-3 border-t border-gray-200">
                          <span className="text-gray-500 block mb-2">Entry Images:</span>
                          <div className="flex gap-2">
                            <div className="w-24 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400 overflow-hidden">
                              {foundSession.evidenceImages?.[0] ? <img src={foundSession.evidenceImages[0].url} className="w-full h-full object-cover" alt="Overview" /> : 'Overview'}
                            </div>
                            <div className="w-24 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400 overflow-hidden">
                              {foundSession.evidenceImages?.[1] ? <img src={foundSession.evidenceImages[1].url} className="w-full h-full object-cover" alt="LPR" /> : 'LPR Close-up'}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-400 text-center py-4">Search a plate to load system record</div>
                    )}
                  </div>
                </section>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <section>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">3. Exception Verification (Mandatory)</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Customer's National ID/Passport"
                      value={identityData.idCard}
                      onChange={e => setIdentityData({ ...identityData, idCard: e.target.value })}
                      className="w-full border border-gray-200 p-3 text-sm outline-none focus:border-gray-400"
                    />
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={identityData.fullName}
                        onChange={e => setIdentityData({ ...identityData, fullName: e.target.value })}
                        className="flex-1 border border-gray-200 p-3 text-sm outline-none focus:border-gray-400"
                      />
                      <input
                        type="text"
                        placeholder="Phone Number"
                        value={identityData.phone}
                        onChange={e => setIdentityData({ ...identityData, phone: e.target.value })}
                        className="flex-1 border border-gray-200 p-3 text-sm outline-none focus:border-gray-400"
                      />
                    </div>
                    <div className="flex gap-3 mt-2">
                      <button className="flex-1 border border-gray-200 border-dashed py-4 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors text-xs">
                        <Camera className="w-5 h-5 mb-1" />
                        Take Photo
                      </button>
                      <label className="flex-1 border border-gray-200 border-dashed py-4 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors text-xs cursor-pointer">
                        <Upload className={`w-5 h-5 mb-1 ${identityData.documentFile ? 'text-green-500' : ''}`} />
                        {identityData.documentFile ? identityData.documentFile.name : 'Upload Document'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setIdentityData({ ...identityData, documentFile: e.target.files[0] });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">4. Payment Information</h4>
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded text-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Parking Fee:</span>
                      <span className="font-bold">Automated on checkout</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Lost Ticket Fine (VND):</span>
                      <input
                        type="number"
                        value={resolveCharge}
                        onChange={e => setResolveCharge(e.target.value)}
                        placeholder="e.g. 50000"
                        className="border border-gray-200 p-1 w-32 text-right outline-none focus:border-gray-400"
                      />
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <span className="text-gray-500 block mb-2">Payment Method:</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIdentityData({ ...identityData, paymentMethod: 'cash' })}
                          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded ${identityData.paymentMethod === 'cash' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                        >
                          Cash
                        </button>
                        <button
                          onClick={() => setIdentityData({ ...identityData, paymentMethod: 'qr' })}
                          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded ${identityData.paymentMethod === 'qr' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                        >
                          QR Transfer
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-4 bg-gray-50">
              <button
                onClick={() => { setResolveModal({ isOpen: false, incident: null }); setFoundSession(null); }}
                className="flex-1 bg-white border border-gray-200 text-gray-700 py-4 text-sm font-bold hover:bg-gray-100 transition-colors uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLostTicket}
                disabled={isResolving}
                className="flex-1 bg-green-600 text-white py-4 text-sm font-bold flex items-center justify-center hover:bg-green-700 transition-colors uppercase tracking-wider disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                {isResolving ? 'Processing...' : 'Confirm Payment & Release'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Default Resolution Modal for other exception types
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Resolve Exception</h3>
            <button onClick={() => setResolveModal({ isOpen: false, incident: null })} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">Resolution Note</label>
              <textarea
                value={resolveDescription}
                onChange={(e) => setResolveDescription(e.target.value)}
                className="w-full border border-gray-200 p-3 text-sm outline-none focus:border-gray-400"
                rows={3}
                placeholder="How was this resolved?"
              ></textarea>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">Extra Charge (VND) - Optional</label>
              <input
                type="number"
                value={resolveCharge}
                onChange={(e) => setResolveCharge(e.target.value)}
                className="w-full border border-gray-200 p-3 text-sm outline-none focus:border-gray-400"
                placeholder="0"
              />
            </div>
            <button
              onClick={handleResolve}
              disabled={isResolving}
              className="w-full bg-black text-white py-4 text-sm font-bold flex items-center justify-center hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              {isResolving ? 'Resolving...' : 'Confirm Resolution'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderViewModal = () => {
    if (!viewModal.isOpen || !viewModal.incident) return null;
    const inc = viewModal.incident;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
            <h3 className="text-lg font-bold text-gray-900">Incident Details</h3>
            <button onClick={() => setViewModal({ isOpen: false, incident: null })} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 grid grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">General Info</h4>
                <div className="border border-gray-100 rounded-lg p-4 space-y-4 shadow-sm bg-white">
                  <div>
                    <p className="text-[10px] uppercase text-gray-400 font-bold">Reference ID</p>
                    <p className="font-bold text-gray-900">{inc.incidentCode}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-400 font-bold">Type</p>
                    <p className="font-semibold text-gray-800 capitalize">{inc.type?.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-400 font-bold">Reported At</p>
                    <p className="text-gray-800 text-sm">{new Date(inc.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="pt-2 border-t border-gray-50">
                    <p className="text-[10px] uppercase text-gray-400 font-bold">Title</p>
                    <p className="font-bold text-gray-900">{inc.title}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Description</p>
                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 whitespace-pre-wrap">{inc.description}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {inc.status === 'resolved' && inc.resolution && (
                <div>
                  <h4 className="text-xs font-bold text-green-500 uppercase tracking-widest mb-3">Resolution Details</h4>
                  <div className="border border-green-100 rounded-lg p-4 space-y-4 shadow-sm bg-green-50">
                    <div>
                      <p className="text-[10px] uppercase text-green-600 font-bold">Resolved At</p>
                      <p className="font-bold text-green-900">{inc.resolution.resolvedAt ? new Date(inc.resolution.resolvedAt).toLocaleString() : new Date(inc.updatedAt).toLocaleString()}</p>
                    </div>
                    {inc.resolution.extraCharge > 0 && (
                      <div>
                        <p className="text-[10px] uppercase text-green-600 font-bold">Extra Charge</p>
                        <p className="font-bold text-green-900">{inc.resolution.extraCharge.toLocaleString()} VND</p>
                      </div>
                    )}
                    <div className="pt-2 border-t border-green-200">
                      <p className="text-[10px] uppercase text-green-600 font-bold mb-1">Resolution Note</p>
                      <div className="bg-white p-3 rounded border border-green-100 text-sm text-green-900 whitespace-pre-wrap font-medium">{inc.resolution.description}</div>
                    </div>

                    {inc.images && inc.images.length > 0 && (
                      <div className="pt-2 border-t border-green-200">
                        <p className="text-[10px] uppercase text-green-600 font-bold mb-2">Uploaded Document</p>
                        <div className="rounded overflow-hidden border border-green-200">
                          <img src={inc.images[0].url} alt="Document" className="w-full h-auto" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <button
              onClick={() => setViewModal({ isOpen: false, incident: null })}
              className="w-full bg-white border border-gray-200 text-gray-700 py-3 text-sm font-bold hover:bg-gray-100 transition-colors uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 relative">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 px-6 py-4 rounded shadow-xl z-[100] flex items-center animate-[fade-in-up_0.3s_ease-out] border ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
          <p className="text-sm font-bold">{notification.message}</p>
        </div>
      )}

      {/* Render the appropriate Modals */}
      {renderResolveModal()}
      {renderViewModal()}

      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">ParkingOps</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Staff Suite</p>
          </div>

          <nav className="mt-6 flex flex-col space-y-1">
            <Link to="/staff" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
              <LogIn className="w-5 h-5 mr-3 text-gray-400" />
              Entry
            </Link>
            <Link to="/staff/exit" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
              <LogOut className="w-5 h-5 mr-3 text-gray-400" />
              Exit
            </Link>
            <Link to="/staff/live-view" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
              <Eye className="w-5 h-5 mr-3 text-gray-400" />
              Live View
            </Link>
            <Link to="/staff/manage-slots" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
              <LayoutGrid className="w-5 h-5 mr-3 text-gray-400" />
              Manage Slots
            </Link>
            <Link to="/staff/exceptions" className="flex items-center px-6 py-3 bg-gray-50 border-r-4 border-gray-900 text-gray-900 font-medium w-full text-left">
              <AlertTriangle className="w-5 h-5 mr-3 text-gray-700" />
              Exceptions
            </Link>
            {profile?.role !== 'parking_manager' && (
              <Link to="/staff/profile" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
                <User className="w-5 h-5 mr-3 text-gray-400" />
                My Profile
              </Link>
            )}
            {profile?.role === 'parking_manager' && (
              <Link to="/admin/staff-assignment" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
                <Users className="w-5 h-5 mr-3 text-gray-400" />
                Staff Assignment
              </Link>
            )}
          </nav>
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white mr-3 shrink-0 overflow-hidden">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
              ) : (
                <User size={20} />
              )}
            </div>
            <div className="overflow-hidden pr-2">
              <p className="text-sm font-semibold text-gray-900 truncate" title={profile?.fullName}>{profile?.fullName || 'Loading...'}</p>
              <p className="text-[10px] text-gray-500 uppercase truncate">{profile?.role ? profile.role.replace('_', ' ') : 'Staff'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-md transition-colors shrink-0"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold text-gray-900 mr-6">{buildingName}</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <User className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-[1200px] mx-auto">
            {/* Page Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Exceptions & Overrides</h1>
                <p className="text-gray-500 text-sm mt-1">Manage manual lot overrides and active security alerts.</p>
              </div>
              <button onClick={fetchIncidents} className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-900 transition-colors shadow-md">
                Sync Data
              </button>
            </div>

            <div className="flex gap-8 mb-8">
              {/* Left Column (Report Form) */}
              <div className="w-[450px] shrink-0">
                <section>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Report New Exception</h3>
                  <div className="bg-white border border-gray-200 p-6 shadow-sm flex flex-col space-y-4">

                    <div className="flex gap-4 mb-2">
                      <button
                        onClick={() => setReportData({ ...reportData, type: 'lost_ticket', title: 'Lost Ticket' })}
                        className={`flex-1 flex flex-col items-center justify-center py-4 border ${reportData.type === 'lost_ticket' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                      >
                        <Ticket className={`w-6 h-6 mb-2 ${reportData.type === 'lost_ticket' ? 'text-blue-500' : 'text-gray-400'}`} />
                        <span className="text-sm font-medium">Lost Ticket</span>
                      </button>
                      <button
                        onClick={() => setReportData({ ...reportData, type: 'wrong_license_plate', title: 'LPR Mismatch' })}
                        className={`flex-1 flex flex-col items-center justify-center py-4 border ${reportData.type === 'wrong_license_plate' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                      >
                        <AlertTriangle className={`w-6 h-6 mb-2 ${reportData.type === 'wrong_license_plate' ? 'text-orange-500' : 'text-gray-400'}`} />
                        <span className="text-sm font-medium">Mismatch</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2">Exception Type</label>
                      <div className="relative">
                        <select
                          value={reportData.type}
                          onChange={(e) => setReportData({ ...reportData, type: e.target.value })}
                          className="w-full appearance-none border border-gray-200 p-3 text-gray-900 text-sm outline-none focus:border-gray-400 transition-colors bg-white pr-10"
                        >
                          {INCIDENT_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2">Title</label>
                      <input
                        type="text"
                        value={reportData.title}
                        onChange={(e) => setReportData({ ...reportData, title: e.target.value })}
                        className="w-full border border-gray-200 p-3 text-gray-900 text-sm outline-none focus:border-gray-400 transition-colors"
                        placeholder="e.g. Plate unmatched at exit"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2">Details / Plate Info</label>
                      <textarea
                        value={reportData.description}
                        onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                        className="w-full border border-gray-200 p-3 text-gray-900 text-sm outline-none focus:border-gray-400 transition-colors"
                        rows={3}
                        placeholder="Provide details..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2">Severity</label>
                      <div className="flex gap-2">
                        {(['low', 'medium', 'high', 'critical'] as const).map(sev => (
                          <button
                            key={sev}
                            onClick={() => setReportData({ ...reportData, severity: sev })}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded ${reportData.severity === sev ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                          >
                            {sev}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleSubmitReport}
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 text-white py-4 text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm uppercase tracking-wider mt-2 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Manual Override'}
                    </button>

                  </div>
                </section>
              </div>

              {/* Right Column (Lot Topology - kept visual from mockup) */}
              <div className="flex-1">
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Lot Topology: Zone A</h3>
                    <div className="flex items-center space-x-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-gray-300 mr-2"></span>
                        Occupied
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                        Exception
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 p-8 shadow-sm h-[400px] flex flex-col justify-center">
                    {/* Top Row */}
                    <div className="flex justify-between items-end border-b border-gray-200 pb-8 mb-8 relative">
                      <div className="w-12 h-16 border border-gray-200 flex items-start justify-center pt-2 text-[10px] text-gray-400">A1</div>
                      <div className="w-12 h-16 border border-gray-200 bg-gray-200 flex items-start justify-center pt-2 text-[10px] text-gray-400">A2</div>
                      <div className="w-12 h-16 border border-gray-200 flex items-start justify-center pt-2 text-[10px] text-gray-400">A3</div>
                      <div className="w-14 h-20 border-2 border-red-500 bg-red-50 flex items-start justify-center pt-2 text-[10px] text-red-600 font-bold">EX</div>
                      <div className="w-12 h-16 border border-gray-200 bg-gray-200 flex items-start justify-center pt-2 text-[10px] text-gray-400">A5</div>
                      <div className="w-12 h-16 border border-gray-200 flex items-start justify-center pt-2 text-[10px] text-gray-400">A6</div>
                      <div className="w-12 h-16 border border-gray-200 flex items-start justify-center pt-2 text-[10px] text-gray-400">A7</div>
                      <div className="w-12 h-16 border border-gray-200 flex items-start justify-center pt-2 text-[10px] text-gray-400">A8</div>
                      <div className="absolute left-0 right-0 -bottom-4 border-b-2 border-dashed border-gray-300"></div>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-16 border border-gray-200 flex items-end justify-center pb-2 text-[10px] text-gray-400">A9</div>
                      <div className="w-12 h-16 border border-gray-200 bg-gray-200 flex items-end justify-center pb-2 text-[10px] text-gray-400">A10</div>
                      <div className="w-14 h-20 border-2 border-gray-800 bg-black flex items-end justify-center pb-2 text-[10px] text-white">A11</div>
                      <div className="w-12 h-16 border border-gray-200 flex items-end justify-center pb-2 text-[10px] text-gray-400">A12</div>
                      <div className="w-12 h-16 border border-gray-200 bg-gray-200 flex items-end justify-center pb-2 text-[10px] text-gray-400">A13</div>
                      <div className="w-12 h-16 border border-gray-200 bg-gray-200 flex items-end justify-center pb-2 text-[10px] text-gray-400">A14</div>
                      <div className="w-12 h-16 border border-gray-200 bg-gray-200 flex items-end justify-center pb-2 text-[10px] text-gray-400">A15</div>
                      <div className="w-12 h-16 border border-gray-200 flex items-end justify-center pb-2 text-[10px] text-gray-400">A16</div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Bottom Section (Log Table) */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Exception Log</h3>
                <div className="text-xs text-gray-500 flex items-center">
                  Filter by Status:
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="ml-2 font-bold text-gray-700 bg-transparent outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>
              <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider font-bold border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 font-bold">Timestamp</th>
                      <th className="px-6 py-4 font-bold">Reference ID</th>
                      <th className="px-6 py-4 font-bold">Exception Type</th>
                      <th className="px-6 py-4 font-bold">Title / Details</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading exceptions...</td>
                      </tr>
                    ) : incidents.length > 0 ? (
                      incidents.map((inc) => (
                        <tr key={inc._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">{new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                          <td className="px-6 py-4 font-medium text-gray-900">{inc.incidentCode}</td>
                          <td className="px-6 py-4 capitalize">{inc.type.replace(/_/g, ' ')}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{inc.title}</div>
                            <div className="text-xs text-gray-500 line-clamp-1">{inc.description}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${inc.status === 'open' ? 'bg-orange-100 text-orange-700' :
                              inc.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                              {inc.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {inc.status !== 'resolved' && inc.status !== 'closed' ? (
                              <button
                                onClick={() => setResolveModal({ isOpen: true, incident: inc })}
                                className="text-xs font-bold text-blue-600 uppercase tracking-wider hover:text-blue-800 transition-colors"
                              >
                                {inc.type === 'lost_ticket' ? 'Process Lost Ticket' : 'Resolve'}
                              </button>
                            ) : (
                              <button
                                onClick={() => setViewModal({ isOpen: true, incident: inc })}
                                className="text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors flex items-center justify-end w-full"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View Details
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No exceptions found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
};

export default StaffExceptionsPage;
