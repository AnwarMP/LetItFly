import React from 'react';
import { CreditCard, Trash2, Star } from 'lucide-react';

export const PaymentMethodCard = ({
  id,
  cardType,
  lastFour,
  isDefault,
  onSetDefault,
  onDelete,
}) => {
  const renderCardTypeIcon = () => {
    switch (cardType.toLowerCase()) {
      case 'visa':
        return 'VISA';
      case 'mastercard':
        return 'MC';
      case 'amex':
        return 'AMEX';
      default:
        return <CreditCard className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-6 bg-black text-white flex items-center justify-center rounded text-sm font-bold">
            {typeof renderCardTypeIcon() === 'string' ? renderCardTypeIcon() : renderCardTypeIcon()}
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-800">•••• {lastFour}</span>
          <span className="text-xs text-gray-500 capitalize">{cardType}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isDefault ? (
          <div className="flex items-center text-yellow-500">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-xs ml-1 font-medium">Default</span>
          </div>
        ) : (
          <button
            onClick={() => onSetDefault(id)}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Set as default"
          >
            <Star className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onDelete(id)}
          className="p-1 text-gray-400 hover:text-red-600"
          title="Remove card"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PaymentMethodCard;