'use strict';

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',

  logging: false,

  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },

  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const connectPostgres = async () => {

  try {

    await sequelize.authenticate();

    console.log('✅ PostgreSQL connected');

    await sequelize.sync({ alter: false });

    console.log('✅ PostgreSQL synced');

  } catch (err) {

    console.error('❌ PostgreSQL connection failed:', err);

    process.exit(1);
  }
};

module.exports = {
  sequelize,
  connectPostgres
};