import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import auth from '../../utils/auth';
import './AdminDashboard.css';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('donors');
  const [donors, setDonors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matchingDonors, setMatchingDonors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = auth.getToken();
        if (!token) {
          navigate('/login');
          return;
        }

        if (activeTab === 'donors') {
          const response = await axios.get('http://localhost:5000/api/admin/donors', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setDonors(response.data.data);
        } else {
          const response = await axios.get('http://localhost:5000/api/admin/receiver-requests', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setRequests(response.data.data);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Error fetching data');
        if (err.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, navigate]);

  const handleStatusChange = async (type, id, newStatus) => {
    try {
      const token = auth.getToken();
      let endpoint, statusValue;

      if (type === 'donor') {
        endpoint = `/api/admin/donors/${id}/status`;
        statusValue = newStatus === 'approved' ? 'active' : newStatus;
      } else if (type === 'request') {
        endpoint = `/api/admin/receiver-requests/${id}/status`;
        statusValue = newStatus;
        
        if (newStatus === 'approved') {
          try {
            // Fetch matching donors when request is approved
            const matchingResponse = await axios.get(`/api/admin/matching-donors/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (matchingResponse.data.success) {
              setMatchingDonors(prev => ({
                ...prev,
                [id]: {
                  request: matchingResponse.data.request,
                  donors: matchingResponse.data.donors
                }
              }));
            }
          } catch (error) {
            console.error('Error fetching matching donors:', error);
            toast.error('Failed to fetch matching donors');
          }
        }
      }

      const response = await axios.put(endpoint, {
        status: statusValue
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        if (type === 'donor') {
          setDonors(prevDonors => 
            prevDonors.map(donor => 
              donor.id === id 
                ? { ...donor, status: statusValue } 
                : donor
            )
          );
        } else {
          setRequests(prevRequests => 
            prevRequests.map(request => 
              request.id === id 
                ? { ...request, status: statusValue } 
                : request
            )
          );
        }
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDonorSelection = async (requestId, donorId) => {
    try {
      const token = auth.getToken();
      const response = await axios.post(`/api/admin/assign-donor`, {
        requestId,
        donorId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Update the request with selected donor
        setRequests(prevRequests =>
          prevRequests.map(request =>
            request.id === requestId
              ? { ...request, selected_donor_id: donorId }
              : request
          )
        );
        
        // Clear matching donors for this request
        setMatchingDonors(prev => {
          const newState = { ...prev };
          delete newState[requestId];
          return newState;
        });
        
        toast.success('Donor assigned successfully');
      }
    } catch (error) {
      console.error('Error assigning donor:', error);
      toast.error(error.response?.data?.message || 'Failed to assign donor');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="mt-4 flex space-x-4">
          <button
            onClick={() => setActiveTab('donors')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'donors'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Manage Donors
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'requests'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Manage Blood Requests
          </button>
        </div>
      </div>

      {activeTab === 'donors' ? (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
          <ul className="divide-y divide-gray-200">
            {donors.map((donor) => (
              <li key={donor.id} className="px-6 py-5 hover:bg-gray-50 transition duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {donor.full_name}
                    </h3>
                    <div className="flex space-x-4 text-sm text-gray-600">
                      <p className="flex items-center">
                        <span className="font-medium mr-2">Blood Type:</span>
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">{donor.blood_type}</span>
                      </p>
                      <p>
                        <span className="font-medium mr-2">Contact:</span>
                        {donor.phone_number}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                      donor.status === 'active' ? 'bg-green-100 text-green-800' :
                      donor.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      donor.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {donor.display_status}
                    </span>
                    {donor.status === 'pending' && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleStatusChange('donor', donor.id, 'approved')}
                          className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition duration-150"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusChange('donor', donor.id, 'rejected')}
                          className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition duration-150"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
          <ul className="divide-y divide-gray-200">
            {requests.map((request) => (
              <li key={request.id} className="px-6 py-5 hover:bg-gray-50 transition duration-150">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.full_name || 'Anonymous'}
                        </h3>
                        <span className="text-sm text-gray-500">
                          (Request #{request.id})
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <p className="flex items-center">
                          <span className="font-medium mr-2">Blood Type:</span>
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">{request.blood_type}</span>
                        </p>
                        <p>
                          <span className="font-medium mr-2">Phone:</span>
                          {request.contact_number || request.phone_number || 'N/A'}
                        </p>
                        <p className="col-span-2">
                          <span className="font-medium mr-2">Location:</span>
                          {request.address || 'N/A'}
                        </p>
                        <p className="col-span-2">
                          <span className="font-medium mr-2">Reason:</span>
                          {request.reason_for_request || request.reason || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                      {request.status === 'pending' && (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleStatusChange('request', request.id, 'approved')}
                            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition duration-150"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusChange('request', request.id, 'rejected')}
                            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition duration-150"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Show matching donors section when request is approved */}
                  {request.status === 'approved' && !request.selected_donor_id && matchingDonors[request.id] && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="text-lg font-semibold mb-3">
                        Matching Donors for {matchingDonors[request.id].request.receiver_name}'s Request
                      </h4>
                      <div className="text-sm text-gray-600 mb-4">
                        <p>Blood Type Needed: {matchingDonors[request.id].request.blood_type}</p>
                        <p>Location: {matchingDonors[request.id].request.location.district}, {matchingDonors[request.id].request.location.state}, {matchingDonors[request.id].request.location.country}</p>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {matchingDonors[request.id].donors.length > 0 ? (
                          matchingDonors[request.id].donors.map(donor => (
                            <div key={donor.id} 
                              className={`border rounded-lg p-4 flex justify-between items-center ${
                                donor.match_level === 'Same District' ? 'bg-green-50 border-green-200' :
                                donor.match_level === 'Same State' ? 'bg-blue-50 border-blue-200' :
                                'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <p className="font-semibold">{donor.full_name}</p>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    donor.match_level === 'Same District' ? 'bg-green-100 text-green-800' :
                                    donor.match_level === 'Same State' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {donor.match_level}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">Blood Type: {donor.blood_type}</p>
                                <p className="text-sm text-gray-600">Contact: {donor.phone_number}</p>
                                <p className="text-sm text-gray-600">Location: {donor.district}, {donor.state}, {donor.country}</p>
                                {donor.last_donation_date && (
                                  <p className="text-sm text-gray-600">
                                    Last Donation: {new Date(donor.last_donation_date).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => handleDonorSelection(request.id, donor.id)}
                                className={`px-4 py-2 rounded-md text-sm font-medium text-white transition duration-150 ${
                                  donor.match_level === 'Same District' 
                                    ? 'bg-green-600 hover:bg-green-700' 
                                    : donor.match_level === 'Same State'
                                    ? 'bg-blue-600 hover:bg-blue-700'
                                    : 'bg-gray-600 hover:bg-gray-700'
                                }`}
                              >
                                Select Donor
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-gray-600">
                            No matching donors found in the same district, state, or country.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Show selected donor info */}
                  {request.selected_donor_id && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="text-lg font-semibold mb-2">Selected Donor</h4>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="font-semibold">{request.donor_name}</p>
                        <p className="text-sm text-gray-600">Contact: {request.donor_contact}</p>
                        <p className="text-sm text-gray-600">Status: Pending Donation</p>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 