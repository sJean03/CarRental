// hooks/useApi.ts - Custom hooks for API calls
'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions = {}
) {
  const { immediate = false, onSuccess, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: any[]) => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFunction(...args);
        setData(result);
        onSuccess?.(result);
        return result;
      } catch (err: any) {
        const error = err.response?.data?.error || err.message || 'An error occurred';
        setError(new Error(error));
        onError?.(error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, onSuccess, onError]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

// Specific hooks for common operations
export function useVehicles(filters?: any) {
  const { vehicleService } = require('@/services');
  return useApi(() => vehicleService.getVehicles(filters), { immediate: true });
}

export function useVehicle(id?: string) {
  const { vehicleService } = require('@/services');
  return useApi(
    () => (id ? vehicleService.getVehicleById(id) : Promise.resolve(null)),
    { immediate: !!id }
  );
}

export function useCategories() {
  const { vehicleService } = require('@/services');
  return useApi(() => vehicleService.getCategories(), { immediate: true });
}

export function useLocations() {
  const { bookingService } = require('@/services');
  return useApi(() => bookingService.getLocations(), { immediate: true });
}

export function useInsurancePlans() {
  const { bookingService } = require('@/services');
  return useApi(() => bookingService.getInsurancePlans(), { immediate: true });
}

export function useMyBookings(status?: string) {
  const { bookingService } = require('@/services');
  return useApi(() => bookingService.getMyBookings(status), { immediate: true });
}

export function useBooking(id?: string) {
  const { bookingService } = require('@/services');
  return useApi(
    () => (id ? bookingService.getBookingById(id) : Promise.resolve(null)),
    { immediate: !!id }
  );
}

export function useDashboardStats(role: 'customer' | 'admin' | 'owner') {
  const { dashboardService, adminService, ownerService } = require('@/services');
  
  const serviceMap = {
    customer: dashboardService.getCustomerDashboard,
    admin: adminService.getDashboardStats,
    owner: ownerService.getDashboard,
  };

  return useApi(serviceMap[role], { immediate: true });
}

export function useNotifications() {
  const { notificationService } = require('@/services');
  return useApi(() => notificationService.getNotifications(), { immediate: true });
}