import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import auth from "../../../utils/auth";
import "./DonorStatus.css";

const DonorStatusPage = () => {
  const { donorId } = useParams();
  const [donorStatus, setDonorStatus] = useState("pending");
  const [donorInfo, setDonorInfo] = useState(null);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDonorStatus = async () => {
      try {
        const userId = auth.getTokenPayload()?.id;
        if (!userId) {
          throw new Error('User not authenticated');
        }

        let response;
        if (donorId) {
          // If donorId is provided in URL, fetch that specific donor's status
          response = await axios.get(`/api/donors/${donorId}/status`, {
            headers: {
              Authorization: `Bearer ${auth.getToken()}`
            }
          });
        } else {
          // Otherwise fetch the current user's donor status
          response = await axios.get(`/api/donors/user/${userId}/status`, {
            headers: {
              Authorization: `Bearer ${auth.getToken()}`
            }
          });
        }

        if (response.data.success) {
          setDonorStatus(response.data.status);
          setDonorInfo(response.data.donor);
          if (response.data.status === 'approved') {
            fetchBloodRequests(response.data.donor.id);
          }
        } else {
          setError(response.data.message || 'Failed to fetch donor status');
        }
      } catch (err) {
        console.error('Error fetching donor status:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch donor status');
      } finally {
        setLoading(false);
      }
    };

    fetchDonorStatus();
  }, [donorId]);

  const fetchBloodRequests = async (id) => {
    try {
      const response = await axios.get(`/api/donors/${id}/blood-requests`, {
        headers: {
          Authorization: `Bearer ${auth.getToken()}`
        }
      });
      if (response.data.success) {
        setBloodRequests(response.data.requests || []);
      }
    } catch (err) {
      console.error('Error fetching blood requests:', err);
      setError(err.response?.data?.message || 'Failed to fetch blood requests');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const response = await axios.post(`/api/donors/${donorId}/accept-request`, {
        requestId: requestId
      }, {
        headers: {
          Authorization: `Bearer ${auth.getToken()}`
        }
      });

      if (response.data.success) {
        alert('Request accepted! You can now contact the receiver.');
        fetchBloodRequests(donorId); // Refresh the list
      } else {
        throw new Error(response.data.message || 'Failed to accept request');
      }
    } catch (err) {
      console.error('Error accepting request:', err);
      alert(err.message || 'Error accepting request');
    }
  };

  if (loading) {
    return (
      <div className="status-container">
        <div className="loading">Loading donor status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="status-container">
      <h1>Donor Status</h1>
      
      {donorInfo && (
        <div className="donor-info">
          <h2>Donor Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Name:</label>
              <span>{donorInfo.fullName}</span>
            </div>
            <div className="info-item">
              <label>Blood Type:</label>
              <span>{donorInfo.bloodType}</span>
            </div>
            <div className="info-item">
              <label>Registration Date:</label>
              <span>{formatDate(donorInfo.registeredDate)}</span>
            </div>
            <div className="info-item">
              <label>Last Donation:</label>
              <span>{formatDate(donorInfo.lastDonationDate)}</span>
            </div>
            {donorInfo.donationGapMonths && (
              <div className="info-item">
                <label>Donation Gap:</label>
                <span>{donorInfo.donationGapMonths} months</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {donorStatus === "pending" && (
        <div className="status-message pending">
          <p>Your donation application is under review. Please wait for admin approval.</p>
        </div>
      )}

      {donorStatus === "rejected" && (
        <div className="status-message rejected">
          <p>Your donation application has been rejected. Please contact support for more information.</p>
        </div>
      )}

      {donorStatus === "approved" && (
        <div className="status-message approved">
          <p>Your donor status is <strong>Approved</strong>. You can now accept blood requests.</p>
          
          <div className="blood-requests-section">
            <h2>Nearby Blood Requests</h2>
            {bloodRequests.length > 0 ? (
              <div className="request-list">
                {bloodRequests.map(request => (
                  <div key={request.id} className="request-card">
                    <div className="request-info">
                      <h3>{request.user_name}</h3>
                      <p><strong>Blood Type:</strong> {request.blood_type}</p>
                      <p><strong>Distance:</strong> {request.distance.toFixed(1)} km</p>
                      <p><strong>Location:</strong> {request.address}</p>
                      {request.urgency && (
                        <p className="urgency"><strong>Urgency:</strong> {request.urgency}</p>
                      )}
                      {request.additional_notes && (
                        <p className="notes"><strong>Notes:</strong> {request.additional_notes}</p>
                      )}
                    </div>
                    <button 
                      className="accept-btn"
                      onClick={() => handleAcceptRequest(request.id)}
                    >
                      Accept Request
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-requests">No blood requests available in your area at the moment.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorStatusPage;