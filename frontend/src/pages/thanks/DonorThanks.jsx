import React from 'react';
import { Link } from 'react-router-dom';
import './DonorThanks.css';

const DonorThanks = () => {
  return (
    <div className="thanks-container">
      <div className="thanks-content">
        <h1>Thank You for Registering as a Donor!</h1>
        <p>Your registration has been successfully submitted. We appreciate your willingness to help save lives.</p>
        
        <div className="next-steps">
          <h2>Next Steps</h2>
          <ul>
            <li>Your donor profile will be reviewed by our team</li>
            <li>You'll receive a notification once your profile is approved</li>
            <li>You can check your donor status in your dashboard</li>
          </ul>
        </div>

        <div className="actions">
          <Link to="/dashboard" className="dashboard-btn">
            Go to Dashboard
          </Link>
          <Link to="/" className="home-btn">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DonorThanks; 