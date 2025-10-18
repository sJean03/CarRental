'use client'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Reservation } from '@/types/booking'

// Mock bookings data (same as bookings page)
const mockBookings: Reservation[] = [
  {
    id: '1',
    booking_reference: 'RES-2025-0001',
    user_id: 'user1',
    vehicle_id: '1',
    vehicle_name: 'Toyota Vios 2020',
    vehicle_image: '',
    pickup_location: 'Manila Branch',
    dropoff_location: 'Manila Branch',
    pickup_date: '2025-10-25T09:00:00',
    dropoff_date: '2025-10-28T17:00:00',
    status: 'confirmed',
    base_amount: 7500,
    insurance_amount: 0,
    total_amount: 7500,
    created_at: '2025-10-19T10:00:00',
    updated_at: '2025-10-19T10:30:00'
  },
  {
    id: '2',
    booking_reference: 'RES-2025-0002',
    user_id: 'user1',
    vehicle_id: '3',
    vehicle_name: 'Mitsubishi Montero Sport 2022',
    vehicle_image: '',
    pickup_location: 'Quezon City Branch',
    dropoff_location: 'Makati Branch',
    pickup_date: '2025-09-15T08:00:00',
    dropoff_date: '2025-09-20T18:00:00',
    status: 'completed',
    base_amount: 22500,
    insurance_amount: 1000,
    total_amount: 23500,
    created_at: '2025-09-10T14:00:00',
    updated_at: '2025-09-20T19:00:00'
  }
]

export default function BookingDetailsPage({ params }: { params: { id: string } }) {
  const booking = mockBookings.find(b => b.id === params.id)

  if (!booking) {
    notFound()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
      case 'active':
        return 'bg-green-100 text-green-800 hover:bg-green-100'
      case 'completed':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-100'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    }
  }

  const calculateDays = (pickup: string, dropoff: string) => {
    const start = new Date(pickup)
    const end = new Date(dropoff)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
        {' / '}
        <Link href="/dashboard/bookings" className="hover:text-foreground">My Bookings</Link>
        {' / '}
        <span className="text-foreground">{booking.booking_reference}</span>
      </div>

      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Booking Details</h1>
          <p className="text-muted-foreground">{booking.booking_reference}</p>
        </div>
        <Badge className={getStatusColor(booking.status)}>
          {booking.status.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">No Image</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{booking.vehicle_name}</h3>
                  <Button variant="link" className="px-0" asChild>
                    <Link href={`/vehicles/${booking.vehicle_id}`}>
                      View Vehicle Details →
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rental Period */}
          <Card>
            <CardHeader>
              <CardTitle>Rental Period</CardTitle>
              <CardDescription>
                {calculateDays(booking.pickup_date, booking.dropoff_date)} day
                {calculateDays(booking.pickup_date, booking.dropoff_date) > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {/* Pickup */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Pickup</p>
                  <p className="font-semibold">
                    {new Date(booking.pickup_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-muted-foreground">
                    {new Date(booking.pickup_date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <Separator className="my-2" />
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-muted-foreground">{booking.pickup_location}</p>
                </div>

                {/* Dropoff */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Dropoff</p>
                  <p className="font-semibold">
                    {new Date(booking.dropoff_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-muted-foreground">
                    {new Date(booking.dropoff_date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <Separator className="my-2" />
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-muted-foreground">{booking.dropoff_location}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Information */}
          <Card>
            <CardHeader>
              <CardTitle>Important Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <p>Please bring your valid driver's license and government-issued ID upon pickup</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <p>Vehicle must be returned with the same fuel level</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <p>Late return fee: ₱500 per hour</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <p>Contact us at (02) 8123-4567 for any concerns</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Price Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base Amount</span>
                  <span>₱{booking.base_amount.toLocaleString()}</span>
                </div>
                {booking.insurance_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Insurance</span>
                    <span>₱{booking.insurance_amount.toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total Amount</span>
                  <span className="text-xl">₱{booking.total_amount.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {booking.status === 'confirmed' && (
                <>
                  <Button className="w-full">
                    View Payment Details
                  </Button>
                  <Button variant="outline" className="w-full">
                    Modify Booking
                  </Button>
                  <Button variant="destructive" className="w-full">
                    Cancel Booking
                  </Button>
                </>
              )}
              {booking.status === 'completed' && (
                <>
                  <Button className="w-full">
                    Leave a Review
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/vehicles/${booking.vehicle_id}`}>
                      Book Again
                    </Link>
                  </Button>
                </>
              )}
              {booking.status === 'active' && (
                <Button className="w-full">
                  Contact Support
                </Button>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/bookings">
                  Back to Bookings
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Booking Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium">Created</p>
                <p className="text-muted-foreground">
                  {new Date(booking.created_at).toLocaleString()}
                </p>
              </div>
              <Separator />
              <div>
                <p className="font-medium">Last Updated</p>
                <p className="text-muted-foreground">
                  {new Date(booking.updated_at).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}