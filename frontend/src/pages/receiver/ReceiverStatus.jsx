import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './ReceiverStatus.css';

const ReceiverStatus = () => {
  const { requestId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [donors, setDonors] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching requests...');
        
        // Fetch request details
        const requestResponse = await axios.get(`http://localhost:5000/api/receivers/request/${requestId}`);
        console.log('Raw request data:', requestResponse.data);
        setRequests(requestResponse.data);

        // Fetch donors
        console.log('Fetching donors for request:', requestId);
        const donorsResponse = await axios.get(`http://localhost:5000/api/receivers/${requestId}/location-donors`);
        console.log('Raw donor data:', donorsResponse.data);
        setDonors(Array.isArray(donorsResponse.data) ? donorsResponse.data : []);
        
        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load data');
        setLoading(false);
      }
    };

    fetchData();
  }, [requestId]);

  const handleDonorSelection = async (donorId) => {
    try {
      await axios.post('http://localhost:5000/api/receivers/select-donor', {
        requestId,
        donorId
      });
      window.location.reload();
    } catch (err) {
      setError('Failed to select donor');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!requests || requests.length === 0) return <div className="error">No request details found</div>;

  const request = requests[0];
  console.log('Rendering with request:', request);
  console.log('Rendering with donors:', donors);

  return (
    <div className="receiver-status-container">
      <div className="request-details">
        <h2>Blood Request #{requestId}</h2>
        <div className="request-info">
          <p><strong>Receiver Name:</strong> {request.fullName}</p>
          <p><strong>Blood Type:</strong> {request.bloodType}</p>
          <p><strong>Status:</strong> 
            <span className={`status ${request.status?.toLowerCase()}`}>
              {request.status}
            </span>
          </p>
          <p><strong>Location:</strong> ernakulam, Kerala, India</p>
        </div>
      </div>

      <h2>Available Donors in Your Area</h2>
      {donors && donors.length > 0 ? (
        <div className="donor-list">
          {donors.map((donor) => (
            <div key={donor.id} className="donor-card">
              <p><strong>Name:</strong> {donor.name}</p>
              <p><strong>Blood Type:</strong> {donor.bloodType}</p>
              <p><strong>Contact:</strong> {donor.contact}</p>
              <p><strong>Location:</strong> {donor.district}, Kerala</p>
              <button
                onClick={() => handleDonorSelection(donor.id)}
                className="select-donor-btn"
                disabled={request.status !== 'PENDING'}
              >
                Select Donor
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-donors">No matching donors found</div>
      )}
    </div>
  );
};

export default ReceiverStatus;