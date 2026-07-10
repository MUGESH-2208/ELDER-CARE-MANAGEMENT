const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/summary', ctrl.getSummary);
router.get('/emergency-alerts', ctrl.getEmergencyAlerts);

module.exports = router;
