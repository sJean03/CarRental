const trackingModel = require('../models/trackingModel');
const vehicleModel = require('../models/vehicleModel');
const rentalModel = require('../models/rentalModel');

// @desc    Record vehicle location
// @route   POST /api/tracking
// @access  Public (GPS device with API key) or Private
const recordLocation = async (req, res) => {
  try {
    const {
      vehicleId,
      rentalId,
      latitude,
      longitude,
      speed,
      heading,
      altitude,
      address,
      trackedAt
    } = req.body;

    // Validate required fields
    if (!vehicleId || !latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Vehicle ID, latitude, and longitude are required' 
      });
    }

    // Verify vehicle exists and has tracking enabled
    const vehicle = await vehicleModel.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    if (!vehicle.is_tracked) {
      return res.status(400).json({ error: 'Vehicle tracking not enabled' });
    }

    // Record tracking data
    const tracking = await trackingModel.create({
      vehicle_id: vehicleId,
      rental_id: rentalId || null,
      latitude,
      longitude,
      speed: speed || null,
      heading: heading || null,
      altitude: altitude || null,
      address: address || null,
      tracked_at: trackedAt || new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Location recorded successfully',
      tracking
    });
  } catch (error) {
    console.error('Error recording location:', error);
    res.status(500).json({ error: 'Failed to record location' });
  }
};

// @desc    Get vehicle current location
// @route   GET /api/tracking/vehicle/:vehicleId/current
// @access  Private (Admin/Staff/Owner)
const getCurrentLocation = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const location = await trackingModel.getCurrentLocation(vehicleId);

    if (!location) {
      return res.status(404).json({ error: 'No tracking data found for this vehicle' });
    }

    res.json({
      success: true,
      location
    });
  } catch (error) {
    console.error('Error fetching current location:', error);
    res.status(500).json({ error: 'Failed to fetch current location' });
  }
};

// @desc    Get vehicle location history
// @route   GET /api/tracking/vehicle/:vehicleId/history
// @access  Private (Admin/Staff/Owner)
const getLocationHistory = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const filters = {
      rental_id: req.query.rentalId,
      start_date: req.query.startDate,
      end_date: req.query.endDate,
      limit: req.query.limit || 100
    };

    const history = await trackingModel.getHistory(vehicleId, filters);

    res.json({
      success: true,
      history,
      count: history.length
    });
  } catch (error) {
    console.error('Error fetching location history:', error);
    res.status(500).json({ error: 'Failed to fetch location history' });
  }
};

// @desc    Get all active vehicle locations (for map view)
// @route   GET /api/tracking/active
// @access  Private (Admin/Staff)
const getAllActiveLocations = async (req, res) => {
  try {
    const vehicles = await trackingModel.getActiveLocations();

    res.json({
      success: true,
      vehicles,
      count: vehicles.length
    });
  } catch (error) {
    console.error('Error fetching active locations:', error);
    res.status(500).json({ error: 'Failed to fetch active locations' });
  }
};

// @desc    Get tracking for rental
// @route   GET /api/tracking/rental/:rentalId
// @access  Private (Admin/Staff/Customer - own rental)
const getRentalTracking = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // If customer, verify they own this rental
    if (userRole === 'customer') {
      const rental = await rentalModel.findByReservationId(rentalId);
      if (!rental) {
        return res.status(404).json({ error: 'Rental not found' });
      }
      // Note: You'd need to verify user_id matches
      // This requires getting the reservation/booking data
    }

    const tracking = await trackingModel.getByRentalId(rentalId);
    const distance = await trackingModel.getDistanceTraveled(rentalId);

    res.json({
      success: true,
      tracking,
      distance: distance?.total_distance_km || 0,
      count: tracking.length
    });
  } catch (error) {
    console.error('Error fetching rental tracking:', error);
    res.status(500).json({ error: 'Failed to fetch rental tracking' });
  }
};

// @desc    Get tracking statistics
// @route   GET /api/tracking/stats
// @access  Private (Admin)
const getTrackingStats = async (req, res) => {
  try {
    const { vehicleId, startDate, endDate } = req.query;

    const stats = await trackingModel.getStatistics(vehicleId, startDate, endDate);

    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('Error fetching tracking statistics:', error);
    res.status(500).json({ error: 'Failed to fetch tracking statistics' });
  }
};

// @desc    Delete old tracking data
// @route   DELETE /api/tracking/cleanup
// @access  Private (Admin)
const cleanupOldData = async (req, res) => {
  try {
    const daysToKeep = parseInt(req.query.days) || 90;

    const result = await trackingModel.deleteOldData(daysToKeep);

    res.json({
      success: true,
      message: `Deleted tracking data older than ${daysToKeep} days`,
      deleted_count: result.deleted_count
    });
  } catch (error) {
    console.error('Error cleaning up tracking data:', error);
    res.status(500).json({ error: 'Failed to cleanup tracking data' });
  }
};

module.exports = {
  recordLocation,
  getCurrentLocation,
  getLocationHistory,
  getAllActiveLocations,
  getRentalTracking,
  getTrackingStats,
  cleanupOldData
};