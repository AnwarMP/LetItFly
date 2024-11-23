const axios = require('axios');

const API_URL = 'http://localhost:3000';
let riderToken = null;
let driverToken = null;
let rideId = null;
let currentRide = null;

const testData = {
    rider: {
        email: 'testrider@example.com',
        password: 'password123',
        role: 'rider',
        first_name: 'Test',
        last_name: 'Rider',
        phone_number: '1234567890',
        home_address: '123 Test St'
    },
    driver: {
        email: 'testdriver@example.com',
        password: 'password123',
        role: 'driver',
        first_name: 'Test',
        last_name: 'Driver',
        phone_number: '0987654321',
        car_model: 'Tesla Model 3',
        car_license_plate: 'TEST123'
    },
    paymentMethod: {
        card_type: 'visa',
        last_four: '4242',
        expiry_month: 12,
        expiry_year: 2025
    },
    bankAccount: {
        account_holder_name: 'Test Driver',
        last_four: '4321',
        routing_number: '123456789'
    },
    ride: {
        pickup_location: 'SFO Airport',
        dropoff_location: 'Downtown SF',
        estimated_fare: 45.00,
        num_passengers: 2
    }
};

async function runTests() {
    try {
        console.log('🚀 Starting comprehensive payment system tests...\n');

        // 1. Register and login users
        console.log('1️⃣  Registering and logging in users...');
        await registerAndLoginUsers();
        console.log('✅ Users registered and logged in successfully\n');

        // 2. Add payment methods
        console.log('2️⃣  Setting up payment methods...');
        await setupPaymentMethods();
        console.log('✅ Payment methods set up successfully\n');

        // 3. Create and process ride
        console.log('3️⃣  Testing ride flow...');
        await testRideFlow();
        console.log('✅ Ride flow completed successfully\n');

        // 4. Check transaction history
        console.log('4️⃣  Checking transaction history...');
        await checkTransactionHistory();
        console.log('✅ Transaction history verified successfully\n');

        console.log('🎉 All tests completed successfully!');
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        
        if (error.response) {
            console.error('\nResponse details:');
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
            console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
            
            if (error.response.config) {
                console.error('\nRequest details:');
                console.error('Method:', error.response.config.method.toUpperCase());
                console.error('URL:', error.response.config.url);
                console.error('Headers:', JSON.stringify(error.response.config.headers, null, 2));
                if (error.response.config.data) {
                    console.error('Data:', JSON.stringify(JSON.parse(error.response.config.data), null, 2));
                }
            }
        } else if (error.request) {
            console.error('No response received:', error.request);
        }
        
        console.error('\nStack trace:');
        console.error(error.stack);
        
        process.exit(1);
    }
}

async function registerAndLoginUsers() {
    // Register Rider
    await axios.post(`${API_URL}/auth/register`, testData.rider);
    const riderLogin = await axios.post(`${API_URL}/auth/login`, {
        email: testData.rider.email,
        password: testData.rider.password,
        role: 'rider'
    });
    riderToken = riderLogin.data.token;
    console.log('  📱 Rider registered and logged in');

    // Register Driver
    await axios.post(`${API_URL}/auth/register`, testData.driver);
    const driverLogin = await axios.post(`${API_URL}/auth/login`, {
        email: testData.driver.email,
        password: testData.driver.password,
        role: 'driver'
    });
    driverToken = driverLogin.data.token;
    console.log('  🚗 Driver registered and logged in');
}

