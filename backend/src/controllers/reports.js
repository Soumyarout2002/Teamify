'use strict';

const { Op, fn, col } = require('sequelize');
const { Project, Task, User } = require('../models');
const { setCache, getCache } = require('../config/redis');

exports.projectReport = async (req, res) => {
  try {
    const cacheKey = `report:project:${req.params.id}:${req.query.period || 30}`;
    const hit = await getCache(cacheKey);
    if (hit) return res.json({ success: true, data: hit });

    const project = await Project.findOne({ where: { id: req.params.id, organizationId: req.organizationId } });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const since = new Date(Date.now() - (parseInt(req.query.period, 10) || 30) * 86_400_000);

    const [byStatus, byPriority, trend, team] = await Promise.all([
      Task.findAll({
        where: { projectId: project.id },
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status']
      }),
      Task.findAll({
        where: { projectId: project.id },
        attributes: ['priority', [fn('COUNT', col('id')), 'count']],
        group: ['priority']
      }),
      Task.findAll({
        where: { projectId: project.id, status: 'done', completedAt: { [Op.gte]: since } },
        attributes: [[fn('DATE', col('completedAt')), 'date'], [fn('COUNT', col('id')), 'count']],
        group: [fn('DATE', col('completedAt'))],
        order:  [[fn('DATE', col('completedAt')), 'ASC']]
      }),
      Task.findAll({
        where: { projectId: project.id, assigneeId: { [Op.ne]: null } },
        attributes: ['assigneeId', 'status', [fn('COUNT', col('id')), 'count']],
        group: ['assigneeId', 'status'],
        include: [{ model: User, as: 'assignee', attributes: ['id','firstName','lastName','avatar'] }]
      })
    ]);

    const total = byStatus.reduce((s, r) => s + parseInt(r.dataValues.count, 10), 0);
    const done  = byStatus.find((r) => r.status === 'done')?.dataValues?.count || 0;

    const data = {
      project,
      summary: {
        totalTasks:      total,
        completedTasks:  parseInt(done, 10),
        completionRate:  total ? Math.round((done / total) * 100) : 0,
        progress:        project.progress
      },
      byStatus, byPriority, trend, team,
      generatedAt: new Date()
    };
    await setCache(cacheKey, data, 600);
    res.json({ success: true, data });
  } catch (err) {
  console.error('REPORT ERROR =>', err);

  res.status(500).json({
    success: false,
    message: err.message
  });
}
};
exports.orgReport = async (req, res) => {
  try {

    const organizationId =
      req.user?.organizationId || req.organizationId;

    const cacheKey = `report:org:${organizationId}`;

    const hit = await getCache(cacheKey);

    if (hit) {
      return res.json({
        success: true,
        data: hit
      });
    }

    const totalProjects = await Project.count({
      where: { organizationId }
    });

    const totalTasks = await Task.count({
      where: { organizationId }
    });

    const totalUsers = await User.count({
      where: { organizationId }
    });

    const overdueTasks = await Task.count({
      where: {
        organizationId,
        status: {
          [Op.notIn]: ['done', 'cancelled']
        },
        deadline: {
          [Op.lt]: new Date()
        }
      }
    });

    const data = {
      totalProjects,
      totalTasks,
      totalUsers,
      overdueTasks,
      generatedAt: new Date()
    };

    await setCache(cacheKey, data, 600);

    res.json({
      success: true,
      data
    });

  } catch (err) {

    console.error('REPORT ERROR =>', err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};