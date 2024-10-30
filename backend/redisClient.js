const redis = require('redis');

const client = redis.createClient({
  host: 'localhost',
  port: 6379,
  legacyMode: true,
});

client.on('connect', () => {
  console.log('Connected to Redis');
});

client.on('error', (err) => {
  console.error('Redis error: ', err);
});

async function init() {
  await client.connect();
}

init();
module.exports = client;