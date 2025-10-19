'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui/badge'
import { dashboardService, bookingService } from '@/services'
import { Reservation, DashboardStats } from '@/types'
import { Loader2, Calendar, Car, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate, getStatusColor, formatStatus } from '@/lib/utils'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [upcomingBookings, setUpcomingBookings] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch dashboard stats and bookings in parallel
      const [statsRes, bookingsRes] = await Promise.all([
        dashboardService.getCustomerDashboard().catch(() => null),
        bookingService.getMyBookings().catch(() => null)
      ])

      // Handle stats
      if (statsRes?.success && statsRes.data) {
        setStats(statsRes.data)
      }

      // Handle bookings
      if (bookingsRes?.success) {
        const bookingsData = bookingsRes.data || (bookingsRes as any).bookings || []
        
        // Filter for upcoming bookings (confirmed or pending_payment)
        const upcoming = bookingsData.filter((b: Reservation) => 
          (b.status === 'confirmed' || b.status === 'pending_payment') &&
          new Date(b.pickup_date) >= new Date()
        )
        
        setUpcomingBookings(upcoming.slice(0, 3)) // Show max 3
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
      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome back, {user?.first_name}!</CardTitle>
          <CardDescription>
            Here's an overview of your rental activity
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Active Bookings
            </CardDescription>
            <CardTitle className="text-3xl">
              {stats?.upcoming_bookings || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Currently active or upcoming</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Total Bookings
            </CardDescription>
            <CardTitle className="text-3xl">
              {(stats?.upcoming_bookings || 0) + (stats?.completed_bookings || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">All time bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed Rentals
            </CardDescription>
            <CardTitle className="text-3xl">
              {stats?.completed_bookings || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Total spent: {formatCurrency(stats?.total_spent || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Upcoming Bookings</CardTitle>
              <CardDescription>Your confirmed reservations</CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard/bookings">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length > 0 ? (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {booking.make} {booking.model} {booking.year || ''}
                      </p>
                      <Badge 
                        variant="secondary"
                        className={getStatusColor(booking.status)}
                      >
                        {formatStatus(booking.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(booking.pickup_date)} - {formatDate(booking.dropoff_date)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ref: {booking.booking_reference}
                    </p>
                    {booking.pickup_location_name && (
                      <p className="text-xs text-muted-foreground">
                        Pickup: {booking.pickup_location_name}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(booking.total_amount)}</p>
                    {booking.status === 'pending_payment' && (
                      <p className="text-xs text-amber-600 mb-2">Payment Pending</p>
                    )}
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <Link href={`/dashboard/bookings/${booking.id}`}>
                        {booking.status === 'pending_payment' ? 'Pay Now' : 'View Details'}
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No upcoming bookings</p>
              <Button asChild>
                <Link href="/vehicles">Browse Vehicles</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild className="h-auto py-4">
              <Link href="/vehicles">
                <div className="text-left w-full">
                  <p className="font-semibold">Browse Vehicles</p>
                  <p className="text-xs opacity-90">Find your next rental</p>
                </div>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4">
              <Link href="/dashboard/bookings">
                <div className="text-left w-full">
                  <p className="font-semibold">My Bookings</p>
                  <p className="text-xs">View all reservations</p>
                </div>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4">
              <Link href="/dashboard/profile">
                <div className="text-left w-full">
                  <p className="font-semibold">Update Profile</p>
                  <p className="text-xs">Manage your information</p>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}