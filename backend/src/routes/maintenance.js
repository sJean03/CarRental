const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  getAllMaintenanceRecords,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  getUpcomingMaintenance,
  completeMaintenance
} = require('../controllers/maintenanceController');

// All routes require authentication and admin/staff role
router.use(protect);
router.use(restrictTo('admin', 'staff'));

router.get('/', getAllMaintenanceRecords);
router.get('/upcoming', getUpcomingMaintenance);
router.post('/', createMaintenanceRecord);
router.put('/:id', updateMaintenanceRecord);
router.patch('/:id/complete', completeMaintenance);

module.exports = router;