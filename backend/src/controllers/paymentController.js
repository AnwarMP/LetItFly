const { pool } = require('../db/init');

// General payment methods/routes
const paymentMethodController = {
    async addPaymentMethod(req, res) {
        const { card_number, card_type } = req.body;
        const user_id = req.user.userId;

        try {
            const last_four = card_number.slice(-4);
            const existingMethods = await pool.query(
                'SELECT COUNT(*) FROM payment_methods WHERE user_id = $1',
                [user_id]
            );
            const is_default = existingMethods.rows[0].count === '0';

            const result = await pool.query(
                `INSERT INTO payment_methods (user_id, card_last_four, card_type, is_default)
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [user_id, last_four, card_type, is_default]
            );

            res.json({ success: true, payment_method: result.rows[0] });
        } catch (error) {
            console.error('Error adding payment method:', error);
            res.status(500).json({ error: 'Failed to add payment method' });
        }
    },

    async getPaymentMethods(req, res) {
        const user_id = req.user.userId;
        try {
            const result = await pool.query(
                'SELECT * FROM payment_methods WHERE user_id = $1 ORDER BY is_default DESC',
                [user_id]
            );
            res.json({ payment_methods: result.rows });
        } catch (error) {
            console.error('Error fetching payment methods:', error);
            res.status(500).json({ error: 'Failed to fetch payment methods' });
        }
    },

    async removePaymentMethod(req, res) {
        const { id } = req.params;
        const user_id = req.user.userId;

        try {
            // Check if it's the default method
            const method = await pool.query(
                'SELECT is_default FROM payment_methods WHERE id = $1 AND user_id = $2',
                [id, user_id]
            );

            if (method.rows[0]?.is_default) {
                return res.status(400).json({ 
                    error: 'Cannot remove default payment method. Please set another method as default first.' 
                });
            }

            const result = await pool.query(
                'DELETE FROM payment_methods WHERE id = $1 AND user_id = $2 RETURNING *',
                [id, user_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Payment method not found' });
            }

            res.json({ success: true, message: 'Payment method removed successfully' });
        } catch (error) {
            console.error('Error removing payment method:', error);
            res.status(500).json({ error: 'Failed to remove payment method' });
        }
    },

    async setDefaultPaymentMethod(req, res) {
        const { id } = req.params;
        const user_id = req.user.userId;

        try {
            await pool.query('BEGIN');

            // Remove default status from all user's payment methods
            await pool.query(
                'UPDATE payment_methods SET is_default = false WHERE user_id = $1',
                [user_id]
            );

            // Set new default
            const result = await pool.query(
                'UPDATE payment_methods SET is_default = true WHERE id = $1 AND user_id = $2 RETURNING *',
                [id, user_id]
            );

            if (result.rows.length === 0) {
                await pool.query('ROLLBACK');
                return res.status(404).json({ error: 'Payment method not found' });
            }

            await pool.query('COMMIT');
            res.json({ success: true, payment_method: result.rows[0] });
        } catch (error) {
            await pool.query('ROLLBACK');
            console.error('Error setting default payment method:', error);
            res.status(500).json({ error: 'Failed to set default payment method' });
        }
    },

    // Wallet Management
    async getWalletBalance(req, res) {
        const user_id = req.user.userId;

        try {
            const result = await pool.query(
                'SELECT balance FROM wallets WHERE user_id = $1',
                [user_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Wallet not found' });
            }

            res.json({ balance: result.rows[0].balance });
        } catch (error) {
            console.error('Error fetching wallet balance:', error);
            res.status(500).json({ error: 'Failed to fetch wallet balance' });
        }
    },

    async topUpWallet(req, res) {
        const { amount, payment_method_id } = req.body;
        const user_id = req.user.userId;

        try {
            await pool.query('BEGIN');

            // Update wallet balance
            const result = await pool.query(
                `UPDATE wallets 
                 SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $2
                 RETURNING balance`,
                [amount, user_id]
            );

            // Create transaction record (with ride_id as NULL)
            await pool.query(
                `INSERT INTO transactions (
                    ride_id, rider_id, driver_id, amount, status, type, payment_method_id
                ) VALUES (
                    NULL, $1, $1, $2, 'completed', 'wallet_topup', $3
                )`,
                [user_id, amount, payment_method_id]
            );

            await pool.query('COMMIT');
            res.json({ success: true, new_balance: result.rows[0].balance });
        } catch (error) {
            await pool.query('ROLLBACK');
            console.error('Error topping up wallet:', error);
            res.status(500).json({ error: 'Failed to top up wallet' });
        }
    },

    // Ride Payments
    async calculateRideFare(req, res) {
        const { distance_miles, duration_minutes, allow_rideshare } = req.body;
        
        try {
            const BASE_FARE = 15.00;
            const PER_MILE_RATE = 1.75;
            const PER_MINUTE_RATE = 0.50;
            const FREE_MILES = 2;
            const RIDESHARE_DISCOUNT = 10.00;

            const chargeable_distance = Math.max(0, distance_miles - FREE_MILES);
            const distance_fare = chargeable_distance * PER_MILE_RATE;
            const time_fare = duration_minutes * PER_MINUTE_RATE;
            const rideshare_discount = allow_rideshare ? RIDESHARE_DISCOUNT : 0;

            const total_amount = Math.max(
                BASE_FARE,
                BASE_FARE + distance_fare + time_fare - rideshare_discount
            );

            res.json({
                fare_breakdown: {
                    base_fare: BASE_FARE,
                    distance_fare,
                    time_fare,
                    rideshare_discount,
                    total_amount
                }
            });
        } catch (error) {
            console.error('Error calculating fare:', error);
            res.status(500).json({ error: 'Failed to calculate fare' });
        }
    },

    async processRidePayment(req, res) {
        const {
            ride_id,
            base_fare,
            distance_fare,
            time_fare,
            rideshare_discount,
            total_amount,
            payment_method_id
        } = req.body;
        const rider_id = req.user.userId;

        try {
            await pool.query('BEGIN');

            // Get driver_id from ride
            const rideResult = await pool.query(
                'SELECT driver_id FROM rides WHERE id = $1',
                [ride_id]
            );

            if (rideResult.rows.length === 0) {
                await pool.query('ROLLBACK');
                return res.status(404).json({ error: 'Ride not found' });
            }

            const driver_id = rideResult.rows[0].driver_id;
            const platform_fee = total_amount * 0.20; // Platform takes 20%
            const driver_earnings = total_amount - platform_fee;

            // Create transaction record
            const transactionResult = await pool.query(
                `INSERT INTO transactions (
                    ride_id, rider_id, driver_id, amount, status, type, 
                    payment_method_id, platform_fee, driver_earnings
                ) VALUES ($1, $2, $3, $4, 'completed', 'ride_payment', $5, $6, $7)
                RETURNING id`,
                [ride_id, rider_id, driver_id, total_amount, payment_method_id, platform_fee, driver_earnings]
            );

            // Create ride payment record
            await pool.query(
                `INSERT INTO ride_payments (
                    ride_id, base_fare, distance_fare, time_fare, 
                    rideshare_discount, total_amount, status, transaction_id
                ) VALUES ($1, $2, $3, $4, $5, $6, 'completed', $7)`,
                [ride_id, base_fare, distance_fare, time_fare, rideshare_discount, total_amount, transactionResult.rows[0].id]
            );

            // Update driver's wallet
            await pool.query(
                `UPDATE wallets 
                 SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $2`,
                [driver_earnings, driver_id]
            );

            // Update ride status
            await pool.query(
                `UPDATE rides 
                 SET ride_status = 'completed', updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1`,
                [ride_id]
            );

            await pool.query('COMMIT');
            res.json({ 
                success: true, 
                transaction_id: transactionResult.rows[0].id,
                payment_details: {
                    total_amount,
                    driver_earnings,
                    platform_fee
                }
            });
        } catch (error) {
            await pool.query('ROLLBACK');
            console.error('Error processing ride payment:', error);
            res.status(500).json({ error: 'Failed to process ride payment' });
        }
    },

    // Transaction History
    async getTransactionHistory(req, res) {
        const user_id = req.user.userId;
        const { role } = req.user;
        const { limit = 10, offset = 0 } = req.query;

        try {
            const roleColumn = role === 'driver' ? 'driver_id' : 'rider_id';
            
            const result = await pool.query(
                `SELECT t.*, r.pickup_location, r.dropoff_location, 
                        pm.card_last_four, pm.card_type,
                        rp.base_fare, rp.distance_fare, rp.time_fare, rp.rideshare_discount
                 FROM transactions t
                 LEFT JOIN rides r ON t.ride_id = r.id
                 LEFT JOIN payment_methods pm ON t.payment_method_id = pm.id
                 LEFT JOIN ride_payments rp ON t.id = rp.transaction_id
                 WHERE t.${roleColumn} = $1
                 ORDER BY t.created_at DESC
                 LIMIT $2 OFFSET $3`,
                [user_id, limit, offset]
            );

            res.json({ transactions: result.rows });
        } catch (error) {
            console.error('Error fetching transaction history:', error);
            res.status(500).json({ error: 'Failed to fetch transaction history' });
        }
    },

    // Driver Earnings
    async getDriverEarnings(req, res) {
        const driver_id = req.user.userId;

        try {
            // Get today's earnings
            const todayResult = await pool.query(
                `SELECT COALESCE(SUM(driver_earnings), 0) as earnings
                 FROM transactions
                 WHERE driver_id = $1 
                 AND type = 'ride_payment'
                 AND status = 'completed'
                 AND DATE(created_at) = CURRENT_DATE`,
                [driver_id]
            );

            // Get this week's earnings
            const weekResult = await pool.query(
                `SELECT COALESCE(SUM(driver_earnings), 0) as earnings
                 FROM transactions
                 WHERE driver_id = $1 
                 AND type = 'ride_payment'
                 AND status = 'completed'
                 AND DATE(created_at) >= DATE_TRUNC('week', CURRENT_DATE)`,
                [driver_id]
            );

            // Get this month's earnings
            const monthResult = await pool.query(
                `SELECT COALESCE(SUM(driver_earnings), 0) as earnings
                 FROM transactions
                 WHERE driver_id = $1 
                 AND type = 'ride_payment'
                 AND status = 'completed'
                 AND DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE)`,
                [driver_id]
            );

            // Get total completed rides
            const ridesResult = await pool.query(
                `SELECT COUNT(*) as total_rides
                 FROM transactions
                 WHERE driver_id = $1 
                 AND type = 'ride_payment'
                 AND status = 'completed'`,
                [driver_id]
            );

            res.json({
                earnings: {
                    today: todayResult.rows[0].earnings,
                    week: weekResult.rows[0].earnings,
                    month: monthResult.rows[0].earnings,
                    total_rides: ridesResult.rows[0].total_rides
                }
            });
        } catch (error) {
            console.error('Error fetching driver earnings:', error);
            res.status(500).json({ error: 'Failed to fetch driver earnings' });
        }
    },

    async requestPayout(req, res) {
        const driver_id = req.user.userId;
        const { amount, payment_method_id } = req.body;

        try {
            await pool.query('BEGIN');

            // Check if driver has sufficient balance
            const walletResult = await pool.query(
                'SELECT balance FROM wallets WHERE user_id = $1',
                [driver_id]
            );

            const currentBalance = walletResult.rows[0].balance;
            if (currentBalance < amount) {
                await pool.query('ROLLBACK');
                return res.status(400).json({ 
                    error: 'Insufficient balance',
                    current_balance: currentBalance,
                    requested_amount: amount
                });
            }

            // Create payout transaction (with ride_id as NULL)
            const transactionResult = await pool.query(
                `INSERT INTO transactions (
                    ride_id, rider_id, driver_id, amount, status, 
                    type, payment_method_id
                ) VALUES (
                    NULL, $1, $1, $2, 'completed', 'driver_payout', $3
                ) RETURNING id`,
                [driver_id, amount, payment_method_id]
            );

            // Update wallet balance
            await pool.query(
                `UPDATE wallets 
                 SET balance = balance - $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $2`,
                [amount, driver_id]
            );

            await pool.query('COMMIT');

            res.json({
                success: true,
                transaction_id: transactionResult.rows[0].id,
                new_balance: currentBalance - amount
            });
        } catch (error) {
            await pool.query('ROLLBACK');
            console.error('Error processing driver payout:', error);
            res.status(500).json({ error: 'Failed to process payout' });
        }
    }
};

// Driver-specific payment functions
const driverPaymentController = {
    async getWalletBalance(req, res) {
        const driver_id = req.user.userId;
        if (req.user.role !== 'driver') {
            return res.status(403).json({ error: 'Only drivers can access wallet' });
        }

        try {
            const result = await pool.query(
                'SELECT balance FROM wallets WHERE user_id = $1',
                [driver_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Wallet not found' });
            }

            res.json({ balance: result.rows[0].balance });
        } catch (error) {
            console.error('Error fetching wallet balance:', error);
            res.status(500).json({ error: 'Failed to fetch wallet balance' });
        }
    },

    async getEarnings(req, res) {
        const driver_id = req.user.userId;
        if (req.user.role !== 'driver') {
            return res.status(403).json({ error: 'Only drivers can access earnings' });
        }

        try {
            // Get today's earnings
            const todayResult = await pool.query(
                `SELECT COALESCE(SUM(driver_earnings), 0) as earnings
                 FROM transactions
                 WHERE driver_id = $1 
                 AND type = 'ride_payment'
                 AND status = 'completed'
                 AND DATE(created_at) = CURRENT_DATE`,
                [driver_id]
            );

            // Get this week's earnings
            const weekResult = await pool.query(
                `SELECT COALESCE(SUM(driver_earnings), 0) as earnings
                 FROM transactions
                 WHERE driver_id = $1 
                 AND type = 'ride_payment'
                 AND status = 'completed'
                 AND DATE(created_at) >= DATE_TRUNC('week', CURRENT_DATE)`,
                [driver_id]
            );

            // Get this month's earnings
            const monthResult = await pool.query(
                `SELECT COALESCE(SUM(driver_earnings), 0) as earnings
                 FROM transactions
                 WHERE driver_id = $1 
                 AND type = 'ride_payment'
                 AND status = 'completed'
                 AND DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE)`,
                [driver_id]
            );

            res.json({
                earnings: {
                    today: todayResult.rows[0].earnings,
                    week: weekResult.rows[0].earnings,
                    month: monthResult.rows[0].earnings
                }
            });
        } catch (error) {
            console.error('Error fetching driver earnings:', error);
            res.status(500).json({ error: 'Failed to fetch driver earnings' });
        }
    },

    async requestPayout(req, res) {
        const driver_id = req.user.userId;
        if (req.user.role !== 'driver') {
            return res.status(403).json({ error: 'Only drivers can request payouts' });
        }

        const { amount, payment_method_id } = req.body;

        try {
            await pool.query('BEGIN');

            // Check if driver has sufficient balance
            const walletResult = await pool.query(
                'SELECT balance FROM wallets WHERE user_id = $1',
                [driver_id]
            );

            const currentBalance = walletResult.rows[0].balance;
            if (currentBalance < amount) {
                await pool.query('ROLLBACK');
                return res.status(400).json({ 
                    error: 'Insufficient balance',
                    current_balance: currentBalance,
                    requested_amount: amount
                });
            }

            // Create payout transaction
            const transactionResult = await pool.query(
                `INSERT INTO transactions (
                    ride_id, driver_id, amount, status, 
                    type, payment_method_id
                ) VALUES (
                    NULL, $1, $2, 'completed', 'driver_payout', $3
                ) RETURNING id`,
                [driver_id, amount, payment_method_id]
            );

            // Update wallet balance
            await pool.query(
                `UPDATE wallets 
                 SET balance = balance - $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $2`,
                [amount, driver_id]
            );

            await pool.query('COMMIT');

            res.json({
                success: true,
                transaction_id: transactionResult.rows[0].id,
                new_balance: currentBalance - amount
            });
        } catch (error) {
            await pool.query('ROLLBACK');
            console.error('Error processing driver payout:', error);
            res.status(500).json({ error: 'Failed to process payout' });
        }
    }
};

// Rider-specific payment functions
const riderPaymentController = {
    async processRidePayment(req, res) {
        const {
            ride_id,
            base_fare,
            distance_fare,
            time_fare,
            rideshare_discount,
            total_amount,
            payment_method_id
        } = req.body;
        const rider_id = req.user.userId;

        try {
            await pool.query('BEGIN');

            // Get driver_id from ride
            const rideResult = await pool.query(
                'SELECT driver_id FROM rides WHERE id = $1',
                [ride_id]
            );

            if (rideResult.rows.length === 0) {
                await pool.query('ROLLBACK');
                return res.status(404).json({ error: 'Ride not found' });
            }

            const driver_id = rideResult.rows[0].driver_id;
            const platform_fee = total_amount * 0.20; // Platform takes 20%
            const driver_earnings = total_amount - platform_fee;

            // Create transaction record
            const transactionResult = await pool.query(
                `INSERT INTO transactions (
                    ride_id, rider_id, driver_id, amount, status, type, 
                    payment_method_id, platform_fee, driver_earnings
                ) VALUES ($1, $2, $3, $4, 'completed', 'ride_payment', $5, $6, $7)
                RETURNING id`,
                [ride_id, rider_id, driver_id, total_amount, payment_method_id, platform_fee, driver_earnings]
            );

            // Create ride payment record
            await pool.query(
                `INSERT INTO ride_payments (
                    ride_id, base_fare, distance_fare, time_fare, 
                    rideshare_discount, total_amount, status, transaction_id
                ) VALUES ($1, $2, $3, $4, $5, $6, 'completed', $7)`,
                [ride_id, base_fare, distance_fare, time_fare, rideshare_discount, total_amount, transactionResult.rows[0].id]
            );

            // Update driver's wallet with earnings
            await pool.query(
                `UPDATE wallets 
                 SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $2`,
                [driver_earnings, driver_id]
            );

            // Update ride status
            await pool.query(
                `UPDATE rides 
                 SET ride_status = 'completed', updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1`,
                [ride_id]
            );

            await pool.query('COMMIT');
            
            res.json({ 
                success: true, 
                transaction_id: transactionResult.rows[0].id,
                payment_details: {
                    total_amount,
                    driver_earnings,
                    platform_fee
                }
            });
        } catch (error) {
            await pool.query('ROLLBACK');
            console.error('Error processing ride payment:', error);
            res.status(500).json({ error: 'Failed to process ride payment' });
        }
    },

    async getTransactionHistory(req, res) {
        const user_id = req.user.userId;
        const { limit = 10, offset = 0 } = req.query;

        try {
            const result = await pool.query(
                `SELECT t.*, r.pickup_location, r.dropoff_location, 
                        pm.card_last_four, pm.card_type,
                        rp.base_fare, rp.distance_fare, rp.time_fare, rp.rideshare_discount
                 FROM transactions t
                 LEFT JOIN rides r ON t.ride_id = r.id
                 LEFT JOIN payment_methods pm ON t.payment_method_id = pm.id
                 LEFT JOIN ride_payments rp ON t.id = rp.transaction_id
                 WHERE t.rider_id = $1
                 ORDER BY t.created_at DESC
                 LIMIT $2 OFFSET $3`,
                [user_id, limit, offset]
            );

            res.json({ transactions: result.rows });
        } catch (error) {
            console.error('Error fetching transaction history:', error);
            res.status(500).json({ error: 'Failed to fetch transaction history' });
        }
    }
};


module.exports = {
    paymentMethodController,
    driverPaymentController,
    riderPaymentController
};
