import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../config/axios';
import './ReceiverStatus.css';

const ReceiverStatus = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matchingDonors, setMatchingDonors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching requests...');
        
        const response = await axios.get('/api/receivers/my-requests');
        console.log('Received requests:', response.data.requests);
        setRequests(response.data.requests);
        console.log("test",requests);
        

        // For each approved request without a selected donor, fetch matching donors
        for (const request of response.data.requests) {
          if (request.status === 'approved' && !request.selected_donor_id) {
            try {
              console.log('Fetching donors for request:', request.id);
              const donorsResponse = await axios.get(`/api/receivers/${request.id}/location-donors`);
              
              console.log('Received donors:', donorsResponse.data.donors);
              setMatchingDonors(prev => ({
                ...prev,
                [request.id]: donorsResponse.data.donors
              }));
            } catch (error) {
              console.error('Error fetching matching donors:', error);
              console.error('Error details:', error.response?.data || error.message);
              // Don't set error state here, just log it
            }
          }
        }
      } catch (error) {
        console.error('Error fetching requests:', error);
        setError(error.response?.data?.message || 'Failed to fetch requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [navigate]);

  const selectDonor = async (requestId, donorId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      '/api/receivers/select-donor',
      { requestId, donorId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.success) {
      toast.success('Donor selected successfully');

      // Find the full donor object that was selected
      const selectedDonor = matchingDonors[requestId]?.find(d => d.id === donorId);

      // Update the local request state with full donor details
      setRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? { ...req, status: 'matched', selectedDonor: selectedDonor || null }
            : req
        )
      );

      // Remove donor list (optional)
      setMatchingDonors(prev => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });
    }
  } catch (error) {
    console.error('Error selecting donor:', error);
    toast.error('Failed to select donor');
  }
};


  if (loading) return <div className="receiver-status-container"><div className="loading">Loading blood requests...</div></div>;
  if (error) return <div className="receiver-status-container"><div className="error">{error}</div></div>;

  return (
    <div className="receiver-status-container">
      <h2>My Blood Requests</h2>
      {requests.length === 0 ? (
        <div className="no-requests">
          <p>You haven't made any blood requests yet.</p>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map((request) => (
            <div key={request.id} className="request-card">
              <div className="request-header">
                <h3>Blood Request #{request.id}</h3>
                <span className={`status-badge ${request.status?.toLowerCase()}`}>
                  {request.status}
                </span>
              </div>
              
              <div className="request-details">
                <p><strong>Receiver Name:</strong> {request.fullName}</p>
                <p><strong>Blood Type:</strong> {request.bloodType}</p>
                <p><strong>Location:</strong> {request.district}, {request.state}, {request.country}</p>
              </div>

              {request.status === 'approved' && !request.selected_donor_id && matchingDonors[request.id]?.length > 0 && (
                <div className="matching-donors">
                  <h4>Available Donors in Your Area</h4>
                  <div className="donors-list">
                    {matchingDonors[request.id].map((donor) => (
                      <div key={donor.id} className="donor-card">
                        <div className="donor-info">
                          <p><strong>Name:</strong> {donor.name}</p>
                          <p><strong>Blood Type:</strong> {donor.bloodType}</p>
                          <p><strong>Contact:</strong> {donor.contact}</p>
                          <p><strong>Availability:</strong> {donor.availability_time}</p>
                          <p><strong>Location:</strong> {donor.district}, {donor.state}</p>
                          <p><strong>Last Donation:</strong> {donor.last_donation_date ? new Date(donor.last_donation_date).toLocaleDateString() : 'No previous donations'}</p>
                        </div>
                        <button 
                          onClick={() => selectDonor(request.id, donor.id)}
                          className="select-donor-btn"
                        >
                          Select Donor
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show selected donor details after selection */}
{request.status === 'matched' && request.selectedDonor && (
  <div className="selected-donor">
    <h4>Selected Donor Details</h4>
    <div className="donor-card">
      <p><strong>Name:</strong> {request.selectedDonor.name}</p>
      <p><strong>Blood Type:</strong> {request.selectedDonor.bloodType}</p>
      <p><strong>Contact:</strong> {request.selectedDonor.contact}</p>
      <p><strong>Availability:</strong> {request.selectedDonor.availability_time}</p>
      <p><strong>Location:</strong> {request.selectedDonor.district}, {request.selectedDonor.state}</p>
      <p><strong>Last Donation:</strong> {request.selectedDonor.lastDonationDate ? new Date(request.selectedDonor.lastDonationDate).toLocaleDateString() : 'No previous donations'}</p>
    </div>
  </div>
)}

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReceiverStatus; 