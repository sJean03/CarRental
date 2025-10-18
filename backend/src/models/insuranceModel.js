const db = require('../config/database');

const insuranceModel = {
  // Get all insurance plans
  async findAll() {
    const query = 'SELECT * FROM insurance_plans WHERE is_active = true ORDER BY daily_rate ASC';
    const result = await db.query(query);
    return result.rows;
  },

  // Get insurance plan by ID
  async findById(id) {
    const query = 'SELECT * FROM insurance_plans WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = insuranceModel;