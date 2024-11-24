const { pool } = require('../db/init');

const rideController = {
    async createRide(req, res) {
        const {  
            rider_id_given,
            pickup_location, 
            dropoff_location, 
            estimated_fare,
            num_passengers 
        } = req.body;
        const rider_id = rider_id_given ?? req.user.userId;


        console.log('Request Body:', req.body);
        console.log('User ID:', req.user.userId);

        try {
            // Check if rider has a default payment method
            //@TODO: Uncomment this code after finishing basic functinaltiy 
            // const paymentMethod = await pool.query(`
            //     SELECT id FROM payment_methods 
            //     WHERE user_id = $1 AND is_default = true`,
            //     [rider_id]
            // );

            // if (paymentMethod.rows.length === 0) {
            //     return res.status(400).json({ 
            //         error: 'No default payment method found. Please add a payment method.' 
            //     });
            // }

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
            // const bankAccount = await pool.query(`
            //     SELECT id FROM bank_accounts 
            //     WHERE user_id = $1 AND is_default = true`,
            //     [driver_id]
            // );

            // if (bankAccount.rows.length === 0) {
            //     return res.status(400).json({ 
            //         error: 'No default bank account found. Please add a bank account.' 
            //     });
            // }

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
            res.status(500).json({ 
                error: 'Failed to accept ride',
                details: error.message
            });
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
        const { final_fare, rider_id} = req.body;
        const driver_id = req.user.userId;

    
        console.log('Complete Ride Request:', {
            rideId,
            final_fare,
            driver_id,
            rider_id,
            body: req.body
        });
    
        try {
            await pool.query('BEGIN');
    
            console.log('Starting transaction');
    
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
    
            console.log('Ride update result:', rideResult.rows);
    
            if (rideResult.rows.length === 0) {
                console.log('No ride found or not in progress');
                await pool.query('ROLLBACK');
                return res.status(404).json({ 
                    error: 'Ride not found or not in progress' 
                });
            }
    
            const ride = rideResult.rows[0];
            console.log('Found ride:', ride);
    
            const valid_rider_id = rider_id ??  ride.rider_id;
            // Get payment method and bank account
            const paymentMethodResult = await pool.query(`
                SELECT id FROM payment_methods 
                WHERE user_id = $1`,
                [valid_rider_id]
            );
            console.log('Payment method query result:', paymentMethodResult.rows);
    
            const bankAccountResult = await pool.query(`
                SELECT id FROM bank_accounts 
                    WHERE user_id = $1`,
                [driver_id]
            );
            console.log('Bank account query result:', bankAccountResult.rows);
    
            // Create transaction record
            const transactionValues = [
                rideId,
                valid_rider_id,
                driver_id,
                final_fare,
                paymentMethodResult.rows[0]?.id,
                bankAccountResult.rows[0]?.id
            ];
            console.log('Transaction values:', transactionValues);
    
            const transactionResult = await pool.query(`
                INSERT INTO transactions 
                (ride_id, rider_id, driver_id, amount, transaction_status, 
                payment_method_id, bank_account_id)
                VALUES ($1, $2, $3, $4, 'completed', $5, $6)
                RETURNING *`,
                transactionValues
            );
    
            console.log('Transaction created:', transactionResult.rows[0]);
    
            await pool.query('COMMIT');
            console.log('Transaction committed');
    
            res.json({
                message: 'Ride completed and payment processed successfully',
                ride: ride,
                transaction: transactionResult.rows[0]
            });
        } catch (error) {
            console.error('Complete ride error details:', {
                error: error.message,
                stack: error.stack,
                detail: error.detail,
                where: error.where
            });
            await pool.query('ROLLBACK');
            res.status(500).json({ 
                error: 'Failed to complete ride',
                details: error.message
            });
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
    
        console.log('Getting ride history for:', {
            user_id,
            role,
            ride_status
        });
    
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
    
            console.log('Executing query:', {
                query,
                params: queryParams
            });
    
            const result = await pool.query(query, queryParams);
    
            console.log('Query result:', {
                rowCount: result.rows.length,
                rows: result.rows
            });
    
            // Also check if there are any rides at all for this user
            const totalRidesQuery = await pool.query(
                'SELECT COUNT(*) FROM rides WHERE rider_id = $1',
                [user_id]
            );
            
            console.log('Total rides for user:', totalRidesQuery.rows[0].count);
    
            res.json({
                rides: result.rows
            });
        } catch (error) {
            console.error('Error in getRideHistory:', error);
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