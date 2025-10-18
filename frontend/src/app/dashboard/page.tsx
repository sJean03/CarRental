'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui/badge'

// Mock upcoming bookings (we'll replace with API later)
const mockUpcomingBookings = [
  {
    id: '1',
    booking_reference: 'RES-2025-0001',
    vehicle_name: 'Toyota Vios 2020',
    pickup_date: '2025-10-25',
    dropoff_date: '2025-10-28',
    status: 'confirmed' as const,
    total_amount: 7500
  }
]

export default function DashboardPage() {
  const { user } = useAuth()

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
            <CardDescription>Active Bookings</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Currently renting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming Bookings</CardDescription>
            <CardTitle className="text-3xl">1</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Confirmed reservations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed Rentals</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Past bookings</p>
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
          {mockUpcomingBookings.length > 0 ? (
            <div className="space-y-4">
              {mockUpcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{booking.vehicle_name}</p>
                      <Badge variant="secondary">{booking.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.pickup_date).toLocaleDateString()} - {new Date(booking.dropoff_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ref: {booking.booking_reference}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₱{booking.total_amount.toLocaleString()}</p>
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <Link href={`/dashboard/bookings/${booking.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button asChild className="h-auto py-4">
              <Link href="/vehicles">
                <div className="text-left">
                  <p className="font-semibold">Browse Vehicles</p>
                  <p className="text-xs opacity-90">Find your next rental</p>
                </div>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4">
              <Link href="/dashboard/profile">
                <div className="text-left">
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