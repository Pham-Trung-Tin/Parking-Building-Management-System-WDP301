import React, { useEffect } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import './HomePage.css';

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
        <div className="home-page">
            <Header />

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-overlay"></div>
                <div className="hero-content animate-fade-in-up">
                    <h1 className="hero-title">Parking made easy,<br />wherever you go</h1>

                    <div className="hero-card">
                        <div className="tabs">
                            <div className="tab active">Hourly/Daily</div>
                            <div className="tab">Monthly</div>
                        </div>

                        <div className="search-input">
                            <span className="icon"><SearchIcon /></span>
                            <input type="text" placeholder="Where are you going?" />
                        </div>

                        <div className="date-time-inputs">
                            <div className="dt-group">
                                <span className="icon"><CalendarIcon /></span>
                                <div className="dt-text">
                                    <div className="dt-label">START TIME</div>
                                    <div className="dt-value">Today, 10:30 PM</div>
                                </div>
                            </div>
                            <div className="dt-group">
                                <span className="icon"><ClockIcon /></span>
                                <div className="dt-text">
                                    <div className="dt-label">END TIME</div>
                                    <div className="dt-value">May 26, 1:30 AM</div>
                                </div>
                            </div>
                        </div>

                        <button className="btn-primary">Find Parking Spots</button>
                    </div>
                </div>
            </section>

            {/* How SpotHero Works */}
            <section className="how-it-works">
                <h2 className="section-title animate-on-scroll slide-up">How Build Parking Works</h2>
                <div className="steps-container">
                    <div className="step-card animate-on-scroll slide-up" style={{ transitionDelay: '0.1s' }}>
                        <div className="step-icon"><SearchIcon /></div>
                        <h3 className="step-title">Look</h3>
                        <p className="step-desc">Search and compare prices at thousands of parking facilities across North America.</p>
                    </div>
                    <div className="step-card animate-on-scroll slide-up" style={{ transitionDelay: '0.2s' }}>
                        <div className="step-icon"><ReceiptIcon /></div>
                        <h3 className="step-title">Book</h3>
                        <p className="step-desc">Pay securely and receive a prepaid parking pass instantly via email or in the app.</p>
                    </div>
                    <div className="step-card animate-on-scroll slide-up" style={{ transitionDelay: '0.3s' }}>
                        <div className="step-icon"><ParkingIcon /></div>
                        <h3 className="step-title">Park</h3>
                        <p className="step-desc">When you arrive, follow the instructions included in your pass, park, and go!</p>
                    </div>
                </div>
            </section>

            {/* Event Parking */}
            <section className="info-section animate-on-scroll fade-in">
                <div className="info-image" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1540039155732-611425dcbd25?auto=format&fit=crop&q=80)` }}></div>
                <div className="info-content">
                    <h2 className="info-title">Event Parking</h2>
                    <p className="info-desc">Enjoy the convenience of booking a parking spot at the venue ahead of time, ensuring you have a space when you arrive for games, concerts, and more.</p>
                    <div className="links-grid">
                        <a href="#" className="link-item"><span className="icon"><MapPinIcon /></span> Madison Square Garden</a>
                        <a href="#" className="link-item"><span className="icon"><MapPinIcon /></span> Oracle Park</a>
                        <a href="#" className="link-item"><span className="icon"><MapPinIcon /></span> SoFi Stadium</a>
                        <a href="#" className="link-item"><span className="icon"><MapPinIcon /></span> Soldier Field</a>
                    </div>
                    <button className="btn-outline">View All Stadiums</button>
                </div>
            </section>

            {/* Airport Parking */}
            <section className="info-section reverse animate-on-scroll fade-in">
                <div className="info-image" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1587560699334-bea53191d5eb?auto=format&fit=crop&q=80)` }}></div>
                <div className="info-content">
                    <h2 className="info-title">Airport Parking</h2>
                    <p className="info-desc">Search for the best parking deals near the airport, compare prices and book a reservation ahead of time. Search for long-term parking, valet service, and more.</p>
                    <div className="links-grid">
                        <a href="#" className="link-item"><span className="icon"><PlaneIcon /></span> ORD Airport</a>
                        <a href="#" className="link-item"><span className="icon"><PlaneIcon /></span> SFO Airport</a>
                        <a href="#" className="link-item"><span className="icon"><PlaneIcon /></span> JFK Airport</a>
                        <a href="#" className="link-item"><span className="icon"><PlaneIcon /></span> LAX Airport</a>
                    </div>
                    <button className="btn-outline">View All Airports</button>
                </div>
            </section>

            {/* Monthly Parking */}
            <section className="info-section animate-on-scroll fade-in">
                <div className="info-image" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80)` }}></div>
                <div className="info-content">
                    <h2 className="info-title">Monthly Parking</h2>
                    <p className="info-desc">Search for secure monthly parking facilities that make it easy to park near your home or office.</p>
                    <div className="links-grid">
                        <a href="#" className="link-item"><span className="icon"><BuildingIcon /></span> NYC Monthly</a>
                        <a href="#" className="link-item"><span className="icon"><BuildingIcon /></span> Chicago Monthly</a>
                        <a href="#" className="link-item"><span className="icon"><BuildingIcon /></span> San Francisco Monthly</a>
                        <a href="#" className="link-item"><span className="icon"><BuildingIcon /></span> Toronto Monthly</a>
                    </div>
                    <button className="btn-outline">View All Cities</button>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section animate-on-scroll slide-up">
                <h2 className="section-title" style={{ fontSize: '24px', marginBottom: '40px' }}>Pay and Park with Confidence</h2>
                <div className="stats-grid">
                    <div className="stat-item">
                        <div className="stat-number">4.8 <span className="star-icon"><StarIcon /></span></div>
                        <div className="stat-title">App Store Rating</div>
                        <div className="stat-desc">We have a 4.8 in the App Store</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">100M+</div>
                        <div className="stat-title">Cars Parked</div>
                        <div className="stat-desc">We've parked over 100 million cars</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">2011</div>
                        <div className="stat-title">Established</div>
                        <div className="stat-desc">We've been around since 2011</div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default HomePage;
