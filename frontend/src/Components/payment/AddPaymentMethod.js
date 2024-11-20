import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

export const AddPaymentMethod = ({ onAdd, onCancel }) => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardType: '',
    expiryDate: '',
    cvv: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.cardNumber || !formData.cardType || !formData.expiryDate || !formData.cvv) {
      setError('All fields are required');
      return;
    }

    if (formData.cardNumber.replace(/\s/g, '').length !== 16) {
      setError('Invalid card number');
      return;
    }

    try {
      await onAdd({
        card_number: formData.cardNumber.replace(/\s/g, ''),
        card_type: formData.cardType.toLowerCase(),
      });
    } catch (err) {
      setError(err.message || 'Failed to add payment method');
    }
  };

  return (
    <div className="bg-white rounded shadow p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Card Number</label>
          <input
            type="text"
            name="cardNumber"
            maxLength="19"
            className="w-full p-2 border rounded focus:outline-none focus:border-black"
            value={formData.cardNumber}
            onChange={handleChange}
            placeholder="1234 5678 9012 3456"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Card Type</label>
          <select
            name="cardType"
            className="w-full p-2 border rounded focus:outline-none focus:border-black"
            value={formData.cardType}
            onChange={handleChange}
          >
            <option value="">Select card type</option>
            <option value="visa">Visa</option>
            <option value="mastercard">Mastercard</option>
            <option value="amex">American Express</option>
            <option value="discover">Discover</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Expiry Date</label>
            <input
              type="text"
              name="expiryDate"
              maxLength="5"
              className="w-full p-2 border rounded focus:outline-none focus:border-black"
              value={formData.expiryDate}
              onChange={handleChange}
              placeholder="MM/YY"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">CVV</label>
            <input
              type="password"
              name="cvv"
              maxLength="4"
              className="w-full p-2 border rounded focus:outline-none focus:border-black"
              value={formData.cvv}
              onChange={handleChange}
              placeholder="123"
            />
          </div>
        </div>

        {error && (
          <div className="text-red-600 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 p-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 p-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Add Card
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPaymentMethod;