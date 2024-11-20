import React, { useState, useEffect } from 'react';
import WalletBalance from './WalletBalance';
import TopUpModal from './TopUpModal';
import TransactionHistory from './TransactionHistory';

export const Wallet = () => {
  const [balance, setBalance] = useState(0); // Initialize with 0
  const [showTopUp, setShowTopUp] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      // Fetch wallet balance
      const balanceResponse = await fetch('http://localhost:3000/payment/wallet', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const balanceData = await balanceResponse.json();
      
      // Ensure balance is a number
      setBalance(Number(balanceData.balance) || 0);

      // Fetch payment methods
      const methodsResponse = await fetch('http://localhost:3000/payment/methods', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const methodsData = await methodsResponse.json();
      setPaymentMethods(methodsData.payment_methods || []);

      // Fetch transactions
      const transactionsResponse = await fetch('http://localhost:3000/payment/transactions', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const transactionsData = await transactionsResponse.json();
      setTransactions(transactionsData.transactions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleTopUp = async (data) => {
    try {
      const response = await fetch('http://localhost:3000/payment/wallet/topup', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to process top-up');

      await fetchWalletData(); // Refresh data after successful top-up
      setShowTopUp(false);
    } catch (err) {
      throw err;
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
    <div className="bg-gray-50 p-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded mb-6">
          {error}
        </div>
      )}

      <WalletBalance 
        balance={balance} 
        onTopUp={() => setShowTopUp(true)} 
      />

      <TransactionHistory transactions={transactions} />

      {showTopUp && (
        <TopUpModal
          onClose={() => setShowTopUp(false)}
          onTopUp={handleTopUp}
          paymentMethods={paymentMethods}
        />
      )}
    </div>
  );
};

export default Wallet;