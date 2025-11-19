'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

interface LifecycleStats {
  status: string;
  count: number;
  total_value: number;
}

interface OverdueBooking {
  id: number;
  booking_reference: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  make: string;
  model: string;
  license_plate: string;
  return_date: string;
  days_overdue: number;
  late_fee_display: number;
}

interface DashboardData {
  lifecycle: LifecycleStats[];
  overdue: {
    count: number;
    totalLateFees: number;
  };
  upcoming: {
    toActive: number;
    toReturn: number;
  };
  scheduler: {
    isRunning: boolean;
    jobCount: number;
    jobs: string[];
  };
}

export default function AdminLifecyclePage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [overdueBookings, setOverdueBookings] = useState<OverdueBooking[]>([]);
  const [triggeringJob, setTriggeringJob] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch lifecycle statistics
  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/admin/lifecycle/stats');
      setStats(response.data.data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching lifecycle stats:', error);
    }
  };

  // Fetch overdue bookings
  const fetchOverdueBookings = async () => {
    try {
      const response = await apiClient.get('/admin/bookings/overdue');
      setOverdueBookings(response.data.data || []);
    } catch (error) {
      console.error('Error fetching overdue bookings:', error);
    }
  };

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchOverdueBookings()]);
      setLoading(false);
    };
    loadData();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchOverdueBookings();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Manually trigger a job
  const triggerJob = async (jobName: string) => {
    setTriggeringJob(jobName);
    try {
      const response = await apiClient.post(`/admin/jobs/${jobName}/trigger`, {});
      alert(`Job '${jobName}' executed successfully!\n\n${JSON.stringify(response.data.data, null, 2)}`);
      // Refresh data after job runs
      await Promise.all([fetchStats(), fetchOverdueBookings()]);
    } catch (error: any) {
      alert(`Failed to execute job: ${error.response?.data?.message || error.message}`);
    } finally {
      setTriggeringJob(null);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending_payment: 'bg-yellow-100 text-yellow-800',
      pending_owner_confirmation: 'bg-orange-100 text-orange-800',
      confirmed: 'bg-blue-gradient/10 text-blue-700',
      active: 'bg-green-100 text-green-800',
      returned: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lifecycle data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Booking Lifecycle Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Monitor automated booking transitions and lifecycle status
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>

        {/* Scheduler Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Scheduler Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <div className="text-lg font-semibold">
                {stats?.scheduler.isRunning ? (
                  <span className="text-green-600">✓ Running</span>
                ) : (
                  <span className="text-red-600">✗ Stopped</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Active Jobs</div>
              <div className="text-lg font-semibold">{stats?.scheduler.jobCount || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Jobs</div>
              <div className="text-sm">{stats?.scheduler.jobs.join(', ') || 'None'}</div>
            </div>
            <div>
              <button
                onClick={() => triggerJob('lifecycle')}
                disabled={triggeringJob === 'lifecycle'}
                className="w-full bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 text-sm"
              >
                {triggeringJob === 'lifecycle' ? 'Running...' : 'Run Lifecycle Job'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Lifecycle Status Cards */}
          {stats?.lifecycle.map((stat) => (
            <div key={stat.status} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 capitalize">
                    {stat.status.replace(/_/g, ' ')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    ${Number(stat.total_value || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(stat.status)}`}>
                    {stat.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Alert Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Overdue Bookings */}
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Overdue Bookings</h3>
            <p className="text-3xl font-bold text-red-600">{stats?.overdue.count || 0}</p>
            <p className="text-sm text-red-700 mt-1">
              Total Late Fees: ${stats?.overdue.totalLateFees.toFixed(2) || '0.00'}
            </p>
            <button
              onClick={() => triggerJob('overdue')}
              disabled={triggeringJob === 'overdue'}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:bg-gray-400"
            >
              {triggeringJob === 'overdue' ? 'Running...' : 'Process Overdue'}
            </button>
          </div>

          {/* Upcoming Active */}
          <div className="bg-blue-gradient/10 border-l-4 border-blue-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-700 mb-2">Ready to Activate</h3>
            <p className="text-3xl font-bold text-blue-700">{stats?.upcoming.toActive || 0}</p>
            <p className="text-sm text-blue-700 mt-1">Bookings ready for pickup</p>
          </div>

          {/* Upcoming Return */}
          <div className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">Ready to Return</h3>
            <p className="text-3xl font-bold text-purple-600">{stats?.upcoming.toReturn || 0}</p>
            <p className="text-sm text-purple-700 mt-1">Due for return soon</p>
          </div>
        </div>

        {/* Overdue Bookings Table */}
        {overdueBookings.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Overdue Bookings Detail</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Booking
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Return Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Days Late
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Late Fee
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {overdueBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {booking.booking_reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {booking.customer_first_name} {booking.customer_last_name}
                        <div className="text-xs text-gray-500">{booking.customer_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {booking.make} {booking.model}
                        <div className="text-xs text-gray-500">{booking.license_plate}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(booking.return_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
                          {booking.days_overdue} days
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                        ${booking.late_fee_display.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="text-center">
          <button
            onClick={() => {
              fetchStats();
              fetchOverdueBookings();
            }}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}
