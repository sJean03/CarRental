const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { protect, restrictTo } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/', vehicleController.getAllVehicles);
router.get('/categories', vehicleController.getCategories);
router.get('/category/:categoryId', vehicleController.getVehiclesByCategory);
router.get('/:id', vehicleController.getVehicleById);
router.get('/:id/availability', vehicleController.checkAvailability);
router.get('/:id/reviews', vehicleController.getVehicleReviews);

// Protected routes (admin/staff only)
router.use(protect);
router.use(restrictTo('admin', 'staff'));

router.post('/', vehicleController.createVehicle);
router.put('/:id', vehicleController.updateVehicle);
router.patch('/:id/status', vehicleController.updateVehicleStatus);
router.patch('/:id/location', vehicleController.updateVehicleLocation);
router.delete('/:id', vehicleController.deleteVehicle);

module.exports = router;