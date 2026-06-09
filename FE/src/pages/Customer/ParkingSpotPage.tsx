import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import parkingLotService, { ParkingLot } from '../../services/api/parkingLotService';
import ParkingFinderMap from '../../components/Map/ParkingFinderMap';

// SVG Icons
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>;
const FilterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
const WalkingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m13 14 1 7" /><path d="m13 14-2.5-3.5L8 12" /><path d="m13 14-1-6 3-2 1.5 2.5" /><path d="M9 21h2" /><circle cx="13" cy="4" r="2" /></svg>;
const ChevronDown = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>;
const MapPinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>;

// Fallback images for parking lots without images
const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?w=200&h=150&fit=crop',
    'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=200&h=150&fit=crop',
    'https://images.unsplash.com/photo-1604061986761-d9d0cc41b0d1?w=200&h=150&fit=crop',
    'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=200&h=150&fit=crop',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=150&fit=crop',
];

// Helper: get price from parking lot
const getPrice = (lot: ParkingLot): number => {
    return lot.settings?.pricePerHour ?? lot.pricePerHour ?? 20000;
};

// Helper: format address
const formatAddress = (address?: ParkingLot['address']): string => {
    if (!address) return '';
    const parts = [address.street, address.ward, address.district, address.city].filter(Boolean);
    return parts.join(', ');
};

// Helper: availability badge color
const getAvailabilityColor = (available: number, total: number): string => {
    if (!total) return '#10b981';
    const pct = available / total;
    if (pct > 0.5) return '#10b981'; // green
    if (pct > 0.2) return '#f59e0b'; // amber
    return '#ef4444'; // red
};

// Skeleton loader component
const SkeletonCard = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex gap-4 animate-pulse">
        <div className="w-[110px] h-[90px] rounded-lg bg-slate-200 shrink-0" />
        <div className="flex flex-col flex-1 gap-2 py-1">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
            <div className="h-3 bg-slate-200 rounded w-1/3 mt-auto" />
        </div>
    </div>
);

