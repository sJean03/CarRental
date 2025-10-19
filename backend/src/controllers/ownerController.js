const vehicleOwnerModel = require('../models/vehicleOwnerModel');
const ownerPaymentModel = require('../models/ownerPaymentModel');
const vehicleModel = require('../models/vehicleModel');
const rentalModel = require('../models/rentalModel');
const reviewModel = require('../models/reviewModel');

// @desc    Get owner dashboard statistics
// @route   GET /api/owners/dashboard
// @access  Private (Owner)
const getOwnerDashboard = async (req, res) => {
  try {
    const ownerId = req.user.ownerId; // Assuming you have ownerId in JWT

    // Get owner info with earnings
    const owner = await vehicleOwnerModel.findById(ownerId);
    if (!owner) {
      return res.status(404).json({ error: 'Owner not found' });
    }

    // Get owner's vehicles
    const vehicles = await vehicleOwnerModel.getVehicles(ownerId);

    // Get payment summary
    const paymentSummary = await vehicleOwnerModel.getPaymentSummary(ownerId);

    res.json({
      success: true,
      owner: {
        ...owner,
        total_vehicles: owner.total_vehicles || 0,
        total_earnings: owner.total_earnings || 0
      },
      vehicles,
      payment_summary: paymentSummary
    });
  } catch (error) {
    console.error('Error fetching owner dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

// @desc    Get owner's vehicles
// @route   GET /api/owners/vehicles
// @access  Private (Owner)
const getOwnerVehicles = async (req, res) => {
  try {
    const ownerId = req.user.ownerId;

    const vehicles = await vehicleOwnerModel.getVehicles(ownerId);

    res.json({
      success: true,
      vehicles,
      count: vehicles.length
    });
  } catch (error) {
    console.error('Error fetching owner vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
};

// @desc    Get owner's payment history
// @route   GET /api/owners/payments
// @access  Private (Owner)
const getOwnerPayments = async (req, res) => {
  try {
    const ownerId = req.user.ownerId;
    const filters = {
      payment_status: req.query.status,
      start_date: req.query.startDate,
      end_date: req.query.endDate
    };

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const payments = await ownerPaymentModel.findByOwnerId(ownerId, filters);

    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPayments = payments.slice(startIndex, endIndex);

    res.json({
      success: true,
      payments: paginatedPayments,
      pagination: {
        page,
        limit,
        total: payments.length,
        totalPages: Math.ceil(payments.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching owner payments:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};

// @desc    Get vehicle performance analytics
// @route   GET /api/owners/vehicles/:vehicleId/analytics
// @access  Private (Owner)
const getVehicleAnalytics = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const ownerId = req.user.ownerId;

    // Verify ownership
    const vehicle = await vehicleModel.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    if (vehicle.owner_id !== ownerId) {
      return res.status(403).json({ error: 'Unauthorized access to vehicle' });
    }

    // Get vehicle statistics
    const vehicleStats = await reviewModel.getVehicleStats(vehicleId);

    // Get maintenance costs
    const maintenanceModel = require('../models/maintenanceModel');
    const maintenanceStats = await maintenanceModel.getStatistics(vehicleId);

    // Calculate rental statistics from bookings
    const db = require('../config/database');
    const rentalStatsQuery = `
      SELECT 
        COUNT(res.id) as total_bookings,
        COUNT(CASE WHEN res.status = 'completed' THEN 1 END) as completed_rentals,
        COUNT(CASE WHEN res.status = 'cancelled' THEN 1 END) as cancelled_bookings,
        COALESCE(SUM(res.total_amount), 0) as total_revenue,
        COALESCE(AVG(EXTRACT(EPOCH FROM (res.dropoff_date - res.pickup_date))/86400), 0) as avg_rental_days
      FROM reservations res
      WHERE res.vehicle_id = $1
    `;
    const rentalStatsResult = await db.query(rentalStatsQuery, [vehicleId]);

    // Get monthly revenue trend (last 6 months)
    const trendQuery = `
      SELECT 
        TO_CHAR(res.pickup_date, 'YYYY-MM') as month,
        COUNT(res.id) as bookings,
        COALESCE(SUM(res.total_amount), 0) as revenue
      FROM reservations res
      WHERE res.vehicle_id = $1 
        AND res.pickup_date >= NOW() - INTERVAL '6 months'
        AND res.status != 'cancelled'
      GROUP BY TO_CHAR(res.pickup_date, 'YYYY-MM')
      ORDER BY month DESC
    `;
    const trendResult = await db.query(trendQuery, [vehicleId]);

    res.json({
      success: true,
      analytics: {
        ...rentalStatsResult.rows[0],
        average_rating: vehicleStats.average_rating || 0,
        total_reviews: vehicleStats.total_reviews || 0
      },
      trend: trendResult.rows,
      maintenance: maintenanceStats
    });
  } catch (error) {
    console.error('Error fetching vehicle analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

// @desc    Get earnings summary
// @route   GET /api/owners/earnings/summary
// @access  Private (Owner)
const getEarningsSummary = async (req, res) => {
  try {
    const ownerId = req.user.ownerId;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const db = require('../config/database');
    const query = `
      SELECT 
        TO_CHAR(payment_period_start, 'Mon') as month,
        EXTRACT(MONTH FROM payment_period_start) as month_number,
        SUM(total_rental_income) as rental_income,
        SUM(owner_share) as owner_earnings,
        SUM(rentease_share) as rentease_share,
        SUM(deductions) as total_deductions,
        COUNT(*) as payment_count
      FROM owner_payments
      WHERE owner_id = $1 
        AND EXTRACT(YEAR FROM payment_period_start) = $2
      GROUP BY month_number, TO_CHAR(payment_period_start, 'Mon')
      ORDER BY month_number
    `;

    const result = await db.query(query, [ownerId, year]);

    // Get year-to-date totals
    const ytdQuery = `
      SELECT 
        SUM(total_rental_income) as ytd_rental_income,
        SUM(owner_share) as ytd_owner_earnings,
        SUM(deductions) as ytd_deductions,
        COUNT(DISTINCT payment_period_start) as total_periods
      FROM owner_payments
      WHERE owner_id = $1 
        AND EXTRACT(YEAR FROM payment_period_start) = $2
    `;

    const ytdResult = await db.query(ytdQuery, [ownerId, year]);

    res.json({
      success: true,
      monthlyEarnings: result.rows,
      yearToDate: ytdResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching earnings summary:', error);
    res.status(500).json({ error: 'Failed to fetch earnings summary' });
  }
};

// @desc    Calculate payment for period (Admin only)
// @route   POST /api/owners/:ownerId/calculate-payment
// @access  Private (Admin)
const calculateOwnerPayment = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const calculation = await ownerPaymentModel.calculateForPeriod(ownerId, startDate, endDate);

    if (!calculation) {
      return res.status(404).json({ error: 'Owner not found or no rentals in period' });
    }

    res.json({
      success: true,
      calculation: {
        ...calculation,
        period: {
          start: startDate,
          end: endDate
        }
      }
    });
  } catch (error) {
    console.error('Error calculating owner payment:', error);
    res.status(500).json({ error: 'Failed to calculate payment' });
  }
};

// @desc    Create owner payment record (Admin only)
// @route   POST /api/owners/payments
// @access  Private (Admin)
const createOwnerPayment = async (req, res) => {
  try {
    const {
      ownerId,
      paymentPeriodStart,
      paymentPeriodEnd,
      totalRentals,
      totalRentalIncome,
      ownerShare,
      renteaseShare,
      deductions,
      deductionNotes,
      netPayment,
      paymentMethod,
      gcashNumber,
      gcashReference,
      notes
    } = req.body;

    const userId = req.user.id;

    // Validate required fields
    if (!ownerId || !paymentPeriodStart || !paymentPeriodEnd || !ownerShare || !renteaseShare) {
      return res.status(400).json({ 
        error: 'Owner ID, period dates, owner share, and RentEase share are required' 
      });
    }

    const payment = await ownerPaymentModel.create({
      owner_id: ownerId,
      payment_period_start: paymentPeriodStart,
      payment_period_end: paymentPeriodEnd,
      total_rentals: totalRentals || 0,
      total_rental_income: totalRentalIncome || 0,
      owner_share: ownerShare,
      rentease_share: renteaseShare,
      deductions: deductions || 0,
      deduction_notes: deductionNotes,
      net_payment: netPayment || ownerShare - (deductions || 0),
      payment_method: paymentMethod,
      gcash_number: gcashNumber,
      gcash_reference: gcashReference,
      payment_status: 'pending',
      paid_by: userId,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Owner payment record created',
      payment
    });
  } catch (error) {
    console.error('Error creating owner payment:', error);
    res.status(500).json({ error: 'Failed to create payment record' });
  }
};

// @desc    Update owner payment status (Admin only)
// @route   PATCH /api/owners/payments/:id/status
// @access  Private (Admin)
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.id;

    if (!['pending', 'paid'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const payment = await ownerPaymentModel.updateStatus(id, status, userId, notes);

    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    // If marking as paid, update owner's total_earned
    if (status === 'paid') {
      await vehicleOwnerModel.updateEarnings(payment.owner_id, payment.owner_share);
    }

    res.json({
      success: true,
      message: 'Payment status updated',
      payment
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
};

module.exports = {
  getOwnerDashboard,
  getOwnerVehicles,
  getOwnerPayments,
  getVehicleAnalytics,
  getEarningsSummary,
  calculateOwnerPayment,
  createOwnerPayment,
  updatePaymentStatus
};