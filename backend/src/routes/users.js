'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/users');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get ('/',     ctrl.list);
router.get ('/:id',  ctrl.getOne);
router.put ('/:id',  ctrl.update);
router.delete('/:id', authorize('Admin'), ctrl.deactivate);

module.exports = router;
