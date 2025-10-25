export const APP_NAME = 'RentEase';
export const PLATFORM_FEE_PERCENTAGE = 10;
export const CANCELLATION_WINDOW_HOURS = 24;

export const BOOKING_STATUS = {
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
  CANCELLED_WITH_REFUND: 'cancelled_with_refund',
} as const;

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending Payment',
  payment_confirmed: 'Payment Confirmed',
  pending_owner_confirmation: 'Awaiting Owner',
  confirmed: 'Confirmed',
  awaiting_vehicle_dropoff: 'Awaiting Drop-off',
  ready_for_pickup: 'Ready for Pickup',
  active: 'Active',
  awaiting_return: 'Awaiting Return',
  returned: 'Returned',
  completed: 'Completed',
  cancelled: 'Cancelled',
  cancelled_with_refund: 'Cancelled (Refunded)',
};

export const CAR_STATUS = {
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  LISTED: 'listed',
  UNAVAILABLE: 'unavailable',
  SUSPENDED: 'suspended',
} as const;

export const TRANSMISSION_TYPES = [
  { value: 'automatic', label: 'Automatic' },
  { value: 'manual', label: 'Manual' },
];

export const FUEL_TYPES = [
  { value: 'petrol', label: 'Petrol' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
];

export const PAYMENT_METHODS = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
];