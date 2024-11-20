import React, { useState, useEffect } from 'react';
import PaymentMethodCard from './PaymentMethodCard';
import AddPaymentMethod from './AddPaymentMethod';
import { Plus } from 'lucide-react';

export const PaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('http://localhost:3000/payment/methods', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch payment methods');
      const data = await response.json();
      setPaymentMethods(data.payment_methods);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async (cardData) => {
    try {
      const response = await fetch('http://localhost:3000/payment/methods', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData),
      });

      if (!response.ok) throw new Error('Failed to add payment method');
      await fetchPaymentMethods();
      setShowAddForm(false);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/payment/methods/${id}/default`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to set default payment method');
      await fetchPaymentMethods();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/payment/methods/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to remove payment method');
      await fetchPaymentMethods();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-70px)] bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-70px)] bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h2 className="text-2xl font-bold mb-6">Payment Methods</h2>

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="mb-6 bg-black text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Card
          </button>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded mb-4">
            {error}
          </div>
        )}

        {showAddForm ? (
          <AddPaymentMethod
            onAdd={handleAddPaymentMethod}
            onCancel={() => setShowAddForm(false)}
          />
        ) : (
          <div className="space-y-4">
            {paymentMethods.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No payment methods added yet
              </div>
            ) : (
              paymentMethods.map((method) => (
                <PaymentMethodCard
                  key={method.id}
                  id={method.id}
                  cardType={method.card_type}
                  lastFour={method.card_last_four}
                  isDefault={method.is_default}
                  onSetDefault={handleSetDefault}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethods;