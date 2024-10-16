import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./App.css"; // Import the CSS file

const NavBar = () => {
  const navigate = useNavigate();

  return (
    <div className="custom-nav">
      <div className="logo">Let It Fly</div>
      <ul className="nav-links">
        <li>
          <button onClick={() => navigate(-1)} className="nav-link">
            GoBack
          </button>
        </li>
        <li>
          <Link to="/driver" className="nav-link">
            Drive
          </Link>
        </li>
        <li>
          <Link to="/landing" className="nav-link"></Link>
        </li>
        <li>
          <Link to="/" className="nav-link">
            Home
          </Link>
        </li>
      </ul>
      <ul className="auth-links">
        <li>
          <Link to="/login" className="nav-link">
            Returning User
          </Link>
        </li>
        <li>
          <Link to="/signup" className="nav-link">
            New User
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default NavBar;