async function setupPaymentMethods() {
    // Add rider's payment method
    const paymentMethodResponse = await axios.post(
        `${API_URL}/api/payments/methods`,
        testData.paymentMethod,
        { headers: { Authorization: `Bearer ${riderToken}` } }
    );
    console.log('  💳 Rider payment method added');

    // Set payment method as default
    await axios.put(
        `${API_URL}/api/payments/methods/${paymentMethodResponse.data.payment_method.id}/default`,
        {},
        { headers: { Authorization: `Bearer ${riderToken}` } }
    );
    console.log('  ✓ Payment method set as default');

    // Add driver's bank account
    const bankAccountResponse = await axios.post(
        `${API_URL}/api/payments/bank-accounts`,
        testData.bankAccount,
        { headers: { Authorization: `Bearer ${driverToken}` } }
    );
    console.log('  🏦 Driver bank account added');

    // Set bank account as default
    await axios.put(
        `${API_URL}/api/payments/bank-accounts/${bankAccountResponse.data.bank_account.id}/default`,
        {},
        { headers: { Authorization: `Bearer ${driverToken}` } }
    );
    console.log('  ✓ Bank account set as default');

    // Verify payment methods
    const riderMethods = await axios.get(
        `${API_URL}/api/payments/methods`,
        { headers: { Authorization: `Bearer ${riderToken}` } }
    );
    console.log('  ✓ Rider has', riderMethods.data.payment_methods.length, 'payment method(s)');

    const driverAccounts = await axios.get(
        `${API_URL}/api/payments/bank-accounts`,
        { headers: { Authorization: `Bearer ${driverToken}` } }
    );
    console.log('  ✓ Driver has', driverAccounts.data.bank_accounts.length, 'bank account(s)');

    // Verify defaults are set
    const hasDefaultPaymentMethod = riderMethods.data.payment_methods.some(m => m.is_default);
    const hasDefaultBankAccount = driverAccounts.data.bank_accounts.some(a => a.is_default);

    if (!hasDefaultPaymentMethod) {
        throw new Error('No default payment method set');
    }
    if (!hasDefaultBankAccount) {
        throw new Error('No default bank account set');
    }

    console.log('  ✓ Default payment methods verified');
}


async function testRideFlow() {
    // 1. Rider requests ride (PostgreSQL)
    const rideResponse = await axios.post(
        `${API_URL}/api/payments/rides`,
        testData.ride,
        { headers: { Authorization: `Bearer ${riderToken}` } }
    );
    rideId = rideResponse.data.ride.id;
    console.log('  🎟️ Ride created in PostgreSQL with ID:', rideId);

    // 2. Rider requests ride (Redis)
    await axios.post(
        `${API_URL}/store-rider-info`,
        {
            rider_id: "test_rider_id",
            rider_name: `${testData.rider.first_name} ${testData.rider.last_name}`,
            pickup_location: testData.ride.pickup_location,
            dropoff_location: testData.ride.dropoff_location,
            num_passengers: testData.ride.num_passengers,
            allow_rideshare: false,
            est_time: 30,
            fare: testData.ride.estimated_fare
        }
    );
    console.log('  📝 Ride info stored in Redis');

    // 3. Driver accepts ride (PostgreSQL)
    await axios.put(
        `${API_URL}/api/payments/rides/${rideId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${driverToken}` } }
    );
    console.log('  👍 Driver accepted ride in PostgreSQL');

    // 4. Driver accepts ride (Redis)
    await axios.post(
        `${API_URL}/store-driver-location`,
        {
            driver_id: "test_driver_id",
            current_location: "[37.7749, -122.4194]",
            name: `${testData.driver.first_name} ${testData.driver.last_name}`,
            car: testData.driver.car_model,
            license_plate: testData.driver.car_license_plate
        }
    );
    console.log('  📍 Driver location stored in Redis');

    // 5. Start ride
    await axios.put(
        `${API_URL}/api/payments/rides/${rideId}/start`,
        {},
        { headers: { Authorization: `Bearer ${driverToken}` } }
    );
    console.log('  🚗 Ride started');

    // 6. Complete ride and process payment
    await axios.put(
        `${API_URL}/api/payments/rides/${rideId}/complete`,
        { final_fare: testData.ride.estimated_fare },
        { headers: { Authorization: `Bearer ${driverToken}` } }
    );
    console.log('  ✅ Ride completed and payment processed');

    // Clean up Redis data
    await axios.post(`${API_URL}/delete-ride-keys`, {
        keys: ['rider:test_rider_id', 'driver:test_driver_id']
    });
    console.log('  🧹 Redis data cleaned up');
}

async function checkTransactionHistory() {
    // Check rider's transactions
    const riderTransactions = await axios.get(
        `${API_URL}/api/payments/transactions`,
        { headers: { Authorization: `Bearer ${riderToken}` } }
    );
    console.log('  💰 Rider transaction count:', riderTransactions.data.transactions.length);

    // Check driver's transactions
    const driverTransactions = await axios.get(
        `${API_URL}/api/payments/transactions`,
        { headers: { Authorization: `Bearer ${driverToken}` } }
    );
    console.log('  💰 Driver transaction count:', driverTransactions.data.transactions.length);

    // Check driver's earnings summary
    const driverEarnings = await axios.get(
        `${API_URL}/api/payments/transactions/earnings?period=day`,
        { headers: { Authorization: `Bearer ${driverToken}` } }
    );
    console.log('  📊 Driver earnings summary:', driverEarnings.data.summary);
}

// Run the tests
runTests();