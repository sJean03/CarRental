const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const authMiddleware = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/', vehicleController.getAllVehicles);
router.get('/categories', vehicleController.getCategories);
router.get('/category/:categoryId', vehicleController.getVehiclesByCategory);
router.get('/:id', vehicleController.getVehicleById);
router.get('/:id/availability', vehicleController.checkAvailability);

// Protected routes (admin/staff only)
// TODO: Add routes for creating/updating/deleting vehicles

module.exports = router;