const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { validateCarCreate, validateUUID } = require('../middleware/validation');
const { USER_ROLES } = require('../config/constants');

/**
 * @route   GET /api/cars
 * @desc    Get all cars with filters
 * @access  Public
 */
router.get('/', carController.getAllCars);

/**
 * @route   GET /api/cars/my-cars
 * @desc    Get current user's cars (owner)
 * @access  Private (Owner)
 */
router.get('/my-cars', authMiddleware, roleMiddleware(USER_ROLES.OWNER), carController.getMyCars);

/**
 * @route   GET /api/cars/:id
 * @desc    Get single car by ID
 * @access  Public
 */
router.get('/:id', validateUUID('id'), carController.getCarById);

/**
 * @route   GET /api/cars/:id/availability
 * @desc    Check car availability for dates
 * @access  Public
 */
router.get('/:id/availability', validateUUID('id'), carController.checkAvailability);

/**
 * @route   GET /api/cars/:id/blocked-dates
 * @desc    Get car's blocked dates
 * @access  Public
 */
router.get('/:id/blocked-dates', validateUUID('id'), carController.getBlockedDates);

/**
 * @route   POST /api/cars
 * @desc    Create new car listing
 * @access  Private (Owner)
 */
router.post('/', authMiddleware, roleMiddleware(USER_ROLES.OWNER), validateCarCreate, carController.createCar);

/**
 * @route   POST /api/cars/:id/block-dates
 * @desc    Block dates for car
 * @access  Private (Owner)
 */
router.post('/:id/block-dates', authMiddleware, roleMiddleware(USER_ROLES.OWNER), validateUUID('id'), carController.blockDates);

/**
 * @route   PUT /api/cars/:id
 * @desc    Update car listing
 * @access  Private (Owner)
 */
router.put('/:id', authMiddleware, roleMiddleware(USER_ROLES.OWNER), validateUUID('id'), carController.updateCar);

/**
 * @route   DELETE /api/cars/:id
 * @desc    Delete car listing
 * @access  Private (Owner)
 */
router.delete('/:id', authMiddleware, roleMiddleware(USER_ROLES.OWNER), validateUUID('id'), carController.deleteCar);

/**
 * @route   PUT /api/cars/:id/approve
 * @desc    Approve car listing
 * @access  Private (Admin)
 */
router.put('/:id/approve', authMiddleware, roleMiddleware(USER_ROLES.ADMIN), validateUUID('id'), carController.approveCar);

/**
 * @route   PUT /api/cars/:id/reject
 * @desc    Reject car listing
 * @access  Private (Admin)
 */
router.put('/:id/reject', authMiddleware, roleMiddleware(USER_ROLES.ADMIN), validateUUID('id'), carController.rejectCar);

module.exports = router;