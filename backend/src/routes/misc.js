'use strict';
const r1 = require('express').Router();
const r2 = require('express').Router();
const r3 = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const reports  = require('../controllers/reports');
const activity = require('../controllers/activity');
const notifs   = require('../controllers/notifications');

// Reports
r1.use(authenticate);
r1.get('/organization',   reports.orgReport);
r1.get('/project/:id',    reports.projectReport);

// Activity
r2.use(authenticate);
r2.get('/', authorize('Admin'), activity.list);

// Notifications
r3.use(authenticate);
r3.get ('/',          notifs.list);
r3.put ('/read-all',  notifs.markAllRead);
r3.put ('/:id/read',  notifs.markRead);

module.exports = { reportsRouter: r1, activityRouter: r2, notificationsRouter: r3 };
