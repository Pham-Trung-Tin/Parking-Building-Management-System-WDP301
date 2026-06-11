import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LogIn,
  LogOut,
  Eye,
  AlertTriangle,
  Bell,
  User,
  RefreshCw,
  CarFront,
  Truck,
  Bike,
  Car,
  ArrowRight,
  Printer,
  ShieldAlert,
  Camera,
  CheckCircle,
  Search,
  VideoOff,
  Terminal,
  Zap,
  ShieldCheck,
  QrCode,
  Ticket,
  ScanLine
} from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import useProfile from '../../hooks/useProfile';

// Interface for mock booking data
interface BookingData {
  id: string;
  plate: string;
  customerName: string;
  spot: string;
  status: 'VALID' | 'INVALID';
}

const StaffPage = () => {
  const { profile } = useProfile();
  const navigate = useNavigate();

  // --- TAB TOGGLE ---
  const [entryMode, setEntryMode] = useState<'standard' | 'booking'>('booking');

  // ==========================================
  // STATES FOR STANDARD ENTRY (WALK-IN)
  // ==========================================
  const [selectedVehicle, setSelectedVehicle] = useState('car');
  const [plate, setPlate] = useState('ABC-1234');
  const [confidence, setConfidence] = useState<number | null>(98);
  const [isScanningStandard, setIsScanningStandard] = useState(false);
  const [isManualStandard, setIsManualStandard] = useState(false);
  const [gateStatus, setGateStatus] = useState('Closed');
  const [notification, setNotification] = useState<{ show: boolean, message: string, type: 'success' | 'info' | 'error' } | null>(null);

  // ==========================================
  // STATES FOR BOOKING ENTRY (QR SCAN)
  // ==========================================
  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessingQR, setIsProcessingQR] = useState<boolean>(false);
  const [isLoadingQR, setIsLoadingQR] = useState<boolean>(false);
  const [manualInputQR, setManualInputQR] = useState<string>('');
  const [modalData, setModalData] = useState<BookingData | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [toastMessageQR, setToastMessageQR] = useState<string | null>(null);

  // --- COMMON LOGIC ---
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ==========================================
  // LOGIC FOR STANDARD ENTRY
  // ==========================================
  const handleRescanStandard = () => {
    setIsScanningStandard(true);
    setPlate('');
    setConfidence(null);
    setTimeout(() => {
      const randomPlates = ['XYZ-9876', 'LMN-4567', 'DEF-1122', 'GHI-5542'];
      setPlate(randomPlates[Math.floor(Math.random() * randomPlates.length)]);
      setConfidence(Math.floor(Math.random() * 15) + 85);
      setIsScanningStandard(false);
      setIsManualStandard(false);
      showNotification('Plate scanned successfully', 'success');
    }, 1500);
  };

  const handleCreateSessionStandard = () => {
    if (!plate || isScanningStandard) {
      showNotification('Please wait for scan or enter a valid license plate', 'error');
      return;
    }
    showNotification(`Session created for ${plate} (${selectedVehicle.toUpperCase()}). Opening gate...`, 'success');
    setGateStatus('Open');

    setTimeout(() => {
      setPlate('');
      setConfidence(null);
      setGateStatus('Closed');
      setSelectedVehicle('car');
      showNotification('Gate closed. Ready for next vehicle.', 'info');
    }, 4000);
  };

  const handlePrintTicket = () => {
    showNotification('Printing physical ticket...', 'info');
  };

  const handleManualOverride = () => {
    setGateStatus('Open');
    showNotification('Emergency override engaged. Gate opened.', 'info');
    setTimeout(() => {
      setGateStatus('Closed');
      showNotification('Gate closed.', 'info');
    }, 5000);
  };

  const vehicleTypes = [
    { id: 'car', label: 'CAR', icon: Car },
    { id: 'suv', label: 'SUV', icon: CarFront },
    { id: 'motorcycle', label: 'MOTORCYCLE', icon: Bike },
    { id: 'truck', label: 'TRUCK', icon: Truck },
  ];


  // ==========================================
  // LOGIC FOR BOOKING QR ENTRY
  // ==========================================
  const playBeep = () => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 800;
      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.1);
    } catch (e) {
      console.warn('Browser does not support AudioContext');
    }
  };

  const processQRCode = (code: string) => {
    if (isProcessingQR) return;

    setIsProcessingQR(true);
    playBeep();

    setIsLoadingQR(true);
    setTimeout(() => {
      setIsLoadingQR(false);
      const mockResult: BookingData = {
        id: code.toUpperCase(),
        plate: '30A-123.45',
        customerName: 'John Doe',
        spot: 'Zone B - Spot 05',
        status: 'VALID'
      };
      setModalData(mockResult);
      setShowModal(true);
    }, 1000);
  };

  const handleManualCheckQR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInputQR.trim()) return;
    processQRCode(manualInputQR.trim());
    setManualInputQR('');
  };

  const handleScanQR = (detectedCodes: any) => {
    if (isProcessingQR) return;
    let qrValue = "";
    if (Array.isArray(detectedCodes) && detectedCodes.length > 0) {
      qrValue = detectedCodes[0].rawValue;
    } else if (detectedCodes && detectedCodes.text) {
      qrValue = detectedCodes.text;
    } else if (typeof detectedCodes === 'string') {
      qrValue = detectedCodes;
    }

    if (qrValue) {
      processQRCode(qrValue);
    }
  };

  const handleErrorQR = (error: unknown) => {
    console.error(error);
    setCameraActive(false);
    setCameraError('Cannot access Camera. Please grant permission in browser settings.');
  };

  const handleConfirmCheckInQR = () => {
    setToastMessageQR(`Check-in successful! Direct vehicle ${modalData?.plate} to ${modalData?.spot}!`);
    setShowModal(false);
    setModalData(null);

    setTimeout(() => {
      setToastMessageQR(null);
      setIsProcessingQR(false);
    }, 3000);
  };

  const handleCancelCheckInQR = () => {
    setShowModal(false);
    setModalData(null);
    setIsProcessingQR(false);
  };


  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 relative overflow-hidden">

      {/* --- NOTIFICATION TOAST FOR STANDARD ENTRY --- */}
      {notification && (
        <div className={`fixed top-6 right-6 px-6 py-4 rounded shadow-xl z-50 flex items-center animate-[fade-in-up_0.3s_ease-out] border ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
          {notification.type === 'success' && <div className="w-2 h-2 rounded-full bg-green-500 mr-3 animate-pulse" />}
          {notification.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />}
          {notification.type === 'info' && <div className="w-2 h-2 rounded-full bg-blue-500 mr-3 animate-pulse" />}
          <p className="text-sm font-bold">{notification.message}</p>
        </div>
      )}

      {/* --- SUCCESS TOAST FOR BOOKING QR --- */}
      {toastMessageQR && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[60] bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-[0_10px_40px_-10px_rgba(16,185,129,0.5)] flex items-center gap-3 animate-in fade-in slide-in-from-top-5 duration-300">
          <CheckCircle className="w-7 h-7" />
          <span className="font-semibold text-lg">{toastMessageQR}</span>
        </div>
      )}

      {/* --- SIDEBAR --- */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 z-20">
        <div>
          <div className="p-6">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">ParkingOps</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Staff Suite</p>
          </div>

          <nav className="mt-6 flex flex-col space-y-1">
            <Link to="/staff" className="flex items-center px-6 py-3 bg-gray-50 border-r-4 border-gray-900 text-gray-900 font-medium w-full text-left">
              <LogIn className="w-5 h-5 mr-3 text-gray-700" />
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
            <Link to="/staff/exceptions" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
              <AlertTriangle className="w-5 h-5 mr-3 text-gray-400" />
              Exceptions
            </Link>
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

      {/* --- MAIN CONTENT DYNAMIC AREA --- */}
      <div className="flex-1 flex flex-col overflow-hidden transition-colors duration-300 bg-gray-50 text-gray-800">

        {/* BOOTH HEADER */}
        <header className="border-b border-gray-200 bg-white p-5 px-8 flex justify-between items-center shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl border bg-gray-100 border-gray-200 text-gray-600">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-wide text-gray-900">ENTRY GATE 01</h1>
              <div className="flex items-center mt-0.5 gap-2">
                <span className="text-sm font-medium text-gray-500">Parking Control System</span>
                {entryMode === 'standard' && (
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded uppercase tracking-wider border border-green-200 ml-2">Active</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* ENTRY MODE TOGGLE TABS */}
            <div className="flex p-1 rounded-xl shadow-inner bg-gray-100 border border-gray-200">
              <button
                onClick={() => setEntryMode('standard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${entryMode === 'standard'
                    ? 'bg-white text-gray-900 shadow border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <ScanLine className="w-4 h-4" />
                Walk-in
              </button>
              <button
                onClick={() => setEntryMode('booking')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${entryMode === 'booking'
                    ? 'bg-white text-gray-900 shadow border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <QrCode className="w-4 h-4" />
                Pre-booked
              </button>
            </div>
          </div>
        </header>

        {/* CONTENT --- STANDARD ENTRY --- */}
        {entryMode === 'standard' && (
          <main className="flex-1 overflow-auto p-8 fade-in animate-in duration-300">
            <div className="max-w-6xl mx-auto flex gap-8">
              {/* Left Column (Forms & Actions) */}
              <div className="flex-1 flex flex-col space-y-8">

                {/* License Plate Section */}
                <section>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                    Automatic Plate Recognition
                    {!isScanningStandard && (
                      <button
                        onClick={() => setIsManualStandard(!isManualStandard)}
                        className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider transition-colors ${isManualStandard ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                      >
                        {isManualStandard ? 'Disable Manual' : 'Manual Override'}
                      </button>
                    )}
                  </h3>
                  <div className={`bg-white border p-8 flex items-center justify-center min-h-[160px] shadow-sm relative transition-colors rounded-xl ${isManualStandard ? 'border-blue-400 ring-1 ring-blue-400' : 'border-gray-200'}`}>
                    {isScanningStandard ? (
                      <div className="flex flex-col items-center text-gray-400">
                        <RefreshCw className="w-10 h-10 mb-4 animate-spin text-gray-300" />
                        <span className="text-xl font-bold tracking-widest uppercase animate-pulse">Scanning...</span>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={plate}
                        onChange={(e) => setPlate(e.target.value.toUpperCase())}
                        readOnly={!isManualStandard}
                        className={`w-full text-center text-6xl font-light tracking-wider outline-none uppercase bg-transparent ${isManualStandard ? 'text-gray-900 placeholder-gray-300' : 'text-gray-700 select-none'}`}
                        placeholder={isManualStandard ? 'ENTER PLATE' : ''}
                      />
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-3 h-6">
                    <span className="text-sm text-gray-500">
                      {isScanningStandard ? 'Processing image feed...' : confidence ? `Confidence: ${confidence}%` : 'Waiting for vehicle...'}
                    </span>
                    <button
                      onClick={handleRescanStandard}
                      disabled={isScanningStandard}
                      className="flex items-center text-sm font-bold text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isScanningStandard ? 'animate-spin' : ''}`} />
                      RE-SCAN
                    </button>
                  </div>
                </section>

                {/* Vehicle Classification */}
                <section>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Vehicle Classification</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {vehicleTypes.map((type) => {
                      const Icon = type.icon;
                      const isSelected = selectedVehicle === type.id;
                      return (
                        <button
                          key={type.id}
                          onClick={() => setSelectedVehicle(type.id)}
                          className={`flex flex-col items-center justify-center p-6 border rounded-xl transition-all ${isSelected
                              ? 'border-gray-900 shadow-md bg-white'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-400'
                            }`}
                        >
                          <Icon className={`w-8 h-8 mb-3 ${isSelected ? 'text-gray-900' : 'text-gray-400'}`} />
                          <span className={`text-xs font-bold tracking-wider ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                            {type.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </section>

                {/* Actions */}
                <section className="pt-4 flex flex-col space-y-4">
                  <button
                    onClick={handleCreateSessionStandard}
                    className="w-full bg-black text-white py-5 text-lg font-bold flex items-center justify-center hover:bg-gray-900 rounded-xl transition-colors shadow-lg group"
                  >
                    Create Session & Open Gate
                    <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <div className="flex gap-4">
                    <button
                      onClick={handlePrintTicket}
                      className="flex-1 bg-white border border-gray-200 rounded-xl py-4 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm uppercase tracking-wider flex items-center justify-center"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print Ticket
                    </button>
                    <button
                      onClick={handleManualOverride}
                      className="flex-1 bg-white border border-red-200 rounded-xl py-4 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors shadow-sm uppercase tracking-wider flex items-center justify-center"
                    >
                      <ShieldAlert className="w-4 h-4 mr-2" />
                      Emergency Override
                    </button>
                  </div>
                </section>

              </div>

              {/* Right Column (Status & Info) */}
              <div className="w-[380px] flex flex-col space-y-8">

                {/* Camera View Placeholder */}
                <section>
                  <div className="relative bg-gray-200 aspect-video rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                    <img
                      src="https://images.unsplash.com/photo-1621570273836-5b4d70908865?auto=format&fit=crop&q=80&w=600"
                      alt="Camera Feed"
                      className="w-full h-full object-cover grayscale opacity-80 mix-blend-multiply"
                    />
                    <div className="absolute top-3 left-3 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2 animate-pulse"></span>
                      LPR-CAM-01
                    </div>
                  </div>
                </section>

                {/* Parking Status Allocation */}
                <section>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Parking Status</h3>
                  <div className="flex flex-col space-y-3">
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">ZONE A: GROUND FLOOR</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Suitable for SUV/Trucks</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">42%</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Occupied</p>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between opacity-60">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">ZONE B: LEVEL 2</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Standard/Sedan Only</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">88%</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Occupied</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Infrastructure Status */}
                <section>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Device Status</h3>
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm text-gray-700">
                        <AlertTriangle className="w-4 h-4 mr-3 text-gray-400" />
                        Gate Barrier 01
                      </div>
                      <span className={`text-xs font-bold uppercase ${gateStatus === 'Open' ? 'text-green-600' : 'text-gray-500'}`}>
                        {gateStatus === 'Open' ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm text-gray-700">
                        <Printer className="w-4 h-4 mr-3 text-gray-400" />
                        Ticket Printer 01
                      </div>
                      <span className="text-xs font-bold text-green-600 uppercase">Ready</span>
                    </div>
                  </div>
                </section>

              </div>
            </div>
          </main>
        )}

        {/* CONTENT --- BOOKING QR --- */}
        {entryMode === 'booking' && (
          <main className="flex-1 overflow-auto p-6 lg:p-8 fade-in animate-in duration-300">
            <div className="flex flex-col xl:flex-row gap-8 max-w-[1400px] mx-auto w-full h-full">

              {/* LEFT: CAMERA AREA */}
              <div className="flex-[2] flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm relative min-h-[500px]">
                <div className="p-5 bg-white/90 backdrop-blur-md border-b border-gray-200 flex justify-between items-center z-10 absolute top-0 left-0 right-0">
                  <div className="flex items-center gap-3">
                    <Camera className="w-6 h-6 text-gray-900" />
                    <h2 className="font-bold text-gray-900 tracking-wide text-lg">PRE-BOOKED QR SCANNER</h2>
                  </div>
                </div>

                <div className="flex-1 relative bg-gray-100 flex items-center justify-center overflow-hidden">
                  {cameraError ? (
                    <div className="flex flex-col items-center text-red-500 p-8 text-center max-w-md mt-16">
                      <VideoOff className="w-20 h-20 mb-6 opacity-60" />
                      <p className="font-semibold text-xl leading-relaxed mb-6">{cameraError}</p>
                      <button
                        onClick={() => { setCameraError(null); setCameraActive(true); }}
                        className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-lg"
                      >
                        Reload Camera
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-full relative pt-16">
                      {/* Overlay Scanner Laser */}
                      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center mt-16">
                        <div className={`relative w-72 h-72 border-2 ${isProcessingQR ? 'border-yellow-500/50' : 'border-blue-500/40'} rounded-3xl overflow-hidden transition-colors duration-300`}>
                          <div className="absolute top-0 left-0 w-10 h-10 border-t-[5px] border-l-[5px] border-blue-500 rounded-tl-[1.3rem]"></div>
                          <div className="absolute top-0 right-0 w-10 h-10 border-t-[5px] border-r-[5px] border-blue-500 rounded-tr-[1.3rem]"></div>
                          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[5px] border-l-[5px] border-blue-500 rounded-bl-[1.3rem]"></div>
                          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[5px] border-r-[5px] border-blue-500 rounded-br-[1.3rem]"></div>

                          {!isProcessingQR && (
                            <div className="absolute w-full h-[2px] bg-blue-400 shadow-[0_0_15px_3px_rgba(59,130,246,0.6)] animate-[scan_2s_ease-in-out_infinite]"></div>
                          )}
                        </div>
                      </div>

                      {/* Loading Overlay */}
                      {isLoadingQR && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-in fade-in duration-200 pt-16">
                          <div className="w-16 h-16 border-[5px] border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-6"></div>
                          <p className="text-xl font-bold text-gray-900 tracking-widest animate-pulse">FETCHING DATA...</p>
                        </div>
                      )}

                      <Scanner
                        onScan={handleScanQR}
                        onError={handleErrorQR}

                        styles={{ container: { width: '100%', height: '100%' }, video: { objectFit: 'cover' } }}
                        paused={isProcessingQR}
                      />
                    </div>
                  )}
                </div>

                <div className={`p-4 text-center text-sm font-semibold tracking-wide border-t border-gray-200 transition-colors z-10 relative ${isProcessingQR ? 'bg-yellow-50 text-yellow-700' : 'bg-white text-gray-500'}`}>
                  {isProcessingQR ? 'CAMERA PAUSED (PROCESSING)' : 'PLEASE ASK CUSTOMER TO ALIGN QR IN FRAME'}
                </div>
              </div>

              {/* RIGHT: MANUAL ENTRY */}
              <div className="flex-1 xl:max-w-[420px] bg-white rounded-xl border border-gray-200 shadow-sm p-7 flex flex-col h-fit">
                <div className="flex items-center gap-3 mb-6 text-gray-900">
                  <Terminal className="w-6 h-6 text-gray-700" />
                  <h2 className="font-bold text-xl tracking-wide">MANUAL ENTRY</h2>
                </div>

                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 mb-8">
                  <p className="text-sm text-blue-800 leading-relaxed font-medium">
                    In case of QR scan failure, manually enter the <span className="font-bold uppercase">License Plate</span> or <span className="font-bold uppercase">Booking ID</span>.
                  </p>
                </div>

                <form onSubmit={handleManualCheckQR} className="flex flex-col gap-6 mt-auto">
                  <div>
                    <label htmlFor="manual-input" className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                      License Plate / Booking ID
                    </label>
                    <div className="relative group">
                      <input
                        id="manual-input"
                        type="text"
                        value={manualInputQR}
                        onChange={(e) => setManualInputQR(e.target.value)}
                        placeholder="EX: 30A-123.45"
                        className="w-full bg-white border-2 border-gray-200 rounded-xl px-5 py-4 pl-14 text-gray-900 placeholder-gray-400 font-bold text-lg focus:outline-none focus:border-gray-400 focus:ring-4 focus:ring-gray-100 transition-all uppercase"
                        disabled={isProcessingQR}
                      />
                      <Search className="absolute left-5 top-[18px] w-6 h-6 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessingQR || !manualInputQR.trim()}
                    className="w-full bg-black hover:bg-gray-900 active:bg-gray-800 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 text-lg tracking-wide"
                  >
                    {isLoadingQR ? (
                      <div className="w-6 h-6 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Zap className="w-6 h-6" />
                    )}
                    {isLoadingQR ? 'CHECKING...' : 'VALIDATE TICKET'}
                  </button>
                </form>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* --- MODAL POP-UP RESULT --- */}
      {showModal && modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-0">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={handleCancelCheckInQR}></div>

          <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-[0.97] fade-in duration-200">
            <div className="bg-emerald-50/50 p-8 border-b border-emerald-100 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-5 shadow-inner">
                <CheckCircle className="w-11 h-11 text-emerald-600" />
              </div>
              <div className="bg-emerald-100 text-emerald-700 px-5 py-2 rounded-full text-sm font-extrabold tracking-widest flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-[pulse_1.5s_ease-in-out_infinite]"></span>
                [VALID TICKET - ON TIME]
              </div>
              <p className="text-slate-500 font-medium">Booking ID: <span className="font-mono text-slate-800 font-bold">{modalData.id}</span></p>
            </div>

            <div className="p-8">
              <div className="bg-slate-100 rounded-2xl p-5 text-center mb-7 border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-sm mb-2 uppercase tracking-widest font-bold">Recognized License Plate</p>
                <h3 className="text-[2.5rem] font-black text-slate-800 tracking-wider">{modalData.plate}</h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <span className="text-slate-500 font-medium">Customer Name:</span>
                  <span className="font-extrabold text-slate-800 text-lg">{modalData.customerName}</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-slate-500 font-medium">Allocated Spot:</span>
                  <span className="font-extrabold text-blue-700 bg-blue-100 px-4 py-1.5 rounded-lg text-lg border border-blue-200">
                    {modalData.spot}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-8 pt-0 flex gap-4">
              <button
                onClick={handleCancelCheckInQR}
                className="flex-1 py-4 px-4 bg-white hover:bg-red-50 text-red-600 font-bold rounded-2xl transition-colors border-2 border-red-200 hover:border-red-300 text-sm tracking-wide uppercase"
              >
                CANCEL / INVALID
              </button>
              <button
                onClick={handleConfirmCheckInQR}
                className="flex-[1.5] py-4 px-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98] text-base tracking-wide uppercase"
              >
                CONFIRM ENTRY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inject Keyframes */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
};

export default StaffPage;
