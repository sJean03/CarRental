const vehicleModel = require('../models/vehicleModel');

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
      res.status(500).json({ error: 'Failed to fetch vehicles', details: error.message });
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
      res.status(500).json({ error: 'Failed to fetch vehicle', details: error.message });
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
      res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
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
      res.status(500).json({ error: 'Failed to fetch vehicles', details: error.message });
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
      res.status(500).json({ error: 'Failed to check availability', details: error.message });
    }
  }
};

module.exports = vehicleController;