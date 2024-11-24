const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');
const rideController = require('../controllers/rideController');
const transactionController = require('../controllers/transactionController');

// Payment Method Routes (Riders only)
router.post(
    '/methods', 
    authenticateToken, 
    paymentController.addPaymentMethod
);

router.get(
    '/methods', 
    authenticateToken, 
    paymentController.getPaymentMethods
);

router.put(
    '/methods/:methodId/default', 
    authenticateToken, 
    paymentController.setDefaultPaymentMethod
);

// Bank Account Routes (Drivers only)
router.post(
    '/bank-accounts', 
    authenticateToken, 
    paymentController.addBankAccount
);

router.get(
    '/bank-accounts', 
    authenticateToken, 
    paymentController.getBankAccounts
);

router.put(
    '/bank-accounts/:accountId/default', 
    authenticateToken, 
    paymentController.setDefaultBankAccount
);

// Ride Routes
router.post('/rides', authenticateToken, rideController.createRide);
router.put('/rides/:rideId/accept', authenticateToken, rideController.acceptRide);
router.put('/rides/:rideId/start', authenticateToken, rideController.startRide);
router.put('/rides/:rideId/complete', authenticateToken, rideController.completeRide);
router.get('/rides/history', authenticateToken, rideController.getRideHistory);
router.get('/rides/:rideId', authenticateToken, rideController.getRideDetails);

// Transaction Routes
router.get('/transactions', authenticateToken, transactionController.getTransactionHistory);
router.get('/transactions/earnings', authenticateToken, transactionController.getEarningsSummary);
router.get('/transactions/:transactionId', authenticateToken, transactionController.getTransactionDetails);

module.exports = router;