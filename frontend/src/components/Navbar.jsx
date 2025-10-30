import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import auth from '../utils/auth';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const isLoggedIn = auth.isAuthenticated();

  const handleLogout = () => {
    auth.removeToken();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="nav-logo">
          BloodConnect
        </Link>
      </div>

      <div className="nav-links">
        <Link to="/" className="nav-item">Home</Link>
        
        {isLoggedIn ? (
          <>
            <Link to="/profile/requests" className="nav-item">Profile</Link>
            <Link to="/receiver/request" className="nav-item">Request Blood</Link>
            <Link to="/donor/register" className="nav-item">Donate</Link>
            <button onClick={handleLogout} className="nav-item logout-btn">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-item">Login</Link>
            <Link to="/register" className="nav-item">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 