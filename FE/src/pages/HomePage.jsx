import React from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <Header />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">Parking made easy,<br/>wherever you go</h1>
          
          <div className="hero-card">
            <div className="tabs">
              <div className="tab active">Hourly/Daily</div>
              <div className="tab">Monthly</div>
            </div>
            
            <div className="search-input">
              <span className="icon">🔍</span>
              <input type="text" placeholder="Where are you going?" />
            </div>
            
            <div className="date-time-inputs">
              <div className="dt-group">
                <span className="icon">🗓️</span>
                <div className="dt-text">
                  <div className="dt-label">START TIME</div>
                  <div className="dt-value">Today, 10:30 PM</div>
                </div>
              </div>
              <div className="dt-group">
                <span className="icon">🕒</span>
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
        <h2 className="section-title">How SpotHero Works</h2>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-icon">🔍</div>
            <h3 className="step-title">Look</h3>
            <p className="step-desc">Search and compare prices at thousands of parking facilities across North America.</p>
          </div>
          <div className="step-card">
            <div className="step-icon">🧾</div>
            <h3 className="step-title">Book</h3>
            <p className="step-desc">Pay securely and receive a prepaid parking pass instantly via email or in the app.</p>
          </div>
          <div className="step-card">
            <div className="step-icon">🅿️</div>
            <h3 className="step-title">Park</h3>
            <p className="step-desc">When you arrive, follow the instructions included in your pass, park, and go!</p>
          </div>
        </div>
      </section>

      {/* Event Parking */}
      <section className="info-section">
        <div className="info-image" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1540039155732-611425dcbd25?auto=format&fit=crop&q=80)` }}></div>
        <div className="info-content">
          <h2 className="info-title">Event Parking</h2>
          <p className="info-desc">Enjoy the convenience of booking a parking spot at the venue ahead of time, ensuring you have a space when you arrive for games, concerts, and more.</p>
          <div className="links-grid">
            <a href="#" className="link-item"><span className="icon">🏟️</span> Madison Square Garden</a>
            <a href="#" className="link-item"><span className="icon">🏟️</span> Oracle Park</a>
            <a href="#" className="link-item"><span className="icon">🏟️</span> SoFi Stadium</a>
            <a href="#" className="link-item"><span className="icon">🏟️</span> Soldier Field</a>
          </div>
          <button className="btn-outline">View All Stadiums</button>
        </div>
      </section>

      {/* Airport Parking */}
      <section className="info-section reverse">
        <div className="info-image" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1587560699334-bea53191d5eb?auto=format&fit=crop&q=80)` }}></div>
        <div className="info-content">
          <h2 className="info-title">Airport Parking</h2>
          <p className="info-desc">Search for the best parking deals near the airport, compare prices and book a reservation ahead of time. Search for long-term parking, valet service, and more.</p>
          <div className="links-grid">
            <a href="#" className="link-item"><span className="icon">✈️</span> ORD Airport</a>
            <a href="#" className="link-item"><span className="icon">✈️</span> SFO Airport</a>
            <a href="#" className="link-item"><span className="icon">✈️</span> JFK Airport</a>
            <a href="#" className="link-item"><span className="icon">✈️</span> LAX Airport</a>
          </div>
          <button className="btn-outline">View All Airports</button>
        </div>
      </section>

      {/* Monthly Parking */}
      <section className="info-section">
        <div className="info-image" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80)` }}></div>
        <div className="info-content">
          <h2 className="info-title">Monthly Parking</h2>
          <p className="info-desc">Search for secure monthly parking facilities that make it easy to park near your home or office.</p>
          <div className="links-grid">
            <a href="#" className="link-item"><span className="icon">🏙️</span> NYC Monthly</a>
            <a href="#" className="link-item"><span className="icon">🏙️</span> Chicago Monthly</a>
            <a href="#" className="link-item"><span className="icon">🏙️</span> San Francisco Monthly</a>
            <a href="#" className="link-item"><span className="icon">🏙️</span> Toronto Monthly</a>
          </div>
          <button className="btn-outline">View All Cities</button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <h2 className="section-title" style={{ fontSize: '24px', marginBottom: '40px' }}>Pay and Park with Confidence</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number">4.8 <span className="star-icon">★</span></div>
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
