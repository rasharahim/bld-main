import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import auth from "../../../utils/auth";
import "../FormStyles.css";
import countryData from "/src/data/countryData.json";
import Gps from "@/components/Gps";
import axios from 'axios';


const DonorForm = () => {
  // Constants
  const restrictedConditions = [
    "HIV", "Hepatitis B", "Hepatitis C", "Cancer",
    "Heart Disease", "Kidney Disease", "Tuberculosis",
    "Diabetes (on insulin)", "Recent Surgery",
    "Malaria (in last 3 months)", "Pregnancy"
  ];

  // State
  const [donor, setDonor] = useState({
    fullName: "",
    dob: "",
    age: "",
    weight: "",
    bloodType: "",
    hasDonatedBefore: false,
    lastDonationDate: "",
    donationGap: "",
    healthCondition: [],
    availabilityStart: "",
    availabilityEnd: "",
    country: "",
    state: "",
    district: "",
    street: "",
    contactNumber: "",
    location: null,
    medical_certificate: null
  });

  const [errors, setErrors] = useState({});
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [locationMethod, setLocationMethod] = useState("address");
  const navigate = useNavigate();

  // Calculate age from DOB
  useEffect(() => {
    if (donor.dob) {
      const birthDate = new Date(donor.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      setDonor(prev => ({ ...prev, age: age.toString() }));
    }
  }, [donor.dob]);

  const handleDonationToggle = (e) => {
    const hasDonated = e.target.value === 'yes';
    setDonor(prev => ({ 
      ...prev, 
      hasDonatedBefore: hasDonated,
      lastDonationDate: hasDonated ? prev.lastDonationDate : "",
      donationGap: hasDonated ? prev.donationGap : ""
    }));
  };

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDonor({ ...donor, [name]: value });

    if (name === "lastDonationDate") {
      const selectedDate = new Date(value);
      const today = new Date();
      const monthDiff =
        (today.getFullYear() - selectedDate.getFullYear()) * 12 +
        today.getMonth() - selectedDate.getMonth();
      setDonor((prev) => ({ ...prev, donationGap: monthDiff }));
    }
  };

  const handleHealthConditionChange = (e) => {
    const { value, checked } = e.target;

    if (value === "None of the Above") {
      setDonor((prev) => ({
        ...prev,
        healthCondition: checked ? ["None of the Above"] : [],
      }));
    } else {
      setDonor((prev) => {
        let updatedConditions = prev.healthCondition.filter(
          (c) => c !== "None of the Above"
        );

        if (checked) {
          updatedConditions.push(value);
        } else {
          updatedConditions = updatedConditions.filter((c) => c !== value);
        }

        return { ...prev, healthCondition: updatedConditions };
      });
    }
  };

  const handleLocationChange = (newLocation) => {
    console.log("Received new location:", newLocation);
    
    if (!newLocation || !newLocation.latitude || !newLocation.longitude) {
      console.error("Invalid location data received:", newLocation);
      setErrors(prev => ({ 
        ...prev, 
        location: "Invalid location data received. Please try getting location again." 
      }));
      return;
    }

    // Create location object with all required fields
    const locationData = {
      lat: parseFloat(newLocation.latitude),
      lng: parseFloat(newLocation.longitude),
      address: newLocation.address || newLocation.formatted_address || "",
      district: newLocation.district || "",
      street: newLocation.street || "",
      country: newLocation.country || "",
      state: newLocation.state || ""
    };

    console.log("Setting location data:", locationData);

    // Update donor state with the new location data
    setDonor(prev => ({
      ...prev,
      location: locationData,
      district: locationData.district || prev.district,
      street: locationData.street || prev.street,
      country: locationData.country || prev.country,
      state: locationData.state || prev.state
    }));

    // Set location method to GPS
    setLocationMethod("gps");

    // Clear any location errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.location;
      return newErrors;
    });
  };

  const validateForm = () => {
    let validationErrors = {};

    // Required fields validation
    const requiredFields = {
      fullName: "Full Name",
      dob: "Date of Birth",
      age: "Age",
      weight: "Weight",
      bloodType: "Blood Type",
      contactNumber: "Contact Number",
      availabilityStart: "Availability Start Time",
      availabilityEnd: "Availability End Time",
      healthCondition: "Health Condition"
    };

    // Check all required fields
    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!donor[field] || (Array.isArray(donor[field]) && donor[field].length === 0)) {
        validationErrors[field] = `${label} is required.`;
      }
    });

    // Specific validations
    if (!donor.fullName.trim()) validationErrors.fullName = "Full Name is required.";
    if (!donor.dob) validationErrors.dob = "Date of Birth is required.";
    if (!donor.age || isNaN(donor.age) || donor.age < 18 || donor.age > 65)
      validationErrors.age = "Age must be between 18 and 65.";
    if (!donor.weight || isNaN(donor.weight) || donor.weight < 45)
      validationErrors.weight = "Minimum weight requirement is 45kg.";
    if (!donor.bloodType) validationErrors.bloodType = "Please select a blood type.";
    
    if (donor.hasDonatedBefore) {
      if (!donor.lastDonationDate) {
        validationErrors.lastDonationDate = "Please provide your last donation date";
      }
      if (donor.donationGap < 3) {
        validationErrors.donationGap = "Minimum donation gap is 3 months.";
      }
    }

    // Health condition validation
    if (donor.healthCondition.length === 0) {
      validationErrors.healthCondition = "Please select at least one health condition or 'None of the Above'";
    }

    const hasRestrictedCondition = donor.healthCondition.some((condition) =>
      restrictedConditions.includes(condition)
    );

    if (hasRestrictedCondition) {
      validationErrors.healthCondition = "You are not eligible to donate due to health conditions.";
    }

    if (!/^\d{10}$/.test(donor.contactNumber))
      validationErrors.contactNumber = "Enter a valid 10-digit phone number.";

    // Validate availability times
    if (!donor.availabilityStart || !donor.availabilityEnd) {
      validationErrors.availabilityTime = "Please select an availability time range.";
    } else {
      const startTime = donor.availabilityStart.split(':').map(Number);
      const endTime = donor.availabilityEnd.split(':').map(Number);
      if (startTime[0] > endTime[0] || (startTime[0] === endTime[0] && startTime[1] > endTime[1])) {
        validationErrors.availabilityTime = "End time must be after start time";
      }
    }

    // Location validation
    if (locationMethod === "address") {
      if (!donor.country) validationErrors.country = "Country is required.";
      if (!donor.state) validationErrors.state = "State is required.";
      if (!donor.district) validationErrors.district = "District is required.";
      if (!donor.street) validationErrors.street = "Street address is required.";
    } else if (locationMethod === "gps") {
      // GPS validation
      console.log("Validating GPS location:", donor.location);
      if (!donor.location || !donor.location.lat || !donor.location.lng || !donor.location.address) {
        validationErrors.location = "Please get your current location using GPS";
      } else if (isNaN(donor.location.lat) || isNaN(donor.location.lng)) {
        validationErrors.location = "Invalid GPS coordinates. Please try getting location again.";
      }
    }

    console.log("Validation Errors:", validationErrors);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = {
      fullName: 'Full Name',
      dob: 'Date of Birth',
      bloodType: 'Blood Type',
      weight: 'Weight',
      contactNumber: 'Contact Number',
      availabilityStart: 'Availability Start Time',
      availabilityEnd: 'Availability End Time'
    };

    // Location validation based on method
    if (locationMethod === 'address') {
      requiredFields.country = 'Country';
      requiredFields.state = 'State';
      requiredFields.district = 'District';
      requiredFields.street = 'Street Address';
    } else if (locationMethod === 'gps' && (!donor.location || !donor.location.lat || !donor.location.lng)) {
      setErrors({
        ...errors,
        submit: 'Please get your current location using GPS'
      });
      return;
    }

    const missingFields = Object.entries(requiredFields)
      .filter(([key]) => !donor[key])
      .map(([_, label]) => label);

    if (missingFields.length > 0) {
      setErrors({
        ...errors,
        submit: `Please fill in all required fields: ${missingFields.join(', ')}`
      });
      return;
    }

    try {
      const token = auth.getToken();
      const userId = auth.getTokenPayload()?.id;

      // Prepare the request data
      const requestData = {
        full_name: donor.fullName,
        date_of_birth: donor.dob,
        blood_type: donor.bloodType,
        weight: donor.weight,
        contact_number: donor.contactNumber,
        availability_time: `${donor.availabilityStart}-${donor.availabilityEnd}`,
        user_id: userId
      };

      // Add location data based on method
      if (locationMethod === 'address') {
        requestData.country = donor.country;
        requestData.state = donor.state;
        requestData.district = donor.district;
        requestData.address = donor.street;
      } else if (locationMethod === 'gps' && donor.location) {
        requestData.country = donor.location.country;
        requestData.state = donor.location.state;
        requestData.district = donor.location.district;
        requestData.address = donor.location.street;
        requestData.location_lat = donor.location.lat;
        requestData.location_lng = donor.location.lng;
        requestData.location_address = donor.location.address;
      }

      // Add optional fields if they exist
      if (donor.healthCondition && donor.healthCondition.length > 0) {
        requestData.health_condition = donor.healthCondition.join(', ');
      }
      if (donor.lastDonationDate) {
        requestData.last_donation_date = donor.lastDonationDate;
      }
      if (donor.donationGap) {
        requestData.donation_gap_months = donor.donationGap;
      }

      console.log('Submitting donor data:', requestData);

      const response = await axios.post(
        'http://localhost:5000/api/donors/createDonor',
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Donor registration successful:', response.data);
      navigate('/donor/thanks', {
        state: {
          donorId: response.data.data.id,
          message: 'Thank you for registering as a donor!'
        }
      });
    } catch (error) {
      console.error('Error submitting donor form:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
        setErrors({
          ...errors,
          submit: error.response.data.message || 'Error submitting form'
        });
      }
    }
  };

  // Effects for country/state/district
  useEffect(() => {
    if (donor.country) {
      const selectedCountry = countryData.find((c) => c.name === donor.country);
      setStates(selectedCountry ? selectedCountry.states : []);
      setDonor((prev) => ({ ...prev, state: "", district: "" }));
    }
  }, [donor.country]);

  useEffect(() => {
    if (donor.state) {
      const selectedState = states.find((s) => s.name === donor.state);
      setDistricts(selectedState ? selectedState.districts : []);
      setDonor((prev) => ({ ...prev, district: "" }));
    }
  }, [donor.state]);

  // Render
  return (
    <div className="form-container">
      <h2>Blood Donor Form</h2>
      <form onSubmit={handleSubmit}>
        {/* Personal Information */}
        <div className="form-section">
          <h3>Personal Information</h3>
          
          <label>Full Name:</label>
          <input type="text" name="fullName" value={donor.fullName} onChange={handleChange} required />
          {errors.fullName && <p className="error">{errors.fullName}</p>}

          <label>Date of Birth:</label>
          <input 
            type="date" 
            name="dob" 
            value={donor.dob} 
            onChange={handleChange} 
            required 
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.dob && <p className="error">{errors.dob}</p>}

          <label>Age:</label>
          <input 
            type="number" 
            name="age" 
            value={donor.age} 
            readOnly 
            className="read-only"
          />
          {errors.age && <p className="error">{errors.age}</p>}

          <label>Weight (kg):</label>
          <input 
            type="number" 
            name="weight" 
            value={donor.weight} 
            onChange={handleChange} 
            required 
            min="45"
            step="0.1"
          />
          {errors.weight && <p className="error">{errors.weight}</p>}

          <label>Blood Type:</label>
          <select name="bloodType" value={donor.bloodType} onChange={handleChange} required>
            <option value="">Select Blood Type</option>
            {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors.bloodType && <p className="error">{errors.bloodType}</p>}

          <div className="form-group">
            <label>Have you donated blood before?</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="hasDonatedBefore"
                  value="yes"
                  checked={donor.hasDonatedBefore === true}
                  onChange={handleDonationToggle}
                />
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="hasDonatedBefore"
                  value="no"
                  checked={donor.hasDonatedBefore === false}
                  onChange={handleDonationToggle}
                />
                No
              </label>
            </div>
          </div>

          {donor.hasDonatedBefore && (
            <div className="form-group">
              <label>Last Donation Date:</label>
              <input 
                type="date" 
                name="lastDonationDate" 
                value={donor.lastDonationDate} 
                onChange={handleChange} 
                max={new Date().toISOString().split('T')[0]} 
              />
              {errors.lastDonationDate && (
                <p className="error">{errors.lastDonationDate}</p>
              )}
              {donor.lastDonationDate && (
                <p className="info-text">
                  Donation gap: {donor.donationGap} months
                </p>
              )}
            </div>
          )}
        </div>
       
        {/* Availability */}
        <div className="form-section">
          <h3>Availability</h3>
          
          <label>Availability Time:</label>
          <div className="time-inputs">
            <input type="time" name="availabilityStart" value={donor.availabilityStart} onChange={handleChange} required />
            <span>to</span>
            <input type="time" name="availabilityEnd" value={donor.availabilityEnd} onChange={handleChange} required />
          </div>
          {errors.availabilityTime && <p className="error">{errors.availabilityTime}</p>}
        </div>

        {/* Health Information */}
        <div className="form-section">
          <h3>Health Information</h3>
          
          <label>Health Condition:</label>
          <div className="checkbox-group">
            {[...restrictedConditions, "None of the Above"].map((condition, index) => (
              <div key={index} className="checkbox-item">
                <input
                  type="checkbox"
                  name="healthCondition"
                  value={condition}
                  checked={donor.healthCondition.includes(condition)}
                  onChange={handleHealthConditionChange}
                />
                <label>{condition}</label>
              </div>
            ))}
          </div>
          {errors.healthCondition && <p className="error">{errors.healthCondition}</p>}
        </div>

        {/* Contact Information */}
        <div className="form-section">
          <h3>Contact Information</h3>
          
          <label>Contact Number:</label>
          <input type="tel" name="contactNumber" value={donor.contactNumber} onChange={handleChange} required pattern="[0-9]{10}" />
          {errors.contactNumber && <p className="error">{errors.contactNumber}</p>}

          {/* Location Method */}
          <div className="location-method">
            <label>Location Method:</label>
            <div>
              <input
                type="radio"
                id="addressMethod"
                name="locationMethod"
                checked={locationMethod === 'address'}
                onChange={() => setLocationMethod('address')}
              />
              <label htmlFor="addressMethod">Address</label>
              
              <input
                type="radio"
                id="gpsMethod"
                name="locationMethod"
                checked={locationMethod === 'gps'}
                onChange={() => setLocationMethod('gps')}
              />
              <label htmlFor="gpsMethod">GPS Location</label>
            </div>
          </div>

          {/* Address Fields */}
          {locationMethod === 'address' && (
            <>
              <label>Country:</label>
              <select name="country" value={donor.country} onChange={handleChange} required>
                <option value="">Select Country</option>
                {countryData.map((country) => (
                  <option key={country.name} value={country.name}>{country.name}</option>
                ))}
              </select>
              {errors.country && <p className="error">{errors.country}</p>}

              <label>State:</label>
              <select name="state" value={donor.state} onChange={handleChange} required disabled={!donor.country}>
                <option value="">Select State</option>
                {states.map((state) => (
                  <option key={state.name} value={state.name}>{state.name}</option>
                ))}
              </select>
              {errors.state && <p className="error">{errors.state}</p>}

              <label>District:</label>
              <select name="district" value={donor.district} onChange={handleChange} required disabled={!donor.state}>
                <option value="">Select District</option>
                {districts.map((district, index) => (
                  <option key={index} value={district}>{district}</option>
                ))}
              </select>
              {errors.district && <p className="error">{errors.district}</p>}

              <label>Street Address:</label>
              <input 
                type="text" 
                name="street" 
                value={donor.street} 
                onChange={handleChange} 
                required 
                placeholder="House no, Building, Street name"
              />
              {errors.street && <p className="error">{errors.street}</p>}
            </>
          )}

          {/* GPS Location */}
          {locationMethod === 'gps' && (
            <div className="gps-section">
              <label>Current Location:</label>
              <Gps onLocationUpdate={handleLocationChange} />
              
              {donor.location && donor.location.lat && donor.location.lng ? (
                <>
                  <div className="location-details">
                    <p>Coordinates: {donor.location.lat.toFixed(6)}, {donor.location.lng.toFixed(6)}</p>
                    {donor.location.address && (
                      <p>Address: {donor.location.address}</p>
                    )}
                  </div>
                  {errors.location && <p className="error">{errors.location}</p>}
                </>
              ) : (
                <p className="info-text">Click "Get Current Location" to set your location</p>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button type="submit" className="submit-btn" disabled={Object.keys(errors).length > 0}>
          Register as Donor
        </button>
      </form>
    </div>
  );
};

export default DonorForm;