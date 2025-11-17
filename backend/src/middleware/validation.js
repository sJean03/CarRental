/**
 * Custom validation middleware - No external dependencies
 * Secure and lightweight validation for RentEase API
 */

/**
 * Validation helper functions
 */
const validators = {
  isEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isUUID: (str) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  },

  isISO8601: (date) => {
    const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    return isoRegex.test(date) && !isNaN(Date.parse(date));
  },

  isPhoneNumber: (phone) => {
    // Basic phone validation (supports +63 Philippines format and others)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s()-]/g, ''));
  },

  isInRange: (value, min, max) => {
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
  },

  isInArray: (value, allowedValues) => {
    return allowedValues.includes(value);
  },

  minLength: (str, length) => {
    return typeof str === 'string' && str.length >= length;
  },

  maxLength: (str, length) => {
    return typeof str === 'string' && str.length <= length;
  },

  trim: (str) => {
    return typeof str === 'string' ? str.trim() : str;
  }
};

/**
 * Validate and sanitize request body
 */
const validate = (rules) => {
  return (req, res, next) => {
    const errors = [];

    for (const field in rules) {
      const fieldRules = rules[field];
      const value = req.body[field];

      // Check if required
      if (fieldRules.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field,
          message: fieldRules.message || `${field} is required`
        });
        continue;
      }

      // Skip validation if optional and not provided
      if (!fieldRules.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Trim strings if needed
      if (fieldRules.trim && typeof value === 'string') {
        req.body[field] = validators.trim(value);
      }

      // Apply validators
      if (fieldRules.type) {
        switch (fieldRules.type) {
          case 'email':
            if (!validators.isEmail(value)) {
              errors.push({ field, message: 'Invalid email format' });
            }
            break;
          case 'uuid':
            if (!validators.isUUID(value)) {
              errors.push({ field, message: 'Invalid UUID format' });
            }
            break;
          case 'date':
            if (!validators.isISO8601(value)) {
              errors.push({ field, message: 'Invalid date format (use ISO8601)' });
            }
            break;
          case 'phone':
            if (!validators.isPhoneNumber(value)) {
              errors.push({ field, message: 'Invalid phone number' });
            }
            break;
        }
      }

      // Check min length
      if (fieldRules.minLength && !validators.minLength(value, fieldRules.minLength)) {
        errors.push({ 
          field, 
          message: `${field} must be at least ${fieldRules.minLength} characters` 
        });
      }

      // Check max length
      if (fieldRules.maxLength && !validators.maxLength(value, fieldRules.maxLength)) {
        errors.push({ 
          field, 
          message: `${field} must not exceed ${fieldRules.maxLength} characters` 
        });
      }

      // Check allowed values
      if (fieldRules.in && !validators.isInArray(value, fieldRules.in)) {
        errors.push({ 
          field, 
          message: `${field} must be one of: ${fieldRules.in.join(', ')}` 
        });
      }

      // Check numeric range
      if (fieldRules.min !== undefined || fieldRules.max !== undefined) {
        const min = fieldRules.min ?? -Infinity;
        const max = fieldRules.max ?? Infinity;
        if (!validators.isInRange(value, min, max)) {
          errors.push({ 
            field, 
            message: `${field} must be between ${min} and ${max}` 
          });
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  };
};

/**
 * Validate URL parameters
 */
const validateParams = (rules) => {
  return (req, res, next) => {
    const errors = [];

    for (const param in rules) {
      const paramRules = rules[param];
      const value = req.params[param];

      if (!value) {
        errors.push({ field: param, message: `${param} parameter is required` });
        continue;
      }

      if (paramRules.type === 'uuid' && !validators.isUUID(value)) {
        errors.push({ field: param, message: `Invalid ${param} format` });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors
      });
    }

    next();
  };
};

/**
 * Auth validation rules
 */
const validateRegister = validate({
  email: { required: true, type: 'email', trim: true },
  password: { required: true, minLength: 8 },
  first_name: { required: true, trim: true, minLength: 1, maxLength: 100 },
  last_name: { required: true, trim: true, minLength: 1, maxLength: 100 },
  phone_number: { required: false, type: 'phone' },
  role: { required: false, in: ['customer', 'owner'] }
});

const validateLogin = validate({
  email: { required: true, type: 'email', trim: true },
  password: { required: true }
});

/**
 * Car validation rules
 */
const validateCarCreate = validate({
  make: { required: true, trim: true, minLength: 1, maxLength: 100 },
  model: { required: true, trim: true, minLength: 1, maxLength: 100 },
  year: { required: true, min: 1900, max: new Date().getFullYear() + 1 },
  license_plate: { required: true, trim: true, minLength: 1, maxLength: 20 },
  category_id: { required: true, type: 'uuid' },
  transmission: { required: true, in: ['automatic', 'manual'] },
  fuel_type: { required: true, in: ['petrol', 'diesel', 'electric', 'hybrid'] },
  seating_capacity: { required: true, min: 1, max: 20 },
  daily_rate: { required: true, min: 0 },
  home_branch_id: { required: false, type: 'uuid' }
});

/**
 * Booking validation rules
 */
const validateBookingCreate = validate({
  car_id: { required: true, type: 'uuid' },
  pickup_date: { required: true, type: 'date' },
  return_date: { required: true, type: 'date' },
  branch_id: { required: false, type: 'uuid' },
  payment_plan: { required: false, in: ['downpayment', 'installment'] },
  installment_months: { required: false, min: 1, max: 12 }
});

/**
 * Payment validation rules
 */
const validatePayment = validate({
  booking_id: { required: true, type: 'uuid' },
  payment_method: { required: true, in: ['credit_card', 'debit_card'] },
  card_last4: { required: false, minLength: 4, maxLength: 4 },
  card_brand: { required: false, trim: true }
});

/**
 * UUID parameter validation
 */
const validateUUID = (paramName) => {
  return validateParams({
    [paramName]: { type: 'uuid' }
  });
};

module.exports = {
  validate,
  validateParams,
  validateRegister,
  validateLogin,
  validateCarCreate,
  validateBookingCreate,
  validatePayment,
  validateUUID,
  validators // Export validators for use in controllers if needed
};