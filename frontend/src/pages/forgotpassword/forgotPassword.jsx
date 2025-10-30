import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './forgotPassword.css'; // Optional: Add styles for this component

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Password reset instructions sent to your email.');
        setTimeout(() => {
          navigate('/login'); // Redirect to login page after 3 seconds
        }, 3000);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className='forgotPassword'>
      <div className='card'>
        <div className='left'>
          <h1>Forgot Password?</h1>
          <p>
            Enter your email address below, and we'll send you instructions to reset your password.
          </p>
          <span>Remember your password?</span>
          <Link to="/login">
            <button>Login</button>
          </Link>
        </div>

        <div className='right'>
          <h1>Reset Password</h1>
          <form onSubmit={handleForgotPassword}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">Send Reset Instructions</button>
          </form>
          {message && <p>{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;