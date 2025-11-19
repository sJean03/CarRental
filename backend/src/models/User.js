const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  /**
   * Create a new user
   */
  static async create(userData) {
    const {
      email,
      password,
      first_name,
      last_name,
      phone_number,
      date_of_birth,
      role = 'customer',
      drivers_license_photo_url
    } = userData;

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, phone_number, date_of_birth, role, drivers_license_photo_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, first_name, last_name, phone_number, date_of_birth, role, is_verified, is_active, created_at
    `;

    const values = [email, password_hash, first_name, last_name, phone_number, date_of_birth, role, drivers_license_photo_url];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const query = `
      SELECT id, email, first_name, last_name, phone_number, date_of_birth, 
             driver_license_number, driver_license_expiry, role, is_verified, 
             is_active, profile_photo_url, created_at, updated_at
      FROM users 
      WHERE id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Verify password
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId, updateData) {
    const allowedFields = [
      'first_name', 'last_name', 'phone_number', 'date_of_birth',
      'driver_license_number', 'driver_license_expiry', 'profile_photo_url',
      'drivers_license_photo_url'
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

    values.push(userId);
    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name, phone_number, date_of_birth, 
                driver_license_number, driver_license_expiry, role, is_verified, 
                profile_photo_url, updated_at
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Verify user account
   */
  static async verifyAccount(userId) {
    const query = `
      UPDATE users 
      SET is_verified = true 
      WHERE id = $1
      RETURNING id, email, first_name, last_name, is_verified
    `;
    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Deactivate user account
   */
  static async deactivate(userId) {
    const query = `
      UPDATE users 
      SET is_active = false 
      WHERE id = $1
      RETURNING id, is_active
    `;
    const result = await db.query(query, [userId]);
    return result.rows[0];
  }
}

module.exports = User;