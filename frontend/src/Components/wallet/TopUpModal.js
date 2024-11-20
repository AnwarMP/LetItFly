import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

export const TopUpModal = ({ 
  onClose, 
  onTopUp, 
  paymentMethods = [],
  isLoading 
}) => {
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!amount || !selectedMethod) {
      setError('Please fill in all fields');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      await onTopUp({
        amount: numAmount,
        payment_method_id: selectedMethod
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to process top-up');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold mb-6">Top Up Wallet</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Amount (USD)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="w-full p-2 border rounded focus:outline-none focus:border-black"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Payment Method</label>
            <select
              className="w-full p-2 border rounded focus:outline-none focus:border-black"
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
            >
              <option value="">Select payment method</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.card_type.toUpperCase()} •••• {method.card_last_four}
                  {method.is_default ? ' (Default)' : ''}
                </option>
              ))}
            </select>
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
              onClick={onClose}
              className="flex-1 p-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 p-2 bg-black text-white rounded hover:bg-gray-800 disabled:bg-gray-400"
            >
              {isLoading ? 'Processing...' : 'Top Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TopUpModal;