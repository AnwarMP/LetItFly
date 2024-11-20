# LetItFly Payment System Documentation

## Database Schema

### Tables Overview
```sql
wallets               - User balance tracking
payment_methods       - Stored payment methods (cards)
transactions         - All financial transactions
ride_payments        - Detailed ride payment info
rides                - Ride information (referenced by payments)
```

### Key Tables Details

#### wallets
```sql
- user_id          - References users(id)
- balance          - Current balance (DECIMAL)
- created_at       - Timestamp
- updated_at       - Timestamp
```

#### payment_methods
```sql
- user_id          - References users(id)
- card_last_four   - Last 4 digits of card
- card_type        - 'visa', 'mastercard', 'amex', 'discover'
- is_default       - Boolean
```

#### transactions
```sql
- ride_id          - Optional reference to rides(id)
- rider_id         - References users(id)
- driver_id        - References users(id)
- amount           - Transaction amount
- status           - 'pending', 'completed', 'failed', 'refunded'
- type             - 'ride_payment', 'driver_payout', 'wallet_topup', 'refund'
- payment_method_id- References payment_methods(id)
- platform_fee     - Platform's cut
- driver_earnings  - Driver's earnings
```

## API Endpoints

### Payment Methods
```
POST   /payment/methods             - Add payment method
GET    /payment/methods             - List payment methods
DELETE /payment/methods/:id         - Remove payment method
PUT    /payment/methods/:id/default - Set default payment method
```

### Wallet Operations
```
GET    /payment/wallet             - Get wallet balance
POST   /payment/wallet/topup       - Add funds to wallet
```

### Ride Payments
```
POST   /payment/rides/calculate    - Calculate ride fare
POST   /payment/rides/process      - Process ride payment
```

### Transactions & Earnings
```
GET    /payment/transactions       - Get transaction history
GET    /payment/earnings          - Get driver earnings
POST   /payment/earnings/payout   - Request driver payout
```

## Testing

### Setup Test Environment
```bash
# 1. Initialize database
psql -U admin -d letitfly_db -f db_init.sql

# 2. Install dependencies
npm install

# 3. Start server
npm start
```

### Run Test Suite
```bash
# Run complete test suite
node src/tests/testPaymentEndpoints.js
```

### Manual Testing with cURL

1. Add Payment Method:
```bash
curl -X POST http://localhost:3000/payment/methods \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"card_number": "4242424242424242", "card_type": "visa"}'
```

2. Process Payment:
```bash
curl -X POST http://localhost:3000/payment/rides/process \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ride_id": "1",
    "amount": 50.00,
    "payment_method_id": "1"
  }'
```

## Key Configurations

### Fee Structure
```javascript
BASE_FARE = 15.00          // Minimum fare
PER_MILE_RATE = 1.75      // Per mile after first 2 miles
PER_MINUTE_RATE = 0.50    // Per minute rate
FREE_MILES = 2            // Initial free miles
RIDESHARE_DISCOUNT = 10.00// Discount for shared rides
PLATFORM_FEE = 20%        // Platform's commission
DRIVER_EARNINGS = 80%     // Driver's portion
```

## Error Handling

Common HTTP Status Codes:
```
200 - Success
400 - Bad Request (invalid input)
401 - Unauthorized (invalid/missing token)
404 - Not Found (invalid ID)
500 - Server Error
```



