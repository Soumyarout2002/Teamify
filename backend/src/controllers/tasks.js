'use strict';

const { Op } = require('sequelize');
const { Task, User, Notification } = require('../models');
const { emitToProject, emitToUser } = require('../sockets');
const { delCachePattern } = require('../config/redis');
const emailSvc = require('../services/email');

const createNotification = async ({ userId, organizationId, type, title, message, metadata = {} }) => {
  try {
    const n = await Notification.create({ userId, organizationId, type, title, message, metadata });
    emitToUser(userId, 'notification:new', n);
  } catch (_) {}
};

exports.list = async (req, res) => {
  try {
    const { projectId, assigneeId, status, priority, search, page = 1, limit = 100 } = req.query;
    const where = { organizationId: req.organizationId };
    if (projectId)  where.projectId  = projectId;
    if (assigneeId) where.assigneeId = assigneeId;
    if (status)     where.status     = status;
    if (priority)   where.priority   = priority;
    if (search)     where.title      = { [Op.iLike]: `%${search}%` };

    const { count, rows } = await Task.findAndCountAll({
      where,
      limit:   parseInt(limit, 10),
      offset:  (parseInt(page, 10) - 1) * parseInt(limit, 10),
      order:   [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
      include: [{
        model: User, as: 'assignee',
        attributes: ['id', 'firstName', 'lastName', 'avatar'],
        required: false
      }]
    });
    res.json({ success: true, data: { tasks: rows, total: count, page: +page } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const task = await Task.create({
      ...req.body,
      organizationId: req.organizationId,
      createdById: req.user.id
    });
    if (task.assigneeId && task.assigneeId !== req.user.id) {
      await createNotification({
        userId: task.assigneeId,
        organizationId: req.organizationId,
        type: 'task_assigned',
        title: 'New task assigned',
        message: `You were assigned: "${task.title}"`,
        metadata: { taskId: task.id }
      });
      const assignee = await User.findByPk(task.assigneeId);
      if (assignee) emailSvc.sendTaskAssigned(assignee, task, req.user);
    }
    emitToProject(task.projectId, 'task:created', task);
    await delCachePattern(`tasks:${req.organizationId}:*`);
    res.status(201).json({ success: true, data: task });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, organizationId: req.organizationId },
      include: [
        { model: User, as: 'assignee', attributes: ['id','firstName','lastName','email','avatar'], required: false },
        { model: User, as: 'creator',  attributes: ['id','firstName','lastName'], required: false },
        { model: Task, as: 'subtasks', required: false }
      ]
    });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, organizationId: req.organizationId } });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const oldStatus = task.status;
    const updates   = { ...req.body };
    if (updates.status === 'done' && oldStatus !== 'done') updates.completedAt = new Date();

    await task.update(updates);

    if (updates.status && updates.status !== oldStatus && task.assigneeId) {
      await createNotification({
        userId: task.assigneeId,
        organizationId: req.organizationId,
        type: 'task_updated',
        title: 'Task status changed',
        message: `"${task.title}" → ${updates.status.replace(/_/g, ' ')}`,
        metadata: { taskId: task.id }
      });
    }
    emitToProject(task.projectId, 'task:updated', task);
    await delCachePattern(`tasks:${req.organizationId}:*`);
    res.json({ success: true, data: task });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, organizationId: req.organizationId } });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    emitToProject(task.projectId, 'task:deleted', { id: task.id });
    await task.destroy();
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.bulkUpdate = async (req, res) => {
  try {
    const { taskIds, updates } = req.body;
    const [count] = await Task.update(updates, {
      where: { id: { [Op.in]: taskIds }, organizationId: req.organizationId }
    });
    await delCachePattern(`tasks:${req.organizationId}:*`);
    res.json({ success: true, message: `${count} tasks updated`, updatedCount: count });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
