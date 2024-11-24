const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const seedDatabase = async () => {
const API_BASE_URL = 'http://localhost:3000'; // Update to match your API base URL

const users = [
  {
    email: 'alice@rider.com',
    password: 'password123',
    role: 'rider',
    first_name: 'Alice',
    last_name: 'Rider',
    phone_number: '1234567890',
    home_address: '123 Rider St',
    payment_method: {
      card_type: 'visa',
      last_four: '4242',
      expiry_month: 12,
      expiry_year: 2025,
    },
  },
  {
    email: 'bob@rider.com',
    password: 'password123',
    role: 'rider',
    first_name: 'Bob',
    last_name: 'Rider',
    phone_number: '1234567890',
    home_address: '124 Rider St',
    payment_method: {
      card_type: 'mastercard',
      last_four: '5555',
      expiry_month: 6,
      expiry_year: 2026,
    },
  },
  {
    email: 'russ@driver.com',
    password: 'password123',
    role: 'driver',
    first_name: 'Russ',
    last_name: 'Driver',
    phone_number: '1234567890',
    car_model: 'Tesla Model S',
    car_license_plate: 'RUSS123',
    bank_account: {
      account_holder_name: 'Russ Driver',
      last_four: '9876',
      routing_number: '123456789',
    },
  },
  {
    email: 'will@driver.com',
    password: 'password123',
    role: 'driver',
    first_name: 'Will',
    last_name: 'Driver',
    phone_number: '1234567890',
    car_model: 'Ford Mustang',
    car_license_plate: 'WILL456',
    bank_account: {
      account_holder_name: 'Will Driver',
      last_four: '4321',
      routing_number: '987654321',
    },
  },
];

const seedDatabase = async () => {
  for (const user of users) {
    try {
      console.log(`Seeding user: ${user.email}`);
      
      // Register user
      await axios.post(`${API_BASE_URL}/auth/register`, user);
      console.log(`✅ User ${user.email} registered successfully.`);

      // Log in to retrieve a token
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: user.email,
        password: user.password,
        role: user.role,
      });
      const token = loginResponse.data.token;
      console.log(`🔑 Logged in as ${user.email}`);

      if (user.role === 'rider') {
        // Add payment method
        const paymentResponse = await axios.post(
          `${API_BASE_URL}/api/payments/methods`,
          user.payment_method,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`💳 Payment method added for ${user.email}`);

        // Set payment method as default
        await axios.put(
          `${API_BASE_URL}/api/payments/methods/${paymentResponse.data.payment_method.id}/default`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`✅ Default payment method set for ${user.email}`);
      }

      if (user.role === 'driver') {
        // Add bank account
        const bankAccountResponse = await axios.post(
          `${API_BASE_URL}/api/payments/bank-accounts`,
          user.bank_account,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`🏦 Bank account added for ${user.email}`);

        // Set bank account as default
        await axios.put(
          `${API_BASE_URL}/api/payments/bank-accounts/${bankAccountResponse.data.bank_account.id}/default`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`✅ Default bank account set for ${user.email}`);
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log(`⚠️ User ${user.email} already exists or another error occurred.`);
      } else {
        console.error(`❌ Failed to seed user ${user.email}:`, error.message);
      }
    }
  }
  console.log('🚀 Seeding process completed.');
};

seedDatabase().catch((error) => console.error('❌ Seeding script failed:', error.message));
};

module.exports = { seedDatabase };