import React from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';

export const WalletBalance = ({ balance = 0, onTopUp }) => {
  // Convert balance to number and handle any potential invalid values
  const numBalance = typeof balance === 'string' ? parseFloat(balance) : Number(balance) || 0;
  
  // Format the balance with 2 decimal places
  const formattedBalance = numBalance.toFixed(2);

  return (
    <div className="bg-white rounded shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">Wallet Balance</h3>
          <div className="flex items-center gap-2 mt-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-2xl font-bold">{formattedBalance}</span>
          </div>
        </div>
        <button
          onClick={onTopUp}
          className="bg-black text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          Top Up
        </button>
      </div>
    </div>
  );
};

export default WalletBalance;