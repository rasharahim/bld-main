import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaArrowRight } from 'react-icons/fa';
import '../FormStyles.css';

const ReceiverThanks = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { requestId } = location.state || {};

  const handleCheckStatus = () => {
    if (requestId) {
      console.log("Navigating to status with ID:", requestId);
      navigate(`/receiver/status/${requestId}`);
    } else {
      console.error('No request ID found in location state');
      navigate('/dashboard');
    }
  };

  return (
    <div className="form-container thanks-container">
      <div className="thanks-content">
        <FaCheckCircle className="success-icon" />
        <h2>Request Submitted Successfully!</h2>
        <p>Your blood request has been submitted and is being processed.</p>
        <p>Request ID: {requestId}</p>
        <p>You can check the status of your request by clicking the button below.</p>
        
        <button 
          className="submit-btn check-status-btn"
          onClick={handleCheckStatus}
        >
          Check Request Status <FaArrowRight className="btn-icon" />
        </button>
      </div>
    </div>
  );
};

export default ReceiverThanks;