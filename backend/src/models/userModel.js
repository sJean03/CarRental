const db = require('../config/database');

const userModel = {
  // Create new user
  async create(userData) {
    const query = `
      INSERT INTO users (
        email, 
        password_hash, 
        first_name, 
        last_name, 
        phone_number, 
        date_of_birth, 
        driver_license_number, 
        driver_license_expiry, 
        role
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, email, first_name, last_name, phone_number, role, created_at
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

  // Find user by email (with password)
  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  },

  // Find user by ID (without password)
  async findById(id) {
    const query = `
      SELECT 
        id, 
        email, 
        first_name, 
        last_name, 
        phone_number, 
        date_of_birth, 
        driver_license_number, 
        driver_license_expiry, 
        role, 
        is_active, 
        created_at, 
        updated_at
      FROM users 
      WHERE id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // Update user profile
  async update(id, userData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic update query
    const allowedFields = [
      'first_name', 
      'last_name', 
      'phone_number', 
      'date_of_birth', 
      'driver_license_number', 
      'driver_license_expiry'
    ];

    allowedFields.forEach(field => {
      if (userData[field] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        values.push(userData[field]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING id, email, first_name, last_name, phone_number, date_of_birth, 
                driver_license_number, driver_license_expiry, role, created_at, updated_at
    `;
    values.push(id);

    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Update password
  async updatePassword(id, password_hash) {
    const query = `
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, email
    `;
    const result = await db.query(query, [password_hash, id]);
    return result.rows[0];
  },

  // Deactivate user
  async deactivate(id) {
    const query = `
      UPDATE users 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, email, is_active
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // Activate user
  async activate(id) {
    const query = `
      UPDATE users 
      SET is_active = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, email, is_active
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // Get all users with filters (admin only)
  async findAll(filters = {}) {
    let query = `
      SELECT 
        id, 
        email, 
        first_name, 
        last_name, 
        phone_number, 
        role, 
        is_active, 
        created_at
      FROM users
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (filters.role) {
      query += ` AND role = $${paramIndex}`;
      params.push(filters.role);
      paramIndex++;
    }

    if (filters.is_active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(filters.is_active);
      paramIndex++;
    }

    if (filters.search) {
      query += ` AND (
        first_name ILIKE $${paramIndex} OR 
        last_name ILIKE $${paramIndex} OR 
        email ILIKE $${paramIndex}
      )`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    return result.rows;
  }
};

module.exports = userModel;