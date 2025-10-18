// Based on your database schema
export type TransmissionType = 'automatic' | 'manual';
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid';
export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'retired';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  category_id: string;
  category_name?: string;
  transmission_type: TransmissionType;
  fuel_type: FuelType;
  seating_capacity: number;
  current_mileage: number;
  daily_rate: number;
  status: VehicleStatus;
  image_urls: string[];
}

export interface VehicleCategory {
  id: string;
  name: string;
  description: string;
}

export interface VehicleFilters {
  category?: string;
  transmission?: TransmissionType;
  fuel_type?: FuelType;
  min_price?: number;
  max_price?: number;
  min_seats?: number;
  search?: string;
}