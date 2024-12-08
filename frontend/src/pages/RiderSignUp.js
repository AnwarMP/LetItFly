import React, { useState, useEffect } from 'react';
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
    card_number: '',
    expiry_month: '',
    expiry_year: ''
  });

  const [errors, setErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitAttempted, setIsSubmitAttempted] = useState(false);

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

      case 'home_address': {
        // Basic format check, will be validated more thoroughly on submit with API
        const addressRegex = /^[\w\s.-]+,\s*[\w\s.-]+,\s*[A-Z]{2}\s*\d{5}$/;
        return addressRegex.test(value) 
          ? '' : 'Format: Street, City, State ZIP (e.g., 123 Main St, Boston, MA 02108)';
      }
      
      case 'password': {
        if (value.length < 8 || value.length > 32) return 'Password must be 8-32 characters';
        if (!/\d/.test(value)) return 'Password must contain at least one number';
        if (!/[a-zA-Z]/.test(value)) return 'Password must contain at least one letter';
        return '';
      }
      
      case 'confirm_password':
        return value === formData.password ? '' : 'Passwords do not match';
      
      case 'card_type':
        return value ? '' : 'Please select a card type';
      
      case 'card_number': {
        if (!/^\d+$/.test(value)) return 'Card number must contain only numbers';
        if (value.length < 13 || value.length > 16) return 'Card number must be 13-16 digits';
        return '';
      }
      
      case 'expiry_month': {
        const month = parseInt(value);
        if (isNaN(month) || month < 1 || month > 12) return 'Invalid month';
        
        const currentDate = new Date();
        const selectedYear = parseInt(formData.expiry_year);
        const currentYear = currentDate.getFullYear();
        
        if (selectedYear === currentYear && month < (currentDate.getMonth() + 1)) {
          return 'Card has expired';
        }
        return '';
      }
      
      case 'expiry_year': {
        const year = parseInt(value);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < currentYear) return 'Invalid year';
        return '';
      }
      
      default:
        return '';
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitAttempted(true);

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

    // Validate address with backend
    try {
      const addressResponse = await fetch('/check-valid-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: formData.home_address }),
      });

      if (!addressResponse.ok) {
        setErrors(prev => ({
          ...prev,
          home_address: 'Invalid address. Please verify and try again.'
        }));
        return;
      }

      // Prepare signup data
      const signUpData = {
        email: formData.email,
        password: formData.password,
        role: 'rider',
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        home_address: formData.home_address
      };

      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signUpData),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Add payment method
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

        alert('Registration successful!');
        window.location.replace('/');
      } else {
        alert(`Registration failed: ${data.message !== undefined ? data.message : 'Ensure email is not already in use.'}`);
      }
    } catch (error) {
      console.error('Error during registration:', error);
      alert('An error occurred while trying to register. Please try again later.');
    }
  };

  const shouldShowError = (fieldName) => {
    return (touchedFields[fieldName] || isSubmitAttempted) && errors[fieldName];
  };

  return (
    <div className="sign-up-page">
      <div className="sign-up-container">
        <h2 className="sign-up-header">Sign Up as Rider</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>First Name:</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={shouldShowError('first_name') ? 'error' : ''}
              required
            />
            {shouldShowError('first_name') && (
              <span className="error-message">{errors.first_name}</span>
            )}
          </div>

          <div className="form-group">
            <label>Last Name:</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={shouldShowError('last_name') ? 'error' : ''}
              required
            />
            {shouldShowError('last_name') && (
              <span className="error-message">{errors.last_name}</span>
            )}
          </div>

          <div className="form-group">
            <label>Phone Number:</label>
            <input
              type="text"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              onBlur={handleBlur}
              className={shouldShowError('phone_number') ? 'error' : ''}
              required
            />
            {shouldShowError('phone_number') && (
              <span className="error-message">{errors.phone_number}</span>
            )}
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={shouldShowError('email') ? 'error' : ''}
              required
            />
            {shouldShowError('email') && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label>Home Address:</label>
            <input
              type="text"
              name="home_address"
              value={formData.home_address}
              onChange={handleChange}
              onBlur={handleBlur}
              className={shouldShowError('home_address') ? 'error' : ''}
              required
            />
            {shouldShowError('home_address') && (
              <span className="error-message">{errors.home_address}</span>
            )}
          </div>

          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={shouldShowError('password') ? 'error' : ''}
              required
            />
            {shouldShowError('password') && (
              <span className="error-message">{errors.password}</span>
            )}
            <p>Requirements for Password:</p>
            <ul>
              <li>Password must be 8-32 characters long</li>
              <li>Password must contain at least one number</li>
              <li>Password must contain at least one letter</li>
            </ul>
          </div>

          <div className="form-group">
            <label>Confirm Password:</label>
            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={shouldShowError('confirm_password') ? 'error' : ''}
              required
            />
            {shouldShowError('confirm_password') && (
              <span className="error-message">{errors.confirm_password}</span>
            )}
          </div>

          <div className="form-group">
            <label>Card Type:</label>
            <select
              name="card_type"
              value={formData.card_type}
              onChange={handleChange}
              onBlur={handleBlur}
              className={shouldShowError('card_type') ? 'error' : ''}
              required
            >
              <option value="">Select Card Type</option>
              <option value="visa">Visa</option>
              <option value="mastercard">MasterCard</option>
              <option value="amex">American Express</option>
            </select>
            {shouldShowError('card_type') && (
              <span className="error-message">{errors.card_type}</span>
            )}
          </div>

          <div className="form-group">
            <label>Card Number:</label>
            <input
              type="text"
              name="card_number"
              value={formData.card_number}
              onChange={handleChange}
              onBlur={handleBlur}
              className={shouldShowError('card_number') ? 'error' : ''}
              maxLength="16"
              required
            />
            {shouldShowError('card_number') && (
              <span className="error-message">{errors.card_number}</span>
            )}
          </div>

          <div className="form-group">
            <label>Expiry Month:</label>
            <input
              type="number"
              name="expiry_month"
              value={formData.expiry_month}
              onChange={handleChange}
              onBlur={handleBlur}
              className={shouldShowError('expiry_month') ? 'error' : ''}
              min="1"
              max="12"
              required
            />
            {shouldShowError('expiry_month') && (
              <span className="error-message">{errors.expiry_month}</span>
            )}
          </div>

          <div className="form-group">
            <label>Expiry Year:</label>
            <input
              type="number"
              name="expiry_year"
              value={formData.expiry_year}
              onChange={handleChange}
              onBlur={handleBlur}
              className={shouldShowError('expiry_year') ? 'error' : ''}
              min={new Date().getFullYear()}
              required
            />
            {shouldShowError('expiry_year') && (
              <span className="error-message">{errors.expiry_year}</span>
            )}
          </div>

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

export default RiderSignUp;