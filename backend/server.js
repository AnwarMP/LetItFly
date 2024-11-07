const express = require('express');
const redisClient = require('./redisClient'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const cors = require('cors'); 
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS to allow requests from your frontend (http://localhost:3001)
app.use(cors({
  origin: 'http://localhost:3001'  // Replace with your frontend URL
}));

// Middleware to parse JSON data
app.use(express.json());

// Set up PostgreSQL pool
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

// Function to check if the users table exists and create it if not
const initializeDatabase = async () => {
  try {
    const result = await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );
    `);
    console.log('Database initialized or already exists.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
};

// Call the function to initialize the database on server startup
initializeDatabase();

// Route to register a new user
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *',
      [email, hashedPassword]
    );
    res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Route to log in a user
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});


app.post('/store-rider-location', (req, res) => {
  const { riderID, longitude, latitude } = req.body;
  // Storing rider location and pending drivers in Redis
  redisClient.sAdd(`rider:${riderID}`, longitude, latitude, (err, response) => {
    if (err) return res.status(500).send('Error creating rider');
    else res.send('Rider location stored in cache');
  });
  // pendingDrive is effectively our driver:<Did>:matches -> [rider:<Rid>, rider:<Rid>, rider:<Rid>,...]
  // for just one driver for now for our demo
  redisClient.sAdd(`pendingDrive`, `rider:${riderID}`, (err, response) => {
    if (err) return res.status(500).send('Error storing rider in waiting list');
  }) 
  
});


// Fetch list of pending drivers
app.get('/driver/rides', (req, res) => {
  redisClient.sMembers(`pendingDrive`, (err, location) => {
    if (err) return res.status(500).send('Error fetching pending riders');
    res.send(location);
  });
})

// Redis route to retrieve rider location
app.post('/get-rider-location', (req, res) => {
  const { riderID } = req.body;

  // Retrieving rider location from Redis
  redisClient.sMembers(`rider:${riderID}`, (err, location) => {
    if (err) return res.status(500).send('Error fetching location');
    res.send(location);
  });
});

// Redis route to store driver location
app.get('/store-driver-location', (req, res) => {
  const driverID = req.query.driverID;
  const longitude = req.query.longitude;
  const latitude = req.query.latitude;

  // Storing driver location in Redis
  redisClient.sAdd(`driver:${driverID}`, longitude, latitude, (err, response) => {
    if (err) return res.status(500).send('Error storing location');
    res.send('Driver location stored in cache');
  });
});

// Redis route to retrieve driver location
app.get('/get-driver-location', (req, res) => {
  const driverID = req.query.driverID;

  // Retrieving driver location from Redis
  redisClient.sMembers(`driver:${driverID}`, (err, location) => {
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


app.get('/wake-rider', (req, res) => {
  const riderID = req.query.riderID;
  const driverID = req.query.driverID;
  redisClient.sAdd(`ridePair:${riderID}`, driverID, (err, response) => {
    if (err) return res.status(500).send('Error storing location');

    res.send('Wake good');
  });
});

app.get('/await-driver', (req, res) => {
  const riderID = req.query.riderID;
  getDrive(riderID).then((driverID) => {
    console.log(driverID);
    redisClient.sMembers(`driver:${driverID}`, (err, location) => {
      if (err) return res.status(500).send('Error fetching location');
      console.log(location);
      console.log(driverID);
      res.send(location);
    });
  }).catch((err1) => {console.log(err1)});
})


function getDrive(riderID) {
  return new Promise((resolve, rej) => {
      redisClient.sMembers(`ridePair:${riderID}`, (err, response) => {
        if (err) return null;
        return resolve(response);
      });
  });



}

//Temporary to get Driver, demo purposes
// app.get('/get-driver', async (req, res) => {
//   const driverID = req.query.driverID || '1'; // Default to driver:1 if no ID is provided

//   try {
//     const driverData = await redisClient.hGetAll('driver:1');

//     if (!driverData) {
//       console.warn(`Driver data not found for driverID: ${driverID}`);
//       return res.status(404).json({ error: 'Driver not found' });
//     }

//     res.json(driverData);
//   } catch (err) {
//     console.error('Error fetching driver data from Redis:', err);
//     res.status(500).json({ error: 'Failed to fetch driver data' });
//   }
// });

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
