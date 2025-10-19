// lib/api.ts
import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear auth and redirect
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API Endpoints
export const endpoints = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    profile: '/auth/profile',
    updateProfile: '/auth/profile',
    changePassword: '/auth/change-password',
  },

  // Vehicles
  vehicles: {
    getAll: '/vehicles',
    getById: (id: string) => `/vehicles/${id}`,
    getByCategory: (categoryId: string) => `/vehicles/category/${categoryId}`,
    checkAvailability: (id: string) => `/vehicles/${id}/availability`,
    getReviews: (id: string) => `/vehicles/${id}/reviews`,
    categories: '/vehicles/categories',
    create: '/vehicles',
    update: (id: string) => `/vehicles/${id}`,
    delete: (id: string) => `/vehicles/${id}`,
    updateStatus: (id: string) => `/vehicles/${id}/status`,
  },

  // Bookings
  bookings: {
    create: '/bookings',
    getAll: '/bookings',
    getMy: '/bookings/my-bookings',
    getById: (id: string) => `/bookings/${id}`,
    cancel: (id: string) => `/bookings/${id}/cancel`,
    calculateCost: '/bookings/calculate-cost',
    insurancePlans: '/bookings/insurance-plans',
    locations: '/bookings/locations',
  },

  // Payments
  payments: {
    submit: '/payments',
    getAll: '/payments',
    getByBooking: (reservationId: string) => `/payments/booking/${reservationId}`,
    getPending: '/payments/pending',
    verify: (id: string) => `/payments/${id}/verify`,
    refund: (id: string) => `/payments/${id}/refund`,
  },

  // Admin
  admin: {
    dashboard: '/admin/dashboard/stats',
    checkIn: '/admin/check-in',
    checkOut: '/admin/check-out',
    activeRentals: '/admin/active-rentals',
  },

  // Owner
  owner: {
    dashboard: '/owners/dashboard',
    vehicles: '/owners/vehicles',
    payments: '/owners/payments',
    earnings: '/owners/earnings/summary',
    vehicleAnalytics: (vehicleId: string) => `/owners/vehicles/${vehicleId}/analytics`,
  },

  // Dashboard
  dashboard: {
    customer: '/dashboard/customer',
    admin: '/dashboard/admin',
    health: '/dashboard/health',
  },

  // Reviews
  reviews: {
    create: '/reviews',
    getByVehicle: (vehicleId: string) => `/reviews/vehicle/${vehicleId}`,
    getMy: '/reviews/my-reviews',
    update: (id: string) => `/reviews/${id}`,
    delete: (id: string) => `/reviews/${id}`,
  },

  // Search
  search: {
    vehicles: '/search/vehicles',
    filters: '/search/filters',
  },

  // Notifications
  notifications: {
    getAll: '/notifications',
    markAsRead: (id: string) => `/notifications/${id}/read`,
    markAllAsRead: '/notifications/read-all',
    delete: (id: string) => `/notifications/${id}`,
  },

  // Tracking
  tracking: {
    record: '/tracking',
    getCurrent: (vehicleId: string) => `/tracking/vehicle/${vehicleId}/current`,
    getHistory: (vehicleId: string) => `/tracking/vehicle/${vehicleId}/history`,
    getActive: '/tracking/active',
  },

  // Maintenance
  maintenance: {
    getAll: '/maintenance',
    create: '/maintenance',
    update: (id: string) => `/maintenance/${id}`,
    complete: (id: string) => `/maintenance/${id}/complete`,
    getUpcoming: '/maintenance/upcoming',
  },

  // Reports
  reports: {
    revenue: '/reports/revenue',
    fleetUtilization: '/reports/fleet-utilization',
    customerAnalytics: '/reports/customer-analytics',
    paymentAnalytics: '/reports/payment-analytics',
    ownerEarnings: '/reports/owner-earnings',
  },
};

export default api;