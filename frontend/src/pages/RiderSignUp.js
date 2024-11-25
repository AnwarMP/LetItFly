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
    confirm_password: '',
    card_type: '',
    card_number: '', // We'll only store last 4
    expiry_month: '',
    expiry_year: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Name test checks for invalid characters in name field. 
    // Lowercase characters, uppercase characters, and dashes are allowed.
    let name_test = formData.first_name.replace((/[a-zA-Z-]+/), '');
    if (name_test.length > 0) {
      alert('Invalid characters found in first name, please try again');
      return;
    }
    name_test = formData.last_name.replace((/[a-zA-Z-]+/), '');
    if (name_test.length > 0) {
      alert('Invalid characters found in last name, please try again');
      return;
    }

    // Test must be have no length regex check for non-numbers in phone number
    let phone_number_test = formData.phone_number.replace(/[0-9]+/, '');
    if (phone_number_test.length > 0) {
      alert('Invalid characters for phone number found. Please only input numbers.');
      return;
    }
    // Phone number entry must have 10 characters 
    if (formData.phone_number.length !== 10) {
      alert('Please input a valid phone number that is 10 digits long (e.g. 1234567890).');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      alert('Passwords do not match!');
      return;
    }

    // Basic form validation for password, password must be between 8 to 32 characters
    if (formData.password.length < 8 || formData.password.length > 32) {
      alert('Passwords must be between 8 to 32 characters, please try again.');
      return;
    }
    
    // Prevents password from excluding any numbers
    let password_test = formData.password.replace(/[^0-9]+/g, '');
    if (password_test === '') {
      alert('Password has no numbers, please try again.');
      return;
    }
  
    // Prevents password from having no lowercase or uppercase characters
    password_test = formData.password.replace(/[^a-zA-Z]+/, '');
    if (password_test === '') {
      alert('Password has no lowercase or uppercase characters, please try again.');
      return;
    }


    
    // Ensuring card number only has number inputs
    let card_test = formData.card_number.replace(/[0-9]+/, '');
    if (card_test.length > 0) {
      alert('Invalid input for card number, must only contain characters between 0 and 9. Please try again.');
      return;
    }
    
    const date = new Date();
    const currentMont = date.getMonth();
    if (formData.expiry_month < currentMont && formData.expiry_year === '2024') {
      alert('Invalid input month, please select a card with an expiry month beyond today.');
      return;
    }
    
    // This is for testing if inputted address is valid through a backend call to MapBox GeoCoding service
    // Done at end of form validation to reduce amount of API calls
    let address_test = formData.home_address;
    try {
      const response = await fetch('http://localhost:3000/check-valid-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({address: address_test}),
      });

      console.log(response);
      if (!response.ok) {
        alert('Invalid address. Please try again.');
        return;
      }

    } catch (error) {
      console.error('Valid address check returns error', error);
      alert('Invalid address. Please try again.');
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
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signUpData),
      });
      const data = await response.json();
      if (response.ok) {
         // After successful registration, add payment method
         const paymentResponse = await fetch('/api/payments/methods', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.token}`,
          },
          body: JSON.stringify({
            card_type: formData.card_type.toLowerCase(),
            last_four: formData.card_number.slice(-4),
            expiry_month: parseInt(formData.expiry_month),
            expiry_year: parseInt(formData.expiry_year),
          }),
        });

        if (!paymentResponse.ok) {
          throw new Error('Failed to add payment method');
        }

        // Payment method will be automatically set as default since it's the first one
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
            <p>Requirements for Password:</p>
            <ul>
              <li>Password must be 8-32 characters long.</li>
              <li>Password must at contain at least one number.</li>
              <li>Password must at contain at least one lowercase or uppercase character.</li>
            </ul>
          </div>
          <div className="form-group">
            <label>Confirm Password:</label>
            <input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Card Type:</label>
            <select
              name="card_type"
              value={formData.card_type}
              onChange={handleChange}
              required
            >
              <option value="">Select Card Type</option>
              <option value="visa">Visa</option>
              <option value="mastercard">MasterCard</option>
              <option value="amex">American Express</option>
            </select>
          </div>
          <div className="form-group">
            <label>Card Number:</label>
            <input
              type="text"
              name="card_number"
              value={formData.card_number}
              onChange={handleChange}
              maxLength="16"
              required
            />
          </div>
          <div className="form-group">
            <label>Expiry Month:</label>
            <input
              type="number"
              name="expiry_month"
              value={formData.expiry_month}
              onChange={handleChange}
              min="1"
              max="12"
              required
            />
          </div>
          <div className="form-group">
            <label>Expiry Year:</label>
            <input
              type="number"
              name="expiry_year"
              value={formData.expiry_year}
              onChange={handleChange}
              min={new Date().getFullYear()}
              required
            />
          </div>
          <button type="submit" className="submit-button">Sign Up</button>
        </form>
      </div>
    </div>
  );
}

export default RiderSignUp;