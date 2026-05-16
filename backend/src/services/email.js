'use strict';

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

const send = async (to, subject, html) => {
  if (!process.env.SMTP_USER) return; // skip if not configured
  try {
    await transport.sendMail({ from: process.env.EMAIL_FROM || 'noreply@teamify.com', to, subject, html });
  } catch (err) {
    logger.error('Email send error: ' + err.message);
  }
};

module.exports = {
  sendWelcome: (user) =>
    send(user.email, 'Welcome to Teamify!',
      `<h2>Hi ${user.firstName}!</h2><p>Your workspace is ready. Start collaborating!</p>`),

  sendPasswordReset: (user, token) =>
    send(user.email, 'Teamify — Reset your password',
      `<h2>Password Reset</h2><p>Click below (expires in 1 hour):</p>
       <a href="${process.env.APP_URL || 'http://localhost:3000'}/reset-password/${token}">Reset Password</a>`),

  sendTaskAssigned: (user, task, assignedBy) =>
    send(user.email, `New task: ${task.title}`,
      `<h2>Task Assigned</h2><p>${assignedBy.firstName} assigned you: <strong>${task.title}</strong></p>`),

  sendDeadlineReminder: (user, task) =>
    send(user.email, `Deadline tomorrow: ${task.title}`,
      `<h2>Deadline Reminder</h2><p><strong>${task.title}</strong> is due tomorrow.</p>`)
};
