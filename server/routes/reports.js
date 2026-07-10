const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin', 'staff'));

router.get('/residents', ctrl.residentReport);
router.get('/health-trends/:residentId', ctrl.healthTrends);
router.get('/medicine-usage', ctrl.medicineUsageReport);
router.get('/appointments', ctrl.appointmentReport);
router.get('/staff-performance', ctrl.staffPerformanceReport);
router.get('/financial', ctrl.financialReport);
router.get('/growth-stats', ctrl.residentGrowthStats);
router.get('/monthly-summary', ctrl.monthlySummary);

module.exports = router;
