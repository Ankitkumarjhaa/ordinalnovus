import Redis, { Callback, RedisKey } from "ioredis";

// Instantiate the Redis client
const redis = new Redis({
  // Redis connection options go here
  host: process.env.REDIS_URL,
  port: 6379,
});

export async function setCache(key: RedisKey, value: any, expiryInSeconds: string | number) {
  try {
    // Store the value in Redis, set to expire after the given time (in seconds)
    await redis.set(key, JSON.stringify(value), "EX", expiryInSeconds);
  } catch (error) {
    console.error(`Error setting cache for key ${key}: ${error}`);
  }
}

export async function getCache(key: RedisKey) {
  try {
    // Fetch the value from Redis
    const value = await redis.get(key);

    if (value) {
      // If the value exists, parse it from JSON and return it
      return JSON.parse(value);
    } else {
      // If the value doesn't exist, return null
      return null;
    }
  } catch (error) {
    console.error(`Error getting cache for key ${key}: ${error}`);
    return null;
  }
}

export async function invalidateCache(key: RedisKey) {
  try {
    // Remove the value from Redis
    await redis.del(key);
  } catch (error) {
    console.error(`Error invalidating cache for key ${key}: ${error}`);
  }
}
