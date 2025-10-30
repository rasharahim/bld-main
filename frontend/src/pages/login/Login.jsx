import React, { useState } from 'react';
import './Login.scss';
import auth from '@/utils/auth';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
      console.log('Login response:', data);
  
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
  
      // Store token, user ID, and email
      auth.setToken(data.token);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('email', data.user.email);
      
      // Navigate based on user type
      if (data.user.is_admin) {
        navigate('/admin-dashboard');
      } else {
        navigate('/home');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='Login'>
      <div className='card'>
        <div className='left'>
          <h1>Hello World</h1>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quidem esse, dolores dolorum harum praesentium ipsum porro dolorem labore magnam tenetur.
          </p>
          <span>Don't have an account?</span>
          <Link to="/register">
            <button>Register</button>
          </Link>
        </div>

        <div className='right'>
          <h1>Login</h1>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <Link to="/forgot-password" className="forgot-password">
            Forgot Password?
          </Link>
          {error && <p className="error" style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default Login;