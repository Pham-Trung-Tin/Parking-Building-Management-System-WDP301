import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import parkingSessionService, { ParkingSession } from '../services/api/parkingSessionService';

const TimerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
);

const CarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="10" width="22" height="8" rx="2" /><path d="M4 10l3-5h10l3 5" />
        <circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" />
    </svg>
);

const formatHMS = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const FloatingSessionWidget: React.FC = () => {
    const [activeSession, setActiveSession] = useState<ParkingSession | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { socket } = useSocket();
    const navigate = useNavigate();
    const location = useLocation();

    // ── Dragging State ──
    const [position, setPosition] = useState({ x: window.innerWidth - 250, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const widgetRef = useRef<HTMLDivElement>(null);
    const isMoved = useRef(false);

    // Initial position on resize
    useEffect(() => {
        const handleResize = () => {
            if (position.x > window.innerWidth - 100) {
                 setPosition(prev => ({ ...prev, x: window.innerWidth - 250 }));
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [position.x]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0 || !widgetRef.current) return;
        setIsDragging(true);
        isMoved.current = false;
        const rect = widgetRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        isMoved.current = true;
        
        let newX = e.clientX - dragOffset.x;
        let newY = e.clientY - dragOffset.y;
        
        const maxX = window.innerWidth - (widgetRef.current?.offsetWidth || 0);
        const maxY = window.innerHeight - (widgetRef.current?.offsetHeight || 0);
        
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        
        setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    const handleWidgetClick = (e: React.MouseEvent) => {
        if (isMoved.current) {
            e.preventDefault();
            return;
        }
        if (activeSession) {
            navigate('/session', { state: { sessionId: activeSession._id } });
        }
    };

    // ── Check Role ──
    const checkIsCustomer = () => {
        const userStr = localStorage.getItem('user');
        const role = userStr ? JSON.parse(userStr)?.role : null;
        return role === 'parking_user';
    };
    
    const [isCustomer, setIsCustomer] = useState(checkIsCustomer());

    useEffect(() => {
        const handleAuthChange = () => {
            setIsCustomer(checkIsCustomer());
        };
        window.addEventListener('authChange', handleAuthChange);
        return () => window.removeEventListener('authChange', handleAuthChange);
    }, []);

    const fetchActiveSession = async () => {
        try {
            const res = await parkingSessionService.getSessions({ status: 'active' });
            let data = res.data?.data || res.data || [];
            
            // Không hiển thị widget trôi nổi cho xe vé tháng
            data = data.filter((s: any) => !s.monthlyPass);
            
            if (data.length > 0) {
                // Sắp xếp giảm dần theo entryTime để luôn lấy session mới nhất
                data.sort((a: any, b: any) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
                setActiveSession(data[0]);
            } else {
                setActiveSession(null);
            }
        } catch (error) {
            console.error("Failed to fetch active session for widget:", error);
        }
    };

    useEffect(() => {
        if (!isCustomer) return;
        fetchActiveSession();
    }, [isCustomer]);

    // ── Socket Lắng nghe checkin/checkout ──
    useEffect(() => {
        if (!socket || !isCustomer) return;

        const handleNotif = (notif: any) => {
            if (notif.type === 'checkin_success') {
                // Đợi 1s rồi gọi API lấy chi tiết
                setTimeout(fetchActiveSession, 1000);
            } else if (notif.type === 'checkout_success') {
                const sid = notif.data?.sessionId;
                if (activeSession && String(activeSession._id) === String(sid)) {
                    setActiveSession(null);
                } else {
                    fetchActiveSession();
                }
            }
        };

        socket.on('newNotification', handleNotif);
        return () => {
            socket.off('newNotification', handleNotif);
        };
    }, [socket, isCustomer, activeSession]);

    // ── Timer Live ──
    useEffect(() => {
        if (!activeSession?.entryTime) return;
        const entryDate = new Date(activeSession.entryTime).getTime();

        const updateTimer = () => {
            const diff = Math.floor((Date.now() - entryDate) / 1000);
            setElapsed(diff > 0 ? diff : 0);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [activeSession?.entryTime]);

    // Không render nếu: không phải user, không có session, hoặc đang ở trang session
    if (!isCustomer || !activeSession || location.pathname.includes('/session')) {
        return null;
    }

    const licensePlate = activeSession.vehicleInfo?.licensePlate || 'N/A';
    const slotCode = (typeof activeSession.slot === 'object' ? activeSession.slot?.slotCode : activeSession.slot) || 'N/A';
    const floorName = (typeof activeSession.floor === 'object' ? activeSession.floor?.name : '') || '';

    if (isCollapsed) {
        return (
            <div 
                ref={widgetRef}
                onMouseDown={handleMouseDown}
                className={`fixed z-[999] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} animate-fade-in-up`}
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    userSelect: 'none',
                    touchAction: 'none'
                }}
            >
                <button 
                    onClick={(e) => {
                        if (isMoved.current) { e.preventDefault(); return; }
                        setIsCollapsed(false);
                    }}
                    className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-full shadow-lg shadow-blue-500/40 hover:scale-110 transition-all duration-300 backdrop-blur-md border border-white/20"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <div 
            ref={widgetRef}
            onMouseDown={handleMouseDown}
            onClick={handleWidgetClick}
            className={`fixed z-[999] ${isDragging ? 'cursor-grabbing hover:scale-100' : 'cursor-grab hover:scale-105'} transition-transform duration-300 animate-fade-in-up`}
            style={{ 
                left: `${position.x}px`, 
                top: `${position.y}px`,
                animationDuration: '0.4s',
                userSelect: 'none',
                touchAction: 'none'
            }}
        >
            <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-4 rounded-2xl shadow-xl shadow-blue-500/30 overflow-hidden border border-white/10 backdrop-blur-md min-w-[220px]">
                {/* Glow Effect */}
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/20 blur-2xl rounded-full pointer-events-none"></div>
                
                {/* Header */}
                <div className="flex justify-between items-center mb-3 relative z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ring-2 ring-emerald-400/30"></div>
                        <span className="text-[11px] font-bold tracking-widest text-blue-100 uppercase">parking</span>
                    </div>
                    <div className="bg-white/15 px-2 py-0.5 rounded-md text-xs font-mono font-semibold tracking-wider">
                        {licensePlate}
                    </div>
                </div>

                {/* Body */}
                <div className="flex justify-between items-end relative z-10">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-white mb-1 opacity-90">
                            <TimerIcon />
                            <span className="text-xl font-black font-mono tracking-wide drop-shadow-md">
                                {formatHMS(elapsed)}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-blue-100 font-medium">
                            <CarIcon />
                            <span className="truncate max-w-[120px]">Position: {floorName} - {slotCode}</span>
                        </div>
                    </div>

                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsCollapsed(true);
                        }}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m9 18 6-6-6-6"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FloatingSessionWidget;
