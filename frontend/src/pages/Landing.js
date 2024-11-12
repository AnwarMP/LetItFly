import React, { useState } from 'react';
import './App.css';
import { Link, useNavigate } from 'react-router-dom';

export const Landing = () => {
  const [showSignUpOptions, setShowSignUpOptions] = useState(false);
  const navigate = useNavigate();

  const handleSignUpClick = () => {
    setShowSignUpOptions(true);
  };

  const handleOptionClick = (role) => {
    setShowSignUpOptions(false);
    navigate(`/signup/${role}`);
};

  const handleClose = () => {
    setShowSignUpOptions(false);
  };

  return (
    <div>
      <div className="introduction">
        <div className="text">
          <div className="slogan">Fast. </div>
          <div className="slogan">Convenient.</div>
          <div className="slogan">Always On Your Schedule.</div>
          <div className="slogan">Let It Fly.</div>
          <div className="about">Bay Area's Premier Airport Shuttle Service.</div>
          <div className="button-options">
            <button>Ride With Us</button>
            <button>Drive With Us</button>
          </div>
        </div>
        <img src="/Driving.png" alt="Driving Over The Golden Gate Bridge" />
      </div>

      <div className="numerical">
        <div className="container">
          <div className="text-1">&lt; 30</div>
          <div className="text-2">minutes</div>
          <div className="small-text">Guaranteed wait time</div>
        </div>
        <div className="container">
          <div className="text-1">$15</div>
          <div className="text-2">minimum</div>
          <div className="small-text">Competitive pricing</div>
        </div>
        <div className="container">
          <div className="text-1">2</div>
          <div className="text-2">miles</div>
          <div className="small-text">Free of charge</div>
        </div>
      </div>

      {showSignUpOptions && (
        <div className="signup-options-slide">
          <button className="close-button" onClick={handleClose}>×</button>
          <p className="role-option" onClick={() => handleOptionClick('rider')}>Sign Up as Rider</p>
          <p className="role-option" onClick={() => handleOptionClick('driver')}>Sign Up as Driver</p>
        </div>
      )}
    </div>
  );
}

export default Landing;
