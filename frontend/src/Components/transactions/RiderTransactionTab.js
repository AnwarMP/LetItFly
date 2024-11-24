import React, { useState, useEffect } from 'react';
import TransactionList from './TransactionList';

const RiderTransactionTab = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('http://localhost:3000/api/payments/transactions', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch transactions.');
        const data = await response.json();
        setTransactions(data.transactions);
      } catch (err) {
        console.error(err);
        setError('Failed to load transactions.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <div className="rider-transactions-tab">
      <h2>Your Transactions</h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <TransactionList transactions={transactions} role="rider" />
      )}
    </div>
  );
};

export default RiderTransactionTab;