'use strict';

const { Op } = require('sequelize');
const { User } = require('../models');

exports.list = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 50 } = req.query;
    const where = { organizationId: req.organizationId, isActive: true };
    if (role) where.role = role;
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName:  { [Op.iLike]: `%${search}%` } },
        { email:     { [Op.iLike]: `%${search}%` } }
      ];
    }
    const { count, rows } = await User.findAndCountAll({
      where,
      limit:      parseInt(limit, 10),
      offset:     (parseInt(page, 10) - 1) * parseInt(limit, 10),
      attributes: { exclude: ['password', 'resetToken', 'resetTokenExpires'] }
    });
    res.json({ success: true, data: { users: rows, total: count } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.params.id, organizationId: req.organizationId }
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const isSelf  = req.params.id === req.user.id;
    const isAdmin = req.user.role === 'Admin';
    if (!isSelf && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

    const allowed = isSelf
      ? ['firstName', 'lastName', 'avatar']
      : ['firstName', 'lastName', 'role', 'isActive', 'avatar'];

    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await user.update(updates);
    res.json({ success: true, data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deactivate = async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, organizationId: req.organizationId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await user.update({ isActive: false });
    res.json({ success: true, message: 'User deactivated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
