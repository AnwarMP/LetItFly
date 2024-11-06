import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import './App.css';

export const Login = () => {
    const [inputs, setInputs] = useState({});
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector(state => state.auth);

    const handleSetValue = (event) => {
        const entry = event.target.name;
        const pass = event.target.value;
        setInputs(values => ({...values, [entry]: pass}));
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        dispatch(loginStart());

        try {
            const response = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: inputs.email, 
                    password: inputs.pass 
                }),
            });

            const data = await response.json();
            
            if (response.ok) {
                dispatch(loginSuccess({
                    user: { email: inputs.email },
                    token: data.token,
                    role: 'driver' // Backend will need to send this
                }));

                // Redirect based on role
                if (data.role === 'driver') {
                    navigate('/driver');
                } else {
                    navigate('/rider');
                }
            } else {
                dispatch(loginFailure(data.message));
                alert(data.message);
            }
        } catch (error) {
            dispatch(loginFailure('Login failed. Please try again.'));
            alert('Login failed. Please try again.');
        }
    };

    return (
        <div>
            <div className="custom-nav">
                <div className="left-section">
                    <div className="logo">Let It Fly</div>
                    <ul>
                        <li><a href="#">Ride</a></li>
                        <li><a href="#">Drive</a></li>
                        <li><a href="#">About</a></li>
                    </ul>
                </div>
                <ul>
                    <li><Link to="/login" className='nav-button'>Log in</Link></li>
                    <li><Link to="/signup" className='nav-button'>Sign up</Link></li>
                </ul>
            </div>
                
            <div className="numerical">
                <div className="container">
                    <br/><br/><br/>
                    <form className="form-group custom-form" onSubmit={handleSubmit}>
                        <label>Enter your email:</label>
                        <br/>
                        <input 
                            type="email" 
                            name="email"
                            required 
                            className="form-control"
                            value={inputs.email || ""}
                            onChange={handleSetValue}
                            disabled={loading}
                        />

                        <br/>
                        <label>Enter your password:</label>
                        <br/>
                        <input 
                            type="password" 
                            name="pass"
                            required 
                            className="form-control"
                            value={inputs.pass || ""}
                            onChange={handleSetValue}
                            disabled={loading}
                        />
                        <br/>
                        <br/>
                        <button 
                            type='submit' 
                            className='btn btn-success btn-md'
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                        
                        {error && (
                            <div className="alert alert-danger mt-3">
                                {error}
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;