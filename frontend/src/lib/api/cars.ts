import apiClient from './client';
import { ApiResponse, Car, CarFilters } from './types';

export const carsApi = {
  // Get all cars with filters
  getAll: async (filters?: CarFilters): Promise<ApiResponse<{ cars: Car[] }>> => {
    const response = await apiClient.get('/cars', { params: filters });
    return response.data;
  },

  // Get car by ID
  getById: async (id: string): Promise<ApiResponse<{ car: Car }>> => {
    const response = await apiClient.get(`/cars/${id}`);
    return response.data;
  },

  // Get current owner's cars
  getMyCars: async (status?: string): Promise<ApiResponse<{ cars: Car[] }>> => {
    const response = await apiClient.get('/cars/my-cars', {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  // Create car listing
  create: async (data: Partial<Car>): Promise<ApiResponse<{ car: Car }>> => {
    const response = await apiClient.post('/cars', data);
    return response.data;
  },

  // Update car listing
  update: async (id: string, data: Partial<Car>): Promise<ApiResponse<{ car: Car }>> => {
    const response = await apiClient.put(`/cars/${id}`, data);
    return response.data;
  },

  // Delete car listing
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/cars/${id}`);
    return response.data;
  },

  // Check availability
  checkAvailability: async (
    id: string,
    pickup_date: string,
    return_date: string
  ): Promise<ApiResponse<{ available: boolean; pickup_date: string; return_date: string }>> => {
    const response = await apiClient.get(`/cars/${id}/availability`, {
      params: { pickup_date, return_date },
    });
    return response.data;
  },

  // Get blocked dates
  getBlockedDates: async (
    id: string
  ): Promise<ApiResponse<{ blockedDates: Array<{ blocked_from: string; blocked_until: string; reason?: string }> }>> => {
    const response = await apiClient.get(`/cars/${id}/blocked-dates`);
    return response.data;
  },

  // Block dates
  blockDates: async (
    id: string,
    data: { blocked_from: string; blocked_until: string; reason?: string }
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/cars/${id}/block-dates`, data);
    return response.data;
  },

  // Admin: Approve car
  approve: async (id: string, admin_notes?: string): Promise<ApiResponse<{ car: Car }>> => {
    const response = await apiClient.put(`/cars/${id}/approve`, { admin_notes });
    return response.data;
  },

  // Admin: Reject car
  reject: async (
    id: string,
    rejection_reason: string,
    admin_notes?: string
  ): Promise<ApiResponse<{ car: Car }>> => {
    const response = await apiClient.put(`/cars/${id}/reject`, { rejection_reason, admin_notes });
    return response.data;
  },

  // Owner: Resubmit rejected car
  resubmit: async (id: string): Promise<ApiResponse<{ car: Car }>> => {
    const response = await apiClient.post(`/cars/${id}/resubmit`);
    return response.data;
  },

  // Owner: Request delist for car
  requestDelist: async (id: string, data?: { reason?: string }): Promise<ApiResponse<{ request: any }>> => {
    const response = await apiClient.post(`/cars/${id}/delist-request`, data);
    return response.data;
  },

  // Admin: Get pending delist requests
  getDelistRequests: async (): Promise<ApiResponse<{ requests: any[] }>> => {
    const response = await apiClient.get('/admin/delist-requests');
    return response.data;
  },

  // Admin: Approve delist request
  approveDelist: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/admin/delist-requests/${id}/approve`);
    return response.data;
  },

  // Admin: Reject delist request
  rejectDelist: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/admin/delist-requests/${id}/reject`);
    return response.data;
  },

  // Admin: Force delist car directly
  forceDelist: async (id: string, data?: { reason?: string; admin_notes?: string }): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/admin/cars/${id}/delist`, data);
    return response.data;
  },
};