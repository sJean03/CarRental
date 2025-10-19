'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { adminService, bookingService, paymentService } from '@/services'
import { DashboardStats, Reservation, Payment } from '@/types'
import { Loader2, Car, Users, DollarSign, Calendar, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate, formatStatus, getStatusColor } from '@/lib/utils'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentBookings, setRecentBookings] = useState<Reservation[]>([])
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch admin dashboard stats
      const statsRes = await adminService.getDashboardStats()
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data)
      }

      // Fetch recent bookings
      const bookingsRes = await bookingService.getAllBookings()
      if (bookingsRes.success) {
        const bookingsData = bookingsRes.data || (bookingsRes as any).bookings || []
        // Sort by created date and take latest 5
        const sorted = bookingsData.sort((a: Reservation, b: Reservation) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        setRecentBookings(sorted.slice(0, 5))
      }

      // Fetch pending payments
      const paymentsRes = await paymentService.getPendingPayments()
      if (paymentsRes.success) {
        const paymentsData = paymentsRes.data || (paymentsRes as any).payments || []
        setPendingPayments(paymentsData.slice(0, 5))
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Manage vehicles, reservations, and monitor system performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Total Vehicles
            </CardDescription>
            <CardTitle className="text-3xl">{stats?.total_vehicles || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 text-xs">
              <span className="text-green-600">{stats?.available_vehicles || 0} Available</span>
              <span className="text-blue-600">{stats?.rented_vehicles || 0} Rented</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Active Rentals
            </CardDescription>
            <CardTitle className="text-3xl">{stats?.active_rentals || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats?.total_bookings || 0} total bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Monthly Revenue
            </CardDescription>
            <CardTitle className="text-3xl">
              {formatCurrency(stats?.monthly_revenue || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Total: {formatCurrency(stats?.total_revenue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Customers
            </CardDescription>
            <CardTitle className="text-3xl">
              {stats?.total_customers || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Payments */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Pending Payments</CardTitle>
                <CardDescription>Payments awaiting verification</CardDescription>
              </div>
              {pendingPayments.length > 0 && (
                <Badge variant="destructive">{pendingPayments.length}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {pendingPayments.length > 0 ? (
              <div className="space-y-4">
                {pendingPayments.map((payment) => (
                  <div key={payment.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">
                          {formatCurrency(payment.amount)}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {payment.payment_method}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {payment.booking_reference || 'Booking'} - {payment.customer_name || 'Customer'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(payment.created_at)}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/payments?highlight=${payment.id}`}>
                        Verify
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-600" />
                <p className="text-sm text-muted-foreground">No pending payments</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Latest reservations</CardDescription>
          </CardHeader>
          <CardContent>
            {recentBookings.length > 0 ? (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">
                          {booking.make} {booking.model}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusColor(booking.status)}`}
                        >
                          {formatStatus(booking.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {booking.customer_first_name} {booking.customer_last_name} • {booking.booking_reference}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(booking.created_at)}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/admin/reservations?id=${booking.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No recent bookings</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button asChild className="h-auto py-4">
              <Link href="/admin/vehicles">
                <div className="text-left w-full">
                  <p className="font-semibold">Manage Vehicles</p>
                  <p className="text-xs opacity-90">Add, edit, or remove</p>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4">
              <Link href="/admin/reservations">
                <div className="text-left w-full">
                  <p className="font-semibold">View Reservations</p>
                  <p className="text-xs">Check bookings</p>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4">
              <Link href="/admin/customers">
                <div className="text-left w-full">
                  <p className="font-semibold">Manage Customers</p>
                  <p className="text-xs">View user accounts</p>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4">
              <Link href="/admin/payments">
                <div className="text-left w-full">
                  <p className="font-semibold">Payment Verification</p>
                  <p className="text-xs">{pendingPayments.length} pending</p>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today's Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pickups</span>
                <span className="font-semibold">{stats?.today_pickups || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Returns</span>
                <span className="font-semibold">{stats?.today_returns || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Verifications</span>
                <span className="font-semibold text-amber-600">{pendingPayments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Maintenance Due</span>
                <span className="font-semibold">{stats?.maintenance_vehicles || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-semibold">All Systems Operational</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}