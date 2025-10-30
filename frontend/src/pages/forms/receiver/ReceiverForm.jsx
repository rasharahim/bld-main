import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import Gps from '../../../components/Gps';
import './ReceiverForm.css';

const ReceiverForm = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    blood_type: '',
    phone_number: '',
    reason_for_request: '',
    country: 'India',
    state: 'Kerala',
    district: '',
    address: '',
    location_lat: '',
    location_lng: '',
    location_address: ''
  });

  const [prescription, setPrescription] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      setPrescription(file);
    }
  };

  const handleLocationChange = (locationData) => {
    setFormData(prev => ({
      ...prev,
      location_lat: locationData.latitude,
      location_lng: locationData.longitude,
      location_address: locationData.formatted_address,
      district: locationData.district || '',
      address: locationData.formatted_address
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [
      'full_name', 'age', 'blood_type', 'phone_number',
      'reason_for_request', 'district', 'address'
    ];

    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = `${field.replace(/_/g, ' ')} is required`;
      }
    });

    // Validate age
    if (formData.age && (isNaN(formData.age) || formData.age < 0 || formData.age > 120)) {
      newErrors.age = 'Please enter a valid age';
    }

    // Validate phone number
    if (formData.phone_number && !/^\d{10}$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Phone number must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      console.log('Submitting form data:', formData);
      
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) { // Only append non-empty values
          // Ensure we're using the correct field name
          const fieldName = key === 'phone_number' ? 'phone_number' : key;
          formDataToSend.append(fieldName, formData[key]);
        }
      });

      // Append location data if available
      if (formData.location_lat && formData.location_lng) {
        formDataToSend.append('location_lat', formData.location_lat);
        formDataToSend.append('location_lng', formData.location_lng);
      }

      // Append prescription file if exists
      if (prescription) {
        formDataToSend.append('prescription', prescription);
      }

      console.log('Sending request with form data:', Object.fromEntries(formDataToSend));

      const response = await axios.post(
        'http://localhost:5000/api/receivers/create-request',
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        console.log("Receiver request successful:", response.data);
        navigate('/receiver/thanks', {
          state: {
            requestId: response.data.data.id,
            message: response.data.data.message
          }
        });
      } else {
        throw new Error(response.data.message || 'Failed to submit blood request');
      }
    } catch (error) {
      console.error('Detailed submission error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      alert(error.response?.data?.message || error.message || 'Failed to submit blood request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="receiver-form-container">
      <h2>Request Blood</h2>
      <form onSubmit={handleSubmit} className="receiver-form">
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className={errors.full_name ? 'error' : ''}
          />
          {errors.full_name && <span className="error-message">{errors.full_name}</span>}
        </div>

        <div className="form-group">
          <label>Age</label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            className={errors.age ? 'error' : ''}
          />
          {errors.age && <span className="error-message">{errors.age}</span>}
        </div>

        <div className="form-group">
          <label>Blood Type</label>
          <select
            name="blood_type"
            value={formData.blood_type}
            onChange={handleChange}
            className={errors.blood_type ? 'error' : ''}
          >
            <option value="">Select Blood Type</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
          {errors.blood_type && <span className="error-message">{errors.blood_type}</span>}
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            className={errors.phone_number ? 'error' : ''}
          />
          {errors.phone_number && <span className="error-message">{errors.phone_number}</span>}
        </div>

        <div className="form-group">
          <label>Reason for Request</label>
          <textarea
            name="reason_for_request"
            value={formData.reason_for_request}
            onChange={handleChange}
            className={errors.reason_for_request ? 'error' : ''}
          />
          {errors.reason_for_request && <span className="error-message">{errors.reason_for_request}</span>}
        </div>

        <div className="form-group">
          <label>Prescription (Optional)</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
          />
          <small>Max file size: 5MB. Supported formats: JPG, PNG, PDF</small>
        </div>

        <div className="form-group">
          <label>Location</label>
          <Gps onLocationChange={handleLocationChange} />
        </div>

        <div className="form-group">
          <label>District</label>
          <input
            type="text"
            name="district"
            value={formData.district}
            onChange={handleChange}
            className={errors.district ? 'error' : ''}
          />
          {errors.district && <span className="error-message">{errors.district}</span>}
        </div>

        <div className="form-group">
          <label>Address</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            className={errors.address ? 'error' : ''}
          />
          {errors.address && <span className="error-message">{errors.address}</span>}
        </div>

        <button type="submit" disabled={isSubmitting} className="submit-button">
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
};

export default ReceiverForm;