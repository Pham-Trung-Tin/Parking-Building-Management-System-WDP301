import React from 'react';
import Header from '../../components/Header/Header';

// SVG Icons
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
const FilterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const WalkingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m13 14 1 7"/><path d="m13 14-2.5-3.5L8 12"/><path d="m13 14-1-6 3-2 1.5 2.5"/><path d="M9 21h2"/><circle cx="13" cy="4" r="2"/></svg>;
const ChevronDown = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;

const parkingSpots = [
    {
        id: 1,
        title: '127 S Commons (100 S Common...',
        price: 50.00,
        time: '16 min',
        distance: '0.7 mi',
        rating: 4.6,
        reviews: '1.2K',
        image: 'https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?w=200&h=150&fit=crop',
        popular: true
    },
    {
        id: 2,
        title: '600 Commonwealth Pl. - Wyndh...',
        price: 25.00,
        time: '20 min',
        distance: '0.9 mi',
        rating: null,
        reviews: null,
        image: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=200&h=150&fit=crop',
        popular: false
    },
    {
        id: 3,
        title: '320 Fort Duquesne Blvd. - Gate...',
        price: 25.00,
        time: '21 min',
        distance: '1.0 mi',
        rating: 4.3,
        reviews: '159',
        image: 'https://images.unsplash.com/photo-1604061986761-d9d0cc41b0d1?w=200&h=150&fit=crop',
        popular: false
    },
    {
        id: 4,
        title: '625 Stanwix St. - PI004 - Riverfr...',
        price: 30.00,
        time: '24 min',
        distance: '1.1 mi',
        rating: 4.5,
        reviews: '947',
        image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=200&h=150&fit=crop',
        popular: false
    }
];

const ParkingSpotPage = () => {
    return (
        <div className="flex flex-col h-screen overflow-hidden font-sans bg-white">
            <Header />
            
            {/* Search/Time Bar */}
            <div className="border-b border-slate-200 bg-white px-4 py-3 flex flex-wrap items-center justify-center gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] z-10 relative">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 text-white flex flex-col items-center justify-center rounded px-2 py-1 w-[46px]">
                        <span className="text-[10px] font-bold uppercase leading-none tracking-wide mb-1">May</span>
                        <span className="text-lg font-extrabold leading-none">29</span>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 font-medium">Acrisure Stadium Events</div>
                        <div className="font-bold text-slate-900 text-[15px]">SteelHERs Social 2026</div>
                    </div>
                </div>
                
                <div className="hidden md:block h-8 w-px bg-slate-200 mx-2"></div>
                
                <div className="flex items-center border border-slate-300 rounded-lg p-2 gap-4 cursor-pointer hover:border-slate-400 transition-colors">
                    <span className="text-slate-500 ml-1"><CalendarIcon /></span>
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Start time</div>
                        <div className="text-sm font-bold text-slate-900">Today, 4:30 PM</div>
                    </div>
                    <div className="h-6 w-px bg-slate-200"></div>
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">End time</div>
                        <div className="text-sm font-bold text-slate-900">Today, 10:00 PM</div>
                    </div>
                    <span className="text-slate-400 mr-1"><ChevronDown /></span>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between z-10 relative overflow-x-auto">
                <div className="flex items-center gap-3 min-w-max">
                    <button className="flex items-center gap-2 border border-slate-300 bg-white px-4 py-1.5 rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                        <FilterIcon /> Filters
                    </button>
                    <button className="flex items-center gap-2 border border-slate-300 bg-white px-4 py-1.5 rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                        Vehicle Type <ChevronDown />
                    </button>
                    <button className="flex items-center gap-2 border border-slate-300 bg-white px-4 py-1.5 rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                        Self Park
                    </button>
                    <button className="flex items-center gap-2 border border-blue-600 text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                        Garage - Covered
                    </button>
                </div>
                <div className="flex items-center gap-2 min-w-max ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-3 text-sm font-semibold text-slate-700">Show total price with fees</span>
                    </label>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <div className="w-full lg:w-[420px] bg-slate-50 flex flex-col border-r border-slate-200 z-10 shadow-[2px_0_10px_rgba(0,0,0,0.03)] shrink-0">
                    <div className="px-5 py-3 flex justify-between items-center bg-white border-b border-slate-200 shadow-sm z-10">
                        <span className="text-sm font-semibold text-slate-600">Sort by Relevance</span>
                        <button className="flex items-center gap-1 text-sm text-blue-600 font-semibold hover:text-blue-700">
                            Relevance <ChevronDown />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
                        {parkingSpots.map(spot => (
                            <div key={spot.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex gap-4 hover:shadow-md transition-shadow hover:border-blue-300 group">
                                <div className="relative w-[110px] h-[90px] rounded-lg overflow-hidden shrink-0 bg-slate-100">
                                    {spot.popular && (
                                        <div className="absolute top-0 left-0 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-br-lg z-10">
                                            Popular
                                        </div>
                                    )}
                                    <img src={spot.image} alt={spot.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                <div className="flex flex-col flex-1 py-0.5">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-[13px] font-bold text-slate-900 leading-snug mb-1 pr-2 line-clamp-2">{spot.title}</h3>
                                        <div className="text-lg font-extrabold text-slate-900">${spot.price.toFixed(2)}</div>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 mb-2">
                                        <span className="flex items-center gap-1 text-slate-800"><span className="text-slate-400"><WalkingIcon /></span> {spot.time} <span className="text-blue-500 font-normal">({spot.distance})</span></span>
                                        {spot.rating && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span className="flex items-center gap-0.5 text-slate-800"><StarIcon /> {spot.rating} <span className="text-slate-400 font-normal">({spot.reviews})</span></span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-end mt-auto">
                                        <button className="text-blue-600 text-xs font-bold hover:underline mb-1">Details</button>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-semibold text-slate-500 mb-0.5">Subtotal</span>
                                            <button className="bg-blue-600 text-white px-5 py-2 rounded-md font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-sm">Book Now</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Map Area */}
                <div className="flex-1 bg-slate-200 relative hidden lg:block">
                    <iframe 
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12146.402506822558!2d-80.0084534!3d40.4449833!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8834f157793d98fb%3A0x63eb372a6a575a2a!2sAcrisure%20Stadium!5e0!3m2!1sen!2sus!4v1714578945678!5m2!1sen!2sus" 
                        className="w-full h-full border-0 grayscale-[0.3] contrast-[1.1] opacity-90" 
                        allowFullScreen="" 
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                    
                    {/* Custom map markers overlay (simulated) */}
                    <div className="absolute top-[40%] left-[30%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10">
                        <div className="bg-white rounded-full px-3 py-1 font-bold text-sm shadow-[0_4px_10px_rgba(0,0,0,0.15)] border border-slate-200 hover:scale-110 transition-transform cursor-pointer hover:bg-blue-600 hover:text-white hover:border-blue-600 text-slate-800">$50</div>
                    </div>
                    <div className="absolute top-[30%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10">
                        <div className="bg-white rounded-full px-3 py-1 font-bold text-sm shadow-[0_4px_10px_rgba(0,0,0,0.15)] border border-slate-200 hover:scale-110 transition-transform cursor-pointer hover:bg-blue-600 hover:text-white hover:border-blue-600 text-slate-800">$25</div>
                    </div>
                    <div className="absolute top-[60%] left-[65%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10">
                        <div className="bg-white rounded-full px-3 py-1 font-bold text-sm shadow-[0_4px_10px_rgba(0,0,0,0.15)] border border-slate-200 hover:scale-110 transition-transform cursor-pointer hover:bg-blue-600 hover:text-white hover:border-blue-600 text-slate-800">$30</div>
                    </div>
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
