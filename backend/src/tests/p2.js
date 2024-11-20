const axios = require('axios');
const { pool, testConnection } = require('../db/init');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const API_URL = process.env.API_URL || 'http://localhost:3000';

const seedTestData = async () => {
    try {
        // Test database connection first
        const isConnected = await testConnection();
        if (!isConnected) {
            throw new Error('Could not connect to database. Check your configuration.');
        }

        console.log('Connected to database, starting to seed data...');

        // Start transaction
        await pool.query('BEGIN');

        // Create test rider
        const riderResponse = await axios.post(`${API_URL}/auth/register`, {
            email: 'testrider@test.com',
            password: 'testpass123',
            role: 'rider',
            first_name: 'Test',
            last_name: 'Rider',
            phone_number: '123-456-7890',
            home_address: '123 Test St'
        });

        console.log('Rider created:', {
            id: riderResponse.data.user.id,
            email: riderResponse.data.user.email
        });

        const riderId = riderResponse.data.user.id;
        const riderToken = riderResponse.data.token;

        // Create test driver
        const driverResponse = await axios.post(`${API_URL}/auth/register`, {
            email: 'testdriver@test.com',
            password: 'testpass123',
            role: 'driver',
            first_name: 'Test',
            last_name: 'Driver',
            phone_number: '123-456-7891',
            car_model: 'Tesla Model 3',
            car_license_plate: 'TEST123'
        });

        console.log('Driver created:', {
            id: driverResponse.data.user.id,
            email: driverResponse.data.user.email
        });

        const driverId = driverResponse.data.user.id;
        const driverToken = driverResponse.data.token;

        // Create test ride
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

        // Add payment method
        const paymentResponse = await axios.post(
            `${API_URL}/payment/methods`,
            {
                card_number: '4242424242424242',
                card_type: 'visa'
            },
            {
                headers: { Authorization: `Bearer ${riderToken}` }
            }
        );

        const paymentMethodId = paymentResponse.data.payment_method.id;

        await pool.query('COMMIT');

        console.log('Test data seeded successfully');
        return {
            riderId,
            driverId,
            rideId,
            paymentMethodId,
            riderToken,
            driverToken
        };

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error seeding test data:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        throw error;
    }
};

// Export the function and also make it directly executable
if (require.main === module) {
    seedTestData()
        .then(() => {
            console.log('Seeding completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('Seeding failed:', error);
            process.exit(1);
        });
} else {
    module.exports = { seedTestData };
}