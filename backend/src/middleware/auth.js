const jwt = require('jsonwebtoken');

const authMiddleware = {
  // Verify JWT token
  verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Add user info to request
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  },

  // Check if user is admin
  isAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    next();
  },

  // Check if user is staff or admin
  isStaff(req, res, next) {
    if (req.user.role !== 'staff' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Staff only.' });
    }
    next();
  }
};

module.exports = authMiddleware;