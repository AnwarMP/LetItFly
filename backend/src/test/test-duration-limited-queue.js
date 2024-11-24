// test-duration-limited-queue.js
const redis = require('redis');
const axios = require('axios');

const testRiders = [
    {
        rider_id: "test_rider_1",
        rider_name: "John",
        pickup_location: "Santa Clara University", // Now can use any location
        dropoff_location: "San Francisco International Airport",
        num_passengers: "2",
        allow_rideshare: "false",
        est_time: "30",
        fare: "45"
    },
    {
        rider_id: "test_rider_2",
        rider_name: "Alice",
        pickup_location: "Stanford Shopping Center", // Different location
        dropoff_location: "Oakland International Airport",
        num_passengers: "4",
        allow_rideshare: "true",
        est_time: "49",
        fare: "49.64"
    }
];

const driverLocations = [
    {
        name: "Driver in Downtown San Jose",
        location: "San Jose City Hall"
    },
    {
        name: "Driver near Stanford",
        location: "Stanford University"
    },
    {
        name: "Driver in SF",
        location: "Fisherman's Wharf San Francisco"
    }
];

async function setupTestRiders() {
    const redisClient = redis.createClient({
        url: 'redis://localhost:6379'
    });

    try {
        await redisClient.connect();
        console.log('Connected to Redis');

        // Clear existing test data
        await redisClient.del('pendingDrive');
        console.log('Cleared existing test data');

        // Add test riders
        for (const rider of testRiders) {
            const key = `rider:${rider.rider_id}`;
            await redisClient.del(key);
            await redisClient.hSet(key, {...rider});
            await redisClient.sAdd('pendingDrive', key);
            console.log(`Added test rider: ${rider.rider_name}`);
        }

        console.log('\nAll test riders added successfully');
        
        // Test each driver location
        for (const driver of driverLocations) {
            console.log(`\n=== Testing ${driver.name} ===`);
            try {
                const response = await axios.get('http://localhost:3000/driver-pending-rides', {
                    params: {
                        driver_location: driver.location
                    }
                });

                if (response.data.length > 0) {
                    console.log('Available rides:');
                    response.data.forEach(ride => {
                        console.log(`- ${ride.rideData.rider_name}`);
                        console.log(`  From: ${ride.rideData.pickup_location}`);
                        console.log(`  To: ${ride.rideData.dropoff_location}`);
                        console.log(`  Duration: ${ride.duration} minutes`);
                        console.log(`  Distance: ${(ride.distance / 1000).toFixed(1)} km`);
                        console.log(`  Pickup coordinates: ${ride.coordinates.pickup}`);
                        console.log('---');
                    });
                } else {
                    console.log('No rides within 30 minutes of this location');
                }
            } catch (error) {
                console.error('Error testing location:', error.message);
                if (error.response) {
                    console.error('Error details:', error.response.data);
                }
            }
            
            // Add a small delay between tests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

    } catch (error) {
        console.error('Error in setup:', error);
    } finally {
        await redisClient.quit();
        console.log('\nTest completed and Redis connection closed');
    }
}

// Run the test
console.log('Starting test setup...');
setupTestRiders().catch(console.error);