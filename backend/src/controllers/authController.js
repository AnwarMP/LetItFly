const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/init');

const register = async (req, res) => {
  const { 
    email, 
    password, 
    role,
    first_name,
    last_name,
    phone_number,
    home_address,
    car_model,
    car_license_plate
  } = req.body;

  try {
    // Validate role
    if (!['rider', 'driver'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    // Check if user already exists
    const userExists = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user with all fields
    const result = await pool.query(
      `INSERT INTO users (
        email, password, role, first_name, last_name, 
        phone_number, home_address, car_model, car_license_plate
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING id, email, role, first_name, last_name`,
      [
        email, hashedPassword, role, first_name, last_name,
        phone_number,
        role === 'rider' ? home_address : null,
        role === 'driver' ? car_model : null,
        role === 'driver' ? car_license_plate : null
      ]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const login = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    
    if (!role) {
      return res.status(400).json({ message: 'Role must be specified (rider or driver)' });
    }

    if (!['rider', 'driver'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    const result = await pool.query(
      'SELECT id, email, password, role, first_name, last_name FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.role !== role) {
      return res.status(401).json({ 
        message: `Invalid login. You selected ${role} but this account is registered as a ${user.role}`
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        id, email, role, first_name, last_name,
        phone_number, home_address, car_model, car_license_plate,
        created_at, updated_at
      FROM users 
      WHERE id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove sensitive information
    const user = result.rows[0];
    delete user.password;

    res.json({
      user,
      message: 'Profile retrieved successfully'
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;
    
    // Remove sensitive/immutable fields
    delete updates.id;
    delete updates.password;
    delete updates.role;
    delete updates.created_at;
    delete updates.updated_at;

    let query;
    let values;
    const role = req.user.role;

    if (role === 'rider') {
      query = `
        UPDATE users 
        SET first_name = $1, 
            last_name = $2,
            phone_number = $3,
            home_address = $4
        WHERE id = $5
        RETURNING id, email, role, first_name, last_name, phone_number, home_address`;
      values = [
        updates.first_name,
        updates.last_name,
        updates.phone_number,
        updates.home_address,
        userId
      ];
    } else if (role === 'driver') {
      query = `
        UPDATE users 
        SET first_name = $1, 
            last_name = $2,
            phone_number = $3,
            car_model = $4,
            car_license_plate = $5
        WHERE id = $6
        RETURNING id, email, role, first_name, last_name, phone_number, car_model, car_license_plate`;
      values = [
        updates.first_name,
        updates.last_name,
        updates.phone_number,
        updates.car_model,
        updates.car_license_plate,
        userId
      ];
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};