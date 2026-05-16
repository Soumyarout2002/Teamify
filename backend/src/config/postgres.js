'use strict';

const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  process.env.PG_DB || 'teamify_db',
  process.env.PG_USER || 'postgres',
  process.env.PG_PASSWORD || 'postgres123',
  {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT, 10) || 5432,
    dialect: 'postgres',
    logging: false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }
  }
);

const connectPostgres = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: false });
    logger.info('PostgreSQL connected and synced');
  } catch (err) {
    logger.error('PostgreSQL connection failed: ' + err.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectPostgres };
