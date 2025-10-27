const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const ownerMiddleware = require('../middleware/ownerMiddleware');
const VehicleOwner = require('../models/VehicleOwner');
const { USER_ROLES } = require('../config/constants');

/**
 * @route   POST /api/owner/register
 * @desc    Register as an owner (allows customers to become owners)
 * @access  Private (Any authenticated user)
 */
router.post('/register', authMiddleware, async (req, res, next) => {
  try {
    // Check if already has owner profile
    const existingOwner = await VehicleOwner.findByUserId(req.user.id);

    if (existingOwner) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered as an owner'
      });
    }

    const { business_name, tax_id, bank_account_number, bank_name, preferred_payout_method } = req.body;

    // Validate required fields
    if (!bank_account_number || !bank_name) {
      return res.status(400).json({
        success: false,
        message: 'Bank account details are required'
      });
    }

    // Create vehicle_owner profile
    const ownerProfile = await VehicleOwner.create(req.user.id, {
      business_name,
      tax_id,
      bank_account_number,
      bank_name,
      preferred_payout_method: preferred_payout_method || 'debit_card'
    });

    res.status(201).json({
      success: true,
      message: 'Owner registration successful! You can now list your cars.',
      data: { profile: ownerProfile }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/owner/check
 * @desc    Check if user has owner profile
 * @access  Private (Any authenticated user)
 */
router.get('/check', authMiddleware, async (req, res, next) => {
  try {
    const ownerProfile = await VehicleOwner.findByUserId(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        isOwner: !!ownerProfile,
        profile: ownerProfile || null
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/owner/profile
 * @desc    Get owner profile
 * @access  Private (Owner)
 */
router.get('/profile', authMiddleware, ownerMiddleware, async (req, res, next) => {
  try {
    let owner = await VehicleOwner.findByUserId(req.user.id);

    if (!owner) {
      owner = await VehicleOwner.create(req.user.id);
    }

    res.status(200).json({
      success: true,
      data: { profile: owner }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/owner/profile
 * @desc    Update owner profile
 * @access  Private (Owner)
 */
router.put('/profile', authMiddleware, ownerMiddleware, async (req, res, next) => {
  try {
    let owner = await VehicleOwner.findByUserId(req.user.id);

    if (!owner) {
      owner = await VehicleOwner.create(req.user.id);
    }

    const { business_name, tax_id, bank_account_number, bank_name, preferred_payout_method } = req.body;

    const updatedOwner = await VehicleOwner.update(owner.id, {
      business_name,
      tax_id,
      bank_account_number,
      bank_name,
      preferred_payout_method
    });

    res.status(200).json({
      success: true,
      message: 'Owner profile updated successfully',
      data: { profile: updatedOwner }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/owner/payouts
 * @desc    Get owner payouts
 * @access  Private (Owner)
 */
router.get('/payouts', authMiddleware, ownerMiddleware, async (req, res, next) => {
  try {
    const owner = await VehicleOwner.findByUserId(req.user.id);

    if (!owner) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: { payouts: [] }
      });
    }

    const result = await db.query(
      `SELECT op.*, b.booking_reference
       FROM owner_payouts op
       LEFT JOIN bookings b ON op.booking_id = b.id
       WHERE op.owner_id = $1
       ORDER BY op.created_at DESC`,
      [owner.id]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: { payouts: result.rows }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/owner/stats
 * @desc    Get owner statistics
 * @access  Private (Owner)
 */
router.get('/stats', authMiddleware, ownerMiddleware, async (req, res, next) => {
  try {
    const owner = await VehicleOwner.findByUserId(req.user.id);

    if (!owner) {
      return res.status(200).json({
        success: true,
        data: {
          stats: {
            total_earnings: 0,
            total_rentals: 0,
            average_rating: 0,
            response_rate: 100,
            total_cars: 0,
            active_bookings: 0
          }
        }
      });
    }

    const stats = await VehicleOwner.getDashboardStats(owner.id);

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
