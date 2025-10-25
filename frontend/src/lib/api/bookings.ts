import apiClient from './client';
import { ApiResponse, Booking, BookingFilters, BookingStats } from './types';

export const bookingsApi = {
  // Create booking
  create: async (data: {
    car_id: string;
    pickup_date: string;
    return_date: string;
    branch_id?: string;
    payment_plan?: 'full' | 'installment';
    installment_months?: number;
    customer_notes?: string;
  }): Promise<ApiResponse<{ booking: Booking }>> => {
    const response = await apiClient.post('/bookings', data);
    return response.data;
  },

  // Get booking by ID
  getById: async (id: string): Promise<ApiResponse<{ booking: Booking }>> => {
    const response = await apiClient.get(`/bookings/${id}`);
    return response.data;
  },

  // Get booking by reference
  getByReference: async (reference: string): Promise<ApiResponse<{ booking: Booking }>> => {
    const response = await apiClient.get(`/bookings/reference/${reference}`);
    return response.data;
  },

  // Get my bookings (customer)
  getMyBookings: async (filters?: BookingFilters): Promise<ApiResponse<{ bookings: Booking[] }>> => {
    const response = await apiClient.get('/bookings/my-bookings', { params: filters });
    return response.data;
  },

  // Get owner bookings
  getOwnerBookings: async (filters?: BookingFilters): Promise<ApiResponse<{ bookings: Booking[] }>> => {
    const response = await apiClient.get('/bookings/owner-bookings', { params: filters });
    return response.data;
  },

  // Get booking statistics
  getStats: async (): Promise<ApiResponse<{ stats: BookingStats }>> => {
    const response = await apiClient.get('/bookings/stats');
    return response.data;
  },

  // Cancel booking
  cancel: async (id: string, cancellation_reason?: string): Promise<ApiResponse<{ booking: Booking; refund_amount: number }>> => {
    const response = await apiClient.put(`/bookings/${id}/cancel`, { cancellation_reason });
    return response.data;
  },

  // Confirm booking (owner)
  confirm: async (id: string): Promise<ApiResponse<{ booking: Booking }>> => {
    const response = await apiClient.put(`/bookings/${id}/confirm`);
    return response.data;
  },

  // Update booking status
  updateStatus: async (id: string, status: string): Promise<ApiResponse<{ booking: Booking }>> => {
    const response = await apiClient.put(`/bookings/${id}/status`, { status });
    return response.data;
  },
};