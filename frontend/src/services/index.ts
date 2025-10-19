// services/index.ts - All API service functions
import api, { endpoints } from '@/lib/api';
import type {
  User, AuthResponse, LoginCredentials, RegisterData,
  Vehicle, VehicleCategory, VehicleFilters,
  Location, InsurancePlan,
  Reservation, BookingCalculation, CreateBookingData,
  Payment, SubmitPaymentData,
  Review, CreateReviewData,
  Notification, DashboardStats, SearchFilters,
  ApiResponse, PaginatedResponse
} from '@/types';

// ========== AUTH SERVICE ==========
export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post(endpoints.auth.login, credentials);
    return data;
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    const { data } = await api.post(endpoints.auth.register, userData);
    return data;
  },

  async getProfile(): Promise<ApiResponse<User>> {
    const { data } = await api.get(endpoints.auth.profile);
    return data;
  },

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    const { data } = await api.put(endpoints.auth.updateProfile, userData);
    return data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    const { data } = await api.put(endpoints.auth.changePassword, {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return data;
  },
};

// ========== VEHICLE SERVICE ==========
export const vehicleService = {
  async getVehicles(filters?: VehicleFilters): Promise<PaginatedResponse<Vehicle>> {
    const { data } = await api.get(endpoints.vehicles.getAll, { params: filters });
    return data;
  },

  async getVehicleById(id: string): Promise<ApiResponse<Vehicle>> {
    const { data } = await api.get(endpoints.vehicles.getById(id));
    return data;
  },

  async getVehiclesByCategory(categoryId: string): Promise<PaginatedResponse<Vehicle>> {
    const { data } = await api.get(endpoints.vehicles.getByCategory(categoryId));
    return data;
  },

  async checkAvailability(vehicleId: string, pickupDate: string, dropoffDate: string): Promise<ApiResponse<{ available: boolean }>> {
    const { data } = await api.get(endpoints.vehicles.checkAvailability(vehicleId), {
      params: { pickupDate, dropoffDate },
    });
    return data;
  },

  async getCategories(): Promise<PaginatedResponse<VehicleCategory>> {
    const { data } = await api.get(endpoints.vehicles.categories);
    return data;
  },

  async getVehicleReviews(vehicleId: string): Promise<PaginatedResponse<Review>> {
    const { data } = await api.get(endpoints.vehicles.getReviews(vehicleId));
    return data;
  },

  // Admin functions
  async createVehicle(vehicleData: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> {
    const { data } = await api.post(endpoints.vehicles.create, vehicleData);
    return data;
  },

  async updateVehicle(id: string, vehicleData: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> {
    const { data } = await api.put(endpoints.vehicles.update(id), vehicleData);
    return data;
  },

  async updateVehicleStatus(id: string, status: string): Promise<ApiResponse<Vehicle>> {
    const { data } = await api.patch(endpoints.vehicles.updateStatus(id), { status });
    return data;
  },

  async deleteVehicle(id: string): Promise<ApiResponse> {
    const { data } = await api.delete(endpoints.vehicles.delete(id));
    return data;
  },
};

// ========== BOOKING SERVICE ==========
export const bookingService = {
  async calculateCost(bookingData: {
    vehicle_id: string;
    pickup_date: string;
    dropoff_date: string;
    insurance_plan_id?: string;
  }): Promise<ApiResponse<BookingCalculation>> {
    const { data } = await api.post(endpoints.bookings.calculateCost, bookingData);
    return data;
  },

  async createBooking(bookingData: CreateBookingData): Promise<ApiResponse<Reservation>> {
    const { data } = await api.post(endpoints.bookings.create, bookingData);
    return data;
  },

  async getMyBookings(status?: string): Promise<PaginatedResponse<Reservation>> {
    const { data } = await api.get(endpoints.bookings.getMy, {
      params: status ? { status } : undefined,
    });
    return data;
  },

  async getBookingById(id: string): Promise<ApiResponse<Reservation>> {
    const { data } = await api.get(endpoints.bookings.getById(id));
    return data;
  },

  async cancelBooking(id: string): Promise<ApiResponse<Reservation>> {
    const { data } = await api.patch(endpoints.bookings.cancel(id));
    return data;
  },

  async getInsurancePlans(): Promise<PaginatedResponse<InsurancePlan>> {
    const { data } = await api.get(endpoints.bookings.insurancePlans);
    return data;
  },

  async getLocations(): Promise<PaginatedResponse<Location>> {
    const { data } = await api.get(endpoints.bookings.locations);
    return data;
  },

  // Admin functions
  async getAllBookings(filters?: { status?: string; vehicle_id?: string }): Promise<PaginatedResponse<Reservation>> {
    const { data } = await api.get(endpoints.bookings.getAll, { params: filters });
    return data;
  },
};

// ========== PAYMENT SERVICE ==========
export const paymentService = {
  async submitPayment(paymentData: SubmitPaymentData): Promise<ApiResponse<Payment>> {
    const { data } = await api.post(endpoints.payments.submit, paymentData);
    return data;
  },

  async getPaymentHistory(reservationId: string): Promise<PaginatedResponse<Payment>> {
    const { data } = await api.get(endpoints.payments.getByBooking(reservationId));
    return data;
  },

  async uploadGCashScreenshot(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('screenshot', file);
    const { data } = await api.post('/upload/gcash-screenshot', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // Admin functions
  async getAllPayments(filters?: { status?: string }): Promise<PaginatedResponse<Payment>> {
    const { data } = await api.get(endpoints.payments.getAll, { params: filters });
    return data;
  },

  async getPendingPayments(): Promise<PaginatedResponse<Payment>> {
    const { data } = await api.get(endpoints.payments.getPending);
    return data;
  },

  async verifyPayment(id: string): Promise<ApiResponse<Payment>> {
    const { data } = await api.patch(endpoints.payments.verify(id));
    return data;
  },

  async refundPayment(id: string, amount: number, notes?: string): Promise<ApiResponse<Payment>> {
    const { data } = await api.patch(endpoints.payments.refund(id), { amount, notes });
    return data;
  },
};

// ========== ADMIN SERVICE ==========
export const adminService = {
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    const { data } = await api.get(endpoints.admin.dashboard);
    return data;
  },

  async checkIn(checkInData: {
    reservation_id: string;
    starting_mileage: number;
    fuel_level_start: string;
    condition_notes_pickup?: string;
    pickup_photos?: string[];
  }): Promise<ApiResponse> {
    const { data } = await api.post(endpoints.admin.checkIn, checkInData);
    return data;
  },

  async checkOut(checkOutData: {
    rental_id: string;
    ending_mileage: number;
    fuel_level_end: string;
    condition_notes_return?: string;
    return_photos?: string[];
    damage_reported?: boolean;
    damage_description?: string;
    damage_photos?: string[];
  }): Promise<ApiResponse> {
    const { data } = await api.post(endpoints.admin.checkOut, checkOutData);
    return data;
  },

  async getActiveRentals(): Promise<PaginatedResponse> {
    const { data } = await api.get(endpoints.admin.activeRentals);
    return data;
  },
};

// ========== OWNER SERVICE ==========
export const ownerService = {
  async getDashboard(): Promise<ApiResponse<DashboardStats>> {
    const { data } = await api.get(endpoints.owner.dashboard);
    return data;
  },

  async getVehicles(): Promise<PaginatedResponse<Vehicle>> {
    const { data } = await api.get(endpoints.owner.vehicles);
    return data;
  },

  async getPayments(): Promise<PaginatedResponse> {
    const { data } = await api.get(endpoints.owner.payments);
    return data;
  },

  async getEarningsSummary(): Promise<ApiResponse> {
    const { data } = await api.get(endpoints.owner.earnings);
    return data;
  },

  async getVehicleAnalytics(vehicleId: string): Promise<ApiResponse> {
    const { data } = await api.get(endpoints.owner.vehicleAnalytics(vehicleId));
    return data;
  },
};

// ========== DASHBOARD SERVICE ==========
export const dashboardService = {
  async getCustomerDashboard(): Promise<ApiResponse<DashboardStats>> {
    const { data } = await api.get(endpoints.dashboard.customer);
    return data;
  },

  async getAdminDashboard(): Promise<ApiResponse<DashboardStats>> {
    const { data } = await api.get(endpoints.dashboard.admin);
    return data;
  },

  async getSystemHealth(): Promise<ApiResponse> {
    const { data } = await api.get(endpoints.dashboard.health);
    return data;
  },
};

// ========== REVIEW SERVICE ==========
export const reviewService = {
  async createReview(reviewData: CreateReviewData): Promise<ApiResponse<Review>> {
    const { data } = await api.post(endpoints.reviews.create, reviewData);
    return data;
  },

  async getVehicleReviews(vehicleId: string): Promise<PaginatedResponse<Review>> {
    const { data } = await api.get(endpoints.reviews.getByVehicle(vehicleId));
    return data;
  },

  async getMyReviews(): Promise<PaginatedResponse<Review>> {
    const { data } = await api.get(endpoints.reviews.getMy);
    return data;
  },

  async updateReview(id: string, reviewData: Partial<Review>): Promise<ApiResponse<Review>> {
    const { data } = await api.put(endpoints.reviews.update(id), reviewData);
    return data;
  },

  async deleteReview(id: string): Promise<ApiResponse> {
    const { data } = await api.delete(endpoints.reviews.delete(id));
    return data;
  },
};

// ========== SEARCH SERVICE ==========
export const searchService = {
  async searchVehicles(params: VehicleFilters): Promise<PaginatedResponse<Vehicle>> {
    const { data } = await api.get(endpoints.search.vehicles, { params });
    return data;
  },

  async getSearchFilters(): Promise<ApiResponse<SearchFilters>> {
    const { data } = await api.get(endpoints.search.filters);
    return data;
  },
};

// ========== NOTIFICATION SERVICE ==========
export const notificationService = {
  async getNotifications(): Promise<PaginatedResponse<Notification>> {
    const { data } = await api.get(endpoints.notifications.getAll);
    return data;
  },

  async markAsRead(id: string): Promise<ApiResponse> {
    const { data } = await api.patch(endpoints.notifications.markAsRead(id));
    return data;
  },

  async markAllAsRead(): Promise<ApiResponse> {
    const { data } = await api.patch(endpoints.notifications.markAllAsRead);
    return data;
  },

  async deleteNotification(id: string): Promise<ApiResponse> {
    const { data } = await api.delete(endpoints.notifications.delete(id));
    return data;
  },
};

// Export all services
export default {
  auth: authService,
  vehicle: vehicleService,
  booking: bookingService,
  payment: paymentService,
  admin: adminService,
  owner: ownerService,
  dashboard: dashboardService,
  review: reviewService,
  search: searchService,
  notification: notificationService,
};