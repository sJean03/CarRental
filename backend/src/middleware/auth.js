const jwt = require('jsonwebtoken');

// Verify JWT token (renamed from verifyToken to protect)
const protect = (req, res, next) => {
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
};

// Check user role (flexible for multiple roles)
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }
    next();
  };
};

// Legacy exports (keep for backward compatibility with existing routes)
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

const isStaff = (req, res, next) => {
  if (req.user.role !== 'staff' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Staff only.' });
  }
  next();
};

// Export both old and new naming for compatibility
module.exports = {
  protect,
  restrictTo,
  verifyToken: protect,  // Alias for backward compatibility
  isAdmin,
  isStaff
};