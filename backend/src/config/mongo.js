'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectMongo = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/teamify_audit',
      { serverSelectionTimeoutMS: 5000 }
    );
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error('MongoDB connection failed: ' + err.message);
    // Non-fatal — audit logs optional
  }
};

module.exports = { connectMongo };
