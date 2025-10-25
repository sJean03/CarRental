import apiClient from './client';
import { ApiResponse } from './types';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_id?: string;
  related_type?: string;
  action_url?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export const notificationsApi = {
  // Get user notifications
  getAll: async (filters?: { is_read?: boolean }): Promise<ApiResponse<{ notifications: Notification[] }>> => {
    const response = await apiClient.get('/notifications', { params: filters });
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (id: string): Promise<ApiResponse<{ notification: Notification }>> => {
    const response = await apiClient.put(`/notifications/${id}/read`);
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async (): Promise<ApiResponse<void>> => {
    const response = await apiClient.put('/notifications/mark-all-read');
    return response.data;
  },

  // Delete notification
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/notifications/${id}`);
    return response.data;
  },

  // Get unread count
  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  },
};
