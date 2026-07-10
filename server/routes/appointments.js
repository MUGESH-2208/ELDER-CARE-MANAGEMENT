const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', ctrl.getAppointments);
router.post('/', authorize('admin', 'staff'), ctrl.createAppointment);
router.put('/:id', authorize('admin', 'staff'), ctrl.updateAppointment);
router.delete('/:id', authorize('admin'), ctrl.deleteAppointment);

module.exports = router;
