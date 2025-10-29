const db = require('../config/database');
const Car = require('./Car');

class DelistRequest {
  // Create table if not exists (safe to call repeatedly)
  static async ensureTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS delist_requests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
        owner_id UUID REFERENCES vehicle_owners(id),
        reason TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await db.query(query);
  }

  static async create(ownerId, carId, reason = null) {
    await this.ensureTable();

    // Prevent duplicate pending requests for the same car
    const exists = await db.query(
      `SELECT 1 FROM delist_requests WHERE car_id = $1 AND status = 'pending' LIMIT 1`,
      [carId]
    );
    if (exists.rows.length > 0) {
      return null;
    }

    const query = `
      INSERT INTO delist_requests (car_id, owner_id, reason)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [carId, ownerId, reason];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findAllPending() {
    await this.ensureTable();
    const query = `
      SELECT dr.*, c.make, c.model, c.year, c.license_plate, c.owner_id as car_owner_id,
             vo.user_id as owner_user_id, u.email as owner_email
      FROM delist_requests dr
      LEFT JOIN cars c ON dr.car_id = c.id
      LEFT JOIN vehicle_owners vo ON dr.owner_id = vo.id
      LEFT JOIN users u ON vo.user_id = u.id
      WHERE dr.status = 'pending'
      ORDER BY dr.created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  static async findById(id) {
    await this.ensureTable();
    const query = `
      SELECT dr.*, c.*, vo.user_id as owner_user_id, u.email as owner_email
      FROM delist_requests dr
      LEFT JOIN cars c ON dr.car_id = c.id
      LEFT JOIN vehicle_owners vo ON dr.owner_id = vo.id
      LEFT JOIN users u ON vo.user_id = u.id
      WHERE dr.id = $1
      LIMIT 1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async markApproved(id) {
    await this.ensureTable();
    // Mark request approved
    const q = `UPDATE delist_requests SET status = 'approved' WHERE id = $1 RETURNING *`;
    const res = await db.query(q, [id]);
    return res.rows[0];
  }

  static async markRejected(id) {
    await this.ensureTable();
    const q = `UPDATE delist_requests SET status = 'rejected' WHERE id = $1 RETURNING *`;
    const res = await db.query(q, [id]);
    return res.rows[0];
  }
}

module.exports = DelistRequest;
