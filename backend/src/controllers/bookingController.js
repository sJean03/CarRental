const Booking = require('../models/Booking');
const Car = require('../models/Car');
const VehicleOwner = require('../models/VehicleOwner');
const { calculateDaysBetween } = require('../utils/dateHelpers');
const { calculateRefundAmount } = require('../utils/calculations');
const { CANCELLATION_WINDOW_HOURS } = require('../config/constants');

/**
 * Create new booking
 */
const createBooking = async (req, res, next) => {
  try {
    const { car_id, pickup_date, return_date, branch_id, payment_plan, installment_months, customer_notes } = req.body;

    console.log('\n=== CREATE BOOKING START ===');
    console.log('User ID:', req.user.id);
    console.log('Car ID:', car_id);
    console.log('Pickup:', pickup_date, 'Return:', return_date);

    // ===== VALIDATION =====
    
    // 1. Validate dates
    const pickupDateObj = new Date(pickup_date);
    const returnDateObj = new Date(return_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (pickupDateObj < today) {
      return res.status(400).json({
        success: false,
        message: 'Pickup date cannot be in the past'
      });
    }

    if (returnDateObj <= pickupDateObj) {
      return res.status(400).json({
        success: false,
        message: 'Return date must be after pickup date'
      });
    }

    // 2. Check car exists
    console.log('Step 1: Fetching car...');
    const car = await Car.findById(car_id);
    
    if (!car) {
      console.error('ERROR: Car not found:', car_id);
      return res.status(404).json({
        success: false,
        message: 'Car not found in database'
      });
    }

    console.log('✓ Car found:', {
      id: car.id,
      make: car.make,
      model: car.model,
      owner_id: car.owner_id,
      status: car.status,
      daily_rate: car.daily_rate,
      home_branch_id: car.home_branch_id
    });

    // 3. Check car is listed
    if (car.status !== 'listed') {
      return res.status(400).json({
        success: false,
        message: `Car is not available for booking (status: ${car.status})`
      });
    }

    // 4. Check car availability
    console.log('Step 2: Checking availability...');
    const isAvailable = await Car.checkAvailability(car_id, pickup_date, return_date);
    if (!isAvailable) {
      return res.status(409).json({
        success: false,
        message: 'Car is not available for the selected dates'
      });
    }

    console.log('✓ Car is available');

    // 5. Check owner exists
    console.log('Step 3: Verifying owner...');
    console.log('Looking for owner with ID:', car.owner_id);
    
    const owner = await VehicleOwner.findById(car.owner_id);
    if (!owner) {
      console.error('ERROR: Owner not found:', car.owner_id);
      return res.status(400).json({
        success: false,
        message: `Owner not found (ID: ${car.owner_id}). Car may be misconfigured.`
      });
    }

    console.log('✓ Owner found:', {
      id: owner.id,
      user_id: owner.user_id,
      email: owner.email
    });

    // 6. Check location exists (if home_branch_id is set)
    if (car.home_branch_id) {
      console.log('Step 4: Verifying location...');
      const db = require('../config/database');
      const locationResult = await db.query(
        'SELECT id FROM locations WHERE id = $1',
        [car.home_branch_id]
      );

      if (locationResult.rows.length === 0) {
        console.error('ERROR: Location not found:', car.home_branch_id);
        return res.status(400).json({
          success: false,
          message: `Location not found (ID: ${car.home_branch_id})`
        });
      }

      console.log('✓ Location verified');
    }

    // ===== CREATE BOOKING =====
    
    console.log('Step 5: Creating booking...');

    const bookingData = {
      car_id,
      owner_id: car.owner_id,
      pickup_date,
      return_date,
      branch_id: branch_id || car.home_branch_id,
      daily_rate: car.daily_rate,
      payment_plan: payment_plan || 'downpayment',
      installment_months: payment_plan === 'installment' ? installment_months : null,
      customer_notes
    };

    console.log('Booking data:', bookingData);

    const booking = await Booking.create(req.user.id, bookingData);

    console.log('✓ Booking created successfully');
    console.log('=== CREATE BOOKING SUCCESS ===\n');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully. Please proceed with payment.',
      data: { booking }
    });

  } catch (error) {
    console.error('\n=== CREATE BOOKING ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('=================================\n');
    next(error);
  }
};

/**
 * Get booking by ID
 */
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const owner = await VehicleOwner.findByUserId(req.user.id);
    const isOwner = owner && booking.owner_id === owner.id;
    const isCustomer = booking.customer_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this booking'
      });
    }

    res.status(200).json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get booking by reference number
 */
const getBookingByReference = async (req, res, next) => {
  try {
    const booking = await Booking.findByReference(req.params.reference);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const owner = await VehicleOwner.findByUserId(req.user.id);
    const isOwner = owner && booking.owner_id === owner.id;
    const isCustomer = booking.customer_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this booking'
      });
    }

    res.status(200).json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's bookings
 */
const getMyBookings = async (req, res, next) => {
  try {
    const filters = { status: req.query.status };
    const bookings = await Booking.findByCustomer(req.user.id, filters);

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: { bookings }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get bookings for owner's cars
 */
const getOwnerBookings = async (req, res, next) => {
  try {
    const owner = await VehicleOwner.findByUserId(req.user.id);

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner profile not found'
      });
    }

    const filters = { status: req.query.status };
    const bookings = await Booking.findByOwner(owner.id, filters);

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: { bookings }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel booking
 */
const cancelBooking = async (req, res, next) => {
  try {
    const { cancellation_reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.customer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this booking'
      });
    }

    const cancellableStatuses = ['pending_payment', 'payment_confirmed', 'confirmed', 'ready_for_pickup'];
    if (!cancellableStatuses.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel booking with status: ${booking.status}`
      });
    }

    const pickupDateTime = new Date(booking.pickup_date);
    const now = new Date();
    const hoursUntilPickup = (pickupDateTime - now) / (1000 * 60 * 60);
    
    const refundAmount = booking.status === 'pending_payment' 
      ? 0 
      : calculateRefundAmount(booking.total_amount, hoursUntilPickup, CANCELLATION_WINDOW_HOURS);

    const cancelledBooking = await Booking.cancel(
      req.params.id,
      cancellation_reason || 'Customer cancellation',
      refundAmount
    );

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { 
        booking: cancelledBooking,
        refund_amount: refundAmount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Owner: Confirm booking
 */
const confirmBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const owner = await VehicleOwner.findByUserId(req.user.id);
    if (!owner || booking.owner_id !== owner.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to confirm this booking'
      });
    }

    if (booking.status !== 'pending_owner_confirmation') {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be confirmed in current status'
      });
    }

    const updatedBooking = await Booking.updateStatus(req.params.id, 'confirmed');

    res.status(200).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: { booking: updatedBooking }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update booking status
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const owner = await VehicleOwner.findByUserId(req.user.id);
    const isOwner = owner && booking.owner_id === owner.id;
    const isCustomer = booking.customer_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isCustomer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this booking'
      });
    }

    const updatedBooking = await Booking.updateStatus(req.params.id, status);

    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      data: { booking: updatedBooking }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get booking statistics
 */
const getBookingStats = async (req, res, next) => {
  try {
    const filters = {};

    if (req.user.role === 'owner') {
      const owner = await VehicleOwner.findByUserId(req.user.id);
      if (owner) {
        filters.owner_id = owner.id;
      }
    } else if (req.user.role === 'customer') {
      filters.customer_id = req.user.id;
    }

    const stats = await Booking.getStats(filters);

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getBookingById,
  getBookingByReference,
  getMyBookings,
  getOwnerBookings,
  cancelBooking,
  confirmBooking,
  updateBookingStatus,
  getBookingStats
};