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
    checkRole(['rider']), 
    paymentController.addPaymentMethod
);

router.get(
    '/methods', 
    authenticateToken, 
    checkRole(['rider']), 
    paymentController.getPaymentMethods
);

router.put(
    '/methods/:methodId/default', 
    authenticateToken, 
    checkRole(['rider']), 
    paymentController.setDefaultPaymentMethod
);

// Bank Account Routes (Drivers only)
router.post(
    '/bank-accounts', 
    authenticateToken, 
    checkRole(['driver']), 
    paymentController.addBankAccount
);

router.get(
    '/bank-accounts', 
    authenticateToken, 
    checkRole(['driver']), 
    paymentController.getBankAccounts
);

router.put(
    '/bank-accounts/:accountId/default', 
    authenticateToken, 
    checkRole(['driver']), 
    paymentController.setDefaultBankAccount
);

// Ride Routes
router.post('/rides', authenticateToken, checkRole(['rider']), rideController.createRide);
router.put('/rides/:rideId/accept', authenticateToken, checkRole(['driver']), rideController.acceptRide);
router.put('/rides/:rideId/start', authenticateToken, checkRole(['driver']), rideController.startRide);
router.put('/rides/:rideId/complete', authenticateToken, checkRole(['driver']), rideController.completeRide);
router.get('/rides/history', authenticateToken, rideController.getRideHistory);
router.get('/rides/:rideId', authenticateToken, rideController.getRideDetails);

// Transaction Routes
router.get('/transactions', authenticateToken, transactionController.getTransactionHistory);
router.get('/transactions/earnings', authenticateToken, checkRole(['driver']), transactionController.getEarningsSummary);
router.get('/transactions/:transactionId', authenticateToken, transactionController.getTransactionDetails);

module.exports = router;