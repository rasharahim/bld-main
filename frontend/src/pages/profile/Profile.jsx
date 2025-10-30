import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Gps from "../../components/Gps";
import defaultAvatar from "../../assets/default-avatar";
import "./ProfileStyles.css";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    full_name: "",
    age: "",
    blood_type: "",
    phone_number: "",
    dob: "",
    is_available: false,
    location_lat: null,
    location_lng: null,
    address: "",
    email: "",
    profile_picture: null
  });

  const [editMode, setEditMode] = useState(false);
  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "" });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    if (date.getTime() === 0 || isNaN(date.getTime())) return 'Not set';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  // Fetch user profile and activities
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('http://localhost:5000/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch profile');
        }

        const data = await response.json();
        
        if (data.success) {
          setUser(data.profile);
          setActivities(data.profile.activities || []);
        } else {
          throw new Error(data.message || 'Failed to fetch profile');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({
      ...prev,
      [name]: value || ""
    }));
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleLocationUpdate = (locationData) => {
    setUser(prev => ({
      ...prev,
      location_lat: locationData.latitude || null,
      location_lng: locationData.longitude || null,
      address: locationData.address || null
    }));
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingPicture(true);
      const formData = new FormData();
      formData.append('profilePicture', file);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile/profile-picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload profile picture');
      }

      const data = await response.json();
      if (data.success) {
        setUser(prev => ({
          ...prev,
          profile_picture: data.profilePicture
        }));
        alert('Profile picture updated successfully!');
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      alert('Failed to upload profile picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: user.full_name || null,
          contactNumber: user.phone_number || null,
          dateOfBirth: user.dob || null,
          bloodType: user.blood_type || null,
          isAvailable: Boolean(user.is_available),
          location_lat: user.location_lat || null,
          location_lng: user.location_lng || null,
          address: user.address || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data = await response.json();
      if (data.success) {
        setUser(prev => ({
          ...prev,
          ...data.profile
        }));
        setEditMode(false);
        alert('Profile updated successfully!');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      alert(err.message || 'Failed to update profile');
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile/update-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passwords)
      });

      if (!response.ok) {
        throw new Error('Failed to update password');
      }

      const data = await response.json();
      if (data.success) {
        alert('Password updated successfully!');
        setPasswords({ oldPassword: "", newPassword: "" });
      }
    } catch (err) {
      console.error('Error updating password:', err);
      alert('Failed to update password');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleAvailability = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile/toggle-availability', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to toggle availability');
      }

      const data = await response.json();
      if (data.success) {
        setUser(prev => ({ ...prev, is_available: data.isAvailable }));
        alert(data.message);
      }
    } catch (err) {
      console.error('Error toggling availability:', err);
      alert('Failed to update availability status');
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (window.confirm("Are you sure you want to cancel this request?")) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/requests/${requestId}/cancel`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to cancel request');
        }

        const data = await response.json();
        if (data.success) {
          setActivities(activities.map(activity => 
            activity.id === requestId 
              ? { ...activity, status: "Cancelled", isPending: false }
              : activity
          ));
          alert('Request cancelled successfully');
        }
      } catch (err) {
        console.error('Error cancelling request:', err);
        alert('Failed to cancel request');
      }
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading profile...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="profile-layout">
      <div className="profile-container">
        <div className="profile-header">
          <h2>My Profile</h2>
          <div className="profile-status">
            <span className="status-badge active">Active Donor</span>
            {user.is_available && (
              <span className="availability-badge available">Available to Donate</span>
            )}
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-section">
            <div className="profile-picture-container">
              <div className="profile-picture">
                <img 
                  src={user.profile_picture || defaultAvatar} 
                  alt="Profile" 
                  onError={(e) => e.target.src = defaultAvatar}
                />
                {editMode && (
                  <label className="picture-upload-btn" title="Upload new picture">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      disabled={uploadingPicture}
                    />
                    <i className="fas fa-camera"></i>
                  </label>
                )}
              </div>
            </div>

            <div className="profile-details">
              <div className="detail-group">
                <label>Full Name</label>
                {editMode ? (
                  <input 
                    type="text" 
                    name="full_name" 
                    value={user.full_name} 
                    onChange={handleInputChange} 
                  />
                ) : (
                  <p>{user.full_name || 'Not set'}</p>
                )}
              </div>

              <div className="detail-group">
                <label>Email</label>
                <p>{user.email || 'Not set'}</p>
              </div>

              <div className="detail-group">
                <label>Date of Birth</label>
                {editMode ? (
                  <input 
                    type="date" 
                    name="dob" 
                    value={user.dob} 
                    onChange={handleInputChange} 
                  />
                ) : (
                  <p>{formatDate(user.dob)}</p>
                )}
              </div>

              <div className="detail-group">
                <label>Age</label>
                <p>{user.age || 'Not set'}</p>
              </div>

              <div className="detail-group">
                <label>Blood Type</label>
                {editMode ? (
                  <select 
                    name="blood_type" 
                    value={user.blood_type || ''} 
                    onChange={handleInputChange}
                  >
                    <option value="">Select Blood Type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                ) : (
                  <p>{user.blood_type || 'Not set'}</p>
                )}
              </div>

              <div className="detail-group">
                <label>Contact Number</label>
                {editMode ? (
                  <input 
                    type="text" 
                    name="phone_number" 
                    value={user.phone_number} 
                    onChange={handleInputChange} 
                  />
                ) : (
                  <p>{user.phone_number || 'Not set'}</p>
                )}
              </div>

              <div className="detail-group">
                <label>Location</label>
                {editMode ? (
                  <div className="location-update">
                    <Gps onLocationUpdate={handleLocationUpdate} />
                    <div className="current-location">
                      {user.address ? (
                        <p>Current Address: {user.address}</p>
                      ) : (
                        <p>No location set</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p>{user.address || 'No location set'}</p>
                )}
              </div>

              <div className="detail-group">
                <label>Availability Status</label>
                <div className="availability-toggle">
                  <button
                    className={`toggle-button ${user.is_available ? 'available' : 'unavailable'}`}
                    onClick={toggleAvailability}
                  >
                    {user.is_available ? 'Available' : 'Unavailable'}
                  </button>
                </div>
              </div>

              <div className="action-buttons">
                {editMode ? (
                  <>
                    <button className="save-btn" onClick={handleSaveProfile}>
                      Save Changes
                    </button>
                    <button className="cancel-btn" onClick={() => setEditMode(false)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button className="edit-btn" onClick={() => setEditMode(true)}>
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Current Status Section */}
          <div className="current-status-section">
            <h3>Current Status</h3>
            <div className="status-cards">
              {activities.filter(a => a.isPending).length > 0 ? (
                activities
                  .filter(activity => activity.isPending)
                  .map(activity => (
                    <div key={`current-${activity.id}`} className={`status-card ${activity.type.toLowerCase()}`}>
                      <div className="status-icon">
                        {activity.type === "Donation" ? (
                          <i className="fas fa-tint"></i>
                        ) : (
                          <i className="fas fa-hand-holding-medical"></i>
                        )}
                      </div>
                      <div className="status-details">
                        <h4>{activity.type} Status</h4>
                        <p className="status-text">{activity.status}</p>
                        {activity.bloodType && <p>Blood Type: {activity.bloodType}</p>}
                        {activity.location && <p>Location: {activity.location}</p>}
                        {activity.hospital && <p>Hospital: {activity.hospital}</p>}
                        <div className="status-actions">
                          {activity.type === "Donation" && (
                            <button 
                              className={`availability-btn ${user.is_available ? 'available' : 'unavailable'}`}
                              onClick={toggleAvailability}
                            >
                              {user.is_available ? 'Make Unavailable' : 'Make Available'}
                            </button>
                          )}
                          {activity.type === "Request" && (
                            <button 
                              className="cancel-request-btn"
                              onClick={() => handleCancelRequest(activity.id)}
                            >
                              Cancel Request
                            </button>
                          )}
                          <Link
                            to={activity.type === "Request" ? 
                                `/request-status/${activity.id}` : 
                                `/donor-status/${activity.id}`}
                            className="status-btn"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="no-current-status">
                  <p>No active donations or requests</p>
                  <div className="action-links">
                    <Link to="/donor-form" className="action-link">
                      <i className="fas fa-tint"></i> Register as Donor
                    </Link>
                    <Link to="/receiver-form" className="action-link">
                      <i className="fas fa-hand-holding-medical"></i> Request Blood
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activities History Section */}
          <div className="activities-section">
            <h3>Activity History</h3>
            {activities.length > 0 ? (
              <div className="activities-list">
                {activities.map(activity => (
                  <div key={activity.id} className={`activity-card ${activity.type.toLowerCase()}`}>
                    <div className="activity-icon">
                      {activity.type === "Donation" ? (
                        <i className="fas fa-tint"></i>
                      ) : (
                        <i className="fas fa-hand-holding-medical"></i>
                      )}
                    </div>
                    <div className="activity-details">
                      <div className="activity-header">
                        <h4>{activity.type}</h4>
                        <span className="activity-date">
                          {formatDate(activity.date)}
                        </span>
                      </div>
                      <div className="activity-info">
                        {activity.bloodType && <p>Blood Type: {activity.bloodType}</p>}
                        {activity.location && <p>Location: {activity.location}</p>}
                        {activity.hospital && <p>Hospital: {activity.hospital}</p>}
                        {activity.quantity && <p>Quantity: {activity.quantity}</p>}
                      </div>
                      <div className="activity-footer">
                        <span className={`status ${activity.status.toLowerCase().replace(' ', '-')}`}>
                          {activity.status}
                        </span>
                        <Link
                          to={activity.type === "Request" ? 
                              `/request-status/${activity.id}` : 
                              `/donor-status`}
                          className="status-btn"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-activities">No previous activities found</p>
            )}
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;