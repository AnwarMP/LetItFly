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
    // Drop all tables in the correct order (to handle foreign key constraints)
    // console.log('Dropping existing tables...');
    // await pool.query(`
    //   DROP TABLE IF EXISTS transactions CASCADE;
    //   DROP TABLE IF EXISTS rides CASCADE;
    //   DROP TABLE IF EXISTS payment_methods CASCADE;
    //   DROP TABLE IF EXISTS bank_accounts CASCADE;
    //   DROP TABLE IF EXISTS users CASCADE;
      
    //   -- Also drop the trigger function if it exists
    //   DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
    // `);
    // console.log('Existing tables dropped successfully');

    console.log('Dropping existing tables...');
    await pool.query(`
      DROP TABLE IF EXISTS payment_methods CASCADE;
      DROP TABLE IF EXISTS bank_accounts CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      
      -- Also drop the trigger function if it exists
      DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
    `);
    console.log('Existing tables dropped successfully');

    // Create updated_at function
    console.log('Creating trigger function...');
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    console.log('Creating users table...');
    // Create users table with all fields (existing)
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

    console.log('Creating payment_methods table...');
    // Payment Methods table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        card_type VARCHAR(50) NOT NULL,
        last_four VARCHAR(4) NOT NULL,
        expiry_month INTEGER NOT NULL,
        expiry_year INTEGER NOT NULL,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT valid_card_type CHECK (card_type IN ('visa', 'mastercard', 'amex')),
        CONSTRAINT valid_expiry_month CHECK (expiry_month BETWEEN 1 AND 12)
      );
    `);

    console.log('Creating bank_accounts table...');
    // Bank Accounts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bank_accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        account_holder_name VARCHAR(255) NOT NULL,
        last_four VARCHAR(4) NOT NULL,
        routing_number VARCHAR(9) NOT NULL,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Creating rides table...');
    // Rides table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rides (
        id SERIAL PRIMARY KEY,
        rider_id INTEGER NOT NULL REFERENCES users(id),
        driver_id INTEGER REFERENCES users(id),
        pickup_location TEXT NOT NULL,
        dropoff_location TEXT NOT NULL,
        ride_status VARCHAR(50) NOT NULL,
        estimated_fare DECIMAL(10,2) NOT NULL,
        final_fare DECIMAL(10,2),
        num_passengers INTEGER NOT NULL,
        requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        accepted_at TIMESTAMP WITH TIME ZONE,
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT valid_ride_status CHECK (ride_status IN ('requested', 'accepted', 'in_progress', 'completed', 'cancelled')),
        CONSTRAINT valid_estimated_fare CHECK (estimated_fare > 0),
        CONSTRAINT valid_final_fare CHECK (final_fare IS NULL OR final_fare > 0),
        CONSTRAINT valid_passengers CHECK (num_passengers > 0 AND num_passengers <= 8)
      );
    `);

    console.log('Creating transactions table...');
    // Transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        ride_id INTEGER NOT NULL REFERENCES rides(id),
        rider_id INTEGER NOT NULL REFERENCES users(id),
        driver_id INTEGER NOT NULL REFERENCES users(id),
        amount DECIMAL(10,2) NOT NULL,
        transaction_status VARCHAR(50) NOT NULL DEFAULT 'completed',
        payment_method_id INTEGER REFERENCES payment_methods(id),
        bank_account_id INTEGER REFERENCES bank_accounts(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT valid_amount CHECK (amount > 0)
      );
    `);

    console.log('Creating triggers...');
    // Create triggers for all tables
    const tables = ['users', 'payment_methods', 'bank_accounts', 'rides', 'transactions'];
    for (const table of tables) {
      await pool.query(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
        CREATE TRIGGER update_${table}_updated_at
            BEFORE UPDATE ON ${table}
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
      `);
    }

    console.log('Creating indexes...');
    // Create indexes after all tables are created
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);
      CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts(user_id);
      CREATE INDEX IF NOT EXISTS idx_rides_rider ON rides(rider_id);
      CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id);
      CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(ride_status);
      CREATE INDEX IF NOT EXISTS idx_transactions_ride ON transactions(ride_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_rider ON transactions(rider_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_driver ON transactions(driver_id);
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