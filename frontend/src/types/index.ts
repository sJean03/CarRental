// types/index.ts - Complete type definitions matching backend

// ========== ENUMS ==========
export type UserRole = 'customer' | 'owner' | 'admin' | 'staff';
export type TransmissionType = 'automatic' | 'manual';
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid';
export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'retired';
export type OwnershipType = 'rentease_owned' | 'leased_from_owner';
export type ReservationStatus = 'pending_payment' | 'confirmed' | 'active' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'gcash';
export type PaymentType = 'deposit' | 'full_payment' | 'balance' | 'additional_charges';
export type PaymentStatus = 'pending' | 'verified' | 'completed' | 'refunded';
export type MaintenanceType = 'routine' | 'repair' | 'inspection';
export type FuelLevel = 'empty' | 'quarter' | 'half' | 'three_quarters' | 'full';

// ========== USER & AUTH ==========
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
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  date_of_birth?: string;
  driver_license_number?: string;
  driver_license_expiry?: string;
  role?: UserRole;
}

// ========== VEHICLES ==========
export interface Vehicle {
  id: string;
  owner_id?: string;
  category_id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  color: string;
  transmission_type: TransmissionType;
  fuel_type: FuelType;
  seating_capacity: number;
  current_mileage: number;
  daily_rate: number;
  hourly_late_fee: number;
  status: VehicleStatus;
  ownership_type?: OwnershipType;
  current_location_id?: string;
  home_location_id?: string;
  image_urls?: string[];
  is_tracked: boolean;
  tracker_device_id?: string;
  created_at: string;
  updated_at: string;
  
  // Joined/computed fields
  category_name?: string;
  current_location_name?: string;
  home_location_name?: string;
  owner_name?: string;
  average_rating?: number;
  total_reviews?: number;
}

export interface VehicleCategory {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  vehicle_count?: number;
}

export interface VehicleFilters {
  category?: string;
  transmission?: TransmissionType;
  fuelType?: FuelType;
  minPrice?: number;
  maxPrice?: number;
  minSeats?: number;
  maxSeats?: number;
  location?: string;
  pickupDate?: string;
  dropoffDate?: string;
  search?: string;
}

// ========== LOCATIONS ==========
export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  contact_number?: string;
  is_active: boolean;
  created_at: string;
}

// ========== INSURANCE ==========
export interface InsurancePlan {
  id: string;
  name: string;
  description?: string;
  coverage_amount?: number;
  daily_rate: number;
  is_active: boolean;
  created_at: string;
}

// ========== BOOKINGS/RESERVATIONS ==========
export interface Reservation {
  id: string;
  booking_reference: string;
  user_id: string;
  vehicle_id: string;
  pickup_location_id: string;
  dropoff_location_id: string;
  pickup_date: string;
  dropoff_date: string;
  insurance_plan_id?: string;
  status: ReservationStatus;
  base_amount: number;
  insurance_amount: number;
  deposit_amount: number;
  total_amount: number;
  booking_comments?: string;
  created_at: string;
  updated_at: string;

  // Joined fields
  customer_email?: string;
  customer_first_name?: string;
  customer_last_name?: string;
  customer_phone?: string;
  vehicle?: Vehicle;
  make?: string;
  model?: string;
  year?: number;
  license_plate?: string;
  daily_rate?: number;
  pickup_location_name?: string;
  pickup_location_address?: string;
  dropoff_location_name?: string;
  dropoff_location_address?: string;
  insurance_plan_name?: string;
}

export interface BookingCalculation {
  num_days: number;
  base_amount: number;
  insurance_amount: number;
  total_amount: number;
  deposit_amount: number;
  balance_due: number;
}

export interface CreateBookingData {
  vehicle_id: string;
  pickup_location_id: string;
  dropoff_location_id: string;
  pickup_date: string;
  dropoff_date: string;
  insurance_plan_id?: string;
  booking_comments?: string;
}

// ========== PAYMENTS ==========
export interface Payment {
  id: string;
  reservation_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_type: PaymentType;
  gcash_number?: string;
  gcash_reference?: string;
  gcash_screenshot_url?: string;
  received_by?: string;
  payment_status: PaymentStatus;
  payment_date?: string;
  notes?: string;
  created_at: string;

  // Joined fields
  booking_reference?: string;
  customer_name?: string;
  received_by_name?: string;
}

export interface SubmitPaymentData {
  reservation_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_type: PaymentType;
  gcash_number?: string;
  gcash_reference?: string;
  gcash_screenshot_url?: string;
  notes?: string;
}

// ========== RENTALS ==========
export interface Rental {
  id: string;
  reservation_id: string;
  actual_pickup_date?: string;
  actual_dropoff_date?: string;
  pickup_location_id?: string;
  dropoff_location_id?: string;
  starting_mileage: number;
  ending_mileage?: number;
  fuel_level_start: FuelLevel;
  fuel_level_end?: FuelLevel;
  condition_notes_pickup?: string;
  condition_notes_return?: string;
  pickup_photos?: string[];
  return_photos?: string[];
  damage_reported: boolean;
  damage_description?: string;
  damage_photos?: string[];
  checked_in_by?: string;
  checked_out_by?: string;
  hours_late: number;
  late_return_fee: number;
  fuel_charge: number;
  cleaning_fee: number;
  damage_charge: number;
  additional_charges: number;
  created_at: string;
  updated_at: string;
}

// ========== REVIEWS ==========
export interface Review {
  id: string;
  user_id: string;
  rental_id: string;
  vehicle_id: string;
  rating: number;
  cleanliness_rating?: number;
  vehicle_condition_rating?: number;
  comment?: string;
  created_at: string;
  updated_at: string;

  // Joined fields
  user_first_name?: string;
  user_last_name?: string;
  vehicle_make?: string;
  vehicle_model?: string;
}

export interface CreateReviewData {
  rental_id: string;
  vehicle_id: string;
  rating: number;
  cleanliness_rating?: number;
  vehicle_condition_rating?: number;
  comment?: string;
}

// ========== NOTIFICATIONS ==========
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_id?: string;
  related_type?: string;
  is_read: boolean;
  created_at: string;
}

// ========== DASHBOARD & STATS ==========
export interface DashboardStats {
  // Admin stats
  total_vehicles?: number;
  available_vehicles?: number;
  rented_vehicles?: number;
  maintenance_vehicles?: number;
  total_customers?: number;
  active_rentals?: number;
  total_bookings?: number;
  pending_payments?: number;
  total_revenue?: number;
  monthly_revenue?: number;
  today_pickups?: number;
  today_returns?: number;

  // Customer stats
  upcoming_bookings?: number;
  completed_bookings?: number;
  total_spent?: number;

  // Owner stats
  owner_vehicles?: number;
  owner_active_rentals?: number;
  owner_monthly_earnings?: number;
  owner_total_earnings?: number;

  // Recent data
  recent_bookings?: Reservation[];
  recent_payments?: Payment[];
  recent_rentals?: Rental[];
}

// ========== API RESPONSES ==========
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ========== SEARCH ==========
export interface SearchFilters {
  categories?: VehicleCategory[];
  locations?: Location[];
  priceRange?: {
    min_price: number;
    max_price: number;
    avg_price: number;
  };
  transmission?: Array<{ transmission_type: TransmissionType; count: number }>;
  fuelTypes?: Array<{ fuel_type: FuelType; count: number }>;
  seating?: {
    min_seating: number;
    max_seating: number;
  };
}