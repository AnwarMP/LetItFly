import React, { useState } from 'react';
import '../methods.css'

const AddPaymentMethodForm = ({ onClose, onSuccess }) => {
  const [cardType, setCardType] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = ""; // Backend API base URL

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    if (!cardType || !lastFour || !expiryMonth || !expiryYear) {
      setError('All fields are required.');
      return;
    }
    if (!/^\d{4}$/.test(lastFour)) {
      setError('Last four digits must be numeric.');
      return;
    }
    if (expiryMonth < 1 || expiryMonth > 12) {
      setError('Expiry month must be between 1 and 12.');
      return;
    }
    if (expiryYear < new Date().getFullYear()) {
      setError('Expiry year must be in the future.');
      return;
    }

    // Submit data to backend
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/payments/methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          card_type: cardType.toLowerCase(),
          last_four: lastFour,
          expiry_month: parseInt(expiryMonth, 10),
          expiry_year: parseInt(expiryYear, 10),
        }),
      });

      const data = await response.text();
      console.log('Response:', {
        status: response.status,
        data: data
      });

      if (!response.ok) {
        throw new Error(data || 'Failed to add payment method.');
      }

      onSuccess(); // Refresh payment methods list
      onClose(); // Close the form
    } catch (err) {
      console.error('Error adding payment method:', err);
      setError(err.message || 'Failed to add payment method. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form state
    setCardType('');
    setLastFour('');
    setExpiryMonth('');
    setExpiryYear('');
    setError(null);
    onClose();
  };

  return (
    <div className="add-payment-method-form">
      <h2>Add Payment Method</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="cardType">Card Type</label>
          <select
            id="cardType"
            value={cardType}
            onChange={(e) => setCardType(e.target.value)}
            required
          >
            <option value="">Select Card Type</option>
            <option value="visa">Visa</option>
            <option value="mastercard">MasterCard</option>
            <option value="amex">American Express</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="lastFour">Last Four Digits</label>
          <input
            id="lastFour"
            type="text"
            maxLength="4"
            value={lastFour}
            onChange={(e) => setLastFour(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="expiryMonth">Expiry Month</label>
          <input
            id="expiryMonth"
            type="number"
            min="1"
            max="12"
            value={expiryMonth}
            onChange={(e) => setExpiryMonth(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="expiryYear">Expiry Year</label>
          <input
            id="expiryYear"
            type="number"
            min={new Date().getFullYear()}
            value={expiryYear}
            onChange={(e) => setExpiryYear(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Adding...' : 'Add Payment Method'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleClose}>
          Cancel
        </button>
      </form>
    </div>
  );
};

export default AddPaymentMethodForm;