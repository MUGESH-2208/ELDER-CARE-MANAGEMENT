const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('../controllers/medicalController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);

router.get('/', ctrl.getMedicalRecord);
router.put('/', authorize('admin', 'staff'), ctrl.upsertMedicalRecord);

router.get('/hospital-visits', ctrl.getHospitalVisits);
router.post('/hospital-visits', authorize('admin', 'staff'), ctrl.addHospitalVisit);

router.get('/documents', ctrl.getDocuments);
router.post('/documents', authorize('admin', 'staff'), ctrl.addDocument);

// File upload: returns file_path to be saved via POST /documents above
router.post('/documents/upload', authorize('admin', 'staff'), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  res.json({ file_name: req.file.originalname, file_path: `/uploads/${req.file.filename}` });
});

module.exports = router;
