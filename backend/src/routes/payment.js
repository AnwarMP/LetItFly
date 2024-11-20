const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// Payment Method Management
router.post('/methods', authenticateToken, paymentController.addPaymentMethod);
router.get('/methods', authenticateToken, paymentController.getPaymentMethods);
router.delete('/methods/:id', authenticateToken, paymentController.removePaymentMethod);
router.put('/methods/:id/default', authenticateToken, paymentController.setDefaultPaymentMethod);

// Wallet Management
router.get('/wallet', authenticateToken, paymentController.getWalletBalance);
router.post('/wallet/topup', authenticateToken, paymentController.topUpWallet);

// Ride Payments
router.post('/rides/calculate', authenticateToken, paymentController.calculateRideFare);
router.post('/rides/process', authenticateToken, paymentController.processRidePayment);

// Transaction History
router.get('/transactions', authenticateToken, paymentController.getTransactionHistory);

// Driver Earnings
router.get('/earnings', authenticateToken, paymentController.getDriverEarnings);
router.post('/earnings/payout', authenticateToken, paymentController.requestPayout);

module.exports = router;