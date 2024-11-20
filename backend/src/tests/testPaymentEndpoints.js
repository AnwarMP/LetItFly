const axios = require('axios');
const { seedTestData } = require('./paymentTestData');

const API_URL = 'http://localhost:3000';
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
        return response.data.token;
    } catch (error) {
        console.error('Login failed:', error.response?.data || error.message);
        throw error;
    }
};

const testPaymentMethods = async () => {
    console.log('\n=== Testing Payment Methods ===');
    try {
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

        // Get payment methods
        const getResponse = await axios.get(
            `${API_URL}/payment/methods`,
            {
                headers: { Authorization: `Bearer ${riderToken}` }
            }
        );
        console.log('Get payment methods:', getResponse.data);
    } catch (error) {
        console.error('Payment methods test failed:', error.response?.data || error.message);
    }
};

const testWallet = async () => {
    console.log('\n=== Testing Wallet Operations ===');
    try {
        // Get wallet balance
        const balanceResponse = await axios.get(
            `${API_URL}/payment/wallet`,
            {
                headers: { Authorization: `Bearer ${driverToken}` }
            }
        );
        console.log('Wallet balance:', balanceResponse.data);

        // Top up wallet
        const topupResponse = await axios.post(
            `${API_URL}/payment/wallet/topup`,
            {
                amount: 50.00,
                payment_method_id: testData.paymentMethodId
            },
            {
                headers: { Authorization: `Bearer ${riderToken}` }
            }
        );
        console.log('Wallet top-up:', topupResponse.data);
    } catch (error) {
        console.error('Wallet test failed:', error.response?.data || error.message);
    }
};

const testRidePayments = async () => {
    console.log('\n=== Testing Ride Payments ===');
    try {
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
    } catch (error) {
        console.error('Ride payments test failed:', error.response?.data || error.message);
    }
};

const testTransactionHistory = async () => {
    console.log('\n=== Testing Transaction History ===');
    try {
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
    } catch (error) {
        console.error('Transaction history test failed:', error.response?.data || error.message);
    }
};

const testDriverEarnings = async () => {
    console.log('\n=== Testing Driver Earnings ===');
    try {
        // Get earnings
        const earningsResponse = await axios.get(
            `${API_URL}/payment/earnings`,
            {
                headers: { Authorization: `Bearer ${driverToken}` }
            }
        );
        console.log('Driver earnings:', earningsResponse.data);

        // Request payout
        const payoutResponse = await axios.post(
            `${API_URL}/payment/earnings/payout`,
            {
                amount: 40.00,
                payment_method_id: testData.paymentMethodId
            },
            {
                headers: { Authorization: `Bearer ${driverToken}` }
            }
        );
        console.log('Payout request:', payoutResponse.data);
    } catch (error) {
        console.error('Driver earnings test failed:', error.response?.data || error.message);
    }
};

const runTests = async () => {
    try {
        console.log('Seeding test data...');
        testData = await seedTestData();

        console.log('Logging in test users...');
        riderToken = await login('testrider@test.com', 'testpass123', 'rider');
        driverToken = await login('testdriver@test.com', 'testpass123', 'driver');

        // Run all tests
        await testPaymentMethods();
        await testWallet();
        await testRidePayments();
        await testTransactionHistory();
        await testDriverEarnings();

        console.log('\nAll tests completed!');
    } catch (error) {
        console.error('Test suite failed:', error);
    }
};

// Run the tests
runTests();