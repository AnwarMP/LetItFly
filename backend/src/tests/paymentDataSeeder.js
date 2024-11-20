const axios = require('axios');

const API_URL = 'http://localhost:3000';

// Helper function to make API calls with error handling
const makeRequest = async (method, endpoint, data = null, headers = {}) => {
    try {
        console.log(`\nMaking ${method} request to ${endpoint}`);
        if (data) console.log('Request data:', JSON.stringify(data, null, 2));
        
        const response = await axios({
            method,
            url: `${API_URL}${endpoint}`,
            data,
            headers,
            validateStatus: null // Don't throw on any status
        });

        console.log(`Response status: ${response.status}`);
        console.log('Response data:', JSON.stringify(response.data, null, 2));

        if (response.status >= 400) {
            throw new Error(`API request failed with status ${response.status}: ${JSON.stringify(response.data)}`);
        }

        return response;
    } catch (error) {
        console.error(`Error making ${method} request to ${endpoint}:`);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
            console.error('Response headers:', error.response.headers);
        } else if (error.request) {
            console.error('No response received. Request:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
        throw error;
    }
};

const seedTestData = async () => {
    console.log('Starting test data seeding process...');
    
    try {
        // Check if server is running
        try {
            await makeRequest('GET', '/');
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error(`Server is not running at ${API_URL}. Please start the server first.`);
            }
            // If we get a 404, that's fine - it means the server is running but this endpoint doesn't exist
        }

        console.log('\n1. Registering test rider...');
        const riderResponse = await makeRequest('POST', '/auth/register', {
            email: 'testrider@test.com',
            password: 'testpass123',
            role: 'rider',
            first_name: 'Test',
            last_name: 'Rider',
            phone_number: '123-456-7890',
            home_address: '123 Test St'
        });

        if (!riderResponse.data.user || !riderResponse.data.token) {
            throw new Error('Rider registration response missing user or token');
        }

        const riderId = riderResponse.data.user.id;
        const riderToken = riderResponse.data.token;

        console.log('\n2. Registering test driver...');
        const driverResponse = await makeRequest('POST', '/auth/register', {
            email: 'testdriver@test.com',
            password: 'testpass123',
            role: 'driver',
            first_name: 'Test',
            last_name: 'Driver',
            phone_number: '123-456-7891',
            car_model: 'Tesla Model 3',
            car_license_plate: 'TEST123'
        });

        if (!driverResponse.data.user || !driverResponse.data.token) {
            throw new Error('Driver registration response missing user or token');
        }

        const driverId = driverResponse.data.user.id;
        const driverToken = driverResponse.data.token;

        console.log('\n3. Adding payment method for rider...');
        const paymentMethodResponse = await makeRequest(
            'POST',
            '/payment/methods',
            {
                card_number: '4242424242424242',
                card_type: 'visa'
            },
            { Authorization: `Bearer ${riderToken}` }
        );

        if (!paymentMethodResponse.data.payment_method) {
            throw new Error('Payment method response missing payment_method data');
        }

        const paymentMethodId = paymentMethodResponse.data.payment_method.id;

        console.log('\n4. Storing test ride data in Redis...');
        await makeRequest('POST', '/store-rider-info', {
            rider_id: riderId,
            pickup_location: 'SFO Airport',
            dropoff_location: '123 Test St',
            num_passengers: 1,
            allow_rideshare: false
        });

        console.log('\n5. Storing driver location...');
        await makeRequest('POST', '/store-driver-location', {
            driver_id: driverId,
            current_location: 'San Francisco Downtown',
            name: 'Test Driver',
            car: 'Tesla Model 3',
            license_plate: 'TEST123'
        });

        console.log('\n6. Creating session between rider and driver...');

        const sessionResponse = await makeRequest('POST', '/store-session', {
            rider_id: riderId,
            driver_id: driverId,
            pickup_location: 'SFO Airport',
            dropoff_location: '123 Test St',
            confirm_pickup: 'false',          // Send as string
            confirm_dropoff: 'false',         // Send as string
            start_time: new Date().toISOString(),
            end_time: null,
            fare: '50.00'
        });

        // Verify session was created
        if (sessionResponse.data.success) {
            console.log('Session created successfully:', sessionResponse.data.sessionKey);
            
            // Verify the session data
            const verifySession = await makeRequest(
                'GET',
                `/get-session?rider_id=${riderId}&driver_id=${driverId}`
            );
            console.log('Session verification:', verifySession.data);
        } else {
            throw new Error('Failed to create session');
        }

        const testData = {
            riderId,
            driverId,
            paymentMethodId,
            riderToken,
            driverToken
        };

        console.log('\nTest data seeded successfully:', testData);
        return testData;

    } catch (error) {
        console.error('\n🚨 Error seeding test data:', error.message);
        console.error('\nFull error details:');
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
            console.error('Response headers:', error.response.headers);
        } else if (error.request) {
            console.error('No response received');
            console.error('Request details:', error.request);
        }
        console.error('\nStack trace:', error.stack);
        throw new Error('Failed to seed test data. See above for details.');
    }
};

// Export separately so we can run it directly with node
if (require.main === module) {
    console.log('Running data seeder directly...');
    seedTestData()
        .then(() => {
            console.log('Data seeding completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Data seeding failed:', error);
            process.exit(1);
        });
} else {
    module.exports = { seedTestData };
}