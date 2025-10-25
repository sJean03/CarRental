const db = require('../config/database');

class VehicleOwner {
  /**
   * Create vehicle owner profile
   */
  static async create(userId, ownerData = {}) {
    const {
      business_name,
      tax_id,
      bank_account_number,
      bank_name,
      preferred_payout_method = 'debit_card'
    } = ownerData;

    const query = `
      INSERT INTO vehicle_owners (user_id, business_name, tax_id, bank_account_number, bank_name, preferred_payout_method)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [userId, business_name, tax_id, bank_account_number, bank_name, preferred_payout_method];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Find owner by user ID
   */
  static async findByUserId(userId) {
    const query = 'SELECT * FROM vehicle_owners WHERE user_id = $1';
    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Find owner by ID
   */
  static async findById(id) {
    const query = `
      SELECT vo.*, u.email, u.first_name, u.last_name, u.phone_number
      FROM vehicle_owners vo
      JOIN users u ON vo.user_id = u.id
      WHERE vo.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Update owner profile
   */
  static async update(ownerId, updateData) {
    const allowedFields = [
      'business_name', 'tax_id', 'bank_account_number', 
      'bank_name', 'preferred_payout_method'
    ];

    const updates = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        updates.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(ownerId);
    const query = `
      UPDATE vehicle_owners 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Update earnings stats
   */
  static async updateEarnings(ownerId, earningsAmount) {
    const query = `
      UPDATE vehicle_owners 
      SET total_earnings = total_earnings + $1,
          total_rentals = total_rentals + 1
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [earningsAmount, ownerId]);
    return result.rows[0];
  }

  /**
   * Get owner dashboard stats
   */
  static async getDashboardStats(ownerId) {
    const query = `
      SELECT 
        vo.total_earnings,
        vo.total_rentals,
        vo.average_rating,
        vo.response_rate,
        COUNT(DISTINCT c.id) as total_cars,
        COUNT(DISTINCT b.id) as active_bookings
      FROM vehicle_owners vo
      LEFT JOIN cars c ON vo.id = c.owner_id
      LEFT JOIN bookings b ON vo.id = b.owner_id AND b.status IN ('confirmed', 'active', 'awaiting_return')
      WHERE vo.id = $1
      GROUP BY vo.id, vo.total_earnings, vo.total_rentals, vo.average_rating, vo.response_rate
    `;
    
    const result = await db.query(query, [ownerId]);
    return result.rows[0];
  }

  /**
   * Verify owner account
   */
  static async verify(ownerId) {
    const query = `
      UPDATE vehicle_owners 
      SET is_verified = true
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [ownerId]);
    return result.rows[0];
  }
}

module.exports = VehicleOwner;