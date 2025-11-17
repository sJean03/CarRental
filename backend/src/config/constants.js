module.exports = {
  // Platform fees
  PLATFORM_FEE_PERCENTAGE: 0.02, // 2%
  
  // Warehouse fees by location
  WAREHOUSE_FEES: {
    'Manila': 2000,
    'Makati': 2500,
    'Quezon City': 1800,
  },
  
  // Cancellation
  CANCELLATION_WINDOW_HOURS: 24,
  
  // Payment
  INSTALLMENT_MONTHS: 12,
  
  // User Roles
  USER_ROLES: {
    CUSTOMER: 'customer',
    OWNER: 'owner',
    ADMIN: 'admin'
  },
  
  // Booking statuses
  BOOKING_STATUS: {
    PENDING_PAYMENT: 'pending_payment',
    PAYMENT_CONFIRMED: 'payment_confirmed',
    PENDING_OWNER_CONFIRMATION: 'pending_owner_confirmation',
    CONFIRMED: 'confirmed',
    AWAITING_VEHICLE_DROPOFF: 'awaiting_vehicle_dropoff',
    READY_FOR_PICKUP: 'ready_for_pickup',
    ACTIVE: 'active',
    AWAITING_RETURN: 'awaiting_return',
    RETURNED: 'returned',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    CANCELLED_WITH_REFUND: 'cancelled_with_refund'
  },
  
  // Car statuses
  CAR_STATUS: {
    PENDING_APPROVAL: 'pending_approval',
    APPROVED: 'approved',
    LISTED: 'listed',
    UNAVAILABLE: 'unavailable',
    SUSPENDED: 'suspended'
  },
  
  // Payment statuses
  PAYMENT_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
  },
  
  // Notification types
  NOTIFICATION_TYPES: {
    CAR_APPROVED: 'car_approved',
    CAR_REJECTED: 'car_rejected',
    CONTRACT_SCHEDULED: 'contract_scheduled',
    BOOKING_CONFIRMED: 'booking_confirmed',
    BOOKING_CANCELLED: 'booking_cancelled',
    DROPOFF_REMINDER: 'dropoff_reminder',
    PICKUP_READY: 'pickup_ready',
    RETURN_REMINDER: 'return_reminder',
    PAYMENT_RECEIVED: 'payment_received',
    PAYMENT_FAILED: 'payment_failed',
    PAYOUT_COMPLETED: 'payout_completed'
  }
};