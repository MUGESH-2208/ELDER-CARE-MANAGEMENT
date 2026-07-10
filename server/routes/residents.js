const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/residentController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);

router.get('/', ctrl.getResidents);
router.get('/:id', ctrl.getResidentById);
router.post('/', authorize('admin', 'staff'), ctrl.createResident);
router.put('/:id', authorize('admin', 'staff'), ctrl.updateResident);
router.delete('/:id', authorize('admin'), ctrl.deleteResident);
router.post('/:id/photo', authorize('admin', 'staff'), upload.single('photo'), ctrl.uploadPhoto);

module.exports = router;