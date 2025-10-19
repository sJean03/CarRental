'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Reservation } from '@/types'
import { bookingService } from '@/services'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate, calculateDays, getStatusColor, formatStatus } from '@/lib/utils'

export default function BookingsPage() {
  const [selectedTab, setSelectedTab] = useState('all')
  const [bookings, setBookings] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      setLoading(true)
      const response = await bookingService.getMyBookings()
      
      // Handle different response formats
      const bookingsData = response.data || (response as any).bookings || []
      setBookings(bookingsData)
    } catch (error) {
      console.error('Failed to load bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    try {
      setCancelling(bookingId)
      await bookingService.cancelBooking(bookingId)
      
      toast.success('Booking cancelled successfully')
      // Reload bookings
      loadBookings()
    } catch (error: any) {
      console.error('Failed to cancel booking:', error)
      toast.error(error.response?.data?.error || 'Failed to cancel booking')
    } finally {
      setCancelling(null)
    }
  }

  // Filter bookings based on status
  const filterBookings = (status: string) => {
    if (status === 'all') return bookings
    
    // Map tab values to actual statuses
    const statusMap: Record<string, string[]> = {
      'confirmed': ['confirmed', 'pending_payment'],
      'active': ['active'],
      'completed': ['completed'],
      'cancelled': ['cancelled']
    }
    
    const allowedStatuses = statusMap[status] || [status]
    return bookings.filter(booking => allowedStatuses.includes(booking.status))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading bookings...</p>
        </div>
      </div>
    )
  }

  const filteredBookings = filterBookings(selectedTab)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">My Bookings</h2>
        <p className="text-muted-foreground">View and manage all your rental reservations</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>All</CardDescription>
            <CardTitle className="text-2xl">{bookings.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming</CardDescription>
            <CardTitle className="text-2xl">
              {bookings.filter(b => b.status === 'confirmed' || b.status === 'pending_payment').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-2xl">
              {bookings.filter(b => b.status === 'active').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-2xl">
              {bookings.filter(b => b.status === 'completed').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs for filtering */}
      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All Bookings</TabsTrigger>
          <TabsTrigger value="confirmed">Upcoming</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4 mt-6">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">
                          {booking.make} {booking.model} {booking.year || ''}
                        </CardTitle>
                        <Badge className={getStatusColor(booking.status)}>
                          {formatStatus(booking.status)}
                        </Badge>
                      </div>
                      <CardDescription>
                        Booking Reference: {booking.booking_reference}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{formatCurrency(booking.total_amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {calculateDays(booking.pickup_date, booking.dropoff_date)} day
                        {calculateDays(booking.pickup_date, booking.dropoff_date) > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Booking Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pickup */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Pickup</p>
                      <p className="font-medium">{formatDate(booking.pickup_date)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.pickup_date).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.pickup_location_name || 'Location TBD'}
                      </p>
                    </div>

                    {/* Dropoff */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Dropoff</p>
                      <p className="font-medium">{formatDate(booking.dropoff_date)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.dropoff_date).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.dropoff_location_name || 'Location TBD'}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Price Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Base Amount</span>
                      <span>{formatCurrency(booking.base_amount)}</span>
                    </div>
                    {booking.insurance_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Insurance</span>
                        <span>{formatCurrency(booking.insurance_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Deposit (20%)</span>
                      <span>{formatCurrency(booking.deposit_amount)}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <Link href={`/dashboard/bookings/${booking.id}`}>
                        {booking.status === 'pending_payment' ? 'Pay Now' : 'View Details'}
                      </Link>
                    </Button>
                    
                    {(booking.status === 'confirmed' || booking.status === 'pending_payment') && (
                      <Button 
                        variant="destructive" 
                        className="flex-1"
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancelling === booking.id}
                      >
                        {cancelling === booking.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          'Cancel Booking'
                        )}
                      </Button>
                    )}
                    
                    {booking.status === 'completed' && booking.vehicle_id && (
                      <Button variant="outline" className="flex-1" asChild>
                        <Link href={`/vehicles/${booking.vehicle_id}`}>
                          Book Again
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No bookings found in this category
                </p>
                <Button asChild>
                  <Link href="/vehicles">Browse Vehicles</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}