const ParkingSpotPage = () => {
    const navigate = useNavigate();
    const [activeFilters, setActiveFilters] = useState(['all']);
    const [showFees, setShowFees] = useState(false);
    const [searchText, setSearchText] = useState('');

    // API state (sử dụng từ Map)
    const [mapParkings, setMapParkings] = useState<any[]>([]);
    const [selectedParkingId, setSelectedParkingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleFilter = (filter: string) => {
        setActiveFilters(prev =>
            prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
        );
    };

    const handleBookNow = (lot: ParkingLot) => {
        navigate('/booking', {
            state: {
                spot: {
                    _id: lot._id,
                    title: lot.name,
                    price: getPrice(lot),
                    address: formatAddress(lot.address),
                    availableSlots: lot.availableSlots,
                    totalSlots: lot.totalSlots,
                    code: lot.code,
                }
            }
        });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    // Apply filters and search
    const filteredLots = mapParkings.filter(p => {
        const tags = p.tags || {};
        const name = (tags.name || 'Building / Sidewalk Parking').toLowerCase();
        
        if (searchText && !name.includes(searchText.toLowerCase())) {
            return false;
        }
        
        return true;
    });

    return (
        <div className="flex flex-col h-screen overflow-hidden font-sans bg-white">
            <Header />



            {/* Filter Bar */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between z-10 relative overflow-x-auto">
                <div className="flex items-center gap-3 min-w-max">
                    <button
                        onClick={() => toggleFilter('all')}
                        className={`flex items-center gap-2 border px-4 py-1.5 rounded-full text-sm font-semibold transition-colors shadow-sm active:scale-95 ${activeFilters.includes('all') ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                    >
                        <FilterIcon /> All
                    </button>
                    <button
                        onClick={() => toggleFilter('motorbike')}
                        className={`flex items-center gap-2 border px-4 py-1.5 rounded-full text-sm font-semibold transition-colors shadow-sm active:scale-95 ${activeFilters.includes('motorbike') ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                    >
                        Motorbike
                    </button>
                    <button
                        onClick={() => toggleFilter('car')}
                        className={`flex items-center gap-2 border px-4 py-1.5 rounded-full text-sm font-semibold transition-colors shadow-sm active:scale-95 ${activeFilters.includes('car') ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                    >
                        Car
                    </button>
                    <button
                        onClick={() => toggleFilter('ev')}
                        className={`flex items-center gap-2 border px-4 py-1.5 rounded-full text-sm font-semibold transition-colors shadow-sm active:scale-95 ${activeFilters.includes('ev') ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                    >
                        Electric Vehicle
                    </button>
                    {(activeFilters.length > 1 || activeFilters[0] !== 'all' || searchText) && (
                        <button
                            onClick={() => {
                                setActiveFilters(['all']);
                                setSearchText('');
                            }}
                            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors active:scale-95 text-slate-500 hover:text-red-500 hover:bg-red-50"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2 min-w-max ml-4">
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={showFees}
                            onChange={() => setShowFees(!showFees)}
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-3 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors">Show total price with fees</span>
                    </label>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <div className="w-full lg:w-[420px] bg-slate-50 flex flex-col border-r border-slate-200 z-10 shadow-[2px_0_10px_rgba(0,0,0,0.03)] shrink-0">
                    {/* Sort + count bar */}
                    <div className="px-5 py-3 flex justify-between items-center bg-white border-b border-slate-200 shadow-sm z-10">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-600">Sort by Relevance</span>
                            {!loading && mapParkings.length > 0 && (
                                <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                                    {filteredLots.length} bãi
                                </span>
                            )}
                        </div>
                        <button
                            className="flex items-center gap-1 text-sm text-blue-600 font-semibold hover:text-blue-700 active:scale-95 transition-transform"
                            onClick={() => alert('Open sorting menu')}
                        >
                            Relevance <ChevronDown />
                        </button>
                    </div>

                    {/* Search box */}
                    <div className="px-4 pt-3 pb-2">
                        <input
                            type="text"
                            placeholder="Tìm bãi đỗ xe..."
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-400 transition-colors"
                        />
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4 custom-scrollbar">
                        {/* Loading state */}
                        {loading && (
                            <>
                                <SkeletonCard />
                                <SkeletonCard />
                                <SkeletonCard />
                            </>
                        )}

                        {/* Error state */}
                        {!loading && error && (
                            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                                <div className="text-4xl">⚠️</div>
                                <div className="text-sm font-bold text-slate-700">{error}</div>
                                <button
                                    className="text-xs text-blue-600 font-bold border border-blue-300 rounded-lg px-4 py-2 hover:bg-blue-50 transition-colors"
                                    onClick={() => window.location.reload()}
                                >
                                    Thử lại
                                </button>
                            </div>
                        )}

                        {/* Empty state */}
                        {!loading && !error && filteredLots.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                                <div className="text-4xl">🅿️</div>
                                <div className="text-sm font-bold text-slate-700">
                                    {searchText ? 'No matching parking lots' : 'No parking lots found'}
                                </div>
                                <div className="text-xs text-slate-400">
                                    {searchText ? 'Try a different keyword' : 'Please check back later'}
                                </div>
                            </div>
                        )}

                        {/* Parking lot cards */}
                        {!loading && !error && filteredLots.map((p, idx) => {
                            const tags = p.tags || {};
                            const name = tags.name || 'Building / Sidewalk Parking';
                            let accessInfo = "Public";
                            if (tags.access === 'private' || tags.parking === 'private' || tags.access === 'customers') {
                                accessInfo = "Private / Customers";
                            } else if (tags.access) {
                                accessInfo = tags.access;
                            }
                            
                            const isSelected = selectedParkingId === p.id;

                            return (
                                <div
                                    key={p.id}
                                    className={`bg-white rounded-xl shadow-sm border p-4 flex flex-col gap-2 hover:shadow-md transition-all duration-300 cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-400'}`}
                                    onClick={() => setSelectedParkingId(p.id)}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className={`text-base font-bold leading-snug mb-1 flex-1 ${isSelected ? 'text-blue-700' : 'text-slate-900'}`}>
                                            {name}
                                        </h3>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase shrink-0 ${accessInfo.includes('Private') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {accessInfo}
                                        </span>
                                    </div>
                                    
                                    {tags.fee && <div className="text-sm text-slate-600"><strong>Fee:</strong> {tags.fee === 'yes' ? 'Yes' : tags.fee === 'no' ? 'Free' : tags.fee}</div>}
                                    {tags.capacity && <div className="text-sm text-slate-600"><strong>Capacity:</strong> {tags.capacity} spaces</div>}
                                    
                                    <button 
                                        className={`mt-2 w-full py-2 rounded-lg font-bold text-sm transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedParkingId(p.id);
                                        }}
                                    >
                                        {isSelected ? '📍 Selected' : '🗺️ View on map'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Map Area */}
                <div className="hidden lg:block flex-1 relative bg-slate-100 z-0">
                    <ParkingFinderMap 
                        onDataLoad={(data) => setMapParkings(data)}
                        selectedParkingId={selectedParkingId}
                        onSelectParking={(id) => setSelectedParkingId(id)}
                    />
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 10px;
                }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                    background-color: #94a3b8;
                }
            `}</style>
        </div>
    );
};

export default ParkingSpotPage;
