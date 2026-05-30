import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../../components/Footer/Footer';

// Reveal Component for scroll animations
const Reveal = ({ children, delay = 0, className = "" }) => {
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

    return (
        <div
            ref={ref}
            className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

// SVG Icons
const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
);

const SearchIcon = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
const ReceiptIcon = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 17.5v-11" /></svg>;
const ParkingIcon = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M9 17V7h4a3 3 0 0 1 0 6H9" /></svg>;

const HomePage = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        // Initial scroll to top on load
        window.scrollTo(0, 0);

        // Sticky header logic
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <div className="font-sans overflow-x-hidden bg-white">
            {/* HERO SECTION */}
            <section className="relative min-h-screen w-full bg-[#f4f5f7]">
                {/* Background Video */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                    >
                        <source src="https://res.cloudinary.com/dgz3rhiv4/video/upload/v1780037325/Parking_lot_dashboard_simulation__202605291347_chy2on.mp4" type="video/mp4" />
                    </video>
                    {/* Dark overlay to make the text pop and give a cinematic feel */}
                    <div className="absolute inset-0 bg-black/50 pointer-events-none"></div>
                </div>

                {/* Sticky Navigation Bar */}
                <nav className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-[5%] transition-all duration-300 ${isScrolled ? 'py-4 bg-white/90 backdrop-blur-md shadow-md text-black' : 'py-8 bg-transparent text-white'}`}>
                    <Link to="/" className="text-[18px] font-bold tracking-tight no-underline text-inherit">
                        PARKING<span className="text-blue-600">BUILDING</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-8 lg:gap-12 text-[15px] font-bold text-inherit opacity-90">
                        <Link to="/find-parking" className="hover:text-blue-600 transition-colors no-underline text-inherit py-2">Find Parking</Link>
                        <Link to="/booking" className="hover:text-blue-600 transition-colors no-underline text-inherit py-2">Book a Slot</Link>
                        <Link to="/contact" className="hover:text-blue-600 transition-colors no-underline text-inherit py-2">Support & Feedback</Link>

                    </div>
                    <div className="flex items-center gap-6 text-[15px] font-bold text-inherit">
                        <Link to="/login" className="hover:text-blue-600 transition-colors no-underline text-inherit">Login</Link>
                        <Link to="/register" className="bg-blue-600 text-white px-5 py-2.5 rounded-sm hover:bg-blue-700 transition-colors no-underline shadow-lg hover:shadow-blue-500/30">Sign Up</Link>
                    </div>
                </nav>

                {/* Main Content */}
                <main className="relative z-10 flex flex-col md:flex-row justify-between items-center px-[5%] md:px-[7%] pt-[15vh] pb-10 min-h-[calc(100vh-100px)] pointer-events-none">

                    {/* Left Side Typography */}
                    <Reveal className="w-full md:w-[50%] mb-10 md:mb-0 flex justify-start pointer-events-auto" delay={100}>
                        <h1 className="text-[64px] md:text-[80px] lg:text-[96px] font-extrabold leading-[1.05] text-white tracking-tighter drop-shadow-lg">
                            Parking<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Redefined</span>
                        </h1>
                    </Reveal>

                    {/* Right Side Text and Button */}
                    <Reveal className="w-full md:w-[45%] flex flex-col items-start md:items-start md:pl-[10%] text-left mt-10 md:mt-[30vh] pointer-events-auto" delay={300}>
                        <p className="text-white/90 text-[18px] leading-[1.6] mb-8 max-w-[400px] font-medium drop-shadow-md">
                            We provide an unrivaled standard of parking convenience, securing and protecting your automotive investment with absolute precision.
                        </p>
                        <Link
                            to="/find-parking"
                            className="bg-white text-black px-10 py-[18px] text-[15px] font-bold hover:bg-blue-600 hover:text-white transition-all duration-300 no-underline rounded-none flex items-center justify-center tracking-wide shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-1"
                        >
                            Get a Spot
                        </Link>
                    </Reveal>
                </main>
            </section>

            {/* PREMIUM FEATURES SECTION */}
            <section className="relative py-32 px-[5%] md:px-[10%] bg-[#0f1115] overflow-hidden" id="services">
                {/* Dynamic dark automotive background */}
                <div className="absolute inset-0 bg-[#0f1115]">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540039155732-611425dcbd25?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-15 mix-blend-luminosity"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0f1115] via-[#0f1115]/80 to-[#0f1115]"></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <Reveal>
                        <div className="flex flex-col md:flex-row gap-16 justify-between items-end mb-24">
                            <div className="w-full md:w-1/2">
                                <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6">Seamless <span className="text-blue-500">Experience</span></h2>
                                <p className="text-gray-400 text-lg leading-relaxed font-medium">Experience a new standard of facility management. We integrate cutting-edge technology to ensure your vehicle is safe, accessible, and maintained to perfection.</p>
                            </div>
                            <div className="w-full md:w-auto">
                                <Link to="/find-parking" className="inline-block border-b-2 border-white pb-1 text-white font-bold hover:text-blue-500 hover:border-blue-500 transition-colors">Explore All Services &rarr;</Link>
                            </div>
                        </div>
                    </Reveal>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {/* Feature 1 */}
                        <Reveal delay={100} className="h-full">
                            <div className="h-full group relative bg-[#1a1c23]/80 backdrop-blur-md p-10 rounded-2xl overflow-hidden hover:bg-[#22252e] transition-colors duration-500 cursor-pointer border border-gray-800 hover:border-blue-500/50 shadow-2xl">
                                <div className="text-blue-500 mb-8 group-hover:text-blue-400 transition-colors transform group-hover:scale-110 duration-500 origin-left">
                                    <SearchIcon size={48} />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">Smart Search</h3>
                                <p className="text-gray-400 font-medium leading-relaxed">Find and secure the perfect spot in seconds. Our real-time tracking ensures you never waste time driving in circles.</p>
                            </div>
                        </Reveal>
                        {/* Feature 2 */}
                        <Reveal delay={300} className="h-full">
                            <div className="h-full group relative bg-[#1a1c23]/80 backdrop-blur-md p-10 rounded-2xl overflow-hidden hover:bg-[#22252e] transition-colors duration-500 cursor-pointer border border-gray-800 hover:border-blue-500/50 shadow-2xl">
                                <div className="text-blue-500 mb-8 group-hover:text-blue-400 transition-colors transform group-hover:scale-110 duration-500 origin-left">
                                    <ReceiptIcon size={48} />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">Instant Booking</h3>
                                <p className="text-gray-400 font-medium leading-relaxed">Reserve your spot instantly with contactless payment. Get your digital pass and drive straight in without hassle.</p>
                            </div>
                        </Reveal>
                        {/* Feature 3 */}
                        <Reveal delay={500} className="h-full">
                            <div className="h-full group relative bg-[#1a1c23]/80 backdrop-blur-md p-10 rounded-2xl overflow-hidden hover:bg-[#22252e] transition-colors duration-500 cursor-pointer border border-gray-800 hover:border-blue-500/50 shadow-2xl">
                                <div className="text-blue-500 mb-8 group-hover:text-blue-400 transition-colors transform group-hover:scale-110 duration-500 origin-left">
                                    <ParkingIcon size={48} />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">Secure Facilities</h3>
                                <p className="text-gray-400 font-medium leading-relaxed">24/7 surveillance and automated entry systems protect your automotive investment with scientific precision.</p>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* INTERACTIVE SHOWCASE SECTION */}
            <section className="relative py-32 px-[5%] md:px-[10%] text-white overflow-hidden" id="gallery">
                {/* Premium automotive dark background */}
                <div className="absolute inset-0 bg-[#08080a]">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=2560&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-transparent to-[#08080a]"></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row gap-16 items-center">
                    <Reveal className="w-full lg:w-1/2">
                        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-10 leading-tight">Upgrade parking  <span className="text-blue-500">services.</span></h2>
                        <div className="space-y-8">
                            <div className="border-l-4 border-blue-600 pl-6 transform hover:translate-x-2 transition-transform cursor-default">
                                <h4 className="text-xl font-bold mb-2 text-white">Climate-Controlled Parking</h4>
                                <p className="text-gray-400 font-medium">Preservation Made Effortless: Advanced temperature and humidity management ensures your vehicle is shielded from harsh weather conditions year-round, maintaining its pristine state without you lifting a finger.</p>
                            </div>
                            <div className="border-l-4 border-gray-800 pl-6 hover:border-blue-600 transform hover:translate-x-2 transition-all cursor-default">
                                <h4 className="text-xl font-bold mb-2 text-white">On-Site EV Fast-Charging</h4>
                                <p className="text-gray-400 font-medium">Park and Recharge Seamlessly: Premium, easily accessible parking bays equipped with high-speed EV charging infrastructure, ensuring your vehicle is powered up and ready to roll when you are.</p>
                            </div>
                            <div className="border-l-4 border-gray-800 pl-6 hover:border-blue-600 transform hover:translate-x-2 transition-all cursor-default">
                                <h4 className="text-xl font-bold mb-2 text-white">Premium Valet & Guest Services</h4>
                                <p className="text-gray-400 font-medium">The Ultimate Frictionless Experience: Enjoy the convenience of professional valet parking and on-demand detailing services. Simply drop off your keys and let our dedicated team handle the rest.</p>
                            </div>
                        </div>
                    </Reveal>
                    <Reveal className="w-full lg:w-1/2" delay={300}>
                        <div className="relative h-[500px] lg:h-[600px] rounded-2xl overflow-hidden group border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                            {/* Using a reliable image link for the gallery image */}
                            <img src="https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=2000" alt="Premium Parking Garage" className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-10">
                                <div>
                                    <div className="text-blue-500 font-bold mb-2 tracking-widest text-sm">PREMIUM WING</div>
                                    <h3 className="text-3xl font-bold text-white">The Platinum Garage</h3>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* CALL TO ACTION */}
            <section className="relative py-32 px-[5%] text-center overflow-hidden">
                {/* Dynamic CTA Background */}
                <div className="absolute inset-0 bg-blue-00">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2560&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-green-500/60"></div>
                </div>

                <Reveal>
                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-white drop-shadow-lg">Ready to park with confidence?</h2>
                        <p className="text-blue-100 text-lg mb-10 font-medium max-w-2xl mx-auto drop-shadow-md">Join thousands of drivers who trust our facilities to secure their vehicles every single day.</p>
                        <Link to="/find-parking" className="inline-block bg-white text-black px-12 py-5 font-bold rounded-sm hover:bg-gray-100 transition-colors shadow-2xl hover:-translate-y-1 tracking-wide">
                            Find Your Spot Now
                        </Link>
                    </div>
                </Reveal>
            </section>

            <Footer />
        </div>
    );
};

export default HomePage;
