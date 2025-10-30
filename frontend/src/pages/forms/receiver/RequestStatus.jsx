import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../FormStyles.css';

const RequestStatus = () => {
  const { requestId } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRequestStatus = async () => {
      try {
        if (!requestId) {
          throw new Error('No request ID provided');
        }

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get(
          `http://localhost:5000/api/receivers/request/${requestId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        // Modify the response handling:
if (response.data.success) {
  setRequest(response.data.request); // Now matches backend response
} else {
  throw new Error(response.data.message || 'Failed to fetch request status');
}
      } catch (err) {
        console.error('Error fetching request status:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch request status');
      } finally {
        setLoading(false);
      }
    };

    fetchRequestStatus();
  }, [requestId]);

  if (loading) {
    return <div className="loading-message">Loading request status...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  if (!request) {
    return <div className="no-data-message">No request information found</div>;
  }

  return (
    <div className="form-container request-status-container">
      <h2>Request Status</h2>
      <div className="status-details">
        <p><strong>Request ID:</strong> {request.id}</p>
        <p><strong>Status:</strong> {request.status}</p>
        <p><strong>Blood Type:</strong> {request.blood_type}</p>
        <p><strong>Created At:</strong> {new Date(request.created_at).toLocaleString()}</p>
        {/* Add more fields as needed */}
      </div>
    </div>
  );
};

export default RequestStatus;