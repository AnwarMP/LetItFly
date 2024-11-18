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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
        setIsMobileMenuOpen(false);
    };

    const handleSignUpClick = () => {
        setShowSignUpOptions(true);
        setIsMobileMenuOpen(false);
    };

    const handleOptionClick = (role) => {
        setShowSignUpOptions(false);
        setIsMobileMenuOpen(false);
        navigate(`/${role}-signup`);
    };

    const handleClose = () => {
        setShowSignUpOptions(false);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <div>
            <div className="custom-nav">
                <div className="left-section">
                    <Link to="/" className="logo">Let It Fly</Link>
                    <ul className="nav-links">
                        {isAuthenticated && role === 'rider' && (
                            <li><Link to="/rider">Book a Ride</Link></li>
                        )}
                        {isAuthenticated && role === 'driver' && (
                            <li><Link to="/driver">Driver Dashboard</Link></li>
                        )}
                    </ul>
                </div>

                <button className="hamburger" onClick={toggleMobileMenu}>
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <ul className="nav-links">
                    {!isAuthenticated ? (
                        <>
                            <li><Link to="/login" className="nav-button">Log in</Link></li>
                            <li>
                                <button onClick={handleSignUpClick} className="nav-button">Sign up</button>
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
                                <Link to="/settings" className="nav-button">Settings</Link>
                            </li>
                            <li>
                                <button onClick={handleLogout} className="nav-button logout-button">
                                    Logout
                                </button>
                            </li>
                        </>
                    )}
                </ul>
            </div>

            {/* Mobile Menu */}
            <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
                <ul className="nav-links">
                    {isAuthenticated && role === 'rider' && (
                        <li><Link to="/rider" onClick={() => setIsMobileMenuOpen(false)}>Book a Ride</Link></li>
                    )}
                    {isAuthenticated && role === 'driver' && (
                        <li><Link to="/driver" onClick={() => setIsMobileMenuOpen(false)}>Driver Dashboard</Link></li>
                    )}
                    <li><a href="#" onClick={() => setIsMobileMenuOpen(false)}>About</a></li>
                    {!isAuthenticated ? (
                        <>
                            <li><Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>Log in</Link></li>
                            <li><button onClick={handleSignUpClick}>Sign up</button></li>
                        </>
                    ) : (
                        <>
                            <li><Link to="/settings" onClick={() => setIsMobileMenuOpen(false)}>Settings</Link></li>
                            <li><button onClick={handleLogout}>Logout</button></li>
                        </>
                    )}
                </ul>
            </div>

            {/* Sign Up Options Modal */}
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