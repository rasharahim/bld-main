import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const RequestStatus = () => {
  const { requestId } = useParams();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRequestStatus = async () => {
      try {
        if (!requestId && requestId !== 0) {
          throw new Error('No request ID provided');
        }

        console.log('Fetching status for requestId:', requestId); // Debug log
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Try the requests endpoint
        const response = await axios.get(`http://localhost:5000/api/receivers/requests/${requestId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log('Status response:', response.data); // Debug log

        if (response.data.success) {
          setStatus(response.data.data);
        } else {
          throw new Error(response.data.message || 'Failed to fetch request status');
        }
      } catch (err) {
        console.error('Error fetching request status:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRequestStatus();
  }, [requestId]);

  if (loading) {
    return <div>Loading request status...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!status) {
    return <div>No status information found</div>;
  }

  return (
    <div className="request-status-container">
      <h2>Request Status</h2>
      <div className="status-details">
        <p><strong>Request ID:</strong> {status.id}</p>
        <p><strong>Status:</strong> {status.status}</p>
        <p><strong>Blood Type:</strong> {status.bloodType}</p>
        <p><strong>Created At:</strong> {new Date(status.createdAt).toLocaleString()}</p>
        {/* Add more status details as needed */}
      </div>
    </div>
  );
};

export default RequestStatus; 