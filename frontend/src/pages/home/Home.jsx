import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to BloodConnect</h1>
          <p>Connecting blood donors with those in need</p>
          <div className="hero-buttons">
            <Link to="/donor/register" className="btn btn-primary">
              Become a Donor
            </Link>
            <Link to="/receiver/request" className="btn btn-secondary">
              Request Blood
            </Link>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <h3>Donate Blood</h3>
          <p>Register as a donor and help save lives in your community.</p>
        </div>
        <div className="feature-card">
          <h3>Request Blood</h3>
          <p>Submit a blood request and find donors near you.</p>
        </div>
        <div className="feature-card">
          <h3>Track Status</h3>
          <p>Monitor your donation or request status in real-time.</p>
        </div>
      </section>

      <section className="info">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h4>Register</h4>
            <p>Create an account as a donor or receiver</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h4>Connect</h4>
            <p>Find donors or submit blood requests</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h4>Save Lives</h4>
            <p>Help those in need through blood donation</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;