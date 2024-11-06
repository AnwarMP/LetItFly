import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/authSlice';
import './SignUp.css';

function SignUp() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [role, setRole] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone_number: '',
        email: '',
        home_address: '',
        car_model: '',
        car_license_plate: '',
        password: '',
        confirm_password: ''
    });

    const handleRoleChange = (selectedRole) => {
        setRole(selectedRole);
        setError(null);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!role) {
            setError('Please select whether you are signing up as a Rider or Driver');
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirm_password) {
            setError('Passwords do not match!');
            setLoading(false);
            return;
        }

        const signUpData = {
            email: formData.email,
            password: formData.password,
            role: role,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone_number: formData.phone_number,
            home_address: role === 'rider' ? formData.home_address : null,
            car_model: role === 'driver' ? formData.car_model : null,
            car_license_plate: role === 'driver' ? formData.car_license_plate : null
        };

        try {
            const response = await fetch('http://localhost:3000/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(signUpData),
            });

            const data = await response.json();

            if (response.ok) {
                // Update Redux store
                dispatch(loginSuccess({
                    user: data.user,
                    token: data.token,
                    role: data.user.role
                }));

                // Redirect based on role
                if (role === 'driver') {
                    navigate('/driver');
                } else {
                    navigate('/rider');
                }
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Error during registration:', error);
            setError('An error occurred while trying to register. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sign-up-page">
            <div className="sign-up-container">
                <h2 className="sign-up-header">Sign Up</h2>

                <div className="sign-up-options">
                    <button
                        className={`role-button ${role === 'rider' ? 'selected' : ''}`}
                        onClick={() => handleRoleChange('rider')}
                        disabled={loading}
                    >
                        Rider
                    </button>
                    <button
                        className={`role-button ${role === 'driver' ? 'selected' : ''}`}
                        onClick={() => handleRoleChange('driver')}
                        disabled={loading}
                    >
                        Driver
                    </button>
                </div>

                {error && (
                    <div className="alert alert-danger mt-3">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Shared fields */}
                    <div className="form-group">
                        <label>First Name:</label>
                        <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label>Last Name:</label>
                        <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label>Phone Number:</label>
                        <input
                            type="text"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>

                    {/* Rider-specific field */}
                    {role === 'rider' && (
                        <div className="form-group">
                            <label>Home Address:</label>
                            <input
                                type="text"
                                name="home_address"
                                value={formData.home_address}
                                onChange={handleChange}
                                required
                                disabled={loading}
                            />
                        </div>
                    )}

                    {/* Driver-specific fields */}
                    {role === 'driver' && (
                        <>
                            <div className="form-group">
                                <label>Car Model:</label>
                                <input
                                    type="text"
                                    name="car_model"
                                    value={formData.car_model}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label>Car License Plate:</label>
                                <input
                                    type="text"
                                    name="car_license_plate"
                                    value={formData.car_license_plate}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </>
                    )}

                    {/* Password fields */}
                    <div className="form-group">
                        <label>Password:</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label>Confirm Password:</label>
                        <input
                            type="password"
                            name="confirm_password"
                            value={formData.confirm_password}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="submit-button"
                        disabled={loading}
                    >
                        {loading ? 'Signing Up...' : 'Sign Up'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default SignUp;