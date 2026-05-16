'use strict';

const { sequelize } = require('../config/postgres');
const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

// ─── Organization ───────────────────────────────────────────────────
const Organization = sequelize.define('Organization', {
  id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:     { type: DataTypes.STRING(100), allowNull: false },
  slug:     { type: DataTypes.STRING(120), allowNull: false, unique: true },
  plan:     { type: DataTypes.ENUM('free', 'pro', 'enterprise'), defaultValue: 'free' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'organizations', timestamps: true });

// ─── User ───────────────────────────────────────────────────────────
const User = sequelize.define('User', {
  id:                   { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  organizationId:       { type: DataTypes.UUID, allowNull: false },
  firstName:            { type: DataTypes.STRING(50), allowNull: false },
  lastName:             { type: DataTypes.STRING(50), allowNull: false },
  email:                { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password:             { type: DataTypes.STRING(255), allowNull: false },
  role:                 { type: DataTypes.ENUM('Admin', 'Project Manager', 'Team Member'), defaultValue: 'Team Member' },
  isActive:             { type: DataTypes.BOOLEAN, defaultValue: true },
  avatar:               { type: DataTypes.STRING(500), allowNull: true },
  resetToken:           { type: DataTypes.STRING(255), allowNull: true },
  resetTokenExpires:    { type: DataTypes.DATE, allowNull: true },
  lastLogin:            { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (u) => { u.password = await bcrypt.hash(u.password, 12); },
    beforeUpdate: async (u) => {
      if (u.changed('password')) u.password = await bcrypt.hash(u.password, 12);
    }
  }
});

User.prototype.checkPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};
User.prototype.toJSON = function () {
  const v = { ...this.get() };
  delete v.password;
  delete v.resetToken;
  delete v.resetTokenExpires;
  return v;
};

// ─── Project ────────────────────────────────────────────────────────
const Project = sequelize.define('Project', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  organizationId: { type: DataTypes.UUID, allowNull: false },
  ownerId:        { type: DataTypes.UUID, allowNull: false },
  name:           { type: DataTypes.STRING(100), allowNull: false },
  description:    { type: DataTypes.TEXT, allowNull: true },
  status:         { type: DataTypes.ENUM('planning','active','on_hold','completed','cancelled'), defaultValue: 'planning' },
  priority:       { type: DataTypes.ENUM('low','medium','high','critical'), defaultValue: 'medium' },
  startDate:      { type: DataTypes.DATEONLY, allowNull: true },
  deadline:       { type: DataTypes.DATEONLY, allowNull: true },
  progress:       { type: DataTypes.INTEGER, defaultValue: 0 },
  isArchived:     { type: DataTypes.BOOLEAN, defaultValue: false },
  tags:           { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] }
}, { tableName: 'projects', timestamps: true });

// ─── ProjectMember ──────────────────────────────────────────────────
const ProjectMember = sequelize.define('ProjectMember', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  projectId: { type: DataTypes.UUID, allowNull: false },
  userId:    { type: DataTypes.UUID, allowNull: false },
  role:      { type: DataTypes.ENUM('owner','manager','member','viewer'), defaultValue: 'member' }
}, { tableName: 'project_members', timestamps: true });

// ─── Task ───────────────────────────────────────────────────────────
const Task = sequelize.define('Task', {
  id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  projectId:        { type: DataTypes.UUID, allowNull: false },
  organizationId:   { type: DataTypes.UUID, allowNull: false },
  createdById:      { type: DataTypes.UUID, allowNull: false },
  assigneeId:       { type: DataTypes.UUID, allowNull: true },
  parentTaskId:     { type: DataTypes.UUID, allowNull: true },
  title:            { type: DataTypes.STRING(200), allowNull: false },
  description:      { type: DataTypes.TEXT, allowNull: true },
  status:           { type: DataTypes.ENUM('todo','in_progress','in_review','done','cancelled'), defaultValue: 'todo' },
  priority:         { type: DataTypes.ENUM('low','medium','high','critical'), defaultValue: 'medium' },
  deadline:         { type: DataTypes.DATE, allowNull: true },
  completedAt:      { type: DataTypes.DATE, allowNull: true },
  estimatedHours:   { type: DataTypes.FLOAT, allowNull: true },
  actualHours:      { type: DataTypes.FLOAT, allowNull: true },
  progress:         { type: DataTypes.INTEGER, defaultValue: 0 },
  tags:             { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  isRecurring:      { type: DataTypes.BOOLEAN, defaultValue: false },
  recurringPattern: { type: DataTypes.JSONB, allowNull: true },
  sortOrder:        { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'tasks', timestamps: true });

// ─── Notification ───────────────────────────────────────────────────
const Notification = sequelize.define('Notification', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:         { type: DataTypes.UUID, allowNull: false },
  organizationId: { type: DataTypes.UUID, allowNull: false },
  type:           {
    type: DataTypes.ENUM(
      'task_assigned','task_updated','task_completed',
      'task_deadline','project_update','mention','file_uploaded'
    ),
    allowNull: false
  },
  title:    { type: DataTypes.STRING(200), allowNull: false },
  message:  { type: DataTypes.TEXT, allowNull: false },
  isRead:   { type: DataTypes.BOOLEAN, defaultValue: false },
  metadata: { type: DataTypes.JSONB, defaultValue: {} }
}, { tableName: 'notifications', timestamps: true });

// ─── File ───────────────────────────────────────────────────────────
const File = sequelize.define('File', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  organizationId: { type: DataTypes.UUID, allowNull: false },
  projectId:      { type: DataTypes.UUID, allowNull: true },
  taskId:         { type: DataTypes.UUID, allowNull: true },
  uploadedById:   { type: DataTypes.UUID, allowNull: false },
  originalName:   { type: DataTypes.STRING(255), allowNull: false },
  s3Key:          { type: DataTypes.STRING(500), allowNull: false },
  s3Url:          { type: DataTypes.STRING(500), allowNull: false },
  mimeType:       { type: DataTypes.STRING(100), allowNull: false },
  size:           { type: DataTypes.BIGINT, allowNull: false },
  isDeleted:      { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'files', timestamps: true });

// ─── Associations ────────────────────────────────────────────────────
Organization.hasMany(User, { foreignKey: 'organizationId' });
User.belongsTo(Organization, { foreignKey: 'organizationId' });

Organization.hasMany(Project, { foreignKey: 'organizationId' });
Project.belongsTo(Organization, { foreignKey: 'organizationId' });

Project.hasMany(ProjectMember, { foreignKey: 'projectId', onDelete: 'CASCADE' });
ProjectMember.belongsTo(Project, { foreignKey: 'projectId' });

User.hasMany(ProjectMember, { foreignKey: 'userId' });
ProjectMember.belongsTo(User, { foreignKey: 'userId' });

Project.hasMany(Task, { foreignKey: 'projectId', onDelete: 'CASCADE' });
Task.belongsTo(Project, { foreignKey: 'projectId' });

User.hasMany(Task, { foreignKey: 'assigneeId', as: 'assignedTasks' });
Task.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });

User.hasMany(Task, { foreignKey: 'createdById', as: 'createdTasks' });
Task.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });

Task.hasMany(Task, { foreignKey: 'parentTaskId', as: 'subtasks' });
Task.belongsTo(Task, { foreignKey: 'parentTaskId', as: 'parent' });

User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

module.exports = { Organization, User, Project, ProjectMember, Task, Notification, File };
