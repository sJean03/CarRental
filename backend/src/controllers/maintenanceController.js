const maintenanceModel = require('../models/maintenanceModel');
const vehicleModel = require('../models/vehicleModel');
const { protect, restrictTo } = require('../middleware/auth');

// @desc    Get all maintenance records
// @route   GET /api/maintenance
// @access  Private (Admin/Staff)
const getAllMaintenanceRecords = async (req, res) => {
  try {
    const filters = {
      vehicle_id: req.query.vehicleId,
      maintenance_type: req.query.type,
      start_date: req.query.startDate,
      end_date: req.query.endDate
    };

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const records = await maintenanceModel.findAll(filters);

    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRecords = records.slice(startIndex, endIndex);

    res.json({
      success: true,
      records: paginatedRecords,
      pagination: {
        page,
        limit,
        total: records.length,
        totalPages: Math.ceil(records.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance records' });
  }
};

// @desc    Create maintenance record
// @route   POST /api/maintenance
// @access  Private (Admin/Staff)
const createMaintenanceRecord = async (req, res) => {
  try {
    const {
      vehicleId,
      maintenanceType,
      description,
      cost,
      serviceDate,
      nextServiceDate,
      performedBy,
      mileageAtService
    } = req.body;

    const userId = req.user.id;

    // Validate required fields
    if (!vehicleId || !maintenanceType || !description || !serviceDate) {
      return res.status(400).json({ 
        error: 'Vehicle ID, maintenance type, description, and service date are required' 
      });
    }

    // Check if vehicle exists
    const vehicle = await vehicleModel.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Create maintenance record
    const record = await maintenanceModel.create({
      vehicle_id: vehicleId,
      maintenance_type: maintenanceType,
      description,
      cost: cost || 0,
      service_date: serviceDate,
      next_service_date: nextServiceDate || null,
      performed_by: performedBy || null,
      mileage_at_service: mileageAtService || null,
      created_by: userId
    });

    // Update vehicle status to maintenance
    // Note: You might want to make this optional or conditional
    // await vehicleModel.update(vehicleId, { status: 'maintenance' });

    res.status(201).json({
      success: true,
      message: 'Maintenance record created successfully',
      record
    });
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    res.status(500).json({ error: 'Failed to create maintenance record' });
  }
};

// @desc    Update maintenance record
// @route   PUT /api/maintenance/:id
// @access  Private (Admin/Staff)
const updateMaintenanceRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      maintenanceType,
      description,
      cost,
      serviceDate,
      nextServiceDate,
      performedBy,
      mileageAtService
    } = req.body;

    // Check if record exists
    const existingRecord = await maintenanceModel.findById(id);
    if (!existingRecord) {
      return res.status(404).json({ error: 'Maintenance record not found' });
    }

    // Build update object
    const updateData = {};
    if (maintenanceType) updateData.maintenance_type = maintenanceType;
    if (description) updateData.description = description;
    if (cost !== undefined) updateData.cost = cost;
    if (serviceDate) updateData.service_date = serviceDate;
    if (nextServiceDate !== undefined) updateData.next_service_date = nextServiceDate;
    if (performedBy !== undefined) updateData.performed_by = performedBy;
    if (mileageAtService !== undefined) updateData.mileage_at_service = mileageAtService;

    const record = await maintenanceModel.update(id, updateData);

    res.json({
      success: true,
      message: 'Maintenance record updated successfully',
      record
    });
  } catch (error) {
    console.error('Error updating maintenance record:', error);
    res.status(500).json({ error: 'Failed to update maintenance record' });
  }
};

// @desc    Get vehicles needing maintenance
// @route   GET /api/maintenance/upcoming
// @access  Private (Admin/Staff)
const getUpcomingMaintenance = async (req, res) => {
  try {
    const daysAhead = parseInt(req.query.days) || 30;
    
    const vehicles = await maintenanceModel.getUpcoming(daysAhead);

    res.json({
      success: true,
      vehicles,
      count: vehicles.length
    });
  } catch (error) {
    console.error('Error fetching upcoming maintenance:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming maintenance' });
  }
};

// @desc    Complete maintenance and restore vehicle
// @route   PATCH /api/maintenance/:id/complete
// @access  Private (Admin/Staff)
const completeMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicleId } = req.body;

    if (!vehicleId) {
      return res.status(400).json({ error: 'Vehicle ID is required' });
    }

    // Verify vehicle exists
    const vehicle = await vehicleModel.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Update vehicle status back to available
    // Note: This should be done via vehicleModel if it has an update method
    // For now using db directly as vehicleModel might not have update method
    const db = require('../config/database');
    await db.query(
      'UPDATE vehicles SET status = $1 WHERE id = $2',
      ['available', vehicleId]
    );

    res.json({
      success: true,
      message: 'Maintenance completed and vehicle restored to available status'
    });
  } catch (error) {
    console.error('Error completing maintenance:', error);
    res.status(500).json({ error: 'Failed to complete maintenance' });
  }
};

// @desc    Get maintenance statistics
// @route   GET /api/maintenance/stats
// @access  Private (Admin/Staff)
const getMaintenanceStats = async (req, res) => {
  try {
    const { vehicleId, startDate, endDate } = req.query;

    const stats = await maintenanceModel.getStatistics(vehicleId, startDate, endDate);

    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('Error fetching maintenance statistics:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance statistics' });
  }
};

module.exports = {
  getAllMaintenanceRecords,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  getUpcomingMaintenance,
  completeMaintenance,
  getMaintenanceStats
};