'use strict';

const { File } = require('../models');
const s3 = require('../config/s3');

exports.upload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });
    const { key, url } = await s3.uploadFile(req.file, `org-${req.organizationId}`);
    const file = await File.create({
      organizationId: req.organizationId,
      projectId:      req.body.projectId || null,
      taskId:         req.body.taskId    || null,
      uploadedById:   req.user.id,
      originalName:   req.file.originalname,
      s3Key:          key,
      s3Url:          url,
      mimeType:       req.file.mimetype,
      size:           req.file.size
    });
    res.status(201).json({ success: true, data: file });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.list = async (req, res) => {
  try {
    const { projectId, taskId } = req.query;
    const where = { organizationId: req.organizationId, isDeleted: false };
    if (projectId) where.projectId = projectId;
    if (taskId)    where.taskId    = taskId;
    const files = await File.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: files });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.download = async (req, res) => {
  try {
    const file = await File.findOne({
      where: { id: req.params.id, organizationId: req.organizationId, isDeleted: false }
    });
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    const downloadUrl = await s3.getDownloadUrl(file.s3Key);
    res.json({ success: true, data: { downloadUrl, fileName: file.originalName, expiresIn: 3600 } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const file = await File.findOne({
      where: { id: req.params.id, organizationId: req.organizationId }
    });
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    try { await s3.deleteFile(file.s3Key); } catch (_) {}
    await file.update({ isDeleted: true });
    res.json({ success: true, message: 'File deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
