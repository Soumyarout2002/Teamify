'use strict';

const { Notification } = require('../models');

exports.list = async (req, res) => {
  try {
    const { isRead, page = 1, limit = 30 } = req.query;
    const where = { userId: req.user.id, organizationId: req.organizationId };
    if (isRead !== undefined) where.isRead = isRead === 'true';

    const { count, rows } = await Notification.findAndCountAll({
      where,
      limit:  parseInt(limit, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      order:  [['createdAt', 'DESC']]
    });
    const unreadCount = await Notification.count({ where: { userId: req.user.id, isRead: false } });
    res.json({ success: true, data: { notifications: rows, total: count, unreadCount } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.markRead = async (req, res) => {
  try {
    await Notification.update({ isRead: true }, { where: { id: req.params.id, userId: req.user.id } });
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.user.id, organizationId: req.organizationId } }
    );
    res.json({ success: true, message: 'All marked as read' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
