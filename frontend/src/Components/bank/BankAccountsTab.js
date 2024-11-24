import React, { useState, useEffect } from 'react';
import AddBankAccountForm from './AddBankAccountForm';
import { Card, CardHeader, CardContent } from '../Card';
import '../methods.css';
import '../Drawer.css'; // Add drawer-specific styles

const BankAccountsTab = () => {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false); // For drawer state

  const API_BASE_URL = 'http://localhost:3000';

  const fetchBankAccounts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/bank-accounts`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch bank accounts');
      const data = await response.json();
      setBankAccounts(data.bank_accounts);
    } catch (err) {
      console.error(err);
      setError('Failed to load bank accounts.');
    } finally {
      setLoading(false);
    }
  };

  const setDefaultAccount = async (accountId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/bank-accounts/${accountId}/default`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to update default bank account');
      fetchBankAccounts();
    } catch (err) {
      console.error(err);
      setError('Failed to update the default account.');
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  return (
    <div className="bank-accounts-tab">
      <Card>
        <CardHeader>
          <h2>Your Bank Accounts</h2>
          <button className="btn btn-primary" onClick={() => setShowDrawer(true)}>
            Add New Account
          </button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading bank accounts...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : bankAccounts.length === 0 ? (
            <p>No bank accounts added yet.</p>
          ) : (
            <ul>
              {bankAccounts.map((account) => (
                <li key={account.id} className={`bank-account ${account.is_default ? 'default' : ''}`}>
                  <p>{account.account_holder_name}</p>
                  <p>****{account.last_four}</p>
                  <p>Routing Number: ****{account.routing_number.slice(-4)}</p>
                  {!account.is_default && (
                    <button className="btn btn-secondary" onClick={() => setDefaultAccount(account.id)}>
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
            <AddBankAccountForm
              onClose={() => setShowDrawer(false)}
              onSuccess={() => {
                fetchBankAccounts();
                setShowDrawer(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BankAccountsTab;