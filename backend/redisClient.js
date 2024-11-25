// backend/redisClient.js
const redis = require('redis');

const redisHost = process.env.NODE_ENV === 'production' ? 'redis' : 'localhost';

const client = redis.createClient({
    socket: {
        host: 'redis', // Always use the service name in Docker
        port: 6379
    },
    legacyMode: true
});

client.on('connect', () => {
    console.log('Connected to Redis at', redisHost);
});

client.on('error', (err) => {
    console.error('Redis error: ', err);
});

client.connect();

module.exports = client;