import React, { useState } from 'react';
import './SignUp.css';

function RiderSignUp() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    home_address: '',
    password: '',
    confirm_password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      alert('Passwords do not match!');
      return;
    }
  
    // Include all required fields for rider registration
    const signUpData = { 
      email: formData.email, 
      password: formData.password,
      role: 'rider', // Specify the role explicitly
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone_number: formData.phone_number,
      home_address: formData.home_address
    };
    
    try {
      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signUpData),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Registration successful!');
        window.location.replace('/');
      } else {
        alert(`Registration failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Error during registration:', error);
      alert('An error occurred while trying to register. Please try again later.');
    }
  };
  

  return (
    <div className="sign-up-page">
      <div className="sign-up-container">
        <h2 className="sign-up-header">Sign Up as Rider</h2>

        <form onSubmit={handleSubmit}>
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
          <div className="form-group">
            <label>Home Address:</label>
            <input type="text" name="home_address" value={formData.home_address} onChange={handleChange} required />
          </div>
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

export default RiderSignUp;