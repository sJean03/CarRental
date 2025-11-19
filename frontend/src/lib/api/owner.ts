import apiClient from './client';

export interface OwnerRegistrationData {
  business_name?: string;
  tax_id?: string;
  bank_account_number: string;
  bank_name: string;
  preferred_payout_method?: 'credit_card' | 'debit_card';
}

export interface OwnerProfile {
  id: string;
  user_id: string;
  business_name: string | null;
  tax_id: string | null;
  bank_account_number: string;
  bank_name: string;
  preferred_payout_method: string;
  total_earnings: number;
  total_rentals: number;
  average_rating: number;
  response_rate: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export const ownerApi = {
  /**
   * Check if current user has owner profile
   */
  async checkOwnerStatus() {
    const response = await apiClient.get('/owner/check');
    return response.data;
  },

  /**
   * Register as an owner (customers can become owners)
   */
  async register(data: OwnerRegistrationData) {
    const response = await apiClient.post('/owner/register', data);
    return response.data;
  },

  /**
   * Get owner profile
   */
  async getProfile() {
    const response = await apiClient.get('/owner/profile');
    return response.data;
  },

  /**
   * Update owner profile
   */
  async updateProfile(data: Partial<OwnerRegistrationData>) {
    const response = await apiClient.put('/owner/profile', data);
    return response.data;
  },

  /**
   * Get owner stats/dashboard data
   */
  async getStats() {
    const response = await apiClient.get('/owner/stats');
    return response.data;
  },

  /**
   * Get owner payouts
   */
  async getPayouts() {
    const response = await apiClient.get('/owner/payouts');
    return response.data;
  },
};
