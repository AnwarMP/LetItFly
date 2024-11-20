const { pool } = require('../db/init');
const bcrypt = require('bcryptjs');

const seedTestData = async () => {
    try {
        await pool.query('BEGIN');

        // Create test users (1 rider, 1 driver)
        const hashedPassword = await bcrypt.hash('testpass123', 10);
        
        // Create rider
        const riderResult = await pool.query(`
            INSERT INTO users (
                email, password, role, first_name, last_name, 
                phone_number, home_address
            ) VALUES (
                'testrider@test.com', 
                $1, 
                'rider', 
                'Test', 
                'Rider', 
                '123-456-7890', 
                '123 Test St'
            ) RETURNING id`,
            [hashedPassword]
        );
        const riderId = riderResult.rows[0].id;

        // Create driver
        const driverResult = await pool.query(`
            INSERT INTO users (
                email, password, role, first_name, last_name, 
                phone_number, car_model, car_license_plate
            ) VALUES (
                'testdriver@test.com', 
                $1, 
                'driver', 
                'Test', 
                'Driver', 
                '123-456-7891',
                'Tesla Model 3',
                'TEST123'
            ) RETURNING id`,
            [hashedPassword]
        );
        const driverId = driverResult.rows[0].id;

        // Create a test ride
        const rideResult = await pool.query(`
            INSERT INTO rides (
                rider_id, driver_id, pickup_location, dropoff_location,
                ride_status, start_time, end_time, distance_miles,
                duration_minutes, allow_rideshare
            ) VALUES (
                $1, $2, 
                'SFO Airport', 
                '123 Test St', 
                'completed',
                NOW() - INTERVAL '1 hour',
                NOW(),
                15.5,
                45,
                false
            ) RETURNING id`,
            [riderId, driverId]
        );
        const rideId = rideResult.rows[0].id;

        // Add payment method for rider
        const paymentMethodResult = await pool.query(`
            INSERT INTO payment_methods (
                user_id, card_last_four, card_type, is_default
            ) VALUES (
                $1, '4242', 'visa', true
            ) RETURNING id`,
            [riderId]
        );
        const paymentMethodId = paymentMethodResult.rows[0].id;

        // Create a test transaction
        await pool.query(`
            INSERT INTO transactions (
                ride_id, rider_id, driver_id, amount, status,
                type, payment_method_id, platform_fee, driver_earnings
            ) VALUES (
                $1, $2, $3, 50.00, 'completed',
                'ride_payment', $4, 10.00, 40.00
            )`,
            [rideId, riderId, driverId, paymentMethodId]
        );

        // Add some initial balance to wallets
        await pool.query(`
            UPDATE wallets SET balance = 100.00 WHERE user_id = $1`,
            [driverId]
        );

        await pool.query('COMMIT');

        console.log('Test data seeded successfully');
        console.log('Test Rider Credentials:', {
            email: 'testrider@test.com',
            password: 'testpass123',
            id: riderId
        });
        console.log('Test Driver Credentials:', {
            email: 'testdriver@test.com',
            password: 'testpass123',
            id: driverId
        });

        return {
            riderId,
            driverId,
            rideId,
            paymentMethodId
        };
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error seeding test data:', error);
        throw error;
    }
};

module.exports = { seedTestData };