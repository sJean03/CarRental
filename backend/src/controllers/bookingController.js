const bookingModel = require('../models/bookingModel');
const vehicleModel = require('../models/vehicleModel');
const insuranceModel = require('../models/insuranceModel');
const locationModel = require('../models/locationModel');

const bookingController = {
  // Calculate rental cost (before creating booking)
  async calculateCost(req, res) {
    try {
      const { vehicle_id, pickup_date, dropoff_date, insurance_plan_id } = req.body;

      // Validate dates
      const pickup = new Date(pickup_date);
      const dropoff = new Date(dropoff_date);
      
      if (pickup >= dropoff) {
        return res.status(400).json({ error: 'Dropoff date must be after pickup date' });
      }

      const numDays = Math.ceil((dropoff - pickup) / (1000 * 60 * 60 * 24));

      // Get vehicle details
      const vehicle = await vehicleModel.findById(vehicle_id);
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      // Get insurance details
      let insuranceRate = 0;
      if (insurance_plan_id) {
        const insurance = await insuranceModel.findById(insurance_plan_id);
        if (insurance) {
          insuranceRate = parseFloat(insurance.daily_rate);
        }
      }

      // Calculate costs
      const costDetails = bookingModel.calculateRentalCost(
        parseFloat(vehicle.daily_rate),
        insuranceRate,
        numDays
      );

      res.json({
        success: true,
        vehicle: {
          id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          daily_rate: vehicle.daily_rate
        },
        ...costDetails
      });
    } catch (error) {
      console.error('Calculate cost error:', error);
      res.status(500).json({ error: 'Failed to calculate cost', details: error.message });
    }
  },

  // Create new booking
  async createBooking(req, res) {
    try {
      const userId = req.user.id; // From JWT token
      const {
        vehicle_id,
        pickup_location_id,
        dropoff_location_id,
        pickup_date,
        dropoff_date,
        insurance_plan_id,
        booking_comments
      } = req.body;

      // Validate required fields
      if (!vehicle_id || !pickup_location_id || !dropoff_location_id || !pickup_date || !dropoff_date) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Validate dates
      const pickup = new Date(pickup_date);
      const dropoff = new Date(dropoff_date);
      
      if (pickup >= dropoff) {
        return res.status(400).json({ error: 'Dropoff date must be after pickup date' });
      }

      const numDays = Math.ceil((dropoff - pickup) / (1000 * 60 * 60 * 24));

      // Check vehicle availability
      const isAvailable = await vehicleModel.checkAvailability(vehicle_id, pickup_date, dropoff_date);
      if (!isAvailable) {
        return res.status(400).json({ error: 'Vehicle not available for selected dates' });
      }

      // Get vehicle details
      const vehicle = await vehicleModel.findById(vehicle_id);
      if (!vehicle || vehicle.status !== 'available') {
        return res.status(400).json({ error: 'Vehicle not available' });
      }

      // Get insurance details
      let insuranceRate = 0;
      if (insurance_plan_id) {
        const insurance = await insuranceModel.findById(insurance_plan_id);
        if (insurance) {
          insuranceRate = parseFloat(insurance.daily_rate);
        }
      }

      // Calculate costs
      const costDetails = bookingModel.calculateRentalCost(
        parseFloat(vehicle.daily_rate),
        insuranceRate,
        numDays
      );

      // Create booking
      const booking = await bookingModel.create({
        user_id: userId,
        vehicle_id,
        pickup_location_id,
        dropoff_location_id,
        pickup_date,
        dropoff_date,
        insurance_plan_id,
        base_amount: costDetails.base_amount,
        insurance_amount: costDetails.insurance_amount,
        total_amount: costDetails.total_amount,
        deposit_amount: costDetails.deposit_amount,
        booking_comments
      });

      // Get full booking details
      const bookingDetails = await bookingModel.findById(booking.id);

      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        booking: bookingDetails,
        payment_info: {
          deposit_due: costDetails.deposit_amount,
          balance_due: costDetails.balance_due,
          total_amount: costDetails.total_amount
        }
      });
    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({ error: 'Failed to create booking', details: error.message });
    }
  },

  // Get user's bookings
  async getMyBookings(req, res) {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      const bookings = await bookingModel.findByUserId(userId, { status });

      res.json({
        success: true,
        count: bookings.length,
        bookings
      });
    } catch (error) {
      console.error('Get my bookings error:', error);
      res.status(500).json({ error: 'Failed to fetch bookings', details: error.message });
    }
  },

  // Get booking by ID
  async getBookingById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const booking = await bookingModel.findById(id);

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Check authorization (user can only see their own bookings, unless admin/staff)
      if (userRole !== 'admin' && userRole !== 'staff' && booking.user_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({
        success: true,
        booking
      });
    } catch (error) {
      console.error('Get booking error:', error);
      res.status(500).json({ error: 'Failed to fetch booking', details: error.message });
    }
  },

  // Cancel booking
  async cancelBooking(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const booking = await bookingModel.cancel(id, userId);

      if (!booking) {
        return res.status(400).json({ error: 'Cannot cancel booking. It may not exist or cannot be cancelled.' });
      }

      res.json({
        success: true,
        message: 'Booking cancelled successfully',
        booking
      });
    } catch (error) {
      console.error('Cancel booking error:', error);
      res.status(500).json({ error: 'Failed to cancel booking', details: error.message });
    }
  },

  // Get all bookings (admin/staff only)
  async getAllBookings(req, res) {
    try {
      const { status, vehicle_id } = req.query;

      const bookings = await bookingModel.findAll({ status, vehicle_id });

      res.json({
        success: true,
        count: bookings.length,
        bookings
      });
    } catch (error) {
      console.error('Get all bookings error:', error);
      res.status(500).json({ error: 'Failed to fetch bookings', details: error.message });
    }
  },

  // Get insurance plans
  async getInsurancePlans(req, res) {
    try {
      const plans = await insuranceModel.findAll();

      res.json({
        success: true,
        count: plans.length,
        insurance_plans: plans
      });
    } catch (error) {
      console.error('Get insurance plans error:', error);
      res.status(500).json({ error: 'Failed to fetch insurance plans', details: error.message });
    }
  },

  // Get locations
  async getLocations(req, res) {
    try {
      const locations = await locationModel.findAll();

      res.json({
        success: true,
        count: locations.length,
        locations
      });
    } catch (error) {
      console.error('Get locations error:', error);
      res.status(500).json({ error: 'Failed to fetch locations', details: error.message });
    }
  }
};

module.exports = bookingController;