const express = require('express');
const redisClient = require('./redisClient'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const cors = require('cors'); 
const dotenv = require('dotenv');
const { initializeDatabase } = require('./src/db/init');
const authRoutes = require('./src/routes/auth');
const paymentRoutes = require('./src/routes/payment'); 
const axios = require('axios');
const { seedDatabase } = require('./src/seed/seed'); // Import the seed function

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS to allow requests from your frontend (http://localhost:3001)
const allowedOrigins = ['http://localhost:3000','http://localhost:3001', 'http://localhost:3002'];

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
(async () => {
  try {
    console.log('🌱 Initializing database...');
    await initializeDatabase();
    console.log('✅ Database initialized.');

    console.log('🌱 Seeding database...');
    await seedDatabase();
    console.log('✅ Seeding completed.');
  } catch (error) {
    console.error('❌ Error during initialization or seeding:', error.message);
    process.exit(1);
  }
})();

// Routes
app.use('/auth', authRoutes);
app.use('/api/payments', paymentRoutes);


app.post('/store-rider-info', (req, res) => {
  const { rider_id, rider_name, pickup_location, dropoff_location, num_passengers, allow_rideshare, est_time, fare } = req.body;
  console.log('rider_id:', rider_id);
  console.log('pickup_location:', pickup_location);
  console.log('dropoff_location:', dropoff_location);
  console.log('num_passengers:', num_passengers);
  console.log('allow_rideshare:', allow_rideshare);
  // Storing rider location and pending drivers in Redis
  const start_time = Date.now();
  redisClient.hSet(`rider:${rider_id}`,
    "rider_id", rider_id,
    "rider_name", rider_name,
    "pickup_location", pickup_location, 
    "dropoff_location", dropoff_location,
    "num_passengers", String(num_passengers),
    "allow_rideshare", String(allow_rideshare), 
    "start_time", start_time, 
    "est_time", est_time,
    "fare", fare,
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

app.get('/get-rider-info', (req, res) => { 
  const rider_id = req.query.rider_id;

  // Retrieving all rider information from redis
  redisClient.hGetAll(`rider:${rider_id}`, (err, rider) => {
    if (err) return res.status(500).send('Error fetching rider info');
    res.send(rider);
  });
});


function formatCoordinates(location) {
  // Handle array input
  if (Array.isArray(location)) {
      return location.join(',');
  }
  
  // Handle stringified array
  if (location.startsWith('[') && location.endsWith(']')) {
      try {
          const coords = JSON.parse(location);
          return coords.join(',');
      } catch (e) {
          console.error('Error parsing coordinates:', e);
      }
  }
  
  // If it's already in "lng,lat" format, return as is
  if (typeof location === 'string' && location.match(/^-?\d+\.?\d*,-?\d+\.?\d*$/)) {
      return location;
  }
  
  // Otherwise, return the original location for geocoding
  return location;
}

async function getCoordinates(location) {
  // if (location.includes(',')) {
  //     // Already in coordinate format
  //     return location;
  // }

  try {
      const encodedLocation = encodeURIComponent(location);
      const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedLocation}.json?access_token=${process.env.MAPBOX_ACCESS_TOKEN}&limit=1`;
      
      console.log('Geocoding location:', location);
      console.log('Geocoding URL:', geocodeUrl);
      
      const response = await axios.get(geocodeUrl);
      
      if (response.data.features && response.data.features.length > 0) {
          const coordinates = response.data.features[0].center;
          const coords = `${coordinates[0]},${coordinates[1]}`;
          console.log(`Geocoded "${location}" to coordinates: ${coords}`);
          return coords;
      }
      
      throw new Error(`No coordinates found for location: ${location}`);
  } catch (error) {
      console.error('Geocoding error:', error.message);
      if (error.response) {
          console.error('Error response:', error.response.data);
      }
      throw error;
  }
}




// Fetch list of pending drivers
app.get('/driver-pending-rides', async (req, res) => {
  try {
      const driverLocation = req.query.driver_location;
      console.log('\n=== Processing Driver Request ===');
      console.log('Driver location:', driverLocation);

      // Get coordinates for driver location
      let driverCoords;
      if(driverLocation.includes(',')) { 
         driverCoords = formatCoordinates(driverLocation);
      } else 
      {
       driverCoords = await getCoordinates(driverLocation);
      }

      // Use promisify for Redis commands
      const getPendingRides = () => {
          return new Promise((resolve, reject) => {
              redisClient.sMembers('pendingDrive', (err, data) => {
                  if (err) reject(err);
                  else resolve(data);
              });
          });
      };

      const getRideData = (rideKey) => {
          return new Promise((resolve, reject) => {
              redisClient.hGetAll(rideKey, (err, data) => {
                  if (err) reject(err);
                  else resolve(data);
              });
          });
      };

      const pendingRideKeys = await getPendingRides();
      console.log('Found pending rides:', pendingRideKeys);
      
      if (!pendingRideKeys || pendingRideKeys.length === 0) {
          return res.json([]);
      }

      const processedRides = await Promise.all(pendingRideKeys.map(async (rideKey) => {
          const rideData = await getRideData(rideKey);
          console.log('Processing ride:', rideKey, rideData);

          if (!rideData || !rideData.pickup_location) {
              console.log('No pickup location found for ride, skipping');
              return null;
          }

          try {
                // Get coordinates for pickup location
                const pickupCoords = await getCoordinates(rideData.pickup_location);
                console.log(`Calculating route from ${driverCoords} to ${pickupCoords}`);

                // Call Mapbox Directions API for route
                const mapboxUrl = new URL('https://api.mapbox.com/directions/v5/mapbox/driving/' + 
                                        `${driverCoords};${pickupCoords}`);
                mapboxUrl.searchParams.append('access_token', process.env.MAPBOX_ACCESS_TOKEN);
                mapboxUrl.searchParams.append('overview', 'full');

                console.log('Calling Directions API:', mapboxUrl.toString());
                
                const response = await axios.get(mapboxUrl.toString());
                
                if (!response.data.routes || response.data.routes.length === 0) {
                    console.log('No route found');
                    return null;
                }

                const durationMinutes = response.data.routes[0].duration / 60;
                console.log(`Duration to ${rideKey}: ${durationMinutes.toFixed(2)} minutes`);

                // Only include rides within 30 minutes
                if (durationMinutes <= 30) {
                    return {
                        rideKey,
                        duration: Math.round(durationMinutes),
                        rideData,
                        distance: response.data.routes[0].distance, // in meters
                        coordinates: {
                            pickup: pickupCoords,
                            dropoff: await getCoordinates(rideData.dropoff_location)
                        }
                    };
                } else {
                    console.log(`Ride too far (${durationMinutes.toFixed(2)} minutes > 30 minutes)`);
                    return null;
                }
          } catch (error) {
              console.error('Error processing ride:', error.message);
              return null;
          }
      }));

      // Filter out null values and sort by duration
      const filteredRides = processedRides
          .filter(ride => ride !== null)
          .sort((a, b) => a.duration - b.duration);

      console.log('Filtered and sorted rides:', filteredRides);
      res.json(filteredRides);
      
  } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ 
          error: 'Failed to filter rides', 
          details: error.message,
          stack: error.stack 
      });
  }
});

// Modify the driver-pending-rides endpoint
// app.get('/driver-pending-rides-duration-limited', async (req, res) => {
//   try {
//       const driverLocation = req.query.driver_location;
//       console.log('\n=== Processing Driver Request ===');
//       console.log('Driver location:', driverLocation);
      
//       if (!driverLocation) {
//           console.log('No driver location provided - returning all rides');
//           const pendingRides = await redisClient.sMembers('pendingDrive');
//           return res.json(pendingRides);
//       }

//       // Get all pending rides
//       const pendingRides = await redisClient.sMembers('pendingDrive');
//       console.log('\nFound pending rides:', pendingRides);
      
//       const filteredRides = [];

//       // Process each ride
//       for (const rideKey of pendingRides) {
//           console.log(`\n--- Processing ${rideKey} ---`);
          
//           const rideData = await redisClient.hGetAll(rideKey);
//           console.log('Ride data:', rideData);
          
//           if (!rideData || !rideData.pickup_location) {
//               console.log('No pickup location found for ride, skipping');
//               continue;
//           }

//           try {
//               // Format coordinates for Mapbox
//               const coordinates = `${rideData.pickup_location}`;
//               console.log('Coordinates for Mapbox:', coordinates);

//               // Construct Mapbox Directions API URL
//               const mapboxUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${driverLocation};${coordinates}`;
//               const fullUrl = `${mapboxUrl}?access_token=${process.env.MAPBOX_ACCESS_TOKEN}`;
//               console.log('Calling Mapbox API:', mapboxUrl);

//               const response = await axios.get(fullUrl);
//               console.log('Mapbox API response:', response.data);

//               if (response.data.routes && response.data.routes.length > 0) {
//                   const duration = response.data.routes[0].duration / 60; // Convert to minutes
//                   console.log(`Calculated duration: ${duration} minutes`);

//                   // Only include rides within 30 minutes
//                   if (duration <= 30) {
//                       console.log('Ride is within 30 minutes - adding to filtered list');
//                       filteredRides.push(rideKey);
//                   } else {
//                       console.log('Ride is too far (> 30 minutes) - skipping');
//                   }
//               } else {
//                   console.log('No routes found in Mapbox response');
//               }
//           } catch (mapboxError) {
//               console.error('Mapbox API error:', mapboxError.message);
//               if (mapboxError.response) {
//                   console.error('Mapbox error response:', mapboxError.response.data);
//               }
//               continue;
//           }
//       }

//       console.log('\n=== Final Results ===');
//       console.log('Filtered rides:', filteredRides);
//       res.json(filteredRides);
      
//   } catch (error) {
//       console.error('Server error:', error);
//       res.status(500).json({ 
//           error: 'Failed to filter rides', 
//           details: error.message,
//           stack: error.stack 
//       });
//   }
// });

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
    console.log(err);
    if (err) return res.status(500).send('Error storing session', err);
    res.send('Session stored in cache');
  });
});

// Redis route to retrieve session data
app.get('/get-session', (req, res) => {
  const rider_id = req.query.rider_id;
  const driver_id = req.query.driver_id;
  // Retrieving session data from Redis
  redisClient.hGetAll(`session:rider:${rider_id}:driver:${driver_id}`, (err, session) => {
    if (err) return res.status(500).send('Error fetching session');
    res.send(session);
  });
});

app.post('/update-session-pickup', (req, res) => {
  const { rider_id, driver_id, confirm_pickup} = req.body;

// Storing session data in Redis
  redisClient.hSet(`session:rider:${rider_id}:driver:${driver_id}`,
    "driverID", driver_id,
    "riderID", rider_id,
    "confirm_pickup", confirm_pickup,
  (err, response) => {
    if (err) return res.status(500).send('Error storing session');
    res.send('Session stored in cache');
  });
});

app.post('/update-session-dropoff', async (req, res) => {
  const { driver_id, rider_id, confirm_dropoff, end_time } = req.body;
  
  console.log('Redis Update Request:', {
      driver_id,
      rider_id,
      confirm_dropoff,
      end_time,
      sessionKey: `session:rider:${rider_id}:driver:${driver_id}`
  });

  try {
      // Update Redis session
      await redisClient.hSet(
          `session:rider:${rider_id}:driver:${driver_id}`,
          "confirm_dropoff", confirm_dropoff,
          "end_time", end_time.toString()  // Convert to string if it's a number
      );

      console.log('Redis session updated successfully');
      res.json({ message: 'Session updated successfully' });
  } catch (error) {
      console.error('Redis update error:', error);
      res.status(500).json({ 
          error: 'Failed to update Redis session',
          details: error.message 
      });
  }
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

//Delete keys once session is over
app.post('/delete-ride-keys', async (req, res) => {
  const { keys } = req.body;

  try {
      if (!keys || !Array.isArray(keys)) {
          return res.status(400).send('Invalid request body');
      }

      const deletePromises = keys.map(key => redisClient.del(key)); // Use redisClient instead of client
      await Promise.all(deletePromises);

      res.status(200).send('Keys deleted successfully');
  } catch (error) {
      console.error('Error deleting keys:', error);
      res.status(500).send('Error deleting keys');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
