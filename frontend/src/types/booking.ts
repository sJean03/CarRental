export type ReservationStatus = 'pending_payment' | 'confirmed' | 'active' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'gcash';
export type PaymentStatus = 'pending' | 'verified' | 'completed' | 'refunded';

export interface Reservation {
  id: string;
  booking_reference: string;
  user_id: string;
  vehicle_id: string;
  vehicle_name?: string; // Make + Model
  vehicle_image?: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_date: string;
  dropoff_date: string;
  status: ReservationStatus;
  base_amount: number;
  insurance_amount: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  reservation_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_date?: string;
  gcash_reference?: string;
  created_at: string;
}