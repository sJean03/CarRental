const db = require('../config/database');

const locationModel = {
  // Get all locations
  async findAll() {
    const query = 'SELECT * FROM locations WHERE is_active = true ORDER BY name ASC';
    const result = await db.query(query);
    return result.rows;
  },

  // Get location by ID
  async findById(id) {
    const query = 'SELECT * FROM locations WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = locationModel;