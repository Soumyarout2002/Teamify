'use strict';

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io;

const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.APP_URL || 'http://localhost:3000', credentials: true }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { id: userId, organizationId } = socket.user;
    socket.join(`user:${userId}`);
    socket.join(`org:${organizationId}`);
    logger.info(`Socket connected: ${userId}`);

    socket.on('project:join', (pid) => socket.join(`project:${pid}`));
    socket.on('project:leave', (pid) => socket.leave(`project:${pid}`));
    socket.on('disconnect', () => logger.info(`Socket disconnected: ${userId}`));
  });
};

const emitToUser    = (uid, event, data) => io && io.to(`user:${uid}`).emit(event, data);
const emitToOrg     = (oid, event, data) => io && io.to(`org:${oid}`).emit(event, data);
const emitToProject = (pid, event, data) => io && io.to(`project:${pid}`).emit(event, data);

module.exports = { init, emitToUser, emitToOrg, emitToProject };
