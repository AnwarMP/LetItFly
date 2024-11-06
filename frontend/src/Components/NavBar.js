import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';

export const Navbar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAuthenticated, user, role } = useSelector(state => state.auth);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    return (
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
                        <li><Link to="/signup" className='nav-button'>Sign up</Link></li>
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
    );
};

export default Navbar;