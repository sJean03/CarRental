const db = require('../config/database');

const rentalModel = {
  // Create rental record (check-in)
  async create(rentalData) {
    const query = `
      INSERT INTO rentals (
        reservation_id,
        actual_pickup_date,
        pickup_location_id,
        starting_mileage,
        fuel_level_start,
        condition_notes_pickup,
        pickup_photos,
        checked_in_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      rentalData.reservation_id,
      rentalData.actual_pickup_date || new Date(),
      rentalData.pickup_location_id,
      rentalData.starting_mileage,
      rentalData.fuel_level_start,
      rentalData.condition_notes_pickup || null,
      rentalData.pickup_photos || null,
      rentalData.checked_in_by
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Get rental by reservation ID
  async findByReservationId(reservationId) {
    const query = `
      SELECT 
        r.*,
        res.booking_reference,
        res.pickup_date as scheduled_pickup,
        res.dropoff_date as scheduled_dropoff,
        v.make, v.model, v.license_plate, v.hourly_late_fee,
        cin.first_name as checkin_staff_first_name,
        cin.last_name as checkin_staff_last_name,
        cout.first_name as checkout_staff_first_name,
        cout.last_name as checkout_staff_last_name
      FROM rentals r
      LEFT JOIN reservations res ON r.reservation_id = res.id
      LEFT JOIN vehicles v ON res.vehicle_id = v.id
      LEFT JOIN users cin ON r.checked_in_by = cin.id
      LEFT JOIN users cout ON r.checked_out_by = cout.id
      WHERE r.reservation_id = $1
    `;
    const result = await db.query(query, [reservationId]);
    return result.rows[0];
  },

  // Update rental record (check-out)
  async updateCheckout(reservationId, checkoutData) {
    const query = `
      UPDATE rentals
      SET
        actual_dropoff_date = $1,
        dropoff_location_id = $2,
        ending_mileage = $3,
        fuel_level_end = $4,
        condition_notes_return = $5,
        return_photos = $6,
        damage_reported = $7,
        damage_description = $8,
        damage_photos = $9,
        hours_late = $10,
        late_return_fee = $11,
        fuel_charge = $12,
        cleaning_fee = $13,
        damage_charge = $14,
        checked_out_by = $15,
        updated_at = CURRENT_TIMESTAMP
      WHERE reservation_id = $16
      RETURNING *
    `;
    
    const values = [
      checkoutData.actual_dropoff_date || new Date(),
      checkoutData.dropoff_location_id,
      checkoutData.ending_mileage,
      checkoutData.fuel_level_end,
      checkoutData.condition_notes_return || null,
      checkoutData.return_photos || null,
      checkoutData.damage_reported || false,
      checkoutData.damage_description || null,
      checkoutData.damage_photos || null,
      checkoutData.hours_late || 0,
      checkoutData.late_return_fee || 0,
      checkoutData.fuel_charge || 0,
      checkoutData.cleaning_fee || 0,
      checkoutData.damage_charge || 0,
      checkoutData.checked_out_by,
      reservationId
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Get all active rentals
  async findActiveRentals() {
    const query = `
      SELECT 
        r.*,
        res.booking_reference,
        res.user_id,
        res.pickup_date as scheduled_pickup,
        res.dropoff_date as scheduled_dropoff,
        u.first_name as customer_first_name,
        u.last_name as customer_last_name,
        u.phone_number as customer_phone,
        v.make, v.model, v.license_plate
      FROM rentals r
      JOIN reservations res ON r.reservation_id = res.id
      JOIN users u ON res.user_id = u.id
      JOIN vehicles v ON res.vehicle_id = v.id
      WHERE r.actual_dropoff_date IS NULL
      ORDER BY r.actual_pickup_date DESC
    `;
    const result = await db.query(query);
    return result.rows;
  },

  // Calculate late fees
  calculateLateFee(scheduledDropoff, actualDropoff, hourlyRate) {
    const scheduled = new Date(scheduledDropoff);
    const actual = new Date(actualDropoff);
    
    if (actual <= scheduled) {
      return { hours_late: 0, late_fee: 0 };
    }
    
    const millisLate = actual - scheduled;
    const hoursLate = Math.ceil(millisLate / (1000 * 60 * 60));
    const lateFee = hoursLate * parseFloat(hourlyRate);
    
    return { hours_late: hoursLate, late_fee: lateFee };
  }
};

module.exports = rentalModel;