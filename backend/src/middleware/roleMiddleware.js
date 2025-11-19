const { USER_ROLES } = require('../config/constants');

/**
 * Middleware to check if user has required role(s)
 * @param  {...string} allowedRoles - Roles that can access the route
 */
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during authorization'
      });
    }
  };
};

module.exports = roleMiddleware;