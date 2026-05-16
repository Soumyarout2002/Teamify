'use strict';

const { createClient } = require('redis');
const logger = require('../utils/logger');

let client = null;

const connectRedis = async () => {
  try {
    client = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        connectTimeout: 5000
      },
      password: process.env.REDIS_PASSWORD || undefined
    });
    client.on('error', (err) => logger.error('Redis error: ' + err.message));
    await client.connect();
    logger.info('Redis connected');
  } catch (err) {
    logger.warn('Redis unavailable — caching disabled: ' + err.message);
    client = null;
  }
};

const setCache = async (key, value, ttlSeconds = 3600) => {
  if (!client) return;
  try { await client.setEx(key, ttlSeconds, JSON.stringify(value)); } catch (_) {}
};

const getCache = async (key) => {
  if (!client) return null;
  try {
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
};

const delCache = async (key) => {
  if (!client) return;
  try { await client.del(key); } catch (_) {}
};

const delCachePattern = async (pattern) => {
  if (!client) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length) await client.del(keys);
  } catch (_) {}
};

module.exports = { connectRedis, setCache, getCache, delCache, delCachePattern };
