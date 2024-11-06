const express = require('express');
const redisClient = require('./redisClient'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const cors = require('cors'); 
const dotenv = require('dotenv');
const { initializeDatabase } = require('./src/db/init');
const authRoutes = require('./src/routes/auth');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS to allow requests from your frontend (http://localhost:3001)
app.use(cors({
  origin: 'http://localhost:3001'  // Replace with your frontend URL
}));

// Middleware to parse JSON data
app.use(express.json());


// Call the function to initialize the database on server startup
// Initialize database
initializeDatabase().catch(console.error);

// Routes
app.use('/auth', authRoutes);

// Redis route to store driver location
app.get('/store-driver-location', (req, res) => {
  const driverID = req.query.driverID;
  const longitude = req.query.longitude;
  const latitude = req.query.latitude;

  // Storing driver location in Redis
  redisClient.sadd(`driver:${driverID}`, longitude, latitude, (err, response) => {
    if (err) return res.status(500).send('Error storing location');
    res.send('Driver location stored in cache');
  });
});

// Redis route to retrieve driver location
app.get('/get-driver-location', (req, res) => {
  const driverID = req.query.driverID;

  // Retrieving driver location from Redis
  redisClient.smembers(`driver:${driverID}`, (err, location) => {
    if (err) return res.status(500).send('Error fetching location');
    res.send(location);
  });
});

// Redis route to store session data
app.get('/store-session', (req, res) => {
  const riderID = req.query.riderID;
  const driverID = req.query.driverID;
  const fare = req.query.fare;

  // Storing session data in Redis
  redisClient.hmset(`session:${riderID}:${driverID}`, {
    fare: fare,
    start_time: Date.now(),
    status: 'in-progress'
  }, (err, response) => {
    if (err) return res.status(500).send('Error storing session');
    res.send('Session stored in cache');
  });
});

// Redis route to retrieve session data
app.get('/get-session', (req, res) => {
  const riderID = req.query.riderID;
  const driverID = req.query.driverID;

  // Retrieving session data from Redis
  redisClient.hgetall(`session:${riderID}:${driverID}`, (err, session) => {
    if (err) return res.status(500).send('Error fetching session');
    res.send(session);
  });
});

//Temporary to get Driver, demo purposes
app.get('/get-driver', async (req, res) => {
  const driverID = req.query.driverID || '1'; // Default to driver:1 if no ID is provided

  try {
    const driverData = await redisClient.hGetAll('driver:1');

    if (!driverData) {
      console.warn(`Driver data not found for driverID: ${driverID}`);
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(driverData);
  } catch (err) {
    console.error('Error fetching driver data from Redis:', err);
    res.status(500).json({ error: 'Failed to fetch driver data' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
