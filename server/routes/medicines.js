const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/medicineController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/missed-report', ctrl.getMissedReport);
router.get('/low-stock', ctrl.getLowStock);
router.put('/:id', authorize('admin', 'staff'), ctrl.updateMedicine);
router.delete('/:id', authorize('admin', 'staff'), ctrl.deleteMedicine);
router.post('/:id/log', authorize('admin', 'staff'), ctrl.markMedicineStatus);

module.exports = router;
