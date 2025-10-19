const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

const authController = {
  // Register new user
  async register(req, res) {
    try {
      const { 
        email, 
        password, 
        first_name, 
        last_name, 
        phone_number, 
        date_of_birth, 
        driver_license_number, 
        driver_license_expiry 
      } = req.body;

      // Validate required fields
      if (!email || !password || !first_name || !last_name) {
        return res.status(400).json({ 
          error: 'Email, password, first name, and last name are required' 
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({ 
          error: 'Password must be at least 8 characters long' 
        });
      }

      // Check if user exists
      const existingUser = await userModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await userModel.create({
        email,
        password_hash,
        first_name,
        last_name,
        phone_number,
        date_of_birth,
        driver_license_number,
        driver_license_expiry,
        role: 'customer'
      });

      // Generate JWT token
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: newUser,
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        error: 'Registration failed', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find user
      const user = await userModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(403).json({ error: 'Account has been deactivated' });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Remove password from response
      delete user.password_hash;

      res.json({
        success: true,
        message: 'Login successful',
        user,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        error: 'Login failed', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get current user profile
  async getProfile(req, res) {
    try {
      const user = await userModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ 
        success: true,
        user 
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ 
        error: 'Failed to get profile', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Update user profile
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const {
        first_name,
        last_name,
        phone_number,
        date_of_birth,
        driver_license_number,
        driver_license_expiry
      } = req.body;

      const updatedUser = await userModel.update(userId, {
        first_name,
        last_name,
        phone_number,
        date_of_birth,
        driver_license_number,
        driver_license_expiry
      });

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ 
        error: 'Failed to update profile', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Change password
  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        return res.status(400).json({ 
          error: 'Current password and new password are required' 
        });
      }

      if (new_password.length < 8) {
        return res.status(400).json({ 
          error: 'New password must be at least 8 characters long' 
        });
      }

      // Get user with password
      const user = await userModel.findByEmail(req.user.email);
      
      // Verify current password
      const isValidPassword = await bcrypt.compare(current_password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const password_hash = await bcrypt.hash(new_password, 10);

      // Update password
      await userModel.updatePassword(userId, password_hash);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ 
        error: 'Failed to change password', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = authController;