import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './DonorStatus.css';

const DonorStatus = () => {
  const [receiver, setReceiver] = useState(null);  // <-- ADD THIS
  const [donorInfo, setDonorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('/api/donors/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        

        if (response.data.success) {
          if (!response.data.isRegistered) {
            setError('You are not registered as a donor yet');
          } else {
            console.log('Donor Info received:', response.data.data);
            setDonorInfo(response.data.data);
          }
        } else {
          setError(response.data.message || 'Failed to fetch donor profile');
        }
      } catch (err) {
        console.error('Error fetching donor data:', err);
        if (err.response?.status === 404) {
          setError('You are not registered as a donor yet');
        } else if (err.response?.status === 401) {
          setError('Please log in again');
          navigate('/login');
        } else {
          setError('Error fetching donor data. Please try again later.');
        }
      } finally {
        setLoading(false);
      } 

    };

    fetchData();
  }, [navigate]);

  

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'active':
        return 'status-accepted';
      case 'rejected':
        return 'status-rejected';
      case 'inactive':
        return 'status-inactive';
      default:
        return 'status-pending';
    }
  };

  const getStatusMessage = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Your registration is pending approval from the admin. Please wait for confirmation.';
      case 'active':
        return 'Your registration has been approved. You can now receive blood donation requests.';
      case 'rejected':
        return 'Your registration has been rejected. Please contact support for more information.';
      case 'inactive':
        return 'Your account is currently inactive. Please contact support to reactivate.';
      default:
        return 'Your registration is pending approval from the admin. Please wait for confirmation.';
    }
  };

  if (loading) {
    return <div className="status-container">Loading...</div>;
  }

  if (error) {
    return (
      <div className="status-container">
        <div className="error-message">{error}</div>
        {error === 'You are not registered as a donor yet' && (
          <button 
            className="register-button"
            onClick={() => navigate('/donor/register')}
          >
            Register as Donor
          </button>
        )}
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="status-container">
      <h2>Donor Status</h2>
      {donorInfo && (
        <div className="donor-details">
          <div className="status-section">
            <h3>Registration Status</h3>
            <div className={`status-badge ${getStatusClass(donorInfo.status)}`}>
              {donorInfo.status === 'pending' ? 'Pending Approval' :
               donorInfo.status === 'active' ? 'Active Donor' :
               donorInfo.status === 'rejected' ? 'Registration Rejected' :
               donorInfo.status === 'inactive' ? 'Account Inactive' :
               'Pending Approval'}
            </div>
            <div className="status-message">
              {getStatusMessage(donorInfo.status)}
            </div>
          </div>

          <div className="info-section">
            <h3>Personal Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Name:</span>
                <span className="value">{donorInfo.fullName}</span>
              </div>
              <div className="info-item">
                <span className="label">Blood Type:</span>
                <span className="value">{donorInfo.bloodType}</span>
              </div>
              <div className="info-item">
                <span className="label">Contact:</span>
                <span className="value">{donorInfo.contactNumber}</span>
              </div>
            </div>
          </div>

          {donorInfo.status === 'active' && (
            <>
              <div className="info-section">
                <h3>Donation History</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Last Donation:</span>
                    <span className="value">{formatDate(donorInfo.lastDonationDate)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Donation Gap:</span>
                    <span className="value">{donorInfo.donationGapMonths || 0} months</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Total Donations:</span>
                    <span className="value">{donorInfo.totalDonations || 0}</span>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3>Location</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Address:</span>
                    <span className="value">{donorInfo.address}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">District:</span>
                    <span className="value">{donorInfo.district}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">State:</span>
                    <span className="value">{donorInfo.state}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Country:</span>
                    <span className="value">{donorInfo.country}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      {receiver && (
  <div className="info-section">
    <h3>Receiver Who Selected You</h3>
    <div className="info-grid">
      <div><span className="label">Name:</span> {receiver.receiverName}</div>
      <div><span className="label">Contact:</span> {receiver.receiverContact}</div>
      <div><span className="label">Blood Type:</span> {receiver.receiverBloodType}</div>
      <div><span className="label">Address:</span> {receiver.address}, {receiver.district}, {receiver.state}</div>
      <div><span className="label">Status:</span> {receiver.requestStatus}</div>
      <div><span className="label">Request Date:</span> {new Date(receiver.requestDate).toLocaleDateString()}</div>
    </div>
  </div>
)}

    </div>
  );
};

export default DonorStatus; 