const express = require('express');
const redisClient = require('./redisClient'); // Import Redis client
const app = express();

// Middleware to parse JSON for later
app.use(express.json());

// route to store driver location in Redis
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

// route to retrieve driver location from Redis
app.get('/get-driver-location', (req, res) => {
  const driverID = req.query.driverID;

  // Retrieving driver location from Redis
  redisClient.smembers(`driver:${driverID}`, (err, location) => {
    if (err) return res.status(500).send('Error fetching location');
    res.send(location);
  });
});

// route to store session data
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

// route to retrieve session data
app.get('/get-session', (req, res) => {
  const riderID = req.query.riderID;
  const driverID = req.query.driverID;

  // Retrieving session data from Redis
  redisClient.hgetall(`session:${riderID}:${driverID}`, (err, session) => {
    if (err) return res.status(500).send('Error fetching session');
    res.send(session);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
