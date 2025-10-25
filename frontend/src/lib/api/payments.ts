import apiClient from './client';
import { ApiResponse, Payment, PaymentStats, InstallmentInfo } from './types';

export const paymentsApi = {
  // Process payment
  process: async (data: {
    booking_id: string;
    payment_method: 'credit_card' | 'debit_card';
    card_last4?: string;
    card_brand?: string;
    installment_number?: number;
  }): Promise<ApiResponse<{ payment: Payment; booking_status: string }>> => {
    const response = await apiClient.post('/payments/process', data);
    return response.data;
  },

  // Get payment by ID
  getById: async (id: string): Promise<ApiResponse<{ payment: Payment }>> => {
    const response = await apiClient.get(`/payments/${id}`);
    return response.data;
  },

  // Get payments for booking
  getByBooking: async (bookingId: string): Promise<ApiResponse<{ payments: Payment[] }>> => {
    const response = await apiClient.get(`/payments/booking/${bookingId}`);
    return response.data;
  },

  // Get pending installments
  getPendingInstallments: async (bookingId: string): Promise<ApiResponse<InstallmentInfo>> => {
    const response = await apiClient.get(`/payments/booking/${bookingId}/installments`);
    return response.data;
  },

  // Process refund (admin)
  refund: async (
    id: string,
    refund_amount: number,
    refund_reason: string
  ): Promise<ApiResponse<{ payment: Payment }>> => {
    const response = await apiClient.post(`/payments/${id}/refund`, { refund_amount, refund_reason });
    return response.data;
  },

  // Get payment statistics (admin)
  getStats: async (filters?: {
    start_date?: string;
    end_date?: string;
    status?: string;
  }): Promise<ApiResponse<{ stats: PaymentStats }>> => {
    const response = await apiClient.get('/payments/stats', { params: filters });
    return response.data;
  },

  // Get recent payments (admin)
  getRecent: async (limit?: number): Promise<ApiResponse<{ payments: Payment[] }>> => {
    const response = await apiClient.get('/payments/recent', {
      params: limit ? { limit } : undefined,
    });
    return response.data;
  },
};