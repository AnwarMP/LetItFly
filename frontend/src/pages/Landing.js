import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Landing = () => {
  const navigate = useNavigate();

  const handleRideWithUs = () => {
    navigate('/rider-signup');
  };

  const handleDriveWithUs = () => {
    navigate('/driver-signup');
  };

  return (
    <div className="landing-container">
      <div className="hero-section">
        <div className="content-wrapper">
          <h1 className="hero-title">
            <span>Airport rides,</span>
            <span>made simple.</span>
            <span>Let It Fly.</span>
          </h1>
          <div className="hero-description">
            Bay Area's Premier Airport Shuttle Service.
            Fast, reliable, and always on your schedule.
          </div>
          <div className="cta-buttons">
            <button className="cta-button primary" onClick={handleRideWithUs}>
              Ride with us
            </button>
            <button className="cta-button secondary" onClick={handleDriveWithUs}>
              Drive with us
            </button>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="feature-card">
          <div className="feature-number">&lt;30</div>
          <div className="feature-label">minutes</div>
          <div className="feature-description">Average wait time for pickup</div>
        </div>
        <div className="feature-card">
          <div className="feature-number">$15</div>
          <div className="feature-label">minimum</div>
          <div className="feature-description">Transparent, competitive pricing</div>
        </div>
        <div className="feature-card">
          <div className="feature-number">2</div>
          <div className="feature-label">miles free</div>
          <div className="feature-description">First two miles on us</div>
        </div>
      </div>
    </div>
  );
};

export default Landing;