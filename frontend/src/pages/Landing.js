
import './App.css';

import React from 'react';
import { Link } from 'react-router-dom';

export const Landing = () => {
  return (
    <body>

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
    </body>
  );
}

export default Landing;