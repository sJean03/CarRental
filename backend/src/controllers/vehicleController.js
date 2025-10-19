const vehicleModel = require('../models/vehicleModel');
const reviewModel = require('../models/reviewModel');

const vehicleController = {
  // Get all vehicles with filters
  async getAllVehicles(req, res) {
    try {
      const filters = {
        status: req.query.status,
        category_id: req.query.category_id,
        location_id: req.query.location_id,
        transmission_type: req.query.transmission_type,
        fuel_type: req.query.fuel_type,
        min_price: req.query.min_price,
        max_price: req.query.max_price,
        search: req.query.search
      };

      const vehicles = await vehicleModel.findAll(filters);

      res.json({
        success: true,
        count: vehicles.length,
        vehicles
      });
    } catch (error) {
      console.error('Get vehicles error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch vehicles', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get vehicle by ID
  async getVehicleById(req, res) {
    try {
      const { id } = req.params;
      const vehicle = await vehicleModel.findById(id);

      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      res.json({
        success: true,
        vehicle
      });
    } catch (error) {
      console.error('Get vehicle by ID error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch vehicle', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get all categories
  async getCategories(req, res) {
    try {
      const categories = await vehicleModel.getCategories();

      res.json({
        success: true,
        count: categories.length,
        categories
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch categories', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get vehicles by category
  async getVehiclesByCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const vehicles = await vehicleModel.findByCategory(categoryId);

      res.json({
        success: true,
        count: vehicles.length,
        vehicles
      });
    } catch (error) {
      console.error('Get vehicles by category error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch vehicles', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Check vehicle availability
  async checkAvailability(req, res) {
    try {
      const { id } = req.params;
      const { pickup_date, dropoff_date } = req.query;

      if (!pickup_date || !dropoff_date) {
        return res.status(400).json({ error: 'Pickup and dropoff dates are required' });
      }

      const isAvailable = await vehicleModel.checkAvailability(id, pickup_date, dropoff_date);

      res.json({
        success: true,
        vehicle_id: id,
        pickup_date,
        dropoff_date,
        available: isAvailable
      });
    } catch (error) {
      console.error('Check availability error:', error);
      res.status(500).json({ 
        error: 'Failed to check availability', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get vehicle reviews
  async getVehicleReviews(req, res) {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const reviews = await reviewModel.findByVehicleId(id, limit, offset);
      const avgRating = await reviewModel.getAverageRating(id);

      res.json({
        success: true,
        vehicle_id: id,
        average_rating: avgRating,
        reviews,
        pagination: {
          page,
          limit,
          count: reviews.length
        }
      });
    } catch (error) {
      console.error('Get vehicle reviews error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch reviews', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // CREATE - Add new vehicle
  async createVehicle(req, res) {
    try {
      const {
        owner_id,
        ownership_type,
        vehicle_identification_number,
        make,
        model,
        year,
        color,
        license_plate,
        category_id,
        transmission_type,
        fuel_type,
        seating_capacity,
        current_mileage,
        daily_rate,
        hourly_late_fee,
        current_location_id,
        home_location_id,
        image_urls,
        is_tracked,
        tracker_device_id
      } = req.body;

      // Validate required fields
      if (!vehicle_identification_number || !make || !model || !year || !license_plate || !daily_rate) {
        return res.status(400).json({ 
          error: 'Missing required fields: VIN, make, model, year, license plate, and daily rate are required' 
        });
      }

      // Check if VIN already exists
      const existingVehicle = await vehicleModel.findByVIN(vehicle_identification_number);
      if (existingVehicle) {
        return res.status(400).json({ error: 'Vehicle with this VIN already exists' });
      }

      const vehicle = await vehicleModel.create({
        owner_id,
        ownership_type: ownership_type || 'rentease_owned',
        vehicle_identification_number,
        make,
        model,
        year,
        color,
        license_plate,
        category_id,
        transmission_type,
        fuel_type,
        seating_capacity,
        current_mileage: current_mileage || 0,
        daily_rate,
        hourly_late_fee: hourly_late_fee || 200.00,
        current_location_id,
        home_location_id,
        image_urls,
        is_tracked: is_tracked || false,
        tracker_device_id
      });

      res.status(201).json({
        success: true,
        message: 'Vehicle created successfully',
        vehicle
      });
    } catch (error) {
      console.error('Create vehicle error:', error);
      res.status(500).json({ 
        error: 'Failed to create vehicle', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // UPDATE - Update vehicle
  async updateVehicle(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if vehicle exists
      const existingVehicle = await vehicleModel.findById(id);
      if (!existingVehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      const updatedVehicle = await vehicleModel.update(id, updateData);

      res.json({
        success: true,
        message: 'Vehicle updated successfully',
        vehicle: updatedVehicle
      });
    } catch (error) {
      console.error('Update vehicle error:', error);
      res.status(500).json({ 
        error: 'Failed to update vehicle', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // UPDATE STATUS - Update vehicle status
  async updateVehicleStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      const validStatuses = ['available', 'rented', 'maintenance', 'retired'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
      }

      const vehicle = await vehicleModel.updateStatus(id, status);

      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      res.json({
        success: true,
        message: 'Vehicle status updated successfully',
        vehicle
      });
    } catch (error) {
      console.error('Update vehicle status error:', error);
      res.status(500).json({ 
        error: 'Failed to update vehicle status', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // UPDATE LOCATION - Update vehicle location
  async updateVehicleLocation(req, res) {
    try {
      const { id } = req.params;
      const { location_id } = req.body;

      if (!location_id) {
        return res.status(400).json({ error: 'Location ID is required' });
      }

      const vehicle = await vehicleModel.updateLocation(id, location_id);

      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      res.json({
        success: true,
        message: 'Vehicle location updated successfully',
        vehicle
      });
    } catch (error) {
      console.error('Update vehicle location error:', error);
      res.status(500).json({ 
        error: 'Failed to update vehicle location', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // DELETE - Delete vehicle (soft delete by setting to retired)
  async deleteVehicle(req, res) {
    try {
      const { id } = req.params;

      // Check if vehicle exists
      const vehicle = await vehicleModel.findById(id);
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      // Check if vehicle has active bookings
      const hasActiveBookings = await vehicleModel.hasActiveBookings(id);
      if (hasActiveBookings) {
        return res.status(400).json({ 
          error: 'Cannot delete vehicle with active bookings. Set to maintenance or retired instead.' 
        });
      }

      // Soft delete by setting status to retired
      await vehicleModel.updateStatus(id, 'retired');

      res.json({
        success: true,
        message: 'Vehicle marked as retired successfully'
      });
    } catch (error) {
      console.error('Delete vehicle error:', error);
      res.status(500).json({ 
        error: 'Failed to delete vehicle', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = vehicleController;