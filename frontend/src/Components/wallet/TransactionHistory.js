import React from 'react';
import { DollarSign, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export const TransactionHistory = ({ transactions = [] }) => {
  const getTransactionIcon = (type) => {
    switch (type) {
      case 'wallet_topup':
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      case 'ride_payment':
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const formatAmount = (amount) => {
    // Convert to number and handle any invalid values
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount) || 0;
    return numAmount.toFixed(2);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getTransactionLabel = (type) => {
    switch (type) {
      case 'wallet_topup':
        return 'Wallet Top-up';
      case 'ride_payment':
        return 'Ride Payment';
      case 'driver_payout':
        return 'Driver Payout';
      default:
        return 'Transaction';
    }
  };

  return (
    <div className="bg-white rounded shadow mt-6">
      <div className="p-4 border-b">
        <h3 className="text-lg font-bold">Transaction History</h3>
      </div>

      <div className="divide-y">
        {transactions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No transactions yet
          </div>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-full">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div>
                  <div className="font-medium">
                    {getTransactionLabel(transaction.type)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(transaction.created_at)}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`font-medium ${
                  transaction.type === 'wallet_topup' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {transaction.type === 'wallet_topup' ? '+' : '-'}$
                  {formatAmount(transaction.amount)}
                </div>
                {transaction.payment_method && (
                  <div className="text-sm text-gray-500">
                    •••• {transaction.payment_method.card_last_four}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;