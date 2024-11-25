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
    

    // Name test checks for invalid characters in name field. 
    // Lowercase characters, uppercase characters, and dashes are allowed.
    let name_test = formData.first_name.replace((/[a-zA-Z-]/), '');
    if (name_test.length > 0) {
      alert('Invalid characters found in first name, please try again');
      return;
    }
    name_test = formData.last_name.replace((/[a-zA-Z-]/), '');
    if (name_test.length > 0) {
      alert('Invalid characters found in last name, please try again');
      return;
    }

    // Test must be have no length regex check for non-numbers in phone number
    let phone_number_test = formData.phone_number.replace(/[0-9]/, '');
    if (phone_number_test.length > 0) {
      alert('Invalid characters for phone number found. Please only input numbers.');
      return;
    }
    // Phone number entry must have 10 characters 
    if (formData.phone_number.length !== 10) {
      alert('Please input a valid phone number that is 10 digits long (e.g. 1234567890).');
      return;
    }
    
    let car_model_test = formData.car_model.replace(/[0-9a-zA-Z- ]/, '');
    if (car_model_test.length > 0) {
      alert('Invalid character found in car model, please try again.');
      return;
    }

    // Car license plate must contain numbers or letters, flexible in characters for non-standard cars
    let car_plate_test = formData.car_license_plate.replace(/[0-9a-zA-Z]/, '');
    if (car_plate_test.length > 0) {
      alert('Invalid license plate, plase input a plate with numbers and letters only.');
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
    let password_test = formData.password.replace(/[^0-9]/g, '');
    if (password_test === '') {
      alert('Password has no numbers, please try again.');
      return;
    }
  
    // Prevents password from having no lowercase or uppercase characters
    password_test = formData.password.replace(/[^a-zA-Z]/, '');
    if (password_test === '') {
      alert('Password has no lowercase or uppercase characters, please try again.');
      return;
    }

    let account_name_test = formData.account_holder_name.replace(/[a-zA-Z-]/, '');
    if (account_name_test.length > 0) {
      alert('Invalid account name, please input something valid.');
      return;
    }

    let account_test = formData.routing_number.replace(/[0-9]/, '');
    if (account_test.length > 0) {
      alert('Routing number must only contain numbers, please try again.');
      return;
    }

    account_test = formData.account_number.replace(/[0-9]/, '');
    if (account_test.length > 0) {
      alert('Account number must only be numbers, please try again.');
      return;
    }

    if (formData.account_number.length < 4) {
      alert('You must have at least 4 digits for your account number. Please try again.');
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