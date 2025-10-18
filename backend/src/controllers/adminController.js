const rentalModel = require('../models/rentalModel');
const bookingModel = require('../models/bookingModel');
const vehicleModel = require('../models/vehicleModel');
const paymentModel = require('../models/paymentModel');
const db = require('../config/database');

const adminController = {
  // Vehicle check-in (pickup)
  async checkIn(req, res) {
    try {
      const staffId = req.user.id;
      const {
        reservation_id,
        starting_mileage,
        fuel_level_start,
        condition_notes_pickup,
        pickup_photos
      } = req.body;

      // Validate required fields
      if (!reservation_id || !starting_mileage || !fuel_level_start) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get booking
      const booking = await bookingModel.findById(reservation_id);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Check booking status
      if (booking.status !== 'confirmed') {
        return res.status(400).json({ 
          error: 'Booking must be confirmed before check-in',
          current_status: booking.status
        });
      }

      // Check if already checked in
      const existingRental = await rentalModel.findByReservationId(reservation_id);
      if (existingRental) {
        return res.status(400).json({ error: 'Vehicle already checked in' });
      }

      // Create rental record
      const rental = await rentalModel.create({
        reservation_id,
        actual_pickup_date: new Date(),
        pickup_location_id: booking.pickup_location_id,
        starting_mileage,
        fuel_level_start,
        condition_notes_pickup,
        pickup_photos,
        checked_in_by: staffId
      });

      // Update booking status to active
      await bookingModel.updateStatus(reservation_id, 'active');

      // Update vehicle status to rented
      await db.query(
        'UPDATE vehicles SET status = $1 WHERE id = $2',
        ['rented', booking.vehicle_id]
      );

      res.status(201).json({
        success: true,
        message: 'Vehicle checked in successfully',
        rental,
        booking_status: 'active'
      });
    } catch (error) {
      console.error('Check-in error:', error);
      res.status(500).json({ error: 'Failed to check in', details: error.message });
    }
  },

  // Vehicle check-out (return)
  async checkOut(req, res) {
    try {
      const staffId = req.user.id;
      const {
        reservation_id,
        ending_mileage,
        fuel_level_end,
        condition_notes_return,
        return_photos,
        damage_reported,
        damage_description,
        damage_photos,
        fuel_charge,
        cleaning_fee,
        damage_charge
      } = req.body;

      // Validate required fields
      if (!reservation_id || !ending_mileage || !fuel_level_end) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get rental and booking
      const rental = await rentalModel.findByReservationId(reservation_id);
      if (!rental) {
        return res.status(404).json({ error: 'Rental not found. Vehicle not checked in.' });
      }

      if (rental.actual_dropoff_date) {
        return res.status(400).json({ error: 'Vehicle already checked out' });
      }

      // Get booking for scheduled dropoff time
      const booking = await bookingModel.findById(reservation_id);

      // Calculate late fees
      const lateFeeData = rentalModel.calculateLateFee(
        booking.dropoff_date,
        new Date(),
        booking.hourly_late_fee
      );

      // Update rental with checkout data
      const updatedRental = await rentalModel.updateCheckout(reservation_id, {
        actual_dropoff_date: new Date(),
        dropoff_location_id: booking.dropoff_location_id,
        ending_mileage,
        fuel_level_end,
        condition_notes_return,
        return_photos,
        damage_reported: damage_reported || false,
        damage_description,
        damage_photos,
        hours_late: lateFeeData.hours_late,
        late_return_fee: lateFeeData.late_fee,
        fuel_charge: fuel_charge || 0,
        cleaning_fee: cleaning_fee || 0,
        damage_charge: damage_charge || 0,
        checked_out_by: staffId
      });

      // Update booking status to completed
      await bookingModel.updateStatus(reservation_id, 'completed');

      // Update vehicle status to available
      await db.query(
        'UPDATE vehicles SET status = $1, current_mileage = $2 WHERE id = $3',
        ['available', ending_mileage, booking.vehicle_id]
      );

      // Calculate total additional charges
      const totalAdditionalCharges = 
        lateFeeData.late_fee +
        parseFloat(fuel_charge || 0) +
        parseFloat(cleaning_fee || 0) +
        parseFloat(damage_charge || 0);

      res.json({
        success: true,
        message: 'Vehicle checked out successfully',
        rental: updatedRental,
        additional_charges: {
          late_fee: lateFeeData.late_fee,
          hours_late: lateFeeData.hours_late,
          fuel_charge: fuel_charge || 0,
          cleaning_fee: cleaning_fee || 0,
          damage_charge: damage_charge || 0,
          total: totalAdditionalCharges
        },
        booking_status: 'completed'
      });
    } catch (error) {
      console.error('Check-out error:', error);
      res.status(500).json({ error: 'Failed to check out', details: error.message });
    }
  },

  // Get active rentals
  async getActiveRentals(req, res) {
    try {
      const rentals = await rentalModel.findActiveRentals();

      res.json({
        success: true,
        count: rentals.length,
        active_rentals: rentals
      });
    } catch (error) {
      console.error('Get active rentals error:', error);
      res.status(500).json({ error: 'Failed to fetch active rentals', details: error.message });
    }
  },

  // Dashboard statistics
  async getDashboardStats(req, res) {
    try {
      // Total bookings
      const bookingsResult = await db.query('SELECT COUNT(*) as total FROM reservations');
      const totalBookings = parseInt(bookingsResult.rows[0].total);

      // Bookings by status
      const statusResult = await db.query(`
        SELECT status, COUNT(*) as count 
        FROM reservations 
        GROUP BY status
      `);

      // Active rentals
      const activeRentalsResult = await db.query(`
        SELECT COUNT(*) as count 
        FROM rentals 
        WHERE actual_dropoff_date IS NULL
      `);
      const activeRentals = parseInt(activeRentalsResult.rows[0].count);

      // Total revenue
      const revenueResult = await db.query(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM payments
        WHERE payment_status IN ('verified', 'completed')
      `);
      const totalRevenue = parseFloat(revenueResult.rows[0].total);

      // Pending payments
      const pendingPaymentsResult = await db.query(`
        SELECT COUNT(*) as count
        FROM payments
        WHERE payment_status = 'pending'
      `);
      const pendingPayments = parseInt(pendingPaymentsResult.rows[0].count);

      // Available vehicles
      const availableVehiclesResult = await db.query(`
        SELECT COUNT(*) as count
        FROM vehicles
        WHERE status = 'available'
      `);
      const availableVehicles = parseInt(availableVehiclesResult.rows[0].count);

      res.json({
        success: true,
        stats: {
          total_bookings: totalBookings,
          bookings_by_status: statusResult.rows,
          active_rentals: activeRentals,
          total_revenue: totalRevenue,
          pending_payments: pendingPayments,
          available_vehicles: availableVehicles
        }
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
    }
  }
};

module.exports = adminController;