import React from 'react';

const TransactionList = ({ transactions = [], role }) => {
  if (!transactions || transactions.length === 0) {
    return <p>No transactions available.</p>;
  }

  return (
    <ul className="transaction-list">
      {transactions.map((transaction) => {
        const amount = transaction.amount ? parseFloat(transaction.amount) : 0;

        return (
          <li key={transaction.id} className="transaction-card">
            <div>
              <strong>Date:</strong> {new Date(transaction.created_at).toLocaleDateString()}
            </div>
            <div>
              <strong>Amount:</strong> ${amount.toFixed(2)}
            </div>
            <div>
              <strong>Status:</strong> {transaction.transaction_status}
            </div>
            {role === 'rider' && (
              <div>
                <strong>Driver:</strong> {transaction.driver_name || 'N/A'}
              </div>
            )}
            {role === 'driver' && (
              <div>
                <strong>Rider:</strong> {transaction.rider_name || 'N/A'}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default TransactionList;