const Booking = require('../models/Booking');
const Car = require('../models/Car');
const VehicleOwner = require('../models/VehicleOwner');
// Unused functions
const { calculateDaysBetween } = require('../utils/dateHelpers');
const { calculateRefundAmount } = require('../utils/calculations');
const { CANCELLATION_WINDOW_HOURS } = require('../config/constants');
const { sendBookingConfirmation } = require('../utils/notificationService');

/**
 * Create new booking
 */
const createBooking = async (req, res, next) => {
  try {
    const { car_id, pickup_date, return_date, branch_id, payment_plan, installment_months, customer_notes } = req.body;

    // Validate dates
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

    // Check car exists and is available
    const car = await Car.findById(car_id);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    if (car.status !== 'listed') {
      return res.status(400).json({
        success: false,
        message: 'Car is not available for booking'
      });
    }

    // Check availability
    const isAvailable = await Car.checkAvailability(car_id, pickup_date, return_date);
    if (!isAvailable) {
      return res.status(409).json({
        success: false,
        message: 'Car is not available for the selected dates'
      });
    }

    // Create booking
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

    const booking = await Booking.create(req.user.id, bookingData);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully. Please proceed with payment.',
      data: { booking }
    });
  } catch (error) {
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

    // Check authorization - customer, owner, or admin can view
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

    // Check authorization
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
    const filters = {
      status: req.query.status
    };

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

    const filters = {
      status: req.query.status
    };

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

    // Check if user is the customer
    if (booking.customer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this booking'
      });
    }

    // Check if booking can be cancelled
    const cancellableStatuses = ['pending_payment', 'payment_confirmed', 'confirmed', 'ready_for_pickup'];
    if (!cancellableStatuses.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel booking with status: ${booking.status}`
      });
    }

    // Calculate refund amount
    const pickupDateTime = new Date(booking.pickup_date);
    const now = new Date();
    const hoursUntilPickup = (pickupDateTime - now) / (1000 * 60 * 60);
    
    const refundAmount = booking.status === 'pending_payment' 
      ? 0 
      : calculateRefundAmount(booking.total_amount, hoursUntilPickup, CANCELLATION_WINDOW_HOURS);

    // Cancel booking
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

    // Check if user is the owner
    const owner = await VehicleOwner.findByUserId(req.user.id);
    if (!owner || booking.owner_id !== owner.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to confirm this booking'
      });
    }

    // Check booking status
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
 * Update booking status (for workflow progression)
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

    // Check authorization
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