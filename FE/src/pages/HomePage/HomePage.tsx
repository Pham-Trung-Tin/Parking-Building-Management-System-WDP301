import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer/Footer';

// Reveal Component for scroll animations
const Reveal = ({ children, delay = 0, className = "", direction = "up" }: { children: React.ReactNode, delay?: number, className?: string, direction?: "up" | "left" | "right" }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, { threshold: 0.1 });

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    let transformInit = "translate-y-8";
    if (direction === "left") transformInit = "-translate-x-8";
    if (direction === "right") transformInit = "translate-x-8";

    return (
        <div
            ref={ref}
            className={`transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${isVisible ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : `opacity-0 ${transformInit} scale-[0.98]`} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

// SVG Icons
const MapIcon = ({ size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" /><path d="M15 5.764v15" /><path d="M9 3.236v15" />
    </svg>
);

const CalendarCheckIcon = ({ size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /><path d="m9 16 2 2 4-4" />
    </svg>
);

const QrCodeIcon = ({ size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" />
    </svg>
);

const ClockIcon = ({ size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
);

const CheckIcon = ({ size = 18 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const HomePage = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        // window.scrollTo(0, 0); // Not needed for container scroll

        const userData = localStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));

        const handleClickOutside = (event: any) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setIsScrolled(e.currentTarget.scrollTop > 50);
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('authChange'));
        setUser(null);
        setShowDropdown(false);
        window.location.reload();
    };

    const getInitials = (name: string) => {
        if (!name) return 'U';
        return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const scrollToPricing = (e: React.MouseEvent) => {
        e.preventDefault();
        const el = document.getElementById('pricing');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="font-sans overflow-x-hidden bg-white h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth" onScroll={handleContainerScroll}>
            {/* HERO SECTION */}
            <section className="relative min-h-[100svh] w-full bg-[#0a0f1c] snap-start flex flex-col justify-center pt-24 pb-12">
                {/* Background Video */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
                        <source src="https://res.cloudinary.com/dgz3rhiv4/video/upload/v1780037325/Parking_lot_dashboard_simulation__202605291347_chy2on.mp4" type="video/mp4" />
                    </video>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/90 via-[#0f172a]/70 to-transparent pointer-events-none"></div>
                </div>

                {/* Sticky Navigation Bar */}
                <nav className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-[5%] transition-all duration-300 ${isScrolled ? 'py-4 bg-white/95 backdrop-blur-md shadow-md text-slate-900' : 'py-8 bg-transparent text-white'}`}>
                    <Link to="/" className="text-[18px] font-bold tracking-tight no-underline text-inherit">
                        PARKING<span className="text-blue-500">BUILDING</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-8 lg:gap-12 text-[15px] font-bold text-inherit opacity-90">
                        <Link to="/find-parking" className="hover:text-blue-500 transition-colors no-underline text-inherit py-2">Find Building</Link>
                        <Link to="/booking" className="hover:text-blue-500 transition-colors no-underline text-inherit py-2">Book a Slot</Link>
                        {user && <Link to="/tickets" className="hover:text-blue-500 transition-colors no-underline text-inherit py-2">My Tickets</Link>}
                    </nav>
                    <div className="flex items-center gap-6 text-[15px] font-bold text-inherit">
                        {user ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className={`flex items-center gap-3 border rounded-full py-1.5 pl-2 pr-4 transition-all duration-200 cursor-pointer ${isScrolled ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-white/10 hover:bg-white/20 border-white/10'}`}
                                >
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.fullName} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                                            {getInitials(user.fullName)}
                                        </div>
                                    )}
                                    <span className="font-semibold text-sm hidden sm:inline text-inherit">{user.fullName}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 text-inherit ${showDropdown ? 'rotate-180' : ''}`}>
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>
                                {showDropdown && (
                                    <div className="absolute right-0 mt-2.5 w-52 bg-white border border-slate-100 rounded-xl shadow-lg py-2 z-50 text-slate-800 text-left font-medium">
                                        <Link to="/profile" onClick={() => setShowDropdown(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors no-underline font-semibold">
                                            My Profile
                                        </Link>
                                        <Link to="/my-vehicles" onClick={() => setShowDropdown(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors no-underline font-semibold">
                                            My Vehicles
                                        </Link>
                                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left border-none bg-transparent cursor-pointer font-semibold">
                                            Log Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className="hover:text-blue-500 transition-colors no-underline text-inherit">Login</Link>
                                <Link to="/register" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors no-underline shadow-lg shadow-blue-500/30">Sign Up</Link>
                            </>
                        )}
                    </div>
                </nav>

                {/* Main Content */}
                <main className="relative z-10 flex flex-col justify-center items-start px-[5%] md:px-[7%] pointer-events-none">
                    <Reveal className="max-w-3xl pointer-events-auto" delay={100} direction="left">
                        <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 font-semibold text-sm mb-6 backdrop-blur-sm">
                            Next-Generation Parking Solutions
                        </div>
                        <h1 className="text-[54px] md:text-[72px] lg:text-[86px] font-extrabold leading-[1.05] text-white tracking-tight drop-shadow-xl mb-6">
                            Smart Parking<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Management System</span>
                        </h1>
                        <p className="text-slate-300 text-[18px] md:text-[22px] leading-relaxed mb-10 font-medium max-w-2xl drop-shadow-md">
                            Experience the future of parking. Real-time availability, instant digital bookings, and automated payments—all in one seamless platform.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link to="/find-parking" className="bg-blue-600 text-white px-8 py-4 text-[16px] font-bold hover:bg-blue-500 transition-all duration-300 no-underline rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] text-center flex-1 sm:flex-none">
                                Find Your Building
                            </Link>
                            <a href="#pricing" onClick={scrollToPricing} className="bg-white/10 text-white border border-white/20 backdrop-blur-sm px-8 py-4 text-[16px] font-bold hover:bg-white/20 transition-all duration-300 no-underline rounded-xl text-center flex-1 sm:flex-none">
                                View Pricing
                            </a>
                        </div>
                    </Reveal>
                </main>
            </section>

            {/* CORE FEATURES SECTION */}
            <section className="min-h-[100svh] py-24 w-full px-[5%] md:px-[7%] bg-slate-50 relative flex flex-col justify-center snap-start" id="features">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-blue-600 font-bold tracking-widest text-sm uppercase mb-3">Core Features</h2>
                        <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Everything you need to park smarter.</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Feature 1 */}
                        <Reveal delay={100} className="h-full">
                            <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full">
                                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                                    <MapIcon size={28} />
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 mb-3">Real-time Map</h4>
                                <p className="text-slate-600 leading-relaxed font-medium text-sm">
                                    View a live layout of the parking building. See exactly which slots are available, occupied, or reserved right now.
                                </p>
                            </div>
                        </Reveal>

                        {/* Feature 2 */}
                        <Reveal delay={200} className="h-full">
                            <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full">
                                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                                    <CalendarCheckIcon size={28} />
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 mb-3">Smart Booking</h4>
                                <p className="text-slate-600 leading-relaxed font-medium text-sm">
                                    Pre-book your slot before you arrive. Supports various vehicle types and dynamically calculates estimated fees.
                                </p>
                            </div>
                        </Reveal>

                        {/* Feature 3 */}
                        <Reveal delay={300} className="h-full">
                            <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full">
                                <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-6">
                                    <ClockIcon size={28} />
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 mb-3">Live Tracking</h4>
                                <p className="text-slate-600 leading-relaxed font-medium text-sm">
                                    Monitor your ongoing parking session. Track exactly how much time has passed and what your current parking fee is.
                                </p>
                            </div>
                        </Reveal>

                        {/* Feature 4 */}
                        <Reveal delay={400} className="h-full">
                            <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full">
                                <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                                    <QrCodeIcon size={28} />
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 mb-3">Digital Tickets</h4>
                                <p className="text-slate-600 leading-relaxed font-medium text-sm">
                                    Say goodbye to paper tickets. Use your generated QR code at the counter to securely check in and out of the facility.
                                </p>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS SECTION */}
            <section className="min-h-[100svh] py-24 w-full px-[5%] md:px-[7%] bg-white flex flex-col justify-center snap-start">
                <div className="max-w-7xl mx-auto">
                    <Reveal direction="up">
                        <div className="text-center mb-16">
                            <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">How it works</h3>
                            <p className="mt-4 text-slate-500 text-lg font-medium max-w-2xl mx-auto">Four simple steps to a stress-free parking experience.</p>
                        </div>
                    </Reveal>

                    <div className="relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-[60px] left-0 w-full h-[2px] bg-slate-100 -z-10"></div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-center">
                            <Reveal delay={100} direction="up">
                                <div className="relative flex flex-col items-center">
                                    <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-[0_0_0_8px_rgba(255,255,255,1)]">1</div>
                                    <h4 className="text-xl font-bold text-slate-900 mb-2">Find Building</h4>
                                    <p className="text-slate-500 font-medium text-sm">Browse our network of supported parking facilities on the interactive map.</p>
                                </div>
                            </Reveal>
                            <Reveal delay={200} direction="up">
                                <div className="relative flex flex-col items-center">
                                    <div className="w-16 h-16 bg-white text-blue-600 border-2 border-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-[0_0_0_8px_rgba(255,255,255,1)]">2</div>
                                    <h4 className="text-xl font-bold text-slate-900 mb-2">Book Slot</h4>
                                    <p className="text-slate-500 font-medium text-sm">Select your vehicle type, arrival time, and pay an advance fee to secure it.</p>
                                </div>
                            </Reveal>
                            <Reveal delay={300} direction="up">
                                <div className="relative flex flex-col items-center">
                                    <div className="w-16 h-16 bg-white text-blue-600 border-2 border-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-[0_0_0_8px_rgba(255,255,255,1)]">3</div>
                                    <h4 className="text-xl font-bold text-slate-900 mb-2">Park & Track</h4>
                                    <p className="text-slate-500 font-medium text-sm">Show your QR code to enter. Check your active session to track live duration.</p>
                                </div>
                            </Reveal>
                            <Reveal delay={400} direction="up">
                                <div className="relative flex flex-col items-center">
                                    <div className="w-16 h-16 bg-white text-blue-600 border-2 border-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-[0_0_0_8px_rgba(255,255,255,1)]">4</div>
                                    <h4 className="text-xl font-bold text-slate-900 mb-2">Checkout</h4>
                                    <p className="text-slate-500 font-medium text-sm">Pay any remaining overtime fees automatically via ZaloPay and exit smoothly.</p>
                                </div>
                            </Reveal>
                        </div>
                    </div>
                </div>
            </section>

            {/* PRICING SECTION */}
            <section className="min-h-[100svh] py-24 w-full px-[5%] md:px-[7%] bg-slate-50 flex flex-col justify-center snap-start" id="pricing">
                <div className="max-w-7xl mx-auto">
                    <Reveal>
                        <div className="text-center mb-16">
                            <h2 className="text-blue-600 font-bold tracking-widest text-sm uppercase mb-3">Transparent Pricing Policy</h2>
                            <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">How we calculate your fees.</h3>
                            <p className="mt-4 text-slate-500 text-lg font-medium max-w-2xl mx-auto">Our pricing is based on 4-hour blocks, ensuring you only pay for the time you need, with clear rules for day, night, and overtime parking.</p>
                        </div>
                    </Reveal>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-5xl mx-auto">
                        {/* Rule 1: Day Block */}
                        <Reveal delay={100} direction="up">
                            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all h-full flex flex-col">
                                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center mb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 mb-2">Day Block</h4>
                                <p className="text-slate-500 font-medium text-sm mb-6">Standard daytime parking rate.</p>

                                <div className="mb-6 flex items-baseline text-slate-900">
                                    <span className="text-3xl font-extrabold">06:00 - 18:00</span>
                                </div>
                                <ul className="space-y-4 mb-8 flex-grow">
                                    <li className="flex items-center gap-3 text-slate-700 font-medium text-sm"><CheckIcon /> 1 Block = 4 hours of parking</li>
                                    <li className="flex items-center gap-3 text-slate-700 font-medium text-sm"><CheckIcon /> Base rate depends on vehicle type</li>
                                    <li className="flex items-center gap-3 text-slate-700 font-medium text-sm"><CheckIcon /> Minimum charge is 1 block</li>
                                </ul>
                            </div>
                        </Reveal>

                        {/* Rule 2: Night Block */}
                        <Reveal delay={200} direction="up">
                            <div className="bg-blue-600 rounded-3xl p-8 border border-blue-500 shadow-xl shadow-blue-600/20 transform md:-translate-y-4 relative h-full flex flex-col">
                                <div className="w-12 h-12 bg-white/20 text-white rounded-xl flex items-center justify-center mb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
                                </div>
                                <h4 className="text-xl font-bold text-white mb-2">Night Block</h4>
                                <p className="text-blue-200 font-medium text-sm mb-6">Overnight and evening parking rate.</p>

                                <div className="mb-6 flex items-baseline text-white">
                                    <span className="text-3xl font-extrabold">18:00 - 06:00</span>
                                </div>
                                <ul className="space-y-4 mb-8 flex-grow">
                                    <li className="flex items-center gap-3 text-white font-medium text-sm"><CheckIcon /> 1 Block = 4 hours of parking</li>
                                    <li className="flex items-center gap-3 text-white font-medium text-sm"><CheckIcon /> Night rate depends on vehicle type</li>
                                    <li className="flex items-center gap-3 text-white font-medium text-sm"><CheckIcon /> Safe & secure overnight storage</li>
                                </ul>
                            </div>
                        </Reveal>

                        {/* Rule 3: Overtime */}
                        <Reveal delay={300} direction="up">
                            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all h-full flex flex-col">
                                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 mb-2">Overtime Policy</h4>
                                <p className="text-slate-500 font-medium text-sm mb-6">When you exceed your booked duration.</p>

                                <div className="mb-6 flex items-baseline text-slate-900">
                                    <span className="text-3xl font-extrabold">Auto-Surcharge</span>
                                </div>
                                <ul className="space-y-4 mb-8 flex-grow">
                                    <li className="flex items-center gap-3 text-slate-700 font-medium text-sm"><CheckIcon /> Overtime is charged per extra 4-hour block</li>
                                    <li className="flex items-center gap-3 text-slate-700 font-medium text-sm"><CheckIcon /> Crossing 18:00 triggers the Night rate</li>
                                    <li className="flex items-center gap-3 text-slate-700 font-medium text-sm"><CheckIcon /> Pay smoothly via VNPAY before exiting</li>
                                </ul>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION & FOOTER SECTION */}
            <section className="min-h-[100svh] pt-24 w-full flex flex-col justify-between snap-start bg-white border-t border-slate-100">
                <div className="flex-1 flex flex-col justify-center px-[5%] text-center pt-24">
                    <Reveal>
                        <div className="max-w-3xl mx-auto">
                            <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight text-slate-900">Ready to secure your spot?</h2>
                            <p className="text-slate-500 text-lg mb-10 font-medium">Join thousands of drivers who trust our facilities to manage and protect their vehicles every single day.</p>
                            <Link to="/find-parking" className="inline-block bg-blue-600 text-white px-10 py-4 font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-blue-500/30 tracking-wide no-underline">
                                Get Started Now
                            </Link>
                        </div>
                    </Reveal>
                </div>
                <Footer />
            </section>
        </div>
    );
};

export default HomePage;
