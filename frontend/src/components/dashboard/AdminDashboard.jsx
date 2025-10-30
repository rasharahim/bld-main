import React, { useState, useEffect } from 'react';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaTint, FaCalendarAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import api from '@/utils/axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('donors');
  const [donors, setDonors] = useState([]);
  const [receiverRequests, setReceiverRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeTab === 'donors') {
      fetchDonors();
    } else {
      fetchReceiverRequests();
    }
  }, [activeTab]);

  const fetchDonors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/admin/donors');
      console.log('Donors data received:', response.data);
      if (response.data.success && Array.isArray(response.data.data)) {
        setDonors(response.data.data);
      } else {
        setError('Invalid data format received from server');
      }
    } catch (err) {
      setError('Failed to fetch donors. Please try again later.');
      console.error('Error fetching donors:', err);
    }
    setLoading(false);
  };

  const fetchReceiverRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/admin/receiver-requests');
      if (response.data.success && Array.isArray(response.data.data)) {
        setReceiverRequests(response.data.data);
      } else {
        setError('Invalid data format received from server');
      }
    } catch (err) {
      setError('Failed to fetch receiver requests. Please try again later.');
      console.error('Error fetching receiver requests:', err);
    }
    setLoading(false);
  };

  const handleDonorStatusUpdate = async (donorId, newStatus) => {
    try {
      await api.put(`/api/admin/donors/${donorId}/status`, { status: newStatus });
      fetchDonors();
      alert(`Donor ${newStatus} successfully`);
    } catch (err) {
      console.error('Error updating donor status:', err);
      alert('Failed to update donor status. Please try again.');
    }
  };

  const handleRequestStatusUpdate = async (requestId, newStatus) => {
    try {
      await api.put(`/api/admin/receiver-requests/${requestId}/status`, { status: newStatus });
      fetchReceiverRequests();
      alert(`Request ${newStatus} successfully`);
    } catch (err) {
      console.error('Error updating request status:', err);
      alert('Failed to update request status. Please try again.');
    }
  };

  const viewPrescription = (prescriptionUrl) => {
    if (prescriptionUrl) {
      window.open(prescriptionUrl, '_blank');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const formatCoordinates = (lat, lng) => {
    if (!lat || !lng) return null;
    try {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      if (isNaN(latitude) || isNaN(longitude)) return null;
      return `(${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;
    } catch (err) {
      return null;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>Admin Dashboard</h2>
        <div className="tab-buttons">
          <button 
            className={`tab-button ${activeTab === 'donors' ? 'active' : ''}`}
            onClick={() => setActiveTab('donors')}
          >
            Donor Management
          </button>
          <button 
            className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Blood Request Management
          </button>
        </div>
      </div>

      {activeTab === 'donors' ? (
        <div className="donors-container">
          {donors.length === 0 ? (
            <div className="no-data">No donor applications found</div>
          ) : (
            donors.map(donor => (
              <div key={donor.id} className="details-card">
                <div className="donor-header">
                  <h3>{donor.full_name}</h3>
                  <span className={`status-badge ${donor.donor_status}`}>
                    {donor.donor_status || 'pending'}
                  </span>
                </div>
                <div className="details-content">
                  <div className="info-row">
                    <FaTint className="icon" />
                    <div>
                      <strong>Blood Type:</strong>
                      <span>{donor.blood_type || 'Not specified'}</span>
                    </div>
                  </div>
                  <div className="info-row">
                    <FaPhone className="icon" />
                    <div>
                      <strong>Phone:</strong>
                      <span>{donor.phone_number || 'Not specified'}</span>
                    </div>
                  </div>
                  <div className="info-row">
                    <FaEnvelope className="icon" />
                    <div>
                      <strong>Email:</strong>
                      <span>{donor.email || 'Not specified'}</span>
                    </div>
                  </div>
                  <div className="info-row">
                    <FaCalendarAlt className="icon" />
                    <div>
                      <strong>Age:</strong>
                      <span>{donor.age ? `${donor.age} years` : 'Not specified'}</span>
                    </div>
                  </div>
                  <div className="info-row">
                    <FaMapMarkerAlt className="icon" />
                    <div>
                      <strong>Location:</strong>
                      <span>{donor.address || 'No location information available'}</span>
                      {donor.location_lat && donor.location_lng && (
                        <span className="coordinates">
                          {formatCoordinates(donor.location_lat, donor.location_lng)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {donor.donor_status === 'pending' && (
                  <div className="action-buttons">
                    <button
                      className="approve-btn"
                      onClick={() => handleDonorStatusUpdate(donor.id, 'approved')}
                    >
                      <FaCheckCircle /> Approve
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => handleDonorStatusUpdate(donor.id, 'rejected')}
                    >
                      <FaTimesCircle /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="requests-container">
          {receiverRequests.length === 0 ? (
            <div className="no-data">No blood requests found</div>
          ) : (
            receiverRequests.map(request => (
              <div key={request.id} className="details-card">
                <div className="request-header">
                  <h3>{request.user_name}</h3>
                  <span className={`status-badge ${request.status}`}>
                    {request.status}
                  </span>
                </div>
                <div className="details-content">
                  <div className="info-row">
                    <FaTint className="icon" />
                    <div>
                      <strong>Blood Type:</strong>
                      <span>{request.blood_type}</span>
                    </div>
                  </div>
                  <div className="info-row">
                    <FaPhone className="icon" />
                    <div>
                      <strong>Contact:</strong>
                      <span>{request.user_phone}</span>
                    </div>
                  </div>
                  <div className="info-row">
                    <FaMapMarkerAlt className="icon" />
                    <div>
                      <strong>Location:</strong>
                      <span>{request.address || 'No location information available'}</span>
                      {request.location_lat && request.location_lng && (
                        <span className="coordinates">
                          {formatCoordinates(request.location_lat, request.location_lng)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {request.status === 'pending' && (
                  <div className="action-buttons">
                    <button
                      className="approve-btn"
                      onClick={() => handleRequestStatusUpdate(request.id, 'approved')}
                    >
                      <FaCheckCircle /> Approve
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => handleRequestStatusUpdate(request.id, 'rejected')}
                    >
                      <FaTimesCircle /> Reject
                    </button>
                  </div>
                )}
                {request.status === 'approved' && request.selected_donor && (
                  <div className="donor-match">
                    <h4>Selected Donor</h4>
                    <p><strong>Name:</strong> {request.selected_donor.name}</p>
                    <p><strong>Contact:</strong> {request.selected_donor.contact}</p>
                    <p><strong>Status:</strong> {request.donation_status || 'Pending'}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
