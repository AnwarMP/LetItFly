import React, { useState } from 'react';
import './SignUp.css';

function DriverSignUp() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    car_model: '',
    car_license_plate: '',
    password: '',
    confirm_password: '',
    account_holder_name: '',
    routing_number: '',
    account_number: '', // We'll only store last 4
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
  
    // Include all required fields for driver registration
    const signUpData = { 
      email: formData.email, 
      password: formData.password,
      role: 'driver', // Specify the role explicitly
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone_number: formData.phone_number,
      car_model: formData.car_model,
      car_license_plate: formData.car_license_plate
    };
    
    try {
      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signUpData),
      });
      const data = await response.json();
      if (response.ok) {
        // After successful registration, add bank account
        const bankResponse = await fetch('http://localhost:3000/api/payments/bank-accounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.token}`,
          },
          body: JSON.stringify({
            account_holder_name: formData.account_holder_name,
            routing_number: formData.routing_number,
            last_four: formData.account_number.slice(-4),
          }),
        });

        if (!bankResponse.ok) {
          throw new Error('Failed to add bank account');
        }
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
        <h2 className="sign-up-header">Sign Up as Driver</h2>

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
            <label>Car Model:</label>
            <input type="text" name="car_model" value={formData.car_model} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Car License Plate:</label>
            <input type="text" name="car_license_plate" value={formData.car_license_plate} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Confirm Password:</label>
            <input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Account Holder Name:</label>
            <input
              type="text"
              name="account_holder_name"
              value={formData.account_holder_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Routing Number:</label>
            <input
              type="text"
              name="routing_number"
              value={formData.routing_number}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Account Number - Last Four Digits:</label>
            <input
              type="text"
              name="account_number"
              value={formData.account_number}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="submit-button">Sign Up</button>
        </form>
      </div>
    </div>
  );
}

export default DriverSignUp;