const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/auth');
const {
    paymentMethodController,
    driverPaymentController,
    riderPaymentController
} = require('../controllers/paymentController');

// Payment Method Management (Common for both riders and drivers)
router.post('/methods', authenticateToken, paymentMethodController.addPaymentMethod);
router.get('/methods', authenticateToken, paymentMethodController.getPaymentMethods);
router.delete('/methods/:id', authenticateToken, paymentMethodController.removePaymentMethod);
router.put('/methods/:id/default', authenticateToken, paymentMethodController.setDefaultPaymentMethod);

// Add the calculate fare route
router.post('/rides/calculate', authenticateToken, paymentMethodController.calculateRideFare);

// Ride Payment Processing
router.post('/rides/process', authenticateToken, riderPaymentController.processRidePayment);

// Driver-specific routes
router.get('/wallet', authenticateToken, checkRole(['driver']), driverPaymentController.getWalletBalance);
router.get('/earnings', authenticateToken, checkRole(['driver']), driverPaymentController.getEarnings);
router.post('/payout', authenticateToken, checkRole(['driver']), driverPaymentController.requestPayout);

// Transaction History
router.get('/transactions', authenticateToken, paymentMethodController.getTransactionHistory);

module.exports = router;