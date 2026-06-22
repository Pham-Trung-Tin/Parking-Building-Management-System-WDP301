import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';

const GlobalNotification: React.FC = () => {
    const { socket } = useSocket();
    const navigate = useNavigate();
    const [banner, setBanner] = useState<{
        visible: boolean;
        title: string;
        message: string;
        sessionId?: string;
        type?: string;
    }>({ visible: false, title: '', message: '' });

    useEffect(() => {
        if (!socket) return;

        const handleNotification = (notif: any) => {
            if (notif.type === 'checkin_success') {
                setBanner({
                    visible: true,
                    title: 'Check-in Thành Công!',
                    message: 'Nhân viên vừa check-in vé của bạn. Bấm để xem phiên đỗ!',
                    sessionId: notif.sessionId || notif.session?._id || notif.data?.sessionId || notif.data?._id,
                    type: 'checkin_success'
                });
            } else if (notif.type === 'checkout_success') {
                setBanner({
                    visible: true,
                    title: 'Check-out Thành Công!',
                    message: 'Phiên đỗ của bạn đã hoàn tất. Cảm ơn bạn!',
                    type: 'checkout_success'
                });
            } else if (notif.type === 'payment_success') {
                setBanner({
                    visible: true,
                    title: 'Thanh Toán Thành Công!',
                    message: 'Hệ thống đã ghi nhận thanh toán cho phiên đỗ của bạn.',
                    type: 'payment_success'
                });
            }

            // Tự động ẩn sau 8 giây
            const timer = setTimeout(() => {
                setBanner(prev => ({ ...prev, visible: false }));
            }, 8000);
            return () => clearTimeout(timer);
        };

        socket.on('newNotification', handleNotification);
        return () => {
            socket.off('newNotification', handleNotification);
        };
    }, [socket]);

    if (!banner.visible) return null;

    const handleClick = () => {
        setBanner(prev => ({ ...prev, visible: false }));
        if (banner.type === 'checkin_success') {
            if (banner.sessionId) {
                navigate('/session', { state: { sessionId: banner.sessionId } });
            } else {
                navigate('/tickets');
            }
        } else {
            navigate('/tickets');
        }
    };

    return (
        <div
            onClick={handleClick}
            style={{
                position: 'fixed',
                top: 24,
                right: 24,
                zIndex: 9999,
                background: banner.type === 'checkin_success' ? '#10b981' : '#3b82f6',
                color: 'white',
                padding: '16px 20px',
                borderRadius: '16px',
                boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.2)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                animation: 'gn-slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                maxWidth: '350px'
            }}
        >
            <style>{`
                @keyframes gn-slideIn {
                    from { transform: translateX(120%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .gn-icon {
                    width: 40px; height: 40px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0; font-size: 20px;
                }
            `}</style>
            
            <div className="gn-icon">
                {banner.type === 'checkin_success' ? '🅿️' : banner.type === 'payment_success' ? '💳' : '👋'}
            </div>

            <div>
                <strong style={{ display: 'block', fontSize: '15px', marginBottom: '4px', lineHeight: 1.2 }}>
                    {banner.title}
                </strong>
                <span style={{ fontSize: '13px', opacity: 0.9, lineHeight: 1.4, display: 'block' }}>
                    {banner.message}
                </span>
            </div>
            
            <div style={{ marginLeft: 'auto', opacity: 0.6 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6"/>
                </svg>
            </div>
        </div>
    );
};

export default GlobalNotification;
