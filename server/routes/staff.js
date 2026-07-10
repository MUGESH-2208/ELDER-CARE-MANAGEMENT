const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/staffController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', ctrl.getAllStaff);
router.post('/', authorize('admin'), ctrl.createStaff);
router.put('/:id', authorize('admin'), ctrl.updateStaff);
router.delete('/:id', authorize('admin'), ctrl.deleteStaff);

// Attendance
router.post('/:id/attendance', authorize('admin', 'staff'), ctrl.markAttendance);
router.get('/:id/attendance', ctrl.getAttendance);

// Shifts
router.post('/:id/shifts', authorize('admin'), ctrl.assignShift);
router.get('/:id/shifts', ctrl.getShifts);

// Leaves
router.post('/:id/leaves', ctrl.requestLeave);
router.put('/:id/leaves/:leaveId', authorize('admin'), ctrl.updateLeaveStatus);

// Tasks
router.post('/:id/tasks', authorize('admin', 'staff'), ctrl.assignTask);
router.get('/:id/tasks', ctrl.getTasks);
router.put('/:id/tasks/:taskId', authorize('admin', 'staff'), ctrl.updateTaskStatus);

// Care notes
router.post('/:id/care-notes', authorize('admin', 'staff'), ctrl.addCareNote);

// Activity logs & performance
router.get('/:id/activity-logs', ctrl.getActivityLogs);
router.get('/:id/performance', ctrl.getPerformance);

module.exports = router;
