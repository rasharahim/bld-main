import React, { useState } from 'react';
import './Register.css';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccessMessage('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate phone number
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone_number)) {
      setError('Phone number must be 10 digits');
      setLoading(false);
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          phone_number: formData.phone_number,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='Register'>
      <div className='card'>
        <div className='left'>
          <h1>Meow</h1>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quidem esse, dolores dolorum harum praesentium ipsum porro dolorem labore magnam tenetur.
          </p>
          <span>Already have an account?</span>
          <Link to="/login">
            <button>Login</button>
          </Link>
        </div>

        <div className='right'>
          <h1>Register</h1>
          <form onSubmit={handleRegister}>
            <input
              type="text"
              name="full_name"
              placeholder="Full Name"
              value={formData.full_name}
              onChange={handleChange}
              required
              minLength={2}
            />
            <input
              type="tel"
              name="phone_number"
              placeholder="Phone Number (10 digits)"
              value={formData.phone_number}
              onChange={handleChange}
              required
              pattern="\d{10}"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
          {error && <p className="error" style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
          {successMessage && <p className="success" style={{ color: 'green', marginTop: '10px' }}>{successMessage}</p>}
        </div>
      </div>
    </div>
  );
};

export default Register;