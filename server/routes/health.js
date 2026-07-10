const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('../controllers/healthController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', ctrl.getHealthRecords);
router.post('/', authorize('admin', 'staff'), ctrl.addHealthRecord);
router.get('/monthly-report', ctrl.getMonthlyReport);

module.exports = router;
