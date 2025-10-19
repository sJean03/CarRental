const db = require('../config/database');

// @desc    Get all maintenance records
// @route   GET /api/maintenance
// @access  Private (Admin/Staff)
const getAllMaintenanceRecords = async (req, res) => {
  try {
    const { vehicleId, type, startDate, endDate, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT 
        m.*,
        v.make,
        v.model,
        v.license_plate,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM maintenance_records m
      JOIN vehicles v ON v.id = m.vehicle_id
      LEFT JOIN users u ON u.id = m.created_by
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (vehicleId) {
      query += ` AND m.vehicle_id = $${paramIndex}`;
      params.push(vehicleId);
      paramIndex++;
    }

    if (type) {
      query += ` AND m.maintenance_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND m.service_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND m.service_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY m.service_date DESC`;

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM maintenance_records WHERE 1=1`;
    const countResult = await db.query(countQuery);

    res.json({
      records: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count)
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
    const vehicleCheck = await db.query(
      'SELECT id, status FROM vehicles WHERE id = $1',
      [vehicleId]
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const query = `
      INSERT INTO maintenance_records (
        vehicle_id, maintenance_type, description, cost, 
        service_date, next_service_date, performed_by, 
        mileage_at_service, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await db.query(query, [
      vehicleId,
      maintenanceType,
      description,
      cost || 0,
      serviceDate,
      nextServiceDate || null,
      performedBy || null,
      mileageAtService || null,
      userId
    ]);

    // Update vehicle status to maintenance if needed
    await db.query(
      'UPDATE vehicles SET status = $1 WHERE id = $2',
      ['maintenance', vehicleId]
    );

    res.status(201).json({
      message: 'Maintenance record created successfully',
      record: result.rows[0]
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
    const recordCheck = await db.query(
      'SELECT id FROM maintenance_records WHERE id = $1',
      [id]
    );

    if (recordCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Maintenance record not found' });
    }

    const query = `
      UPDATE maintenance_records 
      SET 
        maintenance_type = COALESCE($1, maintenance_type),
        description = COALESCE($2, description),
        cost = COALESCE($3, cost),
        service_date = COALESCE($4, service_date),
        next_service_date = COALESCE($5, next_service_date),
        performed_by = COALESCE($6, performed_by),
        mileage_at_service = COALESCE($7, mileage_at_service)
      WHERE id = $8
      RETURNING *
    `;

    const result = await db.query(query, [
      maintenanceType,
      description,
      cost,
      serviceDate,
      nextServiceDate,
      performedBy,
      mileageAtService,
      id
    ]);

    res.json({
      message: 'Maintenance record updated successfully',
      record: result.rows[0]
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
    const query = `
      SELECT 
        v.*,
        m.next_service_date,
        m.service_date as last_service_date,
        m.maintenance_type as last_maintenance_type,
        m.mileage_at_service as last_service_mileage,
        (v.current_mileage - COALESCE(m.mileage_at_service, 0)) as mileage_since_service
      FROM vehicles v
      LEFT JOIN LATERAL (
        SELECT *
        FROM maintenance_records mr
        WHERE mr.vehicle_id = v.id
        ORDER BY mr.service_date DESC
        LIMIT 1
      ) m ON true
      WHERE v.is_active = true
        AND (
          m.next_service_date <= CURRENT_DATE + INTERVAL '30 days'
          OR (v.current_mileage - COALESCE(m.mileage_at_service, 0)) >= 5000
          OR m.next_service_date IS NULL
        )
      ORDER BY m.next_service_date ASC NULLS LAST
    `;

    const result = await db.query(query);

    res.json({
      vehicles: result.rows,
      count: result.rows.length
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

    // Update vehicle status back to available
    await db.query(
      'UPDATE vehicles SET status = $1 WHERE id = $2',
      ['available', vehicleId]
    );

    res.json({
      message: 'Maintenance completed and vehicle restored to available status'
    });
  } catch (error) {
    console.error('Error completing maintenance:', error);
    res.status(500).json({ error: 'Failed to complete maintenance' });
  }
};

module.exports = {
  getAllMaintenanceRecords,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  getUpcomingMaintenance,
  completeMaintenance
};