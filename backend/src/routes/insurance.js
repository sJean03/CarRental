const express = require('express');
const router = express.Router();
const insuranceModel = require('../models/insuranceModel');

// Get all insurance plans (public)
router.get('/', async (req, res) => {
  try {
    const plans = await insuranceModel.findAll();
    res.json({
      success: true,
      count: plans.length,
      insurancePlans: plans
    });
  } catch (error) {
    console.error('Get insurance plans error:', error);
    res.status(500).json({ error: 'Failed to fetch insurance plans' });
  }
});

// Get insurance plan by ID
router.get('/:id', async (req, res) => {
  try {
    const plan = await insuranceModel.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Insurance plan not found' });
    }
    res.json({
      success: true,
      insurancePlan: plan
    });
  } catch (error) {
    console.error('Get insurance plan error:', error);
    res.status(500).json({ error: 'Failed to fetch insurance plan' });
  }
});

module.exports = router;