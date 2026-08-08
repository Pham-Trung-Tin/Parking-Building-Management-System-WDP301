import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LogIn,
  LogOut,
  Eye,
  AlertTriangle,
  Bell,
  User,
  Users,
  Search,
  CheckCircle2,
  RefreshCw,
  VideoOff,
  Camera,
  LayoutGrid,
  Calendar
} from 'lucide-react';
import useProfile from '../../hooks/useProfile';
import lprService from '../../services/api/lprService';
import parkingSessionService from '../../services/api/parkingSessionService';
import { useSocket } from '../../contexts/SocketContext';
import { useCallback } from 'react';
import { verifyQRToken } from '../../utils/qrToken';
import { Scanner } from '@yudiel/react-qr-scanner';
import bookingService from '../../services/api/bookingService';
import paymentService from '../../services/api/paymentService';
import monthlyPassService from '../../services/api/monthlyPassService';

const StaffExitPage = () => {
  const { profile } = useProfile();
  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);
  const navigate = useNavigate();
  const { socket } = useSocket();

  // FE Flow States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [sessionFound, setSessionFound] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [isManual, setIsManual] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ show: boolean, message: string, type: 'success' | 'info' | 'error' } | null>(null);

  const [isExitCamActive, setIsExitCamActive] = useState(true);
  const [camMode, setCamMode] = useState<'lpr' | 'qr'>('lpr');
  const [isProcessingQR, setIsProcessingQR] = useState(false);
  const videoRefExit = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [checkoutQrUrl, setCheckoutQrUrl] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [showLargeQr, setShowLargeQr] = useState(false);

  const buildingName = (profile?.assignedParkingLot as any)?.name || 'Main Street Garage';

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isExitCamActive && camMode === 'lpr') {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          stream = s;
          if (videoRefExit.current) {
            videoRefExit.current.srcObject = s;
          }
        })
        .catch(err => console.error("Camera access denied:", err));
    } else {
      if (videoRefExit.current && videoRefExit.current.srcObject) {
        const s = videoRefExit.current.srcObject as MediaStream;
        s.getTracks().forEach(t => t.stop());
        videoRefExit.current.srcObject = null;
      }
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [isExitCamActive, camMode]);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Validate that a retrieved session belongs to this staff's parking lot.
  // Throws a user-friendly error if lot doesn't match — prevents cross-lot checkout.
  const validateSessionLot = (sessionData: any) => {
    if (!sessionData) throw new Error('Session not found.');
    const currentProfile = profileRef.current;
    const lotId = Array.isArray(currentProfile?.assignedParkingLot)
      ? currentProfile?.assignedParkingLot[0]?._id
      : (currentProfile?.assignedParkingLot as any)?._id || (currentProfile?.assignedParkingLot as any);
    if (!lotId) return; // No lot assigned → skip (admin edge case)
    const sessionLotId = typeof sessionData.parkingLot === 'object'
      ? sessionData.parkingLot?._id
      : sessionData.parkingLot;
    if (sessionLotId && String(sessionLotId) !== String(lotId)) {
      throw new Error('This session belongs to a different parking lot. Cannot check out here.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleRescan = useCallback(async () => {
    const video = videoRefExit.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !isExitCamActive) {
      showNotification('Camera is not active. Please turn on camera first.', 'error');
      return;
    }

    if (video.readyState < 2 || video.videoWidth === 0) {
      showNotification('Camera not ready yet. Please wait...', 'error');
      return;
    }

    setIsSearching(true);
    setSearchQuery('');
    setConfidence(null);
    setSessionFound(false);

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context failed');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageBase64 = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImageBase64(imageBase64);
      const response = await lprService.recognizeFromBase64(imageBase64);
      const data = response.data;

      if (data && data.licensePlate && data.licensePlate !== 'UNRECOGNIZED') {
        setSearchQuery(data.licensePlate);
        setConfidence(data.confidence);
        setIsManual(false);

        try {
          const currentProfile = profileRef.current;
          const lotId = Array.isArray(currentProfile?.assignedParkingLot) ? currentProfile?.assignedParkingLot[0]?._id : (currentProfile?.assignedParkingLot as any)?._id || currentProfile?.assignedParkingLot;
          const sessionRes = await parkingSessionService.findActive({
            licensePlate: data.licensePlate,
            parkingLotId: lotId
          });
          if (sessionRes.data) {
            setActiveSession(sessionRes.data);
            setSessionFound(true);
            showNotification(`Session found for ${data.licensePlate} (${data.confidence}% confidence)`, 'success');
          }
        } catch (sessionErr: any) {
          setActiveSession(null);
          setSessionFound(false);
          showNotification(sessionErr?.message || `No active session found for ${data.licensePlate}.`, 'error');
        }
      } else {
        showNotification(
          'Could not recognize plate. Try repositioning the vehicle or use Manual Override.',
          'error'
        );
      }
    } catch (err: any) {
      console.error('LPR Error:', err);
      showNotification(
        err?.message || 'AI recognition failed. Please enter plate manually.',
        'error'
      );
    } finally {
      setIsSearching(false);
    }
  }, [isExitCamActive, profile]);
  // Estimated Fee Calculation — Block-based pricing (4h blocks)
  const estimatedFees = useMemo(() => {
    if (!activeSession) return { baseFee: 0, overtimeFee: 0, totalFee: 0, logs: [] };

    // Vé tháng thì không tính phí checkout
    if (activeSession.monthlyPass) {
      return {
        baseFee: 0, overtimeFee: 0, totalFee: 0,
        logs: [{ time: new Date(activeSession.entryTime), message: 'Monthly Pass - No Fee', amount: 0 }]
      };
    }

    if (!activeSession.entryTime || !activeSession.vehicleType?.pricing) {
      return {
        baseFee: activeSession.baseFee || 0,
        overtimeFee: activeSession.overtimeFee || 0,
        totalFee: activeSession.totalFee || 0,
        logs: []
      };
    }

    const now = new Date();
    const entryTime = new Date(activeSession.entryTime);
    const pricing = activeSession.vehicleType.pricing;
    const dayBlockRate = pricing.dayBlockRate || 0;
    const nightBlockRate = pricing.nightBlockRate || dayBlockRate * 1.5;
    const BLOCK_MS = 4 * 60 * 60 * 1000;

    const logs: any[] = [];

    // Helper: count blocks between two dates using same logic as BE calculateParkingFee
    const countBlockFee = (start: Date, end: Date, labelPrefix: string): number => {
      if (end <= start) return 0;
      let fee = 0;
      let cur = new Date(start);
      let blockCount = 1;
      while (cur < end) {
        const blockEnd = new Date(Math.min(end.getTime(), cur.getTime() + BLOCK_MS));
        const effectiveEnd = new Date(blockEnd.getTime() - 1);

        const startHour = cur.getHours();
        const endHour = effectiveEnd.getHours();
        const isNightBlock = startHour >= 18 || startHour < 6 || endHour >= 18 || endHour < 6;

        const blockFee = isNightBlock ? nightBlockRate : dayBlockRate;
        fee += blockFee;

        logs.push({
          time: new Date(cur),
          message: `${labelPrefix} - Block ${blockCount} (${isNightBlock ? 'Night' : 'Day'})`,
          amount: blockFee
        });

        cur = new Date(cur.getTime() + BLOCK_MS);
        blockCount++;
      }
      return fee;
    };

    let baseFee = 0;
    let overtimeFee = 0;
    let earlyArrivalFee = 0;

    // Has Booking
    if (activeSession.booking?.endTime && activeSession.booking?.scheduledDate) {
      baseFee = activeSession.booking.estimatedFee || activeSession.baseFee || activeSession.advancePayment || 0;

      logs.push({
        time: entryTime,
        message: 'Pre-booked Base Fee',
        amount: baseFee
      });

      const dStr = activeSession.booking.scheduledDate;
      const [startH, startM] = activeSession.booking.startTime.split(':').map(Number);
      const scheduledStart = new Date(dStr);
      scheduledStart.setHours(startH, startM, 0, 0);

      const [endH, endM] = activeSession.booking.endTime.split(':').map(Number);
      const scheduledEnd = new Date(dStr);
      scheduledEnd.setHours(endH, endM, 0, 0);
      if (scheduledEnd < scheduledStart) {
        scheduledEnd.setDate(scheduledEnd.getDate() + 1);
      }

      // Early arrival logic: > 15 mins early gets charged extra blocks
      if (scheduledStart.getTime() - entryTime.getTime() > 15 * 60 * 1000) {
        earlyArrivalFee = countBlockFee(entryTime, scheduledStart, 'Early Arrival');
      }

      if (now > scheduledEnd) {
        const blockMs = 4 * 60 * 60 * 1000;
        const elapsedIntoBlock = (scheduledEnd.getTime() - scheduledStart.getTime()) % blockMs;
        const msToNextBoundary = elapsedIntoBlock === 0 ? 0 : (blockMs - elapsedIntoBlock);
        const nextBlockBoundary = new Date(scheduledEnd.getTime() + msToNextBoundary);

        if (now > nextBlockBoundary) {
          // Overtime: same block logic, no multiplier
          overtimeFee = countBlockFee(nextBlockBoundary, now, 'Overtime');
        }
      }
    } else {
      baseFee = countBlockFee(entryTime, now, 'Standard Parking');
    }

    const totalFee = baseFee + earlyArrivalFee + overtimeFee;
    const advancePayment = activeSession.advancePayment || 0;
    const balanceDue = Math.max(0, totalFee - advancePayment);

    if (advancePayment > 0) {
      logs.push({
        time: now,
        message: 'Advance Payment Deducted',
        amount: -advancePayment
      });
    }

    return { baseFee, earlyArrivalFee, overtimeFee, totalFee: balanceDue, logs };
  }, [activeSession]);

  useEffect(() => {
    if (sessionFound && activeSession && activeSession.paymentStatus !== 'paid' && estimatedFees.totalFee > 0) {
      const sessionId = activeSession._id || activeSession.id;
      setIsLoadingQr(true);
      paymentService.initiateBankTransfer(sessionId, estimatedFees.totalFee)
        .then((res: any) => {
          setCheckoutQrUrl(res.data?.qrUrl || res.qrUrl);
        })
        .catch(err => {
          console.error("Failed to fetch checkout QR", err);
          showNotification('Could not generate bank transfer QR.', 'error');
        })
        .finally(() => {
          setIsLoadingQr(false);
        });
    } else {
      setCheckoutQrUrl(null);
    }
  }, [sessionFound, activeSession, estimatedFees.totalFee]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isExitCamActive && videoRefExit.current) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRefExit.current) {
            videoRefExit.current.srcObject = stream;
          }
        })
        .catch(err => {
          showNotification('Failed to access camera', 'error');
          console.error(err);
        });

      // Simulate LPR scanning every 5 seconds
      interval = setInterval(() => {
        // In reality, this would send the frame to an LPR API
      }, 5000);
    } else if (videoRefExit.current && videoRefExit.current.srcObject) {
      const tracks = (videoRefExit.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRefExit.current.srcObject = null;
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isExitCamActive]);

  const handleManualSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      showNotification('Please enter a license plate or scan QR to search', 'error');
      return;
    }

    setIsSearching(true);
    setSessionFound(false);
    setActiveSession(null);

    try {
      const query = searchQuery.trim();
      const currentProfile = profileRef.current;
      const lotId = Array.isArray(currentProfile?.assignedParkingLot) ? currentProfile?.assignedParkingLot[0]?._id : (currentProfile?.assignedParkingLot as any)?._id || (currentProfile?.assignedParkingLot as any);

      let cleanQuery = query.trim();
      if (cleanQuery.startsWith('"') && cleanQuery.endsWith('"')) {
        cleanQuery = cleanQuery.substring(1, cleanQuery.length - 1);
      }

      // ── Ưu tiên 1: QR mới — plain prefix "co_<sessionId>" ─────────────────
      if (cleanQuery.startsWith('co_')) {
        const sessionId = cleanQuery.slice(3).trim();
        const sessionRes = await parkingSessionService.getById(sessionId);
        validateSessionLot(sessionRes.data); // ← ensure belongs to this lot
        if (sessionRes.data) {
          setActiveSession(sessionRes.data);
          setSessionFound(true);
          showNotification(`Session found from QR for plate: ${sessionRes.data.vehicleInfo?.licensePlate}`, 'success');
        } else {
          throw new Error('Session not found.');
        }
      } else if (cleanQuery.startsWith('MP:')) {
        // ── Ưu tiên 2: Monthly Pass QR ─────────────────
        const parts = cleanQuery.split(':');
        const passCode = parts[1];
        try {
          const verifyRes: any = await monthlyPassService.verifyPassByCode(passCode);
          const passData = verifyRes.data || verifyRes;

          // Validate the monthly pass belongs to this staff's parking lot
          const passLotId = typeof passData.parkingLot === 'object'
            ? passData.parkingLot?._id
            : passData.parkingLot;
          if (passLotId && lotId && String(passLotId) !== String(lotId)) {
            throw new Error('This monthly pass belongs to a different parking lot.');
          }

          const sessionRes = await parkingSessionService.findActive({ licensePlate: passData.licensePlate, parkingLotId: lotId });
          validateSessionLot(sessionRes.data); // extra defense if lotId was undefined
          if (sessionRes.data) {
            setActiveSession(sessionRes.data);
            setSessionFound(true);
            showNotification(`Session found from Monthly Pass QR for plate: ${sessionRes.data.vehicleInfo?.licensePlate}`, 'success');
          } else {
            throw new Error("Vehicle not checked in (session not found).");
          }
        } catch (err: any) {
          throw new Error(err?.message || 'Invalid or expired Monthly Pass.');
        }
      } else if ((cleanQuery.includes('.') && cleanQuery.length > 20) || cleanQuery.startsWith('{')) {
        // ── Ưu tiên 2: HMAC token cũ (dạng <base64>.<sig>) hoặc JSON ────────
        try {
          let payload: any;
          try {
            payload = await verifyQRToken(cleanQuery);
          } catch (tokenErr) {
            try {
              let cleanCode = cleanQuery.replace(/\\\"/g, '"').replace(/\\'/g, "'").trim();
              if (cleanCode.startsWith('"') && cleanCode.endsWith('"')) {
                cleanCode = cleanCode.substring(1, cleanCode.length - 1);
              }
              payload = JSON.parse(cleanCode);
              if (typeof payload === 'string') {
                payload = JSON.parse(payload);
              }
            } catch (jsonErr) {
              if (typeof query === 'string' && query.trim().length > 0) {
                if (query.includes('.') && query.length > 20) throw new Error('Invalid or expired Checkout QR Code.');
                payload = { id: query.trim() };
              } else {
                throw new Error('Unsupported QR format.');
              }
            }
          }

          if (payload.type === 'monthly_pass' || payload.passCode) {
            const sessionRes = await parkingSessionService.findActive({ licensePlate: payload.licensePlate, parkingLotId: lotId });
            if (sessionRes.data) {
              setActiveSession(sessionRes.data);
              setSessionFound(true);
              showNotification(`Session found from Monthly Pass QR for plate: ${sessionRes.data.vehicleInfo?.licensePlate}`, 'success');
            } else {
              throw new Error("Vehicle not checked in (session not found).");
            }
            return;
          }

          // Trường hợp QR chứa sessionCode
          if (payload.sessionCode && !payload.sessionId) {
            const sessionRes = await parkingSessionService.findActive({ sessionCode: payload.sessionCode, parkingLotId: lotId });
            if (sessionRes.data) {
              setActiveSession(sessionRes.data);
              setSessionFound(true);
              showNotification(`Session found from QR for plate: ${sessionRes.data.vehicleInfo?.licensePlate}`, 'success');
            } else {
              throw new Error("Session not found for this QR code.");
            }
            return;
          }

          let sessionId = payload.sessionId || payload.id;

          // If the QR code is a Check-in code (contains bookingId instead of sessionId)
          if (!payload.sessionId && (payload.bookingId || payload.id)) {
            try {
              const bookingRes = await bookingService.getById(payload.bookingId || payload.id);
              const booking = bookingRes.data || bookingRes;
              if (booking.parkingSession) {
                sessionId = typeof booking.parkingSession === 'string' ? booking.parkingSession : booking.parkingSession._id;
              } else {
                throw new Error("Vehicle not checked in (session not found).");
              }
            } catch (err: any) {
              throw new Error(err.message || "Could not find Booking info for this QR code.");
            }
          }

          if (sessionId) {
            const sessionRes = await parkingSessionService.getById(sessionId);
            validateSessionLot(sessionRes.data); // ← ensure belongs to this lot
            if (sessionRes.data) {
              setActiveSession(sessionRes.data);
              setSessionFound(true);
              showNotification(`Session found from QR for plate: ${sessionRes.data.vehicleInfo?.licensePlate}`, 'success');
            } else {
              throw new Error("Session not found.");
            }
          } else {
            throw new Error("QR code does not contain valid Checkout information.");
          }
        } catch (qrErr: any) {
          throw new Error(qrErr?.message || "Invalid or expired QR code.");
        }
      } else {
        // ── License plate or Session Code flow ────────────────────────────────
        const isSessionCode = query.toUpperCase().startsWith('PS-');
        const params: any = { parkingLotId: lotId };
        if (isSessionCode) {
          params.sessionCode = query;
        } else {
          params.licensePlate = query;
        }

        const sessionRes = await parkingSessionService.findActive(params);
        if (sessionRes.data) {
          setActiveSession(sessionRes.data);
          setSessionFound(true);
          showNotification(`Session found for: ${query.toUpperCase()}`, 'success');
        }
      }
    } catch (sessionErr: any) {
      setActiveSession(null);
      setSessionFound(false);
      showNotification(sessionErr?.message || `No active session found.`, 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleScanQR = async (detectedCodes: any) => {
    if (isProcessingQR) return;

    let qrValue = "";
    if (Array.isArray(detectedCodes) && detectedCodes.length > 0) {
      qrValue = detectedCodes[0].rawValue;
    } else if (detectedCodes && detectedCodes.text) {
      qrValue = detectedCodes.text;
    } else if (typeof detectedCodes === 'string') {
      qrValue = detectedCodes;
    }

    if (!qrValue) return;

    // Capture frame from QR scanner video element
    try {
      const videoEl = document.querySelector('video');
      if (videoEl && videoEl.readyState >= 2 && videoEl.videoWidth > 0) {
        const canvas = document.createElement('canvas');
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          setCapturedImageBase64(canvas.toDataURL('image/jpeg', 0.85));
        }
      }
    } catch (err) {
      console.warn('Failed to capture QR exit frame', err);
    }

    setIsProcessingQR(true);
    setSearchQuery('SCANNING QR...');

    try {
      let payload: any;

      let cleanQr = qrValue.trim();
      if (cleanQr.startsWith('"') && cleanQr.endsWith('"')) {
        cleanQr = cleanQr.substring(1, cleanQr.length - 1);
      }

      // ── Ưu tiên 1: QR mới — plain prefix "co_<sessionId>" ─────────────────
      if (cleanQr.startsWith('co_')) {
        const sessionId = cleanQr.slice(3).trim();
        const sessionRes = await parkingSessionService.getById(sessionId);
        validateSessionLot(sessionRes.data); // ← ensure belongs to this lot
        if (sessionRes.data) {
          setActiveSession(sessionRes.data);
          setSessionFound(true);
          setSearchQuery(sessionRes.data.vehicleInfo?.licensePlate || '');
          showNotification(`Session found from QR for plate: ${sessionRes.data.vehicleInfo?.licensePlate}`, 'success');
        } else {
          throw new Error('Session not found.');
        }
        setTimeout(() => setIsProcessingQR(false), 2000);
        return;
      }



      // ── Ưu tiên 2: Monthly Pass QR (Format: MP:passCode:lotId) ─────────────────
      if (cleanQr.startsWith('MP:')) {
        const parts = cleanQr.split(':');
        const passCode = parts[1];
        payload = { type: 'monthly_pass', passCode, licensePlate: '' };

        try {
          const verifyRes: any = await monthlyPassService.verifyPassByCode(passCode);
          const passData = verifyRes.data || verifyRes;
          payload.licensePlate = passData.licensePlate;
        } catch (err: any) {
          console.error("Error verifying Monthly Pass on Exit:", err);
          throw new Error('Invalid or expired Monthly Pass.');
        }
      } else {
        // ── Ưu tiên 3: HMAC token cũ (dạng <base64>.<sig>) ─────────────────
        try {
          payload = await verifyQRToken(cleanQr);
        } catch (tokenErr: any) {
          try {
            let cleanCode = cleanQr.replace(/\\\"/g, '"').replace(/\\'/g, "'").trim();
            if (cleanCode.startsWith('"') && cleanCode.endsWith('"')) {
              cleanCode = cleanCode.substring(1, cleanCode.length - 1);
            }
            payload = JSON.parse(cleanCode);
            if (typeof payload === 'string') {
              payload = JSON.parse(payload);
            }
          } catch (jsonErr) {
            if (typeof cleanQr === 'string' && cleanQr.trim().length > 0) {
              const trimmed = cleanQr.trim();
              // Nếu là sessionCode dạng PS-XXXXX → tìm qua findActive
              if (trimmed.toUpperCase().startsWith('PS-')) {
                payload = { sessionCode: trimmed, type: 'checkout' };
              } else if (trimmed.includes('.') && trimmed.length > 20) {
                throw new Error('Invalid or expired Checkout QR Code.');
              } else {
                // Giả định là MongoDB _id
                payload = { sessionId: trimmed, type: 'checkout' };
              }
            } else {
              throw new Error('Unsupported QR format.');
            }
          }
        }
      }

      if (payload.type === 'monthly_pass' || payload.passCode) {
        const currentProfile = profileRef.current;
        const lotId = Array.isArray(currentProfile?.assignedParkingLot) ? currentProfile?.assignedParkingLot[0]?._id : (currentProfile?.assignedParkingLot as any)?._id || (currentProfile?.assignedParkingLot as any);
        const sessionRes = await parkingSessionService.findActive({ licensePlate: payload.licensePlate, parkingLotId: lotId });
        validateSessionLot(sessionRes.data); // extra defense if lotId was undefined
        if (sessionRes.data) {
          setActiveSession(sessionRes.data);
          setSessionFound(true);
          setSearchQuery(sessionRes.data.vehicleInfo?.licensePlate || '');
          showNotification(`Session found from Monthly Pass QR for plate: ${sessionRes.data.vehicleInfo?.licensePlate}`, 'success');
        } else {
          throw new Error("Vehicle not checked in (session not found).");
        }
        setTimeout(() => setIsProcessingQR(false), 2000);
        return;
      }

      // Trường hợp QR chứa sessionCode thay vì sessionId
      if (payload.sessionCode && !payload.sessionId) {
        const currentProfile = profileRef.current;
        const lotId = Array.isArray(currentProfile?.assignedParkingLot) ? currentProfile?.assignedParkingLot[0]?._id : (currentProfile?.assignedParkingLot as any)?._id || (currentProfile?.assignedParkingLot as any);
        const sessionRes = await parkingSessionService.findActive({ sessionCode: payload.sessionCode, parkingLotId: lotId });
        if (sessionRes.data) {
          setActiveSession(sessionRes.data);
          setSessionFound(true);
          setSearchQuery(sessionRes.data.vehicleInfo?.licensePlate || '');
          showNotification(`Session found from QR for plate: ${sessionRes.data.vehicleInfo?.licensePlate}`, 'success');
        } else {
          throw new Error("Session not found for this QR code.");
        }
        setTimeout(() => setIsProcessingQR(false), 2000);
        return;
      }

      let sessionId = payload.sessionId || payload.id;

      // If the QR code is a Check-in code (contains bookingId instead of sessionId)
      if (!payload.sessionId && (payload.bookingId || payload.id)) {
        try {
          const bookingRes = await bookingService.getById(payload.bookingId || payload.id);
          const booking = bookingRes.data || bookingRes;
          if (booking.parkingSession) {
            sessionId = typeof booking.parkingSession === 'string' ? booking.parkingSession : booking.parkingSession._id;
          } else {
            throw new Error("Vehicle not checked in (session not found).");
          }
        } catch (err: any) {
          throw new Error(err.message || "Could not find Booking info for this QR code.");
        }
      }

      if (sessionId) {
        const sessionRes = await parkingSessionService.getById(sessionId);
        validateSessionLot(sessionRes.data); // ← ensure belongs to this lot
        if (sessionRes.data) {
          setActiveSession(sessionRes.data);
          setSessionFound(true);
          setSearchQuery(sessionRes.data.vehicleInfo?.licensePlate || '');
          showNotification(`Session found from QR for plate: ${sessionRes.data.vehicleInfo?.licensePlate}`, 'success');
        } else {
          throw new Error("Session not found.");
        }
      } else {
        throw new Error("QR code does not contain valid Checkout information.");
      }
    } catch (error: any) {
      setActiveSession(null);
      setSessionFound(false);
      setSearchQuery('');
      setCapturedImageBase64(null);
      showNotification(error?.message || "Invalid or expired QR code.", 'error');
      setTimeout(() => setIsProcessingQR(false), 3000);
      return;
    }

    setTimeout(() => setIsProcessingQR(false), 2000);
  };

  const handleProcessAndRelease = async () => {
    if (!sessionFound || !activeSession) return;
    try {
      const sessionId = activeSession._id || activeSession.id;
      if (!sessionId) {
        throw new Error('Invalid session data: Missing ID');
      }

      let imageToUpload = capturedImageBase64;
      if (!imageToUpload) {
        const video = videoRefExit.current;
        const canvas = canvasRef.current;
        if (video && canvas && isExitCamActive && video.readyState >= 2 && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            imageToUpload = canvas.toDataURL('image/jpeg', 0.85);
          }
        }
      }

      if (imageToUpload) {
        try {
          const base64Data = imageToUpload.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/jpeg' });

          const formData = new FormData();
          formData.append('images', blob, 'exit.jpg');
          formData.append('type', 'exit');
          await parkingSessionService.uploadEvidence(String(sessionId), formData);
        } catch (uploadErr) {
          console.error('Failed to upload exit evidence:', uploadErr);
        }
      }

      await parkingSessionService.checkOut(String(sessionId));
      showNotification('Payment verified. Releasing gate...', 'success');
      setTimeout(() => {
        setSessionFound(false);
        setActiveSession(null);
        setSearchQuery('');
        setCapturedImageBase64(null);
        showNotification('Gate closed. Session complete.', 'info');
      }, 3500);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to check out session', 'error');
    }
  };

  const handleManualOverride = () => {
    showNotification('Manual override engaged. Gate opened.', 'info');
    setTimeout(() => {
      showNotification('Gate closed.', 'info');
    }, 5000);
  };

  useEffect(() => {
    if (!socket || !sessionFound || !activeSession) return;

    const handlePaymentConfirmed = async (data: any) => {
      const sessionId = activeSession._id || activeSession.id;
      if (data.sessionId && String(data.sessionId) === String(sessionId)) {
        showNotification('Bank transfer confirmed via Webhook!', 'success');
        // Wait a brief moment, then auto release
        setTimeout(() => {
          handleProcessAndRelease();
        }, 1500);
      }
    };

    socket.on('paymentConfirmed', handlePaymentConfirmed);
    return () => {
      socket.off('paymentConfirmed', handlePaymentConfirmed);
    };
  }, [socket, sessionFound, activeSession, handleProcessAndRelease]);

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 relative">
      {/* Toast Notification */}
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
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">ParkingOps</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Staff Suite</p>
          </div>

          <nav className="mt-6 flex flex-col space-y-1">
            {(profile?.role === 'parking_manager' || (profile?.role === 'parking_staff' && profile?.assignedParkingLot)) && (
              <>
                <Link to="/staff" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
                  <LogIn className="w-5 h-5 mr-3 text-gray-400" />
                  Entry
                </Link>
                <Link to="/staff/exit" className="flex items-center px-6 py-3 bg-gray-50 border-r-4 border-gray-900 text-gray-900 font-medium w-full text-left">
                  <LogOut className="w-5 h-5 mr-3 text-gray-700" />
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
                <Link to="/staff/exceptions" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
                  <AlertTriangle className="w-5 h-5 mr-3 text-gray-400" />
                  Exceptions
                </Link>
                <Link to="/staff/schedule" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
                  <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                  My Schedule
                </Link>
              </>
            )}
            {profile?.role !== 'parking_manager' && (
              <Link to="/staff/profile" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
                <User className="w-5 h-5 mr-3 text-gray-400" />
                My Profile
              </Link>
            )}
            {profile?.role === 'parking_manager' && (
              <Link to="/admin/staff-assignment" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left whitespace-nowrap">
                <Users className="w-5 h-5 mr-3 text-gray-400 shrink-0" />
                <span className="truncate">Staff Assignment</span>
              </Link>
            )}
          </nav>
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 mr-3 shrink-0 overflow-hidden">
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
          <div className="max-w-6xl mx-auto">
            {/* Plate Lookup Section */}
            <section className="mb-8">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                License Plate Scanner (Exit Gate)
                {!isSearching && (
                  <button
                    onClick={() => setIsManual(!isManual)}
                    className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider transition-colors ${isManual ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                  >
                    {isManual ? 'Disable Manual' : 'Enable Manual Entry'}
                  </button>
                )}
              </h3>

              <div className={`bg-white border p-8 flex items-center justify-center min-h-[160px] shadow-sm relative transition-colors ${isManual ? 'border-blue-400 ring-1 ring-blue-400' : 'border-gray-200'}`}>
                {isSearching ? (
                  <div className="flex flex-col items-center text-gray-400">
                    <RefreshCw className="w-10 h-10 mb-4 animate-spin text-gray-300" />
                    <span className="text-xl font-bold tracking-widest uppercase animate-pulse">Scanning...</span>
                  </div>
                ) : (
                  <form onSubmit={handleManualSearch} className="w-full flex items-center justify-center">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                      readOnly={!isManual}
                      className={`w-full text-center text-6xl font-light tracking-wider outline-none uppercase bg-transparent ${isManual ? 'text-gray-900 placeholder-gray-300' : 'text-gray-700 select-none'}`}
                      placeholder={isManual ? 'ENTER PLATE' : ''}
                    />
                    {isManual && (
                      <button
                        type="submit"
                        className="absolute right-8 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-sm font-bold rounded uppercase tracking-wider transition-colors shadow-md"
                      >
                        Search
                      </button>
                    )}
                  </form>
                )}
              </div>

              <div className="flex justify-between items-center mt-3 h-6">
                <span className="text-sm text-gray-500">
                  {isSearching ? 'Processing image feed...' : confidence ? `Automatic recognition confidence: ${confidence}%` : 'Waiting for vehicle scan...'}
                </span>
                <button
                  onClick={handleRescan}
                  disabled={isSearching}
                  className="flex items-center text-sm font-bold text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                  <Camera className={`w-4 h-4 mr-2 ${isSearching ? 'animate-pulse' : ''}`} />
                  {isSearching ? 'SCANNING...' : 'AI SCAN'}
                </button>
              </div>
            </section>

            <div className={`flex gap-8 transition-opacity duration-300 ${isSearching ? 'opacity-50' : ''}`}>
              {/* Left Column */}
              <div className="flex-1 flex flex-col space-y-6">

                {/* Active Session Details */}
                <section>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Active Session Details</h3>
                  <div className="bg-white border border-gray-200 shadow-sm p-6">
                    <div className="grid grid-cols-3 gap-y-6 gap-x-4 mb-6">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Session ID</p>
                        <p className={`font-bold text-lg ${sessionFound ? 'text-gray-900' : 'text-gray-300'}`}>
                          {sessionFound ? activeSession?.sessionCode || 'N/A' : '---'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Session Type</p>
                        <p className={`font-bold text-lg ${sessionFound ? 'text-gray-900' : 'text-gray-300'}`}>
                          {sessionFound ? (
                            activeSession?.monthlyPass ? 'Monthly Pass' :
                              activeSession?.booking ? 'Pre-booked' :
                                (activeSession?.user ? 'Registered' : 'Guest')
                          ) : '---'}
                        </p>
                        {sessionFound && activeSession?.user?.fullName && (
                          <p className="text-xs text-gray-500 font-semibold mt-0.5">
                            {activeSession.user.fullName}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">License Plate</p>
                        <p className={`font-bold text-lg ${sessionFound ? 'text-gray-900' : 'text-gray-300'}`}>
                          {sessionFound ? activeSession?.vehicleInfo?.licensePlate || searchQuery : '---'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Entry Time</p>
                        <p className={`font-bold text-lg ${sessionFound ? 'text-gray-900' : 'text-gray-300'}`}>
                          {sessionFound && activeSession?.entryTime ? new Date(activeSession.entryTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '--:-- --'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Duration</p>
                        <p className={`font-bold text-lg ${sessionFound ? 'text-gray-900' : 'text-gray-300'}`}>
                          {sessionFound && activeSession?.entryTime ? (
                            (() => {
                              const diff = new Date().getTime() - new Date(activeSession.entryTime).getTime();
                              const h = Math.floor(diff / 3600000);
                              const m = Math.floor((diff % 3600000) / 60000);
                              return `${h}h ${m}m`;
                            })()
                          ) : '--h --m'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Slot Code</p>
                        <p className={`font-bold text-lg ${sessionFound ? 'text-gray-900' : 'text-gray-300'}`}>
                          {sessionFound ? activeSession?.slot?.slotCode || 'Unassigned' : '---'}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Status</span>
                      {sessionFound ? (
                        <div className={`flex items-center text-sm font-bold ${(activeSession?.paymentStatus === 'paid' || activeSession?.monthlyPass) ? 'text-green-600' : 'text-orange-500'}`}>
                          {(activeSession?.paymentStatus === 'paid' || activeSession?.monthlyPass) ? (
                            <><CheckCircle2 className="w-4 h-4 mr-2" /> {activeSession?.monthlyPass ? 'Paid (Monthly Pass)' : 'Paid'}</>
                          ) : (
                            <><AlertTriangle className="w-4 h-4 mr-2" /> Pending Payment</>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center text-gray-400 text-sm font-medium">
                          Pending Lookup
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* History Log */}
                <section>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">History Log (Fee Details)</h3>
                  <div className="bg-white border border-gray-200 shadow-sm flex flex-col min-h-[120px] max-h-[300px] overflow-y-auto">
                    {sessionFound && estimatedFees.logs && estimatedFees.logs.length > 0 ? (
                      estimatedFees.logs.map((log: any, idx: number) => (
                        <div key={idx} className={`flex items-center p-4 ${idx !== estimatedFees.logs.length - 1 ? 'border-b border-gray-100' : ''}`}>
                          <span className="w-24 text-xs text-gray-400 shrink-0">{new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="flex-1 text-sm text-gray-700">{log.message}</span>
                          {log.amount !== 0 && (
                            <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider ml-2 shrink-0 ${log.amount > 0 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                              }`}>
                              {log.amount > 0 ? '+' : ''}{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(log.amount)}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
                        No history logs available
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Right Column (Amount Due & Camera) */}
              <div className="w-[380px] flex flex-col space-y-6">

                {/* Camera View for Comparison */}
                <section>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Exit Cam</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCamMode('lpr')}
                        className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider transition-colors ${camMode === 'lpr' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        LPR
                      </button>
                      <button
                        onClick={() => setCamMode('qr')}
                        className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider transition-colors ${camMode === 'qr' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        QR
                      </button>
                      <button
                        onClick={() => setIsExitCamActive(!isExitCamActive)}
                        className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider transition-colors ${isExitCamActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                      >
                        {isExitCamActive ? 'Off' : 'On'}
                      </button>
                    </div>
                  </div>
                  <div className="relative bg-black aspect-video rounded-xl overflow-hidden border border-gray-200 shadow-sm flex items-center justify-center">
                    {isExitCamActive ? (
                      camMode === 'lpr' ? (
                        <video
                          ref={videoRefExit}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover opacity-90 mix-blend-screen"
                        />
                      ) : (
                        <div className="w-full h-full relative">
                          <Scanner
                            onScan={handleScanQR}
                            allowMultiple={true}
                            scanDelay={300}
                            constraints={{ facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }}
                            styles={{ container: { width: '100%', height: '100%' }, video: { objectFit: 'cover' } }}
                            paused={isProcessingQR}
                          />
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center text-gray-500">
                        <VideoOff className="w-10 h-10 mb-2 opacity-50" />
                        <span className="text-xs font-bold tracking-widest uppercase">Camera Disabled</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center tracking-wider z-10">
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${isExitCamActive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></span>
                      LPR-CAM-EXIT
                    </div>
                  </div>

                  {/* Hidden canvas for capturing camera frame */}
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Entry Image for Comparison */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Entry Image (Captured)</span>
                    </div>
                    <div className="relative bg-black aspect-video rounded-xl overflow-hidden border border-gray-200 shadow-sm flex items-center justify-center">
                      {(() => {
                        const entryImg = sessionFound ? activeSession?.evidenceImages?.find((img: any) => img.type === 'entry') : null;
                        if (entryImg?.url) {
                          // Resolve backend local storage URL
                          let imgUrl = entryImg.url;
                          if (!imgUrl.startsWith('http')) {
                            const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/v1\/?$/, '') || '';
                            imgUrl = `${baseUrl}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
                          }
                          return <img src={imgUrl} alt="Entry Snapshot" className="w-full h-full object-cover opacity-90" />;
                        }
                        return (
                          <div className="flex flex-col items-center text-gray-500">
                            <Camera className="w-10 h-10 mb-2 opacity-50" />
                            <span className="text-xs font-bold tracking-widest uppercase">No Entry Image</span>
                          </div>
                        );
                      })()}
                      <div className="absolute top-3 left-3 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center tracking-wider z-10">
                        ENTRY-CAM-SNAPSHOT
                      </div>
                      {sessionFound && activeSession?.entryTime && (
                        <div className="absolute bottom-3 right-3 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded tracking-wider z-10">
                          {new Date(activeSession.entryTime).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <div className="bg-white border border-gray-200 shadow-sm p-8 flex flex-col space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Amount Due</h3>
                    <p className={`text-5xl font-black tracking-tight ${sessionFound ? 'text-gray-900' : 'text-gray-300'}`}>
                      {sessionFound && activeSession ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(estimatedFees.totalFee || 0) : '0 ₫'}
                    </p>
                  </div>

                  <div className="flex flex-col space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Base Fee</span>
                      <span className={`font-medium ${sessionFound ? 'text-gray-900' : 'text-gray-400'}`}>
                        {sessionFound && activeSession ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(estimatedFees.baseFee || 0) : '0 ₫'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Early Arrival Fee</span>
                      <span className={`font-medium ${sessionFound ? 'text-gray-900' : 'text-gray-400'}`}>
                        {sessionFound && activeSession ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(estimatedFees.earlyArrivalFee || 0) : '0 ₫'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Overtime Fee</span>
                      <span className={`font-medium ${sessionFound ? 'text-gray-900' : 'text-gray-400'}`}>
                        {sessionFound && activeSession ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(estimatedFees.overtimeFee || 0) : '0 ₫'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-3 border-t border-gray-100">
                      <span className="font-bold text-gray-900 text-xs uppercase tracking-wider">Balance Due</span>
                      <span className={`font-bold ${sessionFound && activeSession?.paymentStatus !== 'paid' ? 'text-orange-600' : (sessionFound ? 'text-green-600' : 'text-gray-400')}`}>
                        {sessionFound && activeSession?.paymentStatus === 'paid' ? 'PAID' : (sessionFound && activeSession ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(estimatedFees.totalFee || 0) : '0 ₫')}
                      </span>
                    </div>
                  </div>

                  {sessionFound && activeSession?.paymentStatus !== 'paid' && estimatedFees.totalFee > 0 && (
                    <div className="flex flex-col items-center pt-6 border-t border-gray-100">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Scan to Pay (VietQR)</p>

                      {isLoadingQr ? (
                        <div className="w-48 h-48 flex flex-col items-center justify-center border border-gray-200 border-dashed rounded-xl p-2 bg-gray-50">
                          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                          <span className="text-xs font-medium text-gray-500">Generating QR...</span>
                        </div>
                      ) : checkoutQrUrl ? (
                        <>
                          <div className="relative group">
                            <img
                              src={checkoutQrUrl}
                              alt="VietQR Payment"
                              className="w-48 h-48 object-contain border border-gray-200 rounded-xl p-2 shadow-sm bg-white cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => setShowLargeQr(true)}
                            />
                            <div className="absolute inset-0 border-2 border-blue-400 rounded-xl animate-pulse pointer-events-none opacity-50"></div>
                          </div>
                          <div className="flex items-center justify-center mt-3 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                            <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Waiting for transfer...</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-2 text-center">Use any banking app that supports VietQR</p>
                        </>
                      ) : null}
                    </div>
                  )}

                  <div className="pt-6 flex flex-col space-y-4">
                    <button
                      onClick={handleProcessAndRelease}
                      disabled={!sessionFound}
                      className="w-full bg-black text-white py-4 text-sm font-bold flex items-center justify-center hover:bg-gray-900 transition-colors shadow-lg group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                      Process & Release
                    </button>
                    <button
                      onClick={handleManualOverride}
                      className="w-full bg-white border border-gray-200 py-4 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm uppercase tracking-wider"
                    >
                      Manual Override
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Large QR Modal */}
      {showLargeQr && checkoutQrUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowLargeQr(false)}>
          <div className="relative bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowLargeQr(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-6 uppercase tracking-wider text-center">Scan to Pay</h3>

            <img
              src={checkoutQrUrl}
              alt="VietQR Payment Large"
              className="w-full max-w-[400px] h-auto object-contain border border-gray-200 rounded-xl p-4 shadow-sm bg-white"
            />

            <div className="flex items-center justify-center mt-6 text-blue-600 bg-blue-50 px-6 py-3 rounded-full border border-blue-100 w-full">
              <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
              <span className="text-sm font-bold uppercase tracking-wider">Waiting for transfer...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffExitPage;
