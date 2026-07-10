const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('../controllers/medicineController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', ctrl.getMedicines);
router.post('/', authorize('admin', 'staff'), ctrl.addMedicine);
router.get('/logs', ctrl.getDailyLogs);

module.exports = router;
