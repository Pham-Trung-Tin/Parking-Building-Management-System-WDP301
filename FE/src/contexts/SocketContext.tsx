import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
export interface SlotUpdatePayload {
  slotId: string;
  slotCode: string;
  status: 'available' | 'reserved' | 'occupied' | 'maintenance';
  bookingId?: string;
  sessionId?: string;
  floorId?: string;
  zoneId?: string;
}

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  /** Subscribe to the parkingLot room to receive slot updates */
  joinParkingLot: (parkingLotId: string) => void;
  leaveParkingLot: (parkingLotId: string) => void;
  /** Subscribe to slot updates; returns an unsubscribe function */
  onSlotUpdate: (handler: (payload: SlotUpdatePayload) => void) => () => void;
}

// ──────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────
const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  joinParkingLot: () => {},
  leaveParkingLot: () => {},
  onSlotUpdate: () => () => {},
});

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      auth: token ? { token } : {},
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    // Periodically check if token changed (e.g. after login/logout without page reload)
    const tokenInterval = setInterval(() => {
      const currentToken = localStorage.getItem('accessToken');
      const auth = socket.auth as any;
      if ((auth?.token || null) !== (currentToken || null)) {
        console.log('[Socket] Token changed, reconnecting...');
        socket.auth = currentToken ? { token: currentToken } : {};
        socket.disconnect().connect();
      }
    }, 2000);

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    return () => {
      clearInterval(tokenInterval);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinParkingLot = useCallback((parkingLotId: string) => {
    socketRef.current?.emit('joinParkingLot', parkingLotId);
  }, []);

  const leaveParkingLot = useCallback((parkingLotId: string) => {
    socketRef.current?.emit('leaveParkingLot', parkingLotId);
  }, []);

  const onSlotUpdate = useCallback((handler: (payload: SlotUpdatePayload) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on('slotStatusUpdated', handler);
    return () => socket.off('slotStatusUpdated', handler);
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, joinParkingLot, leaveParkingLot, onSlotUpdate }}>
      {children}
    </SocketContext.Provider>
  );
};

// ──────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────
export const useSocket = () => useContext(SocketContext);

export default SocketContext;
