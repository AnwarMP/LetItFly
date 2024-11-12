import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import './NavBar.css';

export const Navbar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAuthenticated, user, role } = useSelector(state => state.auth);
    const [showSignUpOptions, setShowSignUpOptions] = useState(false);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    const handleSignUpClick = () => {
        setShowSignUpOptions(true);
    };

    const handleOptionClick = (role) => {
        setShowSignUpOptions(false);
        navigate(`/${role}-signup`);
    };

    const handleClose = () => {
        setShowSignUpOptions(false);
    };

    return (
        <div>
            <div className="custom-nav">
                <div className="left-section">
                    <div className="logo">Let It Fly</div>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        {isAuthenticated && role === 'rider' && (
                            <li><Link to="/rider">Book a Ride</Link></li>
                        )}
                        {isAuthenticated && role === 'driver' && (
                            <li><Link to="/driver">Driver Dashboard</Link></li>
                        )}
                        <li><a href="#">About</a></li>
                    </ul>
                </div>
                <ul>
                    {!isAuthenticated ? (
                        <>
                            <li><Link to="/login" className='nav-button'>Log in</Link></li>
                            <li>
                                <button onClick={handleSignUpClick} className='nav-button'>Sign up</button>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <span className="welcome-text">
                                    Welcome, {user?.first_name || 'User'}
                                </span>
                            </li>
                            <li>
                                <button 
                                    onClick={handleLogout}
                                    className="nav-button logout-button"
                                >
                                    Logout
                                </button>
                            </li>
                        </>
                    )}
                </ul>
            </div>

            {showSignUpOptions && (
                <div className="signup-options-slide">
                    <button className="close-button" onClick={handleClose}>×</button>
                    <p className="role-option" onClick={() => handleOptionClick('rider')}>Sign up as a rider</p>
                    <p className="role-option" onClick={() => handleOptionClick('driver')}>Sign up as driver</p>
                </div>
            )}
        </div>
    );
};

export default Navbar;
