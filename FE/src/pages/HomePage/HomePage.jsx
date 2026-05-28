import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';

// SVG Icons
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const MapPinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#22c55e" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
const BuildingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></svg>;
const PlaneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.5l-1.8 1.8c-.3.3-.2.8.2 1l7 4-2.5 2.5L4 15l-1.5 1.5c-.2.2-.2.6 0 .8L6 20l2.7 3.5c.2.2.6.2.8 0L11 22l-1-2.6 2.5-2.5 4 7c.2.4.7.5 1 .2l1.8-1.8c.3-.2.6-.6.5-1.1Z" /></svg>;
const ReceiptIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 17.5v-11" /></svg>;
const ParkingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M9 17V7h4a3 3 0 0 1 0 6H9" /></svg>;

const HomePage = () => {
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    return (
        <div className="font-sans bg-white">
            <Header />

            {/* Hero Section */}
            <section className="relative min-h-[600px] flex items-center py-10 px-[5%] md:px-[10%] bg-cover bg-center text-white" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&q=80')` }}>
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/20 z-10"></div>
                <div className="relative z-20 flex flex-col gap-8 w-full max-w-[450px] animate-fade-in-up">
                    <h1 className="text-[40px] md:text-[52px] font-extrabold leading-[1.1] m-0 tracking-[-1px]">Parking made easy,<br />wherever you go</h1>

                    <div className="bg-white rounded-xl p-6 text-slate-800 shadow-[0_20px_40px_rgba(0,0,0,0.2)]">
                        <div className="flex mb-5 bg-slate-100 rounded-lg p-1">
                            <div className="flex-1 text-center py-3 rounded-md text-sm font-semibold cursor-pointer text-blue-600 bg-white shadow-sm transition-all duration-200">Hourly/Daily</div>
                            <div className="flex-1 text-center py-3 rounded-md text-sm font-semibold cursor-pointer text-slate-500 hover:text-slate-700 transition-all duration-200">Monthly</div>
                        </div>

                        <div className="flex items-center border border-slate-300 rounded-lg py-3.5 px-4 mb-4 transition-colors duration-200 focus-within:border-blue-500">
                            <span className="text-slate-400 flex"><SearchIcon /></span>
                            <input type="text" placeholder="Where are you going?" className="border-none outline-none w-full text-base ml-2.5 text-slate-900 placeholder:text-slate-400" />
                        </div>

                        {/* <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="flex-1 border border-slate-300 rounded-lg py-3 px-4 flex items-center gap-3">
                                <span className="text-slate-400 flex"><CalendarIcon /></span>
                                <div className="flex flex-col">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.5px] mb-1">START TIME</div>
                                    <div className="text-sm font-semibold text-slate-900">Today, 10:30 PM</div>
                                </div>
                            </div>
                            <div className="flex-1 border border-slate-300 rounded-lg py-3 px-4 flex items-center gap-3">
                                <span className="text-slate-400 flex"><ClockIcon /></span>
                                <div className="flex flex-col">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.5px] mb-1">END TIME</div>
                                    <div className="text-sm font-semibold text-slate-900">May 26, 1:30 AM</div>
                                </div>
                            </div>
                        </div> */}

                        <Link to="/find-parking" className="block text-center w-full bg-blue-600 text-white border-none py-4 rounded-lg text-base font-bold cursor-pointer transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] no-underline">Find Parking Spots</Link>
                    </div>
                </div>
            </section>

            {/* How SpotHero Works */}
            <section className="py-20 px-[10%] text-center bg-slate-50">
                <h2 className="text-[32px] font-extrabold text-slate-900 mb-14 animate-on-scroll slide-up">How Build Parking Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="bg-white p-10 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-transform duration-300 animate-on-scroll slide-up" style={{ transitionDelay: '0.1s' }}>
                        <div className="w-16 h-16 bg-sky-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"><SearchIcon /></div>
                        <h3 className="text-xl font-extrabold mb-4 text-slate-900">Look</h3>
                        <p className="text-slate-500 text-[15px] leading-[1.6]">Search and compare prices at thousands of parking facilities across North America.</p>
                    </div>
                    <div className="bg-white p-10 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-transform duration-300 animate-on-scroll slide-up" style={{ transitionDelay: '0.2s' }}>
                        <div className="w-16 h-16 bg-sky-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"><ReceiptIcon /></div>
                        <h3 className="text-xl font-extrabold mb-4 text-slate-900">Book</h3>
                        <p className="text-slate-500 text-[15px] leading-[1.6]">Pay securely and receive a prepaid parking pass instantly via email or in the app.</p>
                    </div>
                    <div className="bg-white p-10 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-transform duration-300 animate-on-scroll slide-up" style={{ transitionDelay: '0.3s' }}>
                        <div className="w-16 h-16 bg-sky-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"><ParkingIcon /></div>
                        <h3 className="text-xl font-extrabold mb-4 text-slate-900">Park</h3>
                        <p className="text-slate-500 text-[15px] leading-[1.6]">When you arrive, follow the instructions included in your pass, park, and go!</p>
                    </div>
                </div>
            </section>

            {/* Info Sections - using flex for row layout */}
            {/* <section className="flex flex-col lg:flex-row my-20 mx-[5%] md:mx-[10%] bg-slate-50 rounded-[20px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] animate-on-scroll fade-in">
                <div className="flex-1 min-h-[250px] md:min-h-[350px] bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1540039155732-611425dcbd25?auto=format&fit=crop&q=80)` }}></div>
                <div className="flex-1 p-10 md:p-[60px] flex flex-col justify-center">
                    <h2 className="text-[32px] font-extrabold mb-5 text-slate-900 tracking-[-0.5px]">Event Parking</h2>
                    <p className="text-slate-500 text-base leading-[1.6] mb-[30px]">Enjoy the convenience of booking a parking spot at the venue ahead of time, ensuring you have a space when you arrive for games, concerts, and more.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-[30px]">
                        <a href="#" className="text-blue-600 text-sm font-semibold flex items-center gap-2 hover:underline"><span className="flex"><MapPinIcon /></span> Madison Square Garden</a>
                        <a href="#" className="text-blue-600 text-sm font-semibold flex items-center gap-2 hover:underline"><span className="flex"><MapPinIcon /></span> Oracle Park</a>
                        <a href="#" className="text-blue-600 text-sm font-semibold flex items-center gap-2 hover:underline"><span className="flex"><MapPinIcon /></span> SoFi Stadium</a>
                        <a href="#" className="text-blue-600 text-sm font-semibold flex items-center gap-2 hover:underline"><span className="flex"><MapPinIcon /></span> Soldier Field</a>
                    </div>
                    <button className="self-start bg-blue-600 text-white border-none py-3 px-6 rounded-lg font-bold text-sm cursor-pointer transition-colors duration-200 hover:bg-blue-700">View All Stadiums</button>
                </div>
            </section> */}

            {/* Info Section Reversed */}
            {/* <section className="flex flex-col lg:flex-row-reverse my-20 mx-[5%] md:mx-[10%] bg-slate-50 rounded-[20px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] animate-on-scroll fade-in">
        <div className="flex-1 min-h-[250px] md:min-h-[350px] bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1587560699334-bea53191d5eb?auto=format&fit=crop&q=80)` }}></div>
        <div className="flex-1 p-10 md:p-[60px] flex flex-col justify-center">
          <h2 className="text-[32px] font-extrabold mb-5 text-slate-900 tracking-[-0.5px]">Airport Parking</h2>
          <p className="text-slate-500 text-base leading-[1.6] mb-[30px]">Search for the best parking deals near the airport, compare prices and book a reservation ahead of time. Search for long-term parking, valet service, and more.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-[30px]">
            <a href="#" className="text-blue-600 text-sm font-semibold flex items-center gap-2 hover:underline"><span className="flex"><PlaneIcon /></span> ORD Airport</a>
            <a href="#" className="text-blue-600 text-sm font-semibold flex items-center gap-2 hover:underline"><span className="flex"><PlaneIcon /></span> SFO Airport</a>
            <a href="#" className="text-blue-600 text-sm font-semibold flex items-center gap-2 hover:underline"><span className="flex"><PlaneIcon /></span> JFK Airport</a>
            <a href="#" className="text-blue-600 text-sm font-semibold flex items-center gap-2 hover:underline"><span className="flex"><PlaneIcon /></span> LAX Airport</a>
          </div>
          <button className="self-start bg-blue-600 text-white border-none py-3 px-6 rounded-lg font-bold text-sm cursor-pointer transition-colors duration-200 hover:bg-blue-700">View All Airports</button>
        </div>
      </section> */}

            {/* Monthly Parking */}
            <section className="flex flex-col lg:flex-row my-20 mx-[5%] md:mx-[10%] bg-slate-50 rounded-[20px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] animate-on-scroll fade-in">
                <div className="flex-1 min-h-[250px] md:min-h-[350px] bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80)` }}></div>
                <div className="flex-1 p-10 md:p-[60px] flex flex-col justify-center">
                    <h2 className="text-[32px] font-extrabold mb-5 text-slate-900 tracking-[-0.5px]">Monthly Parking</h2>
                    <p className="text-slate-500 text-base leading-[1.6] mb-[30px]">Search for secure monthly parking facilities that make it easy to park near your home or office.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-[30px]">
                        <a href="#" className="text-blue-600 text-sm font-semibold flex items-center gap-2 hover:underline"><span className="flex"><BuildingIcon /></span> NYC Monthly</a>
                        <a href="#" className="text-blue-600 text-sm font-semibold flex items-center gap-2 hover:underline"><span className="flex"><BuildingIcon /></span> Chicago Monthly</a>
                        <a href="#" className="text-blue-600 text-sm font-semibold flex items-center gap-2 hover:underline"><span className="flex"><BuildingIcon /></span> San Francisco Monthly</a>
                        <a href="#" className="text-blue-600 text-sm font-semibold flex items-center gap-2 hover:underline"><span className="flex"><BuildingIcon /></span> Toronto Monthly</a>
                    </div>
                    <button className="self-start bg-blue-600 text-white border-none py-3 px-6 rounded-lg font-bold text-sm cursor-pointer transition-colors duration-200 hover:bg-blue-700">View All Cities</button>
                </div>
            </section>

            {/* Stats Section */}
            <section className="text-center py-20 px-[10%] bg-white animate-on-scroll slide-up">
                <h2 className="text-[24px] font-extrabold text-slate-900 mb-10">Pay and Park with Confidence</h2>
                <div className="flex justify-center flex-wrap gap-[50px] md:gap-[100px] mt-[50px]">
                    <div className="flex flex-col items-center gap-3">
                        <div className="text-[56px] font-extrabold text-blue-600 flex items-center gap-2 tracking-[-1px]">4.8 <span className="text-[28px] text-[#22c55e] flex"><StarIcon /></span></div>
                        <div className="text-lg font-extrabold text-slate-900">App Store Rating</div>
                        <div className="text-sm text-slate-500">We have a 4.8 in the App Store</div>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <div className="text-[56px] font-extrabold text-blue-600 flex items-center gap-2 tracking-[-1px]">100M+</div>
                        <div className="text-lg font-extrabold text-slate-900">Cars Parked</div>
                        <div className="text-sm text-slate-500">We've parked over 100 million cars</div>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <div className="text-[56px] font-extrabold text-blue-600 flex items-center gap-2 tracking-[-1px]">2011</div>
                        <div className="text-lg font-extrabold text-slate-900">Established</div>
                        <div className="text-sm text-slate-500">We've been around since 2011</div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default HomePage;
