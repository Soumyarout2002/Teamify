'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  organizationId: { type: String, required: true, index: true },
  userId:         { type: String, required: true },
  userEmail:      { type: String },
  action:         { type: String, required: true },
  resourceType:   { type: String },
  resourceId:     { type: String },
  changes:        { type: mongoose.Schema.Types.Mixed },
  ipAddress:      { type: String },
  userAgent:      { type: String }
}, { timestamps: true, collection: 'audit_logs' });

schema.index({ createdAt: -1 });
schema.index({ organizationId: 1, action: 1 });

module.exports = mongoose.model('AuditLog', schema);
