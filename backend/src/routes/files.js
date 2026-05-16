'use strict';
const router = require('express').Router();
const multer = require('multer');
const ctrl   = require('../controllers/files');
const { authenticate } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.use(authenticate);
router.post('/upload', upload.single('file'), ctrl.upload);
router.get ('/',          ctrl.list);
router.get ('/:id/download', ctrl.download);
router.delete('/:id',     ctrl.remove);

module.exports = router;
