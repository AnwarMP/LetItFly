import React, { useState } from 'react';
import '../methods.css'


const AddBankAccountForm = ({ onClose, onSuccess }) => {
    const [accountHolderName, setAccountHolderName] = useState('');
    const [routingNumber, setRoutingNumber] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
  
    const API_BASE_URL = "";
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setError(null);
  
      // Input validation
      if (!accountHolderName || !routingNumber || !accountNumber) {
        setError('All fields are required.');
        return;
      }
  
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/payments/bank-accounts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            account_holder_name: accountHolderName,
            routing_number: routingNumber,
            last_four: accountNumber,
          }),
        });
  
        if (!response.ok) throw new Error('Failed to add bank account');
        onSuccess(); // Refresh bank accounts list
        onClose(); // Close the form
      } catch (err) {
        console.error(err);
        setError('Failed to add bank account. Please try again.');
      } finally {
        setLoading(false);
      }
    };
  
    const handleClose = () => {
      // Reset bank account form state
      setAccountHolderName('');
      setRoutingNumber('');
      setAccountNumber('');
      setError(null);
      onClose();
    };
  
    return (
      <div className="add-bank-account-form">
        <h2>Add New Bank Account</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Account Holder Name</label>
            <input
              type="text"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Routing Number</label>
            <input
              type="text"
              value={routingNumber}
              onChange={(e) => setRoutingNumber(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Account Number - Last Four Digits</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Adding...' : 'Add Bank Account'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleClose}>
            Cancel
          </button>
        </form>
      </div>
    );
  };
  
  export default AddBankAccountForm;