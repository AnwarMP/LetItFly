const redis = require('redis');

const client = redis.createClient({
  host: 'redis',
  port: 6379,
});

client.on('connect', () => {
  console.log('Connected to Redis');
});

client.on('error', (err) => {
  console.error('Redis error: ', err);
});

module.exports = client;