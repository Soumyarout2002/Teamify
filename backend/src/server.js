'use strict';

require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const session = require('express-session');
const rateLimit = require('express-rate-limit');

const { connectPostgres } = require('./config/postgres');
// const { connectMongo } = require('./config/mongo');
// const { connectRedis } = require('./config/redis');

const setupSwagger = require('./config/swagger');
const sockets = require('./sockets');
const logger = require('./utils/logger');

const authRouter = require('./routes/auth');
const projectsRouter = require('./routes/projects');
const tasksRouter = require('./routes/tasks');
const usersRouter = require('./routes/users');
const filesRouter = require('./routes/files');

const {
  reportsRouter,
  activityRouter,
  notificationsRouter
} = require('./routes/misc');

const app = express();
const server = http.createServer(app);

const PORT = parseInt(process.env.PORT, 10) || 5000;

// Middleware
app.use(helmet());

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://teamify-fxulzurwl-soumyarout2002s-projects.vercel.app'
  ],
  credentials: true
}));

app.options('*', cors());
app.use(compression());

app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
  })
);

app.use(
  '/api/',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true
  })
);

// Swagger
setupSwagger(app);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/users', usersRouter);
app.use('/api/files', filesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/activity', activityRouter);
app.use('/api/notifications', notificationsRouter);

// Health
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 404
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, _req, res, _next) => {

  logger.error(err.stack || err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
const startServer = async () => {

  try {

    await connectPostgres();
    console.log('PostgreSQL connected');

    // await connectMongo();
    // console.log('MongoDB connected');

    // await connectRedis();
    // console.log('Redis connected');

    sockets.init(server);

    server.listen(PORT, () => {
      logger.info(`Teamify API running on port ${PORT}`);
    });

  } catch (err) {

    console.error('Startup error:', err);

    process.exit(1);
  }
};

startServer();

module.exports = app;