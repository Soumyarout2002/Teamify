'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/projects');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

router.use(authenticate);

router.get ('/',                    ctrl.list);
router.post('/', authorize('Admin','Project Manager'), validate(schemas.project), ctrl.create);
router.get ('/:id',                 ctrl.getOne);
router.put ('/:id', authorize('Admin','Project Manager'), validate(schemas.project), ctrl.update);
router.delete('/:id', authorize('Admin','Project Manager'), ctrl.remove);
router.post ('/:id/members', authorize('Admin','Project Manager'), ctrl.addMember);
router.delete('/:id/members/:userId', authorize('Admin','Project Manager'), ctrl.removeMember);

module.exports = router;
