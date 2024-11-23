import React, { useEffect, useState } from 'react';
import AddPaymentMethodForm from './AddPaymentMethodsForm';
import { Card, CardHeader, CardContent } from '../Card';
import './methods.css'

const PaymentMethodsTab = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false); // Track form visibility

  const API_BASE_URL = "http://localhost:3000"; // Base URL for API requests

  const fetchPaymentMethods = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/methods`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch payment methods');
      const data = await response.json();
      setPaymentMethods(data.payment_methods);
    } catch (err) {
      console.error(err);
      setError('Failed to load payment methods.');
    } finally {
      setLoading(false);
    }
  };

  const setDefaultMethod = async (methodId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/methods/${methodId}/default`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to update default payment method');
      fetchPaymentMethods(); // Refresh the list
    } catch (err) {
      console.error(err);
      setError('Failed to update the default method.');
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  return (
    <div className="payment-methods-tab">
      <Card>
        <CardHeader>
          <h2>Your Payment Methods</h2>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddForm(true)} // Show the form when clicked
          >
            Add New Method
          </button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading payment methods...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : paymentMethods.length === 0 ? (
            <p>No payment methods added yet.</p>
          ) : (
            <ul>
              {paymentMethods.map((method) => (
                <li key={method.id} className={`payment-method ${method.is_default ? 'default' : ''}`}>
                  <p>{method.card_type.toUpperCase()} ****{method.last_four}</p>
                  <p>Expires {method.expiry_month}/{method.expiry_year}</p>
                  {!method.is_default && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => setDefaultMethod(method.id)}
                    >
                      Set as Default
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Display AddPaymentMethodForm as a modal */}
      {showAddForm && (
        <div className="modal">
          <AddPaymentMethodForm
            onClose={() => setShowAddForm(false)} // Hide the form on close
            onSuccess={fetchPaymentMethods} // Refresh the list on success
          />
        </div>
      )}
    </div>
  );
};

export default PaymentMethodsTab;