const jwt = require('jsonwebtoken');
const User = require('../models/User');
const VehicleOwner = require('../models/VehicleOwner');

/**
 * Generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * Register new user
 */
const register = async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, phone_number, date_of_birth, role, drivers_license_photo_url } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      first_name,
      last_name,
      phone_number,
      date_of_birth,
      role: role || 'customer',
      drivers_license_photo_url
    });

    // If registering as owner, create owner profile
    if (role === 'owner') {
      await VehicleOwner.create(user.id);
    }

    // Generate token
    const token = generateToken(user);

    // Send response with success modal data
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          is_verified: user.is_verified
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          is_verified: user.is_verified,
          profile_photo_url: user.profile_photo_url
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If user is an owner, get owner profile too
    let ownerProfile = null;
    if (user.role === 'owner') {
      ownerProfile = await VehicleOwner.findByUserId(user.id);
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        ownerProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const allowedUpdates = [
      'first_name', 'last_name', 'phone_number', 'date_of_birth',
      'driver_license_number', 'driver_license_expiry', 
      'profile_photo_url', 'drivers_license_photo_url'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    const updatedUser = await User.updateProfile(req.user.id, updates);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 */
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (new_password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Get user with password
    const user = await User.findByEmail(req.user.email);
    
    // Verify current password
    const isValidPassword = await User.verifyPassword(current_password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    const bcrypt = require('bcryptjs');
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const newPasswordHash = await bcrypt.hash(new_password, saltRounds);

    const db = require('../config/database');
    await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout (client-side token removal, but we can log it)
 */
const logout = async (req, res, next) => {
  try {
    // In a real app, you might want to blacklist the token
    // For now, just send success response
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout
};