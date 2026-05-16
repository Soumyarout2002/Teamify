'use strict';

const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const messages = error.details.map((d) => d.message);
    return res.status(400).json({ success: false, message: 'Validation failed', errors: messages });
  }
  next();
};

const schemas = {
  register: Joi.object({
    firstName:        Joi.string().min(2).max(50).required(),
    lastName:         Joi.string().min(2).max(50).required(),
    email:            Joi.string().email().required(),
    password:         Joi.string().min(8).required(),
    organizationName: Joi.string().min(2).max(100).required()
  }),

  login: Joi.object({
    email:    Joi.string().email().required(),
    password: Joi.string().required()
  }),

  project: Joi.object({
    name:        Joi.string().min(2).max(100).required(),
    description: Joi.string().max(2000).allow('', null),
    status:      Joi.string().valid('planning','active','on_hold','completed','cancelled'),
    priority:    Joi.string().valid('low','medium','high','critical'),
    startDate:   Joi.date().iso().allow(null),
    deadline:    Joi.date().iso().allow(null),
    tags:        Joi.array().items(Joi.string()).default([])
  }),

  task: Joi.object({
    title:            Joi.string().min(1).max(200).required(),
    description:      Joi.string().max(5000).allow('', null),
    projectId:        Joi.string().uuid().required(),
    status:           Joi.string().valid('todo','in_progress','in_review','done','cancelled').default('todo'),
    priority:         Joi.string().valid('low','medium','high','critical').default('medium'),
    assigneeId:       Joi.string().uuid().allow(null),
    deadline:         Joi.date().iso().allow(null),
    estimatedHours:   Joi.number().min(0).allow(null),
    tags:             Joi.array().items(Joi.string()).default([]),
    isRecurring:      Joi.boolean().default(false),
    recurringPattern: Joi.object({
      frequency: Joi.string().valid('daily','weekly','monthly').required(),
      interval:  Joi.number().integer().min(1).required(),
      endDate:   Joi.date().iso().allow(null)
    }).allow(null),
    parentTaskId: Joi.string().uuid().allow(null)
  }),

  bulkUpdate: Joi.object({
    taskIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
    updates: Joi.object({
      status:     Joi.string().valid('todo','in_progress','in_review','done','cancelled'),
      priority:   Joi.string().valid('low','medium','high','critical'),
      assigneeId: Joi.string().uuid().allow(null),
      deadline:   Joi.date().iso().allow(null)
    }).required()
  })
};

module.exports = { validate, schemas };
