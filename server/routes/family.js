const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/familyController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/my-residents', authorize('family'), ctrl.getMyResidents);
router.post('/link', authorize('admin'), ctrl.linkFamilyMember);
router.get('/residents/:residentId/progress', ctrl.getResidentProgress);
router.get('/residents/:residentId/linked-users', authorize('admin', 'staff'), ctrl.getLinkedUsers);

router.post('/visits', authorize('family'), ctrl.scheduleVisit);
router.get('/residents/:residentId/visits', ctrl.getVisits);

router.post('/messages', ctrl.sendMessage);
router.get('/residents/:residentId/messages', ctrl.getMessages);

router.get('/notifications', ctrl.getNotifications);
router.put('/notifications/:id/read', ctrl.markNotificationRead);

// NOTE: Video calling requires a third-party WebRTC provider (e.g. Twilio Video, Agora, Daily.co).
// Wire up your provider's SDK on the frontend and use this route to generate/broker session tokens.
router.post('/video-session', authorize('family', 'admin', 'staff'), (req, res) => {
  res.status(501).json({
    message: 'Video calling requires a third-party provider (Twilio/Agora/Daily.co). Configure API keys and implement token generation here.',
  });
});

module.exports = router;