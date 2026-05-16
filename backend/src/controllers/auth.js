'use strict';

const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { User, Organization } = require('../models');
const email   = require('../services/email');
const { delCache } = require('../config/redis');

const sign = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, organizationId: user.organizationId },
    process.env.JWT_SECRET || 'dev_secret_change_me',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email: em, password, organizationName } = req.body;
    if (await User.findOne({ where: { email: em } })) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    const slug = organizationName.toLowerCase().replace(/\s+/g, '-') + '-' + uuidv4().slice(0, 6);
    const org  = await Organization.create({ name: organizationName, slug });
    const user = await User.create({ firstName, lastName, email: em, password, organizationId: org.id, role: 'Admin' });
    email.sendWelcome(user);
    res.status(201).json({ success: true, data: { user, token: sign(user) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email: em, password } = req.body;
    const user = await User.findOne({ where: { email: em } });
    if (!user || !(await user.checkPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }
    await user.update({ lastLogin: new Date() });
    res.json({ success: true, data: { user, token: sign(user) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = (req, res) => res.json({ success: true, data: req.user });

exports.logout = async (req, res) => {
  await delCache(`user:${req.user.id}`);
  res.json({ success: true, message: 'Logged out' });
};

exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ where: { email: req.body.email } });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      await user.update({ resetToken: token, resetTokenExpires: new Date(Date.now() + 3_600_000) });
      email.sendPasswordReset(user, token);
    }
    res.json({ success: true, message: 'If that email exists a reset link was sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const user = await User.findOne({ where: { resetToken: req.params.token } });
    if (!user || user.resetTokenExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }
    await user.update({ password: req.body.password, resetToken: null, resetTokenExpires: null });
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!(await user.checkPassword(req.body.currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    await user.update({ password: req.body.newPassword });
    res.json({ success: true, message: 'Password changed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
