const Car = require('../models/Car');
const VehicleOwner = require('../models/VehicleOwner');
const { sendCarApproval, sendCarRejection } = require('../utils/notificationService');

/**
 * Create new car listing
 */
const createCar = async (req, res, next) => {
  try {
    // Get or create vehicle owner profile
    let owner = await VehicleOwner.findByUserId(req.user.id);
    
    if (!owner) {
      // Create owner profile if doesn't exist
      owner = await VehicleOwner.create(req.user.id);
    }

    // Normalize home_branch_id: accept array (from multi-checkbox) or single value
    let normalizedBranchId = req.body.home_branch_id;
    if (Array.isArray(normalizedBranchId)) {
      normalizedBranchId = normalizedBranchId[0];
    }

    const carData = {
      make: req.body.make,
      model: req.body.model,
      year: req.body.year,
      color: req.body.color,
      license_plate: req.body.license_plate,
      vin: req.body.vin,
      category_id: req.body.category_id,
      transmission: req.body.transmission,
      fuel_type: req.body.fuel_type,
      seating_capacity: req.body.seating_capacity,
      daily_rate: req.body.daily_rate,
      description: req.body.description,
      features: req.body.features || [],
      rules: req.body.rules,
      image_urls: req.body.image_urls || [],
      home_branch_id: normalizedBranchId,
      storage_option: req.body.storage_option || 'owner_delivers'
    };

    const car = await Car.create(owner.id, carData);

    res.status(201).json({
      success: true,
      message: 'Car listing created successfully. Awaiting admin approval.',
      data: { car }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all cars with filters
 */
const getAllCars = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      category_id: req.query.category_id,
      transmission: req.query.transmission,
      fuel_type: req.query.fuel_type,
      min_seats: req.query.min_seats,
      min_price: req.query.min_price,
      max_price: req.query.max_price,
      branch_id: req.query.branch_id,
      search: req.query.search,
      sort_by: req.query.sort_by || 'created_at',
      sort_order: req.query.sort_order || 'DESC',
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0
    };

    const cars = await Car.findAll(filters);

    res.status(200).json({
      success: true,
      count: cars.length,
      data: { cars }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single car by ID
 */
const getCarById = async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { car }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get cars owned by current user
 */
const getMyCars = async (req, res, next) => {
  try {
    const owner = await VehicleOwner.findByUserId(req.user.id);
    
    if (!owner) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: { cars: [] }
      });
    }

    const filters = {
      owner_id: owner.id,
      status: req.query.status
    };

    const cars = await Car.findAll(filters);

    res.status(200).json({
      success: true,
      count: cars.length,
      data: { cars }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update car listing
 */
const updateCar = async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Check ownership
    const owner = await VehicleOwner.findByUserId(req.user.id);
    if (!owner || car.owner_id !== owner.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this car'
      });
    }

    const allowedUpdates = [
      'make', 'model', 'year', 'color', 'license_plate', 'vin',
      'transmission', 'fuel_type', 'seating_capacity', 'daily_rate',
      'description', 'features', 'rules', 'image_urls', 'storage_option'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // If car was previously rejected, reset status to pending approval
    if (car.status === 'pending_approval' && car.rejection_reason) {
      updates.status = 'pending_approval';
      updates.rejection_reason = null;
    }

    const updatedCar = await Car.update(req.params.id, updates);

    res.status(200).json({
      success: true,
      message: 'Car updated successfully',
      data: { car: updatedCar }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete car listing
 */
const deleteCar = async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Check ownership
    const owner = await VehicleOwner.findByUserId(req.user.id);
    if (!owner || car.owner_id !== owner.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this car'
      });
    }

    // Check if car has active bookings
    const db = require('../config/database');
    const activeBookings = await db.query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE car_id = $1 
       AND status IN ('confirmed', 'active', 'awaiting_return', 'ready_for_pickup')`,
      [req.params.id]
    );

    if (parseInt(activeBookings.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete car with active bookings'
      });
    }

    await Car.delete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Car deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check car availability for dates
 */
const checkAvailability = async (req, res, next) => {
  try {
    const { pickup_date, return_date } = req.query;

    if (!pickup_date || !return_date) {
      return res.status(400).json({
        success: false,
        message: 'Pickup date and return date are required'
      });
    }

    const isAvailable = await Car.checkAvailability(
      req.params.id,
      pickup_date,
      return_date
    );

    res.status(200).json({
      success: true,
      data: { 
        available: isAvailable,
        pickup_date,
        return_date
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get car blocked dates
 */
const getBlockedDates = async (req, res, next) => {
  try {
    const blockedDates = await Car.getBlockedDates(req.params.id);

    res.status(200).json({
      success: true,
      data: { blockedDates }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Block dates for car (owner only)
 */
const blockDates = async (req, res, next) => {
  try {
    const { blocked_from, blocked_until, reason } = req.body;

    if (!blocked_from || !blocked_until) {
      return res.status(400).json({
        success: false,
        message: 'Blocked from and blocked until dates are required'
      });
    }

    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Check ownership
    const owner = await VehicleOwner.findByUserId(req.user.id);
    if (!owner || car.owner_id !== owner.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to block dates for this car'
      });
    }

    const blocked = await Car.blockDates(
      req.params.id,
      blocked_from,
      blocked_until,
      reason
    );

    res.status(201).json({
      success: true,
      message: 'Dates blocked successfully',
      data: { blocked }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Approve car listing
 */
const approveCar = async (req, res, next) => {
  try {
    const { admin_notes } = req.body;

    const car = await Car.approve(req.params.id, admin_notes);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Get owner details to send notification
    const owner = await VehicleOwner.findById(car.owner_id);
    const carDetails = `${car.year} ${car.make} ${car.model}`;
    
    await sendCarApproval(owner.user_id, owner.email, carDetails);

    res.status(200).json({
      success: true,
      message: 'Car approved successfully',
      data: { car }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Reject car listing
 */
const rejectCar = async (req, res, next) => {
  try {
    const { rejection_reason, admin_notes } = req.body;

    if (!rejection_reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const car = await Car.reject(req.params.id, rejection_reason, admin_notes);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Get owner details to send notification
    const owner = await VehicleOwner.findById(car.owner_id);
    const carDetails = `${car.year} ${car.make} ${car.model}`;
    
    await sendCarRejection(owner.user_id, owner.email, carDetails, rejection_reason);

    res.status(200).json({
      success: true,
      message: 'Car rejected',
      data: { car }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Owner: Resubmit rejected car for approval
 */
const resubmitCar = async (req, res, next) => {
  try {
    const car = await Car.resubmit(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found or not in rejected status'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Car resubmitted for approval',
      data: { car }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCar,
  getAllCars,
  getCarById,
  getMyCars,
  updateCar,
  deleteCar,
  checkAvailability,
  getBlockedDates,
  blockDates,
  approveCar,
  rejectCar,
  resubmitCar
};