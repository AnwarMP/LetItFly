import React, { useEffect, useState } from 'react';
import AddPaymentMethodForm from './AddPaymentMethodsForm';
import { Card, CardHeader, CardContent } from '../Card';
import '../methods.css';
import '../Drawer.css'; // Add drawer-specific styles

const PaymentMethodsTab = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false); // For drawer state

  const API_BASE_URL = 'http://localhost:3000';

  const fetchPaymentMethods = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/methods`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`,
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
          Authorization: `Bearer ${sessionStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to update default payment method');
      fetchPaymentMethods();
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
          <button className="btn btn-primary" onClick={() => setShowDrawer(true)}>
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
                    <button className="btn btn-secondary" onClick={() => setDefaultMethod(method.id)}>
                      Set as Default
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Slide-in drawer */}
      {showDrawer && (
        <div className={`drawer ${showDrawer ? 'open' : ''}`}>
          <div className="drawer-content">
            <button className="close-button" onClick={() => setShowDrawer(false)}>
              Close
            </button>
            <AddPaymentMethodForm
              onClose={() => setShowDrawer(false)}
              onSuccess={() => {
                fetchPaymentMethods();
                setShowDrawer(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodsTab;