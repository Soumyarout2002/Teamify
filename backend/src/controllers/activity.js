'use strict';

let AuditLog;
try { AuditLog = require('../models/auditLog'); } catch (_) {}

exports.list = async (req, res) => {
  try {
    if (!AuditLog) return res.json({ success: true, data: { logs: [], total: 0 } });
    const { action, resourceType, userId, page = 1, limit = 50, startDate, endDate } = req.query;
    const filter = { organizationId: req.organizationId };
    if (action)       filter.action       = action;
    if (resourceType) filter.resourceType = resourceType;
    if (userId)       filter.userId       = userId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate)   filter.createdAt.$lte = new Date(endDate);
    }
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)).lean(),
      AuditLog.countDocuments(filter)
    ]);
    res.json({ success: true, data: { logs, total, page: +page, pages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
