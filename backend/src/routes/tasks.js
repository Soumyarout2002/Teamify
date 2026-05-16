'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/tasks');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

router.use(authenticate);

router.get ('/',              ctrl.list);
router.post('/', validate(schemas.task), ctrl.create);
router.put ('/bulk-update',   validate(schemas.bulkUpdate), ctrl.bulkUpdate);
router.get ('/:id',           ctrl.getOne);
router.put ('/:id', validate(schemas.task), ctrl.update);
router.delete('/:id',         ctrl.remove);

module.exports = router;
