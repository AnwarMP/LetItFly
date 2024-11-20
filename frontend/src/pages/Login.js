import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import './Login.css';

export const Login = () => {
    const [inputs, setInputs] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showSignUpOptions, setShowSignUpOptions] = useState(false);
    const [selectedRole, setSelectedRole] = useState('rider'); // Default to rider
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleSetValue = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setInputs(values => ({...values, [name]: value}));
        setError(null);
    }

    const handleSignUpClick = (e) => {
        e.preventDefault();
        setShowSignUpOptions(true);
    };

    const handleOptionClick = (role) => {
        setShowSignUpOptions(false);
        navigate(`/${role}-signup`);
    };

    const handleClose = () => {
        setShowSignUpOptions(false);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setLoading(true);
        dispatch(loginStart());

        try {
            const response = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: inputs.email, 
                    password: inputs.pass,
                    role: selectedRole
                }),
            });

            const data = await response.json();
            
            if (response.ok) {
                if (data.user.role !== selectedRole) {
                    setError(`Invalid login. This account is registered as a ${data.user.role}`);
                    dispatch(loginFailure('Invalid role'));
                    return;
                }

                dispatch(loginSuccess({
                    user: data.user,
                    token: data.token,
                    role: data.user.role
                }));

                navigate(data.user.role === 'driver' ? '/driver' : '/rider');
            } else {
                dispatch(loginFailure(data.message));
                setError(data.message);
            }
        } catch (error) {
            const errorMessage = 'Login failed. Please try again.';
            dispatch(loginFailure(errorMessage));
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="login-page">
                <div className="login-container">
                    <h2 className="login-header">Login</h2>
                    
                    <div className="tab-container">
                        <div 
                            className={`tab ${selectedRole === 'rider' ? 'active' : ''}`}
                            onClick={() => setSelectedRole('rider')}
                        >
                            <span className="tab-icon">🚗</span>
                            Rider
                        </div>
                        <div 
                            className={`tab ${selectedRole === 'driver' ? 'active' : ''}`}
                            onClick={() => setSelectedRole('driver')}
                        >
                            <span className="tab-icon">🚘</span>
                            Driver
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Email Address:</label>
                            <input 
                                type="email" 
                                name="email"
                                required 
                                value={inputs.email || ""}
                                onChange={handleSetValue}
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label>Password:</label>
                            <input 
                                type="password" 
                                name="pass"
                                required 
                                value={inputs.pass || ""}
                                onChange={handleSetValue}
                                disabled={loading}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="login-button"
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : `Login as ${selectedRole}`}
                        </button>

                        {error && (
                            <div className="alert alert-danger">
                                {error}
                            </div>
                        )}

                        <div className="redirect-signup">
                            Don't have an account? <a href="#" onClick={handleSignUpClick} className="signup-link">Sign up</a>
                        </div>
                    </form>
                </div>
            </div>

            {showSignUpOptions && (
                <div className="signup-options-slide">
                    <button className="close-button" onClick={handleClose}>×</button>
                    <p className="role-option" onClick={() => handleOptionClick('rider')}>Sign up as a rider</p>
                    <p className="role-option" onClick={() => handleOptionClick('driver')}>Sign up as driver</p>
                </div>
            )}
        </>
    );
};

export default Login;