'use strict';

const { Op, fn, col } = require('sequelize');
const { Project, ProjectMember, Task, User } = require('../models');
const { setCache, getCache, delCache, delCachePattern } = require('../config/redis');

exports.list = async (req, res) => {
  try {
    const { status, priority, search, page = 1, limit = 20 } = req.query;
    const cacheKey = `projects:${req.organizationId}:${JSON.stringify(req.query)}`;
    const hit = await getCache(cacheKey);
    if (hit) return res.json({ success: true, data: hit });

    const where = { organizationId: req.organizationId, isArchived: false };
    if (status)   where.status   = status;
    if (priority) where.priority = priority;
    if (search)   where.name     = { [Op.iLike]: `%${search}%` };

    const { count, rows } = await Project.findAndCountAll({
      where,
      limit:  parseInt(limit, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      order:  [['createdAt', 'DESC']]
    });
    const data = { projects: rows, total: count, page: +page, pages: Math.ceil(count / limit) };
    await setCache(cacheKey, data, 300);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const project = await Project.create({
      ...req.body,
      organizationId: req.organizationId,
      ownerId: req.user.id
    });
    await ProjectMember.create({ projectId: project.id, userId: req.user.id, role: 'owner' });
    await delCachePattern(`projects:${req.organizationId}:*`);
    res.status(201).json({ success: true, data: project });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const cacheKey = `project:${req.params.id}`;
    const hit = await getCache(cacheKey);
    if (hit) return res.json({ success: true, data: hit });

    const project = await Project.findOne({
      where: { id: req.params.id, organizationId: req.organizationId }
    });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const [members, taskStats] = await Promise.all([
      ProjectMember.findAll({
        where: { projectId: project.id },
        include: [{ model: User, attributes: ['id','firstName','lastName','email','role','avatar'] }]
      }),
      Task.findAll({
        where: { projectId: project.id },
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status']
      })
    ]);
    const data = { ...project.toJSON(), members, taskStats };
    await setCache(cacheKey, data, 300);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const project = await Project.findOne({
      where: { id: req.params.id, organizationId: req.organizationId }
    });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    await project.update(req.body);
    await delCache(`project:${req.params.id}`);
    await delCachePattern(`projects:${req.organizationId}:*`);
    res.json({ success: true, data: project });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const project = await Project.findOne({
      where: { id: req.params.id, organizationId: req.organizationId }
    });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    await project.destroy();
    await delCache(`project:${req.params.id}`);
    await delCachePattern(`projects:${req.organizationId}:*`);
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.addMember = async (req, res) => {
  try {
    const { userId, role = 'member' } = req.body;
    const existing = await ProjectMember.findOne({
      where: { projectId: req.params.id, userId }
    });
    if (existing) return res.status(409).json({ success: false, message: 'Already a member' });
    const m = await ProjectMember.create({ projectId: req.params.id, userId, role });
    await delCache(`project:${req.params.id}`);
    res.status(201).json({ success: true, data: m });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.removeMember = async (req, res) => {
  try {
    await ProjectMember.destroy({
      where: { projectId: req.params.id, userId: req.params.userId }
    });
    await delCache(`project:${req.params.id}`);
    res.json({ success: true, message: 'Member removed' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
