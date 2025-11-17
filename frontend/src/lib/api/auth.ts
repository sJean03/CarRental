import apiClient from './client';
import { ApiResponse, LoginResponse, User } from './types';

export const authApi = {
  // Register new user
  register: async (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    date_of_birth?: string;
    role?: 'customer' | 'owner';
    drivers_license_photo_url: string;
  }): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  // Login user
  login: async (data: {
    email: string;
    password: string;
  }): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  // Get current user profile
  getProfile: async (): Promise<ApiResponse<{ user: User; ownerProfile?: any }>> => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: Partial<User>): Promise<ApiResponse<{ user: User }>> => {
    const response = await apiClient.put('/auth/profile', data);
    return response.data;
  },

  // Change password
  changePassword: async (data: {
    current_password: string;
    new_password: string;
  }): Promise<ApiResponse<void>> => {
    const response = await apiClient.put('/auth/change-password', data);
    return response.data;
  },

  // Logout
  logout: async (): Promise<ApiResponse<void>> => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
};