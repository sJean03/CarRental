const { AppError } = require('./errorHandler');

// Validation helper functions
const validators = {
  // Email validation
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Phone number validation (Philippine format)
  isValidPhoneNumber: (phone) => {
    const phoneRegex = /^(\+63|0)?9\d{9}$/;
    return phoneRegex.test(phone?.replace(/\s|-/g, ''));
  },

  // Date validation
  isValidDate: (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  },

  // UUID validation
  isValidUUID: (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  // Password strength validation
  isStrongPassword: (password) => {
    return password && password.length >= 8;
  }
};

// Validation middleware factory
const validate = {
  // Register validation
  register: (req, res, next) => {
    const { email, password, first_name, last_name } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return next(new AppError('Email, password, first name, and last name are required', 400));
    }

    if (!validators.isValidEmail(email)) {
      return next(new AppError('Invalid email format', 400));
    }

    if (!validators.isStrongPassword(password)) {
      return next(new AppError('Password must be at least 8 characters long', 400));
    }

    next();
  },

  // Login validation
  login: (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Email and password are required', 400));
    }

    if (!validators.isValidEmail(email)) {
      return next(new AppError('Invalid email format', 400));
    }

    next();
  },

  // Booking creation validation
  createBooking: (req, res, next) => {
    const {
      vehicle_id,
      pickup_location_id,
      dropoff_location_id,
      pickup_date,
      dropoff_date
    } = req.body;

    if (!vehicle_id || !pickup_location_id || !dropoff_location_id || !pickup_date || !dropoff_date) {
      return next(new AppError('All booking fields are required', 400));
    }

    if (!validators.isValidUUID(vehicle_id)) {
      return next(new AppError('Invalid vehicle ID', 400));
    }

    if (!validators.isValidDate(pickup_date) || !validators.isValidDate(dropoff_date)) {
      return next(new AppError('Invalid date format', 400));
    }

    const pickup = new Date(pickup_date);
    const dropoff = new Date(dropoff_date);

    if (pickup >= dropoff) {
      return next(new AppError('Dropoff date must be after pickup date', 400));
    }

    if (pickup < new Date()) {
      return next(new AppError('Pickup date cannot be in the past', 400));
    }

    next();
  },

  // Payment submission validation
  submitPayment: (req, res, next) => {
    const { reservation_id, amount, payment_method } = req.body;

    if (!reservation_id || !amount || !payment_method) {
      return next(new AppError('Reservation ID, amount, and payment method are required', 400));
    }

    if (!validators.isValidUUID(reservation_id)) {
      return next(new AppError('Invalid reservation ID', 400));
    }

    if (parseFloat(amount) <= 0) {
      return next(new AppError('Amount must be greater than zero', 400));
    }

    if (!['cash', 'gcash'].includes(payment_method)) {
      return next(new AppError('Invalid payment method. Must be cash or gcash', 400));
    }

    if (payment_method === 'gcash') {
      const { gcash_number, gcash_reference } = req.body;
      if (!gcash_number || !gcash_reference) {
        return next(new AppError('GCash number and reference are required for GCash payments', 400));
      }
    }

    next();
  },

  // Vehicle creation validation
  createVehicle: (req, res, next) => {
    const {
      vehicle_identification_number,
      make,
      model,
      year,
      license_plate,
      daily_rate
    } = req.body;

    if (!vehicle_identification_number || !make || !model || !year || !license_plate || !daily_rate) {
      return next(new AppError('VIN, make, model, year, license plate, and daily rate are required', 400));
    }

    if (year < 1900 || year > new Date().getFullYear() + 1) {
      return next(new AppError('Invalid vehicle year', 400));
    }

    if (parseFloat(daily_rate) <= 0) {
      return next(new AppError('Daily rate must be greater than zero', 400));
    }

    next();
  },

  // UUID parameter validation
  validateUUID: (paramName) => {
    return (req, res, next) => {
      const uuid = req.params[paramName];
      
      if (!validators.isValidUUID(uuid)) {
        return next(new AppError(`Invalid ${paramName}`, 400));
      }
      
      next();
    };
  }
};

module.exports = {
  validate,
  validators
};