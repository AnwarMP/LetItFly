const axios = require('axios');
const { seedTestData } = require('./paymentTestData');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from root .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const API_URL = process.env.API_URL || 'http://localhost:3000';
let riderToken = '';
let driverToken = '';
let testData = {};


const login = async (email, password, role) => {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, {
            email,
            password,
            role
        });
        if (!response.data.token) {
            throw new Error('No token received from login');
        }
        return response.data.token;
    } catch (error) {
        console.error('Login failed:', error.response?.data || error.message);
        throw error;
    }
};

const testPaymentMethods = async () => {
    console.log('\n=== Testing Payment Methods ===');
    try {
        if (!riderToken) throw new Error('Rider token not available');

        // Add a payment method
        const addResponse = await axios.post(
            `${API_URL}/payment/methods`,
            {
                card_number: '4242424242424242',
                card_type: 'visa'
            },
            {
                headers: { Authorization: `Bearer ${riderToken}` }
            }
        );
        console.log('Add payment method:', addResponse.data);
        
        if (!addResponse.data.success) {
            throw new Error('Failed to add payment method');
        }

        // Get payment methods
        const getResponse = await axios.get(
            `${API_URL}/payment/methods`,
            {
                headers: { Authorization: `Bearer ${riderToken}` }
            }
        );
        console.log('Get payment methods:', getResponse.data);
        
        return true;
    } catch (error) {
        console.error('Payment methods test failed:', error.response?.data || error.message);
        return false;
    }
};

const testRidePayments = async () => {
    console.log('\n=== Testing Ride Payments ===');
    try {
        if (!riderToken) throw new Error('Rider token not available');
        if (!testData.paymentMethodId) throw new Error('Payment method ID not available');

        // Calculate fare
        const calcResponse = await axios.post(
            `${API_URL}/payment/rides/calculate`,
            {
                distance_miles: 15.5,
                duration_minutes: 45,
                allow_rideshare: false
            },
            {
                headers: { Authorization: `Bearer ${riderToken}` }
            }
        );
        console.log('Fare calculation:', calcResponse.data);

        if (!calcResponse.data.fare_breakdown) {
            throw new Error('Fare calculation failed');
        }

        // Process payment
        const fareDetails = calcResponse.data.fare_breakdown;
        const payResponse = await axios.post(
            `${API_URL}/payment/rides/process`,
            {
                ride_id: testData.rideId,
                ...fareDetails,
                payment_method_id: testData.paymentMethodId
            },
            {
                headers: { Authorization: `Bearer ${riderToken}` }
            }
        );
        console.log('Payment processing:', payResponse.data);
        
        if (!payResponse.data.success) {
            throw new Error('Payment processing failed');
        }

        return true;
    } catch (error) {
        console.error('Ride payments test failed:', error.response?.data || error.message);
        return false;
    }
};

const testTransactionHistory = async () => {
    console.log('\n=== Testing Transaction History ===');
    try {
        if (!riderToken || !driverToken) throw new Error('Tokens not available');

        // Get rider's transactions
        const riderTxResponse = await axios.get(
            `${API_URL}/payment/transactions`,
            {
                headers: { Authorization: `Bearer ${riderToken}` }
            }
        );
        console.log('Rider transactions:', riderTxResponse.data);

        // Get driver's transactions
        const driverTxResponse = await axios.get(
            `${API_URL}/payment/transactions`,
            {
                headers: { Authorization: `Bearer ${driverToken}` }
            }
        );
        console.log('Driver transactions:', driverTxResponse.data);

        return true;
    } catch (error) {
        console.error('Transaction history test failed:', error.response?.data || error.message);
        return false;
    }
};

const testDriverEarnings = async () => {
    console.log('\n=== Testing Driver Earnings ===');
    try {
        if (!driverToken) throw new Error('Driver token not available');

        // Get earnings
        const earningsResponse = await axios.get(
            `${API_URL}/payment/earnings`,
            {
                headers: { Authorization: `Bearer ${driverToken}` }
            }
        );
        console.log('Driver earnings:', earningsResponse.data);

        if (!earningsResponse.data.earnings) {
            throw new Error('Failed to fetch earnings');
        }

        // Request payout
        const payoutResponse = await axios.post(
            `${API_URL}/payment/payout`,
            {
                amount: 40.00,
                payment_method_id: testData.paymentMethodId
            },
            {
                headers: { Authorization: `Bearer ${driverToken}` }
            }
        );
        console.log('Payout request:', payoutResponse.data);

        if (!payoutResponse.data.success) {
            throw new Error('Payout request failed');
        }

        return true;
    } catch (error) {
        console.error('Driver earnings test failed:', error.response?.data || error.message);
        return false;
    }
};

const runTests = async () => {
    try {
        console.log('Starting payment endpoint tests...');
        
        console.log('\nStep 1: Seeding test data...');
        testData = await seedTestData();
        
        console.log('\nStep 2: Logging in test users...');
        riderToken = await login('testrider@test.com', 'testpass123', 'rider');
        driverToken = await login('testdriver@test.com', 'testpass123', 'driver');

        // Track test results
        const results = {
            paymentMethods: await testPaymentMethods(),
            ridePayments: await testRidePayments(),
            transactionHistory: await testTransactionHistory(),
            driverEarnings: await testDriverEarnings()
        };

        // Summary
        console.log('\n=== Test Summary ===');
        Object.entries(results).forEach(([test, passed]) => {
            console.log(`${test}: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
        });

        const allPassed = Object.values(results).every(Boolean);
        console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
};

// Run the tests if called directly
if (require.main === module) {
    runTests().then(() => process.exit());
}

module.exports = { runTests };