const db = require('../config/database');

const addressModel = {
  // Create address
  async create(addressData) {
    const query = `
      INSERT INTO addresses (
        user_id,
        street_address,
        city,
        province,
        postal_code,
        country,
        is_default
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      addressData.user_id,
      addressData.street_address,
      addressData.city,
      addressData.province,
      addressData.postal_code,
      addressData.country || 'Philippines',
      addressData.is_default || false
    ];

    // If this is set as default, unset other defaults first
    if (addressData.is_default) {
      await db.query(
        'UPDATE addresses SET is_default = false WHERE user_id = $1',
        [addressData.user_id]
      );
    }
    
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Find by ID
  async findById(id) {
    const query = 'SELECT * FROM addresses WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // Find by user ID
  async findByUserId(userId) {
    const query = `
      SELECT * FROM addresses 
      WHERE user_id = $1 
      ORDER BY is_default DESC, created_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  },

  // Get default address for user
  async getDefault(userId) {
    const query = `
      SELECT * FROM addresses 
      WHERE user_id = $1 AND is_default = true
      LIMIT 1
    `;
    const result = await db.query(query, [userId]);
    return result.rows[0];
  },

  // Update address
  async update(id, addressData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // If setting as default, unset others first
    if (addressData.is_default) {
      const address = await this.findById(id);
      if (address) {
        await db.query(
          'UPDATE addresses SET is_default = false WHERE user_id = $1',
          [address.user_id]
        );
      }
    }

    Object.keys(addressData).forEach(key => {
      if (addressData[key] !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(addressData[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE addresses 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    values.push(id);

    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Set as default
  async setDefault(id, userId) {
    // Unset all defaults for user
    await db.query(
      'UPDATE addresses SET is_default = false WHERE user_id = $1',
      [userId]
    );

    // Set this one as default
    const query = `
      UPDATE addresses 
      SET is_default = true 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await db.query(query, [id, userId]);
    return result.rows[0];
  },

  // Delete address
  async delete(id) {
    const query = 'DELETE FROM addresses WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = addressModel;