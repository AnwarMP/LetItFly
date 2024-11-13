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
const allowedOrigins = ['http://localhost:3001', 'http://localhost:3002'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin, like mobile apps or curl requests
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// Middleware to parse JSON data
app.use(express.json());


// Call the function to initialize the database on server startup
// Initialize database
initializeDatabase().catch(console.error);

// Routes
app.use('/auth', authRoutes);


app.post('/store-rider-location', (req, res) => {
  const { rider_id, pickup_location, dropoff_location } = req.body;
  // Storing rider location and pending drivers in Redis
  const start_time = Date.now();
  redisClient.hSet(`rider:${rider_id}`,
    "rider_id", rider_id,
    "pickup_location", pickup_location, 
    "dropoff_location", dropoff_location, 
    "start_time", start_time, 
  (err, response) => {
    if (err) return res.status(500).send('Error creating rider');
    else res.send('Rider location stored in cache');
  });
  // pendingDrive is effectively our driver:<Did>:matches -> [rider:<Rid>, rider:<Rid>, rider:<Rid>,...]
  // for just one driver for now for our demo
  redisClient.sAdd(`pendingDrive`, `rider:${rider_id}`, (err, response) => {
    if (err) return res.status(500).send('Error storing rider in waiting list');
  }) 
  
});

// Redis route to retrieve rider location
app.get('/get-rider-location', (req, res) => {
  const rider_id = req.query.rider_id;
  
  // Retrieving rider location from Redis, set to hGetAll for now but can choose a location
  redisClient.hGetAll(`rider:${rider_id}`, (err, location) => {
    if (err) return res.status(500).send('Error fetching location');
    res.send(location);
  });
});



// Fetch list of pending drivers
app.get('/driver-pending-rides', (req, res) => {
  redisClient.sMembers(`pendingDrive`, (err, location) => {
    if (err) return res.status(500).send('Error fetching pending riders');
    res.send(location);
  });
})

app.get('/delete-waiting-ride', (req, res) => {
  const rider_id = req.query.rider_id;
  redisClient.sRem(`pendingDrive`, `rider:${rider_id}`, (err, response) => {
    if (err) return res.status(500).send('Error deleting rider-driver pair');
    res.send('Delete pending rider success');
  })
})

// Redis route to store driver location
app.post('/store-driver-location', (req, res) => {
  const { driver_id, current_location, name, car, license_plate } = req.body;

  // Storing driver location in Redis
  redisClient.hSet(`driver:${driver_id}`,
    "driver_id", driver_id, 
    "current_location", current_location, 
    "name", name,
    "car", car, 
    "license_plate", license_plate,
  (err, response) => {
    if (err) return res.status(500).send('Error storing location');
    res.send('Driver location stored in cache');
  });
});

// Redis route to retrieve driver location
app.get('/get-driver-location', (req, res) => {
  const driver_id = req.query.driver_id;

  // Retrieving driver location from Redis
  redisClient.hGet(`driver:${driver_id}`, "current_location", (err, location) => {
    if (err) return res.status(500).send('Error fetching location');
    res.send(location);
  });
});

// Redis route to store session data
app.post('/store-session', (req, res) => {
  const { rider_id, driver_id, pickup_location, dropoff_location, 
      confirm_pickup, confirm_dropoff, start_time, end_time, fare } = req.body;

  // Storing session data in Redis
  redisClient.hSet(`session:rider:${rider_id}:driver:${driver_id}`,
    "driverID", driver_id,
    "riderID", rider_id,
    "pickup_location", pickup_location,
    "dropoff_location", dropoff_location,
    "confirm_pickup", confirm_pickup,
    "confirm_dropoff", confirm_dropoff,
    "start_time", start_time,
    "session_start_time", Date.now(),
    "end_time", end_time,
    "fare", fare,
  (err, response) => {
    if (err) return res.status(500).send('Error storing session');
    res.send('Session stored in cache');
  });
});

// Redis route to retrieve session data
app.get('/get-session', (req, res) => {
  const rider_id = req.query.rider_id;
  const driver_id = req.query.driver_id;
  // Retrieving session data from Redis
  redisClient.hGetAll(`session:${rider_id}:${driver_id}`, (err, session) => {
    if (err) return res.status(500).send('Error fetching session');
    res.send(session);
  });
});


app.get('/wake-rider', (req, res) => {
  const rider_id = req.query.rider_id;
  const driver_id = req.query.driver_id;
  redisClient.hSet(`ridePair:${rider_id}`, "driver_id", driver_id, (err, response) => {
    if (err) return res.status(500).send('Error storing rider-driver pair');
    res.send('Wake good');
  });

});

app.get('/await-driver', (req, res) => {
  const rider_id = req.query.rider_id;
    redisClient.hGetAll(`ridePair:${rider_id}`, (err, pair) => {
      if (err) return res.status(500).send('Error fetching rider-driver pair');
      res.send(pair);
    });

    // redisClient.del(`ridePair:${rider_id}` (err, response) => {
    //   if (err) return res.status(500).send("Error deleting pair");
    // })
})

app.get('/delete-ride-pair', (req, res) => {
  const rider_id = req.query.rider_id;
  redisClient.del(`ridePair:${rider_id}`, (err, response) => {
    if (err) return res.status(500).send('Error deleting rider-driver pair');
    res.send('Delete ride pair success');
  })
})

//Temporary to get Driver, demo purposes
app.get('/get-driver', async (req, res) => {
  const driverID = req.query.driverID || '1'; // Default to driver:1 if no ID is provided

  try {

    redisClient.hGetAll(`driver:${driverID}`, (err, location) => {
      if (err) return res.status(500).send('Error fetching location');
      res.send(location);
    });


  //   const driverData = await redisClient.hGetAll(`driver:${driverID}`);
  //   console.log(driverData);
  //   if (!driverData) {
  //     console.warn(`Driver data not found for driverID: ${driverID}`);
  //     return res.status(404).json({ error: 'Driver not found' });
  //   }

  //   res.json(driverData);
  } catch (err) {
    console.error('Error fetching driver data from Redis:', err);
    res.status(500).json({ error: 'Failed to fetch driver data' });
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
