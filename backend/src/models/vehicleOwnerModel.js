const db = require('../config/database');

const vehicleOwnerModel = {
  // Create new vehicle owner
  async create(ownerData) {
    const query = `
      INSERT INTO vehicle_owners (
        user_id,
        first_name,
        last_name,
        email,
        phone_number,
        address,
        bank_account_number,
        bank_name,
        gcash_number,
        tax_id,
        contract_start_date,
        contract_end_date,
        contract_status,
        payment_type,
        fixed_monthly_amount,
        percentage_share
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;
    
    const values = [
      ownerData.user_id || null,
      ownerData.first_name,
      ownerData.last_name,
      ownerData.email,
      ownerData.phone_number,
      ownerData.address || null,
      ownerData.bank_account_number || null,
      ownerData.bank_name || null,
      ownerData.gcash_number || null,
      ownerData.tax_id || null,
      ownerData.contract_start_date,
      ownerData.contract_end_date,
      ownerData.contract_status || 'active',
      ownerData.payment_type,
      ownerData.fixed_monthly_amount || null,
      ownerData.percentage_share || null
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Find owner by ID
  async findById(id) {
    const query = `
      SELECT 
        vo.*,
        u.email as user_email,
        COUNT(DISTINCT v.id) as total_vehicles,
        COALESCE(SUM(op.owner_share), 0) as total_earnings
      FROM vehicle_owners vo
      LEFT JOIN users u ON vo.user_id = u.id
      LEFT JOIN vehicles v ON v.owner_id = vo.id
      LEFT JOIN owner_payments op ON op.owner_id = vo.id AND op.payment_status = 'paid'
      WHERE vo.id = $1
      GROUP BY vo.id, u.email
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // Find owner by user ID
  async findByUserId(userId) {
    const query = 'SELECT * FROM vehicle_owners WHERE user_id = $1';
    const result = await db.query(query, [userId]);
    return result.rows[0];
  },

  // Find owner by email
  async findByEmail(email) {
    const query = 'SELECT * FROM vehicle_owners WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  },

  // Get all owners with filters
  async findAll(filters = {}) {
    let query = `
      SELECT 
        vo.*,
        COUNT(DISTINCT v.id) as vehicle_count,
        COALESCE(SUM(op.owner_share), 0) as total_paid
      FROM vehicle_owners vo
      LEFT JOIN vehicles v ON v.owner_id = vo.id
      LEFT JOIN owner_payments op ON op.owner_id = vo.id AND op.payment_status = 'paid'
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (filters.contract_status) {
      query += ` AND vo.contract_status = $${paramIndex}`;
      params.push(filters.contract_status);
      paramIndex++;
    }

    if (filters.payment_type) {
      query += ` AND vo.payment_type = $${paramIndex}`;
      params.push(filters.payment_type);
      paramIndex++;
    }

    query += ` GROUP BY vo.id ORDER BY vo.created_at DESC`;

    const result = await db.query(query, params);
    return result.rows;
  },

  // Update owner
  async update(id, ownerData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic UPDATE query
    Object.keys(ownerData).forEach(key => {
      if (ownerData[key] !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(ownerData[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE vehicle_owners 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    values.push(id);

    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Update earnings
  async updateEarnings(ownerId, amount) {
    const query = `
      UPDATE vehicle_owners 
      SET total_earned = total_earned + $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [amount, ownerId]);
    return result.rows[0];
  },

  // Get owner vehicles
  async getVehicles(ownerId) {
    const query = `
      SELECT 
        v.*,
        vc.name as category_name,
        l.name as location_name,
        COUNT(DISTINCT res.id) as total_bookings,
        COALESCE(AVG(rev.rating), 0) as avg_rating
      FROM vehicles v
      LEFT JOIN vehicle_categories vc ON vc.id = v.category_id
      LEFT JOIN locations l ON l.id = v.current_location_id
      LEFT JOIN reservations res ON res.vehicle_id = v.id
      LEFT JOIN reviews rev ON rev.vehicle_id = v.id
      WHERE v.owner_id = $1
      GROUP BY v.id, vc.name, l.name
      ORDER BY v.created_at DESC
    `;
    const result = await db.query(query, [ownerId]);
    return result.rows;
  },

  // Get owner payment summary
  async getPaymentSummary(ownerId, startDate = null, endDate = null) {
    let query = `
      SELECT 
        COUNT(*) as total_payments,
        COALESCE(SUM(owner_share), 0) as total_owner_share,
        COALESCE(SUM(rentease_share), 0) as total_rentease_share,
        COALESCE(SUM(deductions), 0) as total_deductions,
        COALESCE(SUM(net_payment), 0) as total_net_payment,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_count,
        COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN net_payment ELSE 0 END), 0) as pending_amount
      FROM owner_payments
      WHERE owner_id = $1
    `;
    
    const params = [ownerId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND payment_period_start >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND payment_period_end <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const result = await db.query(query, params);
    return result.rows[0];
  }
};

module.exports = vehicleOwnerModel;