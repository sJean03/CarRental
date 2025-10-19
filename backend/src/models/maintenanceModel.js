const db = require('../config/database');

const maintenanceModel = {
  // Create maintenance record
  async create(maintenanceData) {
    const query = `
      INSERT INTO maintenance_records (
        vehicle_id,
        maintenance_type,
        description,
        cost,
        service_date,
        next_service_date,
        performed_by,
        mileage_at_service,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      maintenanceData.vehicle_id,
      maintenanceData.maintenance_type,
      maintenanceData.description,
      maintenanceData.cost || 0,
      maintenanceData.service_date,
      maintenanceData.next_service_date || null,
      maintenanceData.performed_by || null,
      maintenanceData.mileage_at_service || null,
      maintenanceData.created_by
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Find by ID
  async findById(id) {
    const query = `
      SELECT 
        m.*,
        v.make,
        v.model,
        v.license_plate,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM maintenance_records m
      JOIN vehicles v ON v.id = m.vehicle_id
      LEFT JOIN users u ON u.id = m.created_by
      WHERE m.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // Find by vehicle ID
  async findByVehicleId(vehicleId) {
    const query = `
      SELECT 
        m.*,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM maintenance_records m
      LEFT JOIN users u ON u.id = m.created_by
      WHERE m.vehicle_id = $1
      ORDER BY m.service_date DESC
    `;
    const result = await db.query(query, [vehicleId]);
    return result.rows;
  },

  // Get all with filters
  async findAll(filters = {}) {
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

    if (filters.vehicle_id) {
      query += ` AND m.vehicle_id = $${paramIndex}`;
      params.push(filters.vehicle_id);
      paramIndex++;
    }

    if (filters.maintenance_type) {
      query += ` AND m.maintenance_type = $${paramIndex}`;
      params.push(filters.maintenance_type);
      paramIndex++;
    }

    if (filters.start_date) {
      query += ` AND m.service_date >= $${paramIndex}`;
      params.push(filters.start_date);
      paramIndex++;
    }

    if (filters.end_date) {
      query += ` AND m.service_date <= $${paramIndex}`;
      params.push(filters.end_date);
      paramIndex++;
    }

    query += ` ORDER BY m.service_date DESC`;

    const result = await db.query(query, params);
    return result.rows;
  },

  // Update maintenance record
  async update(id, maintenanceData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(maintenanceData).forEach(key => {
      if (maintenanceData[key] !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(maintenanceData[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE maintenance_records 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    values.push(id);

    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Get upcoming maintenance
  async getUpcoming(daysAhead = 30) {
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
      WHERE v.status != 'retired'
        AND (
          m.next_service_date <= CURRENT_DATE + $1
          OR (v.current_mileage - COALESCE(m.mileage_at_service, 0)) >= 5000
          OR m.next_service_date IS NULL
        )
      ORDER BY m.next_service_date ASC NULLS LAST
    `;
    const result = await db.query(query, [`${daysAhead} days`]);
    return result.rows;
  },

  // Get maintenance statistics
  async getStatistics(vehicleId = null, startDate = null, endDate = null) {
    let query = `
      SELECT 
        COUNT(*) as total_records,
        COALESCE(SUM(cost), 0) as total_cost,
        COALESCE(AVG(cost), 0) as avg_cost,
        COUNT(CASE WHEN maintenance_type = 'routine' THEN 1 END) as routine_count,
        COUNT(CASE WHEN maintenance_type = 'repair' THEN 1 END) as repair_count,
        COUNT(CASE WHEN maintenance_type = 'inspection' THEN 1 END) as inspection_count
      FROM maintenance_records
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (vehicleId) {
      query += ` AND vehicle_id = $${paramIndex}`;
      params.push(vehicleId);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND service_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND service_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const result = await db.query(query, params);
    return result.rows[0];
  },

  // Delete maintenance record
  async delete(id) {
    const query = 'DELETE FROM maintenance_records WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // Get last service for vehicle
  async getLastService(vehicleId) {
    const query = `
      SELECT *
      FROM maintenance_records
      WHERE vehicle_id = $1
      ORDER BY service_date DESC
      LIMIT 1
    `;
    const result = await db.query(query, [vehicleId]);
    return result.rows[0];
  }
};

module.exports = maintenanceModel;