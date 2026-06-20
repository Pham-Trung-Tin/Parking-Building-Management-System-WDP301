import React from 'react';
import { useNavigate } from 'react-router-dom';

// SVG Icons
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const MapPinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;

const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1604061986761-d9d0cc41b0d1?w=600&h=400&fit=crop',
];

interface ParkingDetailSidebarProps {
    selectedParking: any;
    onClose: () => void;
}

const formatAddress = (address?: any): string => {
    if (!address) return 'Address not available';
    const parts = [address.street, address.ward, address.district, address.city].filter(Boolean);
    return parts.join(', ');
};

const ParkingDetailSidebar: React.FC<ParkingDetailSidebarProps> = ({ selectedParking, onClose }) => {
    const navigate = useNavigate();

    // The component always renders its container to support slide-in/out transitions.
    // However, if selectedParking is null, we translate it completely out of view.
    const isOpen = !!selectedParking;
    const parkingData = selectedParking || {};
    
    const { isSystem, tags, lotData, lat, lon } = parkingData;
    const name = tags?.name || 'Building / Sidewalk Parking';
    const fee = tags?.fee;
    
    // Default image
    const imageUrl = (isSystem && lotData?.images?.length > 0) 
        ? lotData.images[0].url 
        : FALLBACK_IMAGES[0];

    const handleBookNow = () => {
        if (!isSystem || !lotData) return;
        navigate('/booking', {
            state: {
                spot: {
                    _id: lotData._id,
                    title: lotData.name,
                    price: lotData.settings?.pricePerHour || lotData.pricePerHour || 20000,
                    address: formatAddress(lotData.address),
                    availableSlots: lotData.availableSlots,
                    totalSlots: lotData.totalSlots,
                    code: lotData.code,
                }
            }
        });
    };

    return (
        <div 
            className={`absolute top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-[-8px_0_25px_rgba(0,0,0,0.08)] z-[1000] flex flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
            {/* Header / Image */}
            <div className="relative h-[240px] shrink-0 bg-slate-200">
                <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                <button 
                    onClick={onClose}
                    className="absolute top-4 left-4 bg-white/90 backdrop-blur-md p-2.5 rounded-full text-slate-700 hover:bg-white transition-colors shadow-md"
                    aria-label="Close details"
                >
                    <CloseIcon />
                </button>
                {isSystem && lotData?.status === 'active' && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase shadow-sm flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        Active
                    </div>
                )}
            </div>

            {/* Content Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar bg-white">
                
                {/* Title and Access */}
                <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <h2 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">{name}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${isSystem ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                            {tags?.access || 'Public'}
                        </span>
                        {isSystem && lotData?.settings?.allowBooking && (
                            <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-700 flex items-center gap-1">
                                🎟️ Booking Allowed
                            </span>
                        )}
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Capacity</span>
                        <span className="text-xl font-black text-slate-800">{tags?.capacity || lotData?.totalSlots || 'N/A'}</span>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center text-center">
                        <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Available</span>
                        <span className="text-xl font-black text-emerald-700">{lotData?.availableSlots ?? 'N/A'}</span>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex flex-col items-center justify-center text-center">
                        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">Price/Hr</span>
                        <span className="text-sm font-black text-blue-700 break-all leading-tight">{fee || 'N/A'}</span>
                    </div>
                </div>

                {/* Details Section */}
                <div className="flex flex-col gap-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                    {/* Address */}
                    <div className="flex gap-3 text-slate-700">
                        <div className="mt-0.5 text-blue-500"><MapPinIcon /></div>
                        <p className="text-sm font-medium leading-relaxed">
                            {isSystem ? formatAddress(lotData?.address) : 'Location coordinates on map'}
                        </p>
                    </div>

                    {/* Operating Hours */}
                    {isSystem && lotData?.operatingHours && (
                        <div className="flex gap-3 text-slate-700">
                            <div className="mt-0.5 text-orange-500"><ClockIcon /></div>
                            <p className="text-sm font-medium">
                                {lotData.operatingHours.is24Hours 
                                    ? 'Open 24/7' 
                                    : `${lotData.operatingHours.open} - ${lotData.operatingHours.close}`}
                            </p>
                        </div>
                    )}

                    {/* Contact */}
                    {isSystem && (lotData?.contactPhone || lotData?.contactEmail) && (
                        <>
                            {lotData.contactPhone && (
                                <div className="flex gap-3 text-slate-700">
                                    <div className="mt-0.5 text-green-500"><PhoneIcon /></div>
                                    <p className="text-sm font-medium">{lotData.contactPhone}</p>
                                </div>
                            )}
                            {lotData.contactEmail && (
                                <div className="flex gap-3 text-slate-700">
                                    <div className="mt-0.5 text-indigo-500"><MailIcon /></div>
                                    <p className="text-sm font-medium">{lotData.contactEmail}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Description */}
                {isSystem && lotData?.description && (
                    <div className="pt-2">
                        <h3 className="text-sm font-black text-slate-800 mb-2 uppercase tracking-wide">About</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            {lotData.description}
                        </p>
                    </div>
                )}

                {/* Amenities */}
                {isSystem && lotData?.amenities && lotData.amenities.length > 0 && (
                    <div className="pt-2 pb-6">
                        <h3 className="text-sm font-black text-slate-800 mb-3 uppercase tracking-wide">Amenities</h3>
                        <div className="flex flex-wrap gap-2">
                            {lotData.amenities.map((amenity: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 shadow-sm">
                                    <span className="text-emerald-500"><CheckCircleIcon /></span> {amenity}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Action Bottom Bar */}
            <div className="p-5 border-t border-slate-100 bg-white shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-10 flex gap-3">
                <button 
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, '_blank')}
                    className="flex-1 bg-slate-100 text-slate-700 font-bold text-[15px] py-3.5 rounded-xl hover:bg-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-slate-200"
                >
                    🗺️ Get directions
                </button>
                {isSystem && (
                    <button 
                        onClick={handleBookNow}
                        className="flex-[1.5] bg-blue-600 text-white font-black text-[15px] py-3.5 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
                    >
                        Book a slot
                    </button>
                )}
            </div>
        </div>
    );
};

export default ParkingDetailSidebar;
