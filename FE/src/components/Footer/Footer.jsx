import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-column">
          <h4 className="footer-title">Parking Building</h4>
          <a href="#">Book Parking</a>
          <a href="#">Sell Parking</a>
        </div>
        <div className="footer-column">
          <h4 className="footer-title">Company</h4>
          <a href="#">Company</a>
          <a href="#">Solutions</a>
        </div>
        <div className="footer-column">
          <h4 className="footer-title">Legal</h4>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
        <div className="footer-copyright">
          © 2024 Parking Building , Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
