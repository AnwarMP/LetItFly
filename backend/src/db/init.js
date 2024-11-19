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
    // Create users table with all fields
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

    // First, try to drop the existing constraint if it exists
    try {
      await pool.query(`
        ALTER TABLE users 
        DROP CONSTRAINT IF EXISTS check_rider_fields;
      `);
    } catch (error) {
      console.log('No existing constraint to drop');
    }

    // Add constraints for role-specific fields
    await pool.query(`
      ALTER TABLE users 
      ADD CONSTRAINT check_rider_fields 
      CHECK (
        (role = 'rider' AND home_address IS NOT NULL AND car_model IS NULL AND car_license_plate IS NULL) OR
        (role = 'driver' AND home_address IS NULL AND car_model IS NOT NULL AND car_license_plate IS NOT NULL)
      );
    `);

    // Handle the updated_at trigger
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      
      CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
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