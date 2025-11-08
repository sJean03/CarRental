// User Types
export type UserRole = 'customer' | 'owner' | 'admin';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  date_of_birth?: string;
  driver_license_number?: string;
  driver_license_expiry?: string;
  role: UserRole;
  is_verified: boolean;
  is_active: boolean;
  profile_photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleOwner {
  id: string;
  user_id: string;
  business_name?: string;
  tax_id?: string;
  bank_account_number?: string;
  bank_name?: string;
  preferred_payout_method: 'credit_card' | 'debit_card';
  total_earnings: number;
  total_rentals: number;
  average_rating: number;
  response_rate: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Car Types
export type TransmissionType = 'automatic' | 'manual';
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid';
export type CarStatus = 'pending_approval' | 'approved' | 'listed' | 'unavailable' | 'suspended' | 'rejected';
export type StorageOption = 'warehouse' | 'owner_delivers';

export interface Car {
  id: string;
  owner_id: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  license_plate: string;
  vin?: string;
  category_id: string;
  category_name?: string;
  transmission: TransmissionType;
  fuel_type: FuelType;
  seating_capacity: number;
  daily_rate: number;
  description?: string;
  features?: string[];
  rules?: string;
  image_urls?: string[];
  home_branch_id?: string;
  branch_name?: string;
  branch_city?: string;
  storage_option: StorageOption;
  status: CarStatus;
  admin_notes?: string;
  rejection_reason?: string;
  total_bookings: number;
  average_rating: number;
  owner_first_name?: string;
  owner_last_name?: string;
  owner_rating?: number;
  owner_response_rate?: number;
  created_at: string;
  updated_at: string;
}

// Booking Types
export type BookingStatus = 
  | 'pending_payment'
  | 'payment_confirmed'
  | 'pending_owner_confirmation'
  | 'confirmed'
  | 'awaiting_vehicle_dropoff'
  | 'ready_for_pickup'
  | 'active'
  | 'awaiting_return'
  | 'returned'
  | 'completed'
  | 'cancelled'
  | 'cancelled_with_refund';

export type PaymentPlanType = 'downpayment' | 'installment';

export interface Booking {
  id: string;
  booking_reference: string;
  customer_id: string;
  car_id: string;
  owner_id: string;
  pickup_date: string;
  return_date: string;
  total_days: number;
  branch_id: string;
  daily_rate: number;
  subtotal: number;
  platform_fee: number;
  total_amount: number;
  payment_plan: PaymentPlanType;
  installment_months?: number;
  monthly_payment?: number;
  down_payment_amount?: number;
  remaining_balance?: number;
  remaining_balance_paid: boolean;
  status: BookingStatus;
  owner_dropoff_at?: string;
  customer_pickup_at?: string;
  customer_return_at?: string;
  owner_pickup_at?: string;
  actual_return_date?: string;
  days_late: number;
  late_fee: number;
  cancelled_at?: string;
  cancellation_reason?: string;
  refund_amount: number;
  customer_notes?: string;
  admin_notes?: string;
  // Joined data
  make?: string;
  model?: string;
  year?: number;
  license_plate?: string;
  car_images?: string[];
  customer_first_name?: string;
  customer_last_name?: string;
  customer_email?: string;
  customer_phone?: string;
  owner_user_id?: string; // User ID of the car owner (for ownership verification)
  owner_first_name?: string;
  owner_last_name?: string;
  owner_email?: string;
  owner_phone?: string;
  branch_name?: string;
  branch_address?: string;
  branch_city?: string;
  created_at: string;
  updated_at: string;
}

// Payment Types
export type PaymentMethod = 'credit_card' | 'debit_card';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_plan: PaymentPlanType;
  installment_number?: number;
  is_initial_payment: boolean;
  is_down_payment: boolean;
  is_remaining_balance: boolean;
  card_last4?: string;
  card_brand?: string;
  transaction_id: string;
  status: PaymentStatus;
  processed_at?: string;
  refunded_amount: number;
  refunded_at?: string;
  refund_reason?: string;
  booking_reference?: string;
  customer_email?: string;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  errors?: Array<{ field: string; message: string }>;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface CarFilters {
  status?: CarStatus;
  category_id?: string;
  transmission?: TransmissionType;
  fuel_type?: FuelType;
  min_seats?: number;
  min_price?: number;
  max_price?: number;
  branch_id?: string;
  search?: string;
  sort_by?: 'created_at' | 'daily_rate' | 'average_rating';
  sort_order?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

export interface BookingFilters {
  status?: BookingStatus;
}

export interface BookingStats {
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  active_bookings: number;
  total_revenue: number;
  avg_booking_value: number;
}

export interface PaymentStats {
  total_payments: number;
  successful_payments: number;
  failed_payments: number;
  refunded_payments: number;
  total_revenue: number;
  total_refunded: number;
  avg_payment_amount: number;
}

export interface InstallmentInfo {
  totalInstallments: number;
  paidInstallments: number;
  remainingInstallments: number;
  nextInstallmentNumber: number;
  installmentAmount: number;
}