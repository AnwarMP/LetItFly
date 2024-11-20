const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

const initializeDatabase = async () => {
  try {
    // Create users table (existing)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('rider', 'driver')),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        home_address TEXT,
        car_model VARCHAR(100),
        car_license_plate VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create rides table to track ride history
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rides (
        id SERIAL PRIMARY KEY,
        rider_id INTEGER REFERENCES users(id) NOT NULL,
        driver_id INTEGER REFERENCES users(id) NOT NULL,
        pickup_location TEXT NOT NULL,
        dropoff_location TEXT NOT NULL,
        ride_status VARCHAR(50) NOT NULL CHECK (ride_status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
        start_time TIMESTAMP WITH TIME ZONE,
        end_time TIMESTAMP WITH TIME ZONE,
        distance_miles DECIMAL(10,2),
        duration_minutes INTEGER,
        allow_rideshare BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create wallets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_wallet UNIQUE (user_id)
      );
    `);

    // Create payment methods table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        card_last_four VARCHAR(4) NOT NULL,
        card_type VARCHAR(20) NOT NULL,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT valid_card_type CHECK (card_type IN ('visa', 'mastercard', 'amex', 'discover'))
      );
    `);

    // Create transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        ride_id INTEGER REFERENCES rides(id) NOT NULL,
        rider_id INTEGER REFERENCES users(id) NOT NULL,
        driver_id INTEGER REFERENCES users(id) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
        type VARCHAR(20) NOT NULL CHECK (type IN ('ride_payment', 'driver_payout', 'refund')),
        payment_method_id INTEGER REFERENCES payment_methods(id),
        platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        driver_earnings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP WITH TIME ZONE
      );
    `);

    // Create ride_payments table for detailed payment info
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ride_payments (
        id SERIAL PRIMARY KEY,
        ride_id INTEGER REFERENCES rides(id) NOT NULL,
        base_fare DECIMAL(10,2) NOT NULL DEFAULT 15.00,
        distance_fare DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        time_fare DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        rideshare_discount DECIMAL(10,2) DEFAULT 0.00,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
        transaction_id INTEGER REFERENCES transactions(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_ride_payment UNIQUE (ride_id)
      );
    `);

    // Create trigger function for updating timestamps
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create triggers for all tables with updated_at
    const tables = ['users', 'rides', 'wallets', 'ride_payments'];
    for (const table of tables) {
      await pool.query(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
        
        CREATE TRIGGER update_${table}_updated_at
            BEFORE UPDATE ON ${table}
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
      `);
    }

    // Create function to automatically create wallet for new users
    await pool.query(`
      CREATE OR REPLACE FUNCTION create_user_wallet()
      RETURNS TRIGGER AS $$
      BEGIN
          INSERT INTO wallets (user_id)
          VALUES (NEW.id);
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS create_wallet_for_new_user ON users;
      
      CREATE TRIGGER create_wallet_for_new_user
          AFTER INSERT ON users
          FOR EACH ROW
          EXECUTE FUNCTION create_user_wallet();
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

module.exports = {
  pool,
  initializeDatabase
};