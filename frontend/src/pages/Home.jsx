import React from 'react';
import { Link } from 'react-router-dom';
import auth from '../utils/auth';
import './Home.css';

const Home = () => {
  const isLoggedIn = auth.isAuthenticated();

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="video-background">
          <div className="overlay"></div>
        </div>
        <div className="hero-content">
          <h1>Welcome to <span className="highlight">BloodConnect</span></h1>
          <p className="subtitle">Connecting blood donors with those in need</p>
          {!isLoggedIn && (
            <div className="cta-buttons">
              <Link to="/register" className="cta-primary">
                Sign Up
              </Link>
              <Link to="/login" className="cta-secondary">
                Login
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Value Propositions */}
      <section className="value-props">
        <div className="section-header">
          <h2>How You Can Help</h2>
          <p>Join our community and make a difference</p>
        </div>
        
        <div className="cards">
          {/* Donate Blood Card */}
          <div className="card">
            <div className="card-icon">D</div>
            <h3>Donate Blood</h3>
            <p>Register as a blood donor and help save lives in your community.</p>
            <Link
              to={isLoggedIn ? "/donor/register" : "/login"}
              className="cta-primary"
            >
              Become a Donor
            </Link>
          </div>

          {/* Request Blood Card */}
          <div className="card">
            <div className="card-icon">R</div>
            <h3>Request Blood</h3>
            <p>Submit a blood request and connect with potential donors.</p>
            <Link
              to={isLoggedIn ? "/receiver/request" : "/login"}
              className="cta-primary"
            >
              Request Blood
            </Link>
          </div>

          {/* Track Status Card */}
          <div className="card">
            <div className="card-icon">T</div>
            <h3>Track Status</h3>
            <p>Check the status of your blood donations and requests.</p>
            <Link
              to={isLoggedIn ? "/profile" : "/login"}
              className="cta-primary"
            >
              Check Status
            </Link>
          </div>
        </div>
      </section>

      {/* Emergency Section */}
      <section className="emergency">
        <div className="emergency-content">
          <h2>Emergency Blood Request?</h2>
          <p>We understand that every second counts. Get immediate assistance.</p>
          <Link
            to={isLoggedIn ? "/receiver/request" : "/login"}
            className="emergency-button"
          >
            Request Now
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="stat-item">
          <div className="stat-value">1000+</div>
          <div className="stat-label">Registered Donors</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">500+</div>
          <div className="stat-label">Successful Donations</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">24/7</div>
          <div className="stat-label">Emergency Support</div>
        </div>
      </section>
    </div>
  );
};

export default Home; 