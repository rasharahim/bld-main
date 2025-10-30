import React from 'react';
import { Link, useLocation } from 'react-router-dom'; // Import useLocation
import '../ThanksStyles.css';

const DonorThankYou = () => {
  const location = useLocation(); // Now useLocation is correctly imported
  const { donorId, message } = location.state || {};

  return (
    <div className="thank-you-container">
      <div className="thank-you-card">
        <h1>Thank You for Registering as a Donor!</h1>
        <div className="icon-container">
          <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>

        <div className="info-section">
          <h2>What Happens Next?</h2>
          <ul>
            <li>Your information has been added to our donor database</li>
            <li>You may be contacted when there's a matching blood request in your area</li>
            <li>We'll notify you about upcoming blood donation camps</li>
          </ul>
        </div>

        <div className="quick-links">
          <h3>Quick Links</h3>
          <div className="link-buttons">
            <Link to="/donation-guidelines" className="link-button">
              Donation Guidelines
            </Link>
            <Link to="/donation-centers" className="link-button">
              Nearby Donation Centers
            </Link>
            <Link to="/donor/status" className="link-button">
              Check Your Status
            </Link>
          </div>
        </div>

        <div className="share-section">
          <p>Help us spread the word:</p>
          <div className="social-share">
            <button className="social-button facebook">Share on Facebook</button>
            <button className="social-button twitter">Share on Twitter</button>
            <button className="social-button whatsapp">Share on WhatsApp</button>
          </div>
        </div>

        <div className="return-home">
          <Link to="/" className="home-link">
            ← Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DonorThankYou;
