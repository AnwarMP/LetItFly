import React from 'react'
import { useState } from 'react';
import { Link } from 'react-router-dom';
//import { useDispatch } from 'react-redux';


import './SignUp.css';
function SignUp() {
    const [role, setRole] = useState('');
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
    };
  
    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };
  
    const handleSubmit = (e) => {
      e.preventDefault();
      if (!role) {
        alert('Please select whether you are signing up as a Rider or Driver');
      } else if (formData.password !== formData.confirm_password) {
        alert('Passwords do not match!');
      } else {
        // Handle sign-up logic here when we implement backend
        console.log('Sign-up data:', { role, ...formData });
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
            >
              Rider
            </button>
            <button 
              className={`role-button ${role === 'driver' ? 'selected' : ''}`} 
              onClick={() => handleRoleChange('driver')}
            >
              Driver
            </button>
          </div>
  
          <form onSubmit={handleSubmit}>
            {/* Shared fields */}
            <div className="form-group">
              <label>First Name:</label>
              <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Last Name:</label>
              <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Phone Number:</label>
              <input type="text" name="phone_number" value={formData.phone_number} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
  
            {/* Rider-specific field */}
            {role === 'rider' && (
              <div className="form-group">
                <label>Home Address:</label>
                <input type="text" name="home_address" value={formData.home_address} onChange={handleChange} required />
              </div>
            )}
  
            {/* Driver-specific fields */}
            {role === 'driver' && (
              <>
                <div className="form-group">
                  <label>Car Model:</label>
                  <input type="text" name="car_model" value={formData.car_model} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Car License Plate:</label>
                  <input type="text" name="car_license_plate" value={formData.car_license_plate} onChange={handleChange} required />
                </div>
              </>
            )}
  
            {/* Password and Confirm Password fields */}
            <div className="form-group">
              <label>Password:</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Confirm Password:</label>
              <input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} required />
            </div>
  
            <button type="submit" className="submit-button">Sign Up</button>
          </form>
        </div>
      </div>
    );
  }
  
  export default SignUp;