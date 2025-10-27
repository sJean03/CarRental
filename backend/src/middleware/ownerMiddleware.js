const VehicleOwner = require('../models/VehicleOwner');

/**
 * Middleware to check if user has owner capabilities (vehicle_owners profile)
 * This allows customers to also be owners (dual role)
 */
const ownerMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has a vehicle_owner profile
    const ownerProfile = await VehicleOwner.findByUserId(req.user.id);

    if (!ownerProfile) {
      return res.status(403).json({
        success: false,
        message: 'Owner profile required. Please complete owner registration to access this feature.',
        code: 'OWNER_PROFILE_REQUIRED'
      });
    }

    // Attach owner profile to request for use in routes
    req.ownerProfile = ownerProfile;

    next();
  } catch (error) {
    console.error('Owner middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authorization'
    });
  }
};

module.exports = ownerMiddleware;
