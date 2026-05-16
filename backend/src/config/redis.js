'use strict';

const connectRedis = async () => {
  console.log('Redis disabled in production');
};

const getCache = async () => null;

const setCache = async () => true;

module.exports = {
  connectRedis,
  getCache,
  setCache
};