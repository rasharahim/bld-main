import React from 'react';
import { Link } from 'react-router-dom';
import './ReceiverThanks.css';

const ReceiverThanks = () => {
  return (
    <div className="thanks-container">
      <div className="thanks-card">
        <div className="thanks-icon">
          <i className="fas fa-heartbeat"></i>
        </div>
        <h2>Thank You for Your Blood Request!</h2>
        <p className="thanks-message">
          Your blood request has been successfully submitted. Our team will review it and get back to you soon.
        </p>
        <div className="next-steps">
          <h3>Next Steps:</h3>
          <ul>
            <li>Check your request status in the dashboard</li>
            <li>We'll notify you when a matching donor is found</li>
            <li>Keep your contact information up to date</li>
          </ul>
        </div>
        <div className="thanks-actions">
          <Link to="/receiver/request-status" className="status-btn">
            Check Request Status
          </Link>
          <Link to="/dashboard" className="dashboard-btn">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ReceiverThanks; 