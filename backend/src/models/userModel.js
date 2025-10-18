const db = require('../config/database');

const userModel = {
  // Create new user
  async create(userData) {
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, phone_number, date_of_birth, driver_license_number, driver_license_expiry, role)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, email, first_name, last_name, role, created_at
    `;
    const values = [
      userData.email,
      userData.password_hash,
      userData.first_name,
      userData.last_name,
      userData.phone_number || null,
      userData.date_of_birth || null,
      userData.driver_license_number || null,
      userData.driver_license_expiry || null,
      userData.role || 'customer'
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Find user by email
  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  },

  // Find user by ID
  async findById(id) {
    const query = 'SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = userModel;