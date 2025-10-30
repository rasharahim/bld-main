import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './DonorSelection.css';

const DonorSelection = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDonor, setSelectedDonor] = useState(null);

  useEffect(() => {
    fetchMatchingDonors();
  }, [requestId]);

  const fetchMatchingDonors = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/receivers/${requestId}/matching-donors`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setDonors(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error fetching matching donors:', error);
      setError(error.response?.data?.message || 'Failed to fetch matching donors');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDonor = async (donorId) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/receivers/select-donor',
        {
          requestId,
          donorId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        navigate('/receiver/requests');
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error selecting donor:', error);
      setError(error.response?.data?.message || 'Failed to select donor');
    }
  };

  if (loading) {
    return <div className="loading">Loading matching donors...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="donor-selection">
      <h2>Select a Donor</h2>
      {donors.length === 0 ? (
        <div className="no-donors">
          No matching donors found in your area. Please try again later.
        </div>
      ) : (
        <div className="donor-list">
          {donors.map((donor) => (
            <div key={donor.id} className="donor-card">
              <h3>{donor.donor_name}</h3>
              <p><strong>Blood Type:</strong> {donor.blood_type}</p>
              <p><strong>Phone:</strong> {donor.donor_phone}</p>
              <p><strong>Address:</strong> {donor.address}</p>
              <p><strong>Distance:</strong> {donor.distance.toFixed(2)} km</p>
              <button
                onClick={() => handleSelectDonor(donor.id)}
                disabled={selectedDonor === donor.id}
                className="select-button"
              >
                {selectedDonor === donor.id ? 'Selected' : 'Select Donor'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DonorSelection; 