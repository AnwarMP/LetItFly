const { pool } = require('../db/init');

const rideController = {
    async createRide(req, res) {
        const { 
            pickup_location, 
            dropoff_location, 
            estimated_fare,
            num_passengers 
        } = req.body;
        const rider_id = req.user.userId;

        try {
            // Check if rider has a default payment method
            const paymentMethod = await pool.query(`
                SELECT id FROM payment_methods 
                WHERE user_id = $1 AND is_default = true`,
                [rider_id]
            );

            if (paymentMethod.rows.length === 0) {
                return res.status(400).json({ 
                    error: 'No default payment method found. Please add a payment method.' 
                });
            }

            const result = await pool.query(`
                INSERT INTO rides 
                (rider_id, pickup_location, dropoff_location, ride_status, 
                estimated_fare, num_passengers)
                VALUES ($1, $2, $3, 'requested', $4, $5)
                RETURNING *`,
                [rider_id, pickup_location, dropoff_location, estimated_fare, num_passengers]
            );

            res.status(201).json({
                message: 'Ride created successfully',
                ride: result.rows[0]
            });
        } catch (error) {
            console.error('Error creating ride:', error);
            res.status(500).json({ error: 'Failed to create ride' });
        }
    },

    async acceptRide(req, res) {
        const { rideId } = req.params;
        const driver_id = req.user.userId;

        try {
            // Check if driver has a default bank account
            const bankAccount = await pool.query(`
                SELECT id FROM bank_accounts 
                WHERE user_id = $1 AND is_default = true`,
                [driver_id]
            );

            if (bankAccount.rows.length === 0) {
                return res.status(400).json({ 
                    error: 'No default bank account found. Please add a bank account.' 
                });
            }

            const result = await pool.query(`
                UPDATE rides 
                SET driver_id = $1, 
                    ride_status = 'accepted',
                    accepted_at = CURRENT_TIMESTAMP
                WHERE id = $2 AND ride_status = 'requested'
                RETURNING *`,
                [driver_id, rideId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ 
                    error: 'Ride not found or already accepted' 
                });
            }

            res.json({
                message: 'Ride accepted successfully',
                ride: result.rows[0]
            });
        } catch (error) {
            console.error('Error accepting ride:', error);
            res.status(500).json({ error: 'Failed to accept ride' });
        }
    },

    async startRide(req, res) {
        const { rideId } = req.params;
        const driver_id = req.user.userId;

        try {
            const result = await pool.query(`
                UPDATE rides 
                SET ride_status = 'in_progress',
                    started_at = CURRENT_TIMESTAMP
                WHERE id = $1 
                AND driver_id = $2 
                AND ride_status = 'accepted'
                RETURNING *`,
                [rideId, driver_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ 
                    error: 'Ride not found or not in accepted state' 
                });
            }

            res.json({
                message: 'Ride started successfully',
                ride: result.rows[0]
            });
        } catch (error) {
            console.error('Error starting ride:', error);
            res.status(500).json({ error: 'Failed to start ride' });
        }
    },

    async completeRide(req, res) {
        const { rideId } = req.params;
        const { final_fare } = req.body;
        const driver_id = req.user.userId;

        try {
            await pool.query('BEGIN');

            // Update ride status
            const rideResult = await pool.query(`
                UPDATE rides 
                SET ride_status = 'completed',
                    completed_at = CURRENT_TIMESTAMP,
                    final_fare = $1
                WHERE id = $2 
                AND driver_id = $3 
                AND ride_status = 'in_progress'
                RETURNING *`,
                [final_fare, rideId, driver_id]
            );

            if (rideResult.rows.length === 0) {
                await pool.query('ROLLBACK');
                return res.status(404).json({ 
                    error: 'Ride not found or not in progress' 
                });
            }

            const ride = rideResult.rows[0];

            // Get payment method and bank account
            const paymentMethod = await pool.query(`
                SELECT id FROM payment_methods 
                WHERE user_id = $1 AND is_default = true`,
                [ride.rider_id]
            );

            const bankAccount = await pool.query(`
                SELECT id FROM bank_accounts 
                WHERE user_id = $1 AND is_default = true`,
                [driver_id]
            );

            // Create transaction record
            await pool.query(`
                INSERT INTO transactions 
                (ride_id, rider_id, driver_id, amount, transaction_status, 
                payment_method_id, bank_account_id)
                VALUES ($1, $2, $3, $4, 'completed', $5, $6)`,
                [
                    rideId,
                    ride.rider_id,
                    driver_id,
                    final_fare,
                    paymentMethod.rows[0]?.id,
                    bankAccount.rows[0]?.id
                ]
            );

            await pool.query('COMMIT');

            res.json({
                message: 'Ride completed and payment processed successfully',
                ride: ride
            });
        } catch (error) {
            await pool.query('ROLLBACK');
            console.error('Error completing ride:', error);
            res.status(500).json({ error: 'Failed to complete ride' });
        }
    },

    async cancelRide(req, res) {
        const { rideId } = req.params;
        const user_id = req.user.userId;
        const role = req.user.role;

        try {
            let result;
            if (role === 'rider') {
                result = await pool.query(`
                    UPDATE rides 
                    SET ride_status = 'cancelled'
                    WHERE id = $1 
                    AND rider_id = $2 
                    AND ride_status IN ('requested', 'accepted')
                    RETURNING *`,
                    [rideId, user_id]
                );
            } else {
                result = await pool.query(`
                    UPDATE rides 
                    SET ride_status = 'cancelled'
                    WHERE id = $1 
                    AND driver_id = $2 
                    AND ride_status IN ('accepted', 'in_progress')
                    RETURNING *`,
                    [rideId, user_id]
                );
            }

            if (result.rows.length === 0) {
                return res.status(404).json({ 
                    error: 'Ride not found or cannot be cancelled in current state' 
                });
            }

            res.json({
                message: 'Ride cancelled successfully',
                ride: result.rows[0]
            });
        } catch (error) {
            console.error('Error cancelling ride:', error);
            res.status(500).json({ error: 'Failed to cancel ride' });
        }
    },

    async getRideHistory(req, res) {
        const user_id = req.user.userId;
        const role = req.user.role;
        const { ride_status } = req.query;

        try {
            let query = `
                SELECT r.*, 
                    u1.first_name as rider_first_name,
                    u1.last_name as rider_last_name,
                    u2.first_name as driver_first_name,
                    u2.last_name as driver_last_name,
                    t.transaction_status as payment_status
                FROM rides r
                LEFT JOIN users u1 ON r.rider_id = u1.id
                LEFT JOIN users u2 ON r.driver_id = u2.id
                LEFT JOIN transactions t ON r.id = t.ride_id
                WHERE r.${role === 'rider' ? 'rider_id' : 'driver_id'} = $1
            `;

            const queryParams = [user_id];

            if (ride_status) {
                query += ` AND r.ride_status = $2`;
                queryParams.push(ride_status);
            }

            query += ` ORDER BY r.created_at DESC`;

            const result = await pool.query(query, queryParams);

            res.json({
                rides: result.rows
            });
        } catch (error) {
            console.error('Error fetching ride history:', error);
            res.status(500).json({ error: 'Failed to fetch ride history' });
        }
    },

    async getRideDetails(req, res) {
        const { rideId } = req.params;
        const user_id = req.user.userId;

        try {
            const result = await pool.query(`
                SELECT r.*, 
                    u1.first_name as rider_first_name,
                    u1.last_name as rider_last_name,
                    u2.first_name as driver_first_name,
                    u2.last_name as driver_last_name,
                    t.transaction_status as payment_status,
                    t.amount as payment_amount
                FROM rides r
                LEFT JOIN users u1 ON r.rider_id = u1.id
                LEFT JOIN users u2 ON r.driver_id = u2.id
                LEFT JOIN transactions t ON r.id = t.ride_id
                WHERE r.id = $1 
                AND (r.rider_id = $2 OR r.driver_id = $2)`,
                [rideId, user_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Ride not found' });
            }

            res.json({
                ride: result.rows[0]
            });
        } catch (error) {
            console.error('Error fetching ride details:', error);
            res.status(500).json({ error: 'Failed to fetch ride details' });
        }
    }
};

module.exports = rideController;