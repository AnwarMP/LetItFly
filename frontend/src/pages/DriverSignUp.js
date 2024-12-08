import React, { useState, useEffect } from 'react';
import './SignUp.css';

function DriverSignUp() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    car_model: '',
    car_license_plate: '',
    has_four_seats: '',
    password: '',
    confirm_password: '',
    account_holder_name: '',
    routing_number: '',
    account_number: '',
    address: '',
  });

  const [errors, setErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitAttempted, setIsSubmitAttempted] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Only validate if the field has been touched or form submission was attempted
    if (touchedFields[name] || isSubmitAttempted) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Handle field blur
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };
  
    // Check if all fields are valid
  useEffect(() => {
    const validateForm = () => {
      const newErrors = {};
      Object.keys(formData).forEach(key => {
        const error = validateField(key, formData[key]);
        if (error) newErrors[key] = error;
      });
      
      setIsFormValid(Object.keys(newErrors).length === 0 && 
        Object.values(formData).every(value => value.length > 0));
    };

    validateForm();
  }, [formData]);

   // Validation rules
    const validateField = (name, value) => {
      switch (name) {
        case 'first_name':
        case 'last_name':
          return /^[a-zA-Z-]+$/.test(value) ? '' : 'Only letters and hyphens allowed';
        
        case 'phone_number':
          return value.length === 10 && /^\d+$/.test(value) 
            ? '' : 'Phone number must be exactly 10 digits';
        
        case 'email': {
          const validDomains = ['@gmail.com', '@yahoo.com', '@hotmail.com'];
          const hasValidDomain = validDomains.some(domain => value.endsWith(domain));
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && hasValidDomain
            ? '' : 'Must be a valid gmail.com, yahoo.com, or hotmail.com email';
        }
        
        case 'car_model':
          return /^[0-9a-zA-Z- ]+$/.test(value) ? '' : 'Invalid car model format';
        
        case 'car_license_plate':
          return /^[0-9a-zA-Z]+$/.test(value) ? '' : 'Only letters and numbers allowed';

        case 'has_four_seats':
          return value === 'yes' ? '' : 'You must have at least four passenger seats to be a LetItFly driver';
        
        case 'password': {
          if (value.length < 8 || value.length > 32) return 'Password must be 8-32 characters';
          if (!/\d/.test(value)) return 'Password must contain at least one number';
          if (!/[a-zA-Z]/.test(value)) return 'Password must contain at least one letter';
          return '';
        }
        
        case 'confirm_password':
          return value === formData.password ? '' : 'Passwords do not match';
        
        case 'account_holder_name':
          return /^[a-zA-Z- ]+$/.test(value) ? '' : 'Only letters, spaces, and hyphens allowed';
        
        case 'routing_number':
          return value.length === 9 && /^\d+$/.test(value) 
            ? '' : 'Routing number must be exactly 9 digits';
        
        case 'account_number':
          return value.length === 9 && /^\d+$/.test(value) 
            ? '' : 'Account number must be exactly 9 digits';
        
        case 'address': {
          const addressRegex = /^[\w\s.-]+,\s*[\w\s.-]+,\s*[A-Z]{2}\s*\d{5}$/;
          return addressRegex.test(value) 
            ? '' : 'Format: Street, City, State ZIP';
        }
        
        default:
          return '';
      }
    };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;


    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }
    

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
    
    let car_model_test = formData.car_model.replace(/[0-9a-zA-Z- ]+/, '');
    if (car_model_test.length > 0) {
      alert('Invalid character found in car model, please try again.');
      return;
    }

    // Car license plate must contain numbers or letters, flexible in characters for non-standard cars
    let car_plate_test = formData.car_license_plate.replace(/[0-9a-zA-Z]+/, '');
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

    let account_name_test = formData.account_holder_name.replace(/[a-zA-Z-]+/, '');
    if (account_name_test.length > 0) {
      alert('Invalid account name, please input something valid.');
      return;
    }

    let account_test = formData.routing_number.replace(/[0-9]+/, '');
    if (account_test.length > 0) {
      alert('Routing number must only contain numbers, please try again.');
      return;
    }
    
    if (formData.routing_number.length !== 9) {
      alert('Your routing number must be 9 digits long, please try again.');
      return;
    }

    account_test = formData.account_number.replace(/[0-9]+/, '');
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
        alert(`Registration failed: ${data.message !== undefined ? data.message : 'Ensure email is not already in use.'}`);
              }
    } catch (error) {
      console.error('Error during registration, ensure this email has not been used before', error);
      alert('An error occurred while trying to register. Please try again later. Ensure email is not already in use.');
    }
  };


  const shouldShowError = (fieldName) => {
    return (touchedFields[fieldName] || isSubmitAttempted) && errors[fieldName];
  };
  
  const renderFormField = (field) => {
    const label = field.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    // Special case for has_four_seats field
    if (field === 'has_four_seats') {
      return (
        <div className="form-group" key={field}>
          <label>LetItFly requires that drivers have a minimum of four passenger seats, do you meet this requirement?</label>
          <select
            name={field}
            value={formData[field]}
            onChange={handleChange}
            onBlur={handleBlur}
            className={shouldShowError(field) ? 'error' : ''}
            required
          >
            <option value="">Select an option</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
          {shouldShowError(field) && (
            <span className="error-message">{errors[field]}</span>
          )}
        </div>
      );
    }

    // Default input field rendering
    return (
      <div className="form-group" key={field}>
        <label>{label}:</label>
        <input
          type={field.includes('password') ? 'password' : 'text'}
          name={field}
          value={formData[field]}
          onChange={handleChange}
          onBlur={handleBlur}
          className={shouldShowError(field) ? 'error' : ''}
          required
        />
        {shouldShowError(field) && (
          <span className="error-message">{errors[field]}</span>
        )}
      </div>
    );
  };

  return (
    <div className="sign-up-page">
      <div className="sign-up-container">
        <h2 className="sign-up-header">Sign Up as Driver</h2>
        
        <form onSubmit={handleSubmit}>
          {Object.keys(formData).map(field => renderFormField(field))}

          <button 
            type="submit" 
            className={`submit-button ${!isFormValid ? 'disabled' : ''}`}
            disabled={!isFormValid}
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}


export default DriverSignUp;