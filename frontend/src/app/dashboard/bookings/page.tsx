'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Reservation } from '@/types/booking'

// Mock bookings data (we'll replace with API later)
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
  },
  {
    id: '3',
    booking_reference: 'RES-2025-0003',
    user_id: 'user1',
    vehicle_id: '2',
    vehicle_name: 'Honda City 2021',
    vehicle_image: '',
    pickup_location: 'Makati Branch',
    dropoff_location: 'Makati Branch',
    pickup_date: '2025-08-10T10:00:00',
    dropoff_date: '2025-08-12T16:00:00',
    status: 'cancelled',
    base_amount: 5600,
    insurance_amount: 400,
    total_amount: 6000,
    created_at: '2025-08-05T09:00:00',
    updated_at: '2025-08-08T11:00:00'
  }
]

export default function BookingsPage() {
  const [selectedTab, setSelectedTab] = useState('all')

  console.log('Total bookings:', mockBookings.length)
  console.log('Selected tab:', selectedTab)
  // Filter bookings based on status
  const filterBookings = (status?: string) => {
    if (status === 'all') return mockBookings
    return mockBookings.filter(booking => booking.status === status)
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
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    }
  }

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
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
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">My Bookings</h2>
        <p className="text-muted-foreground">View and manage all your rental reservations</p>
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
          {filterBookings(selectedTab).length > 0 ? (
            filterBookings(selectedTab).map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{booking.vehicle_name}</CardTitle>
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusLabel(booking.status)}
                        </Badge>
                      </div>
                      <CardDescription>
                        Booking Reference: {booking.booking_reference}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">₱{booking.total_amount.toLocaleString()}</p>
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
                      <p className="font-medium">
                        {new Date(booking.pickup_date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.pickup_date).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">{booking.pickup_location}</p>
                    </div>

                    {/* Dropoff */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Dropoff</p>
                      <p className="font-medium">
                        {new Date(booking.dropoff_date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.dropoff_date).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">{booking.dropoff_location}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Price Breakdown */}
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
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <Link href={`/dashboard/bookings/${booking.id}`}>
                        View Details
                      </Link>
                    </Button>
                    
                    {booking.status === 'confirmed' && (
                      <Button variant="destructive" className="flex-1">
                        Cancel Booking
                      </Button>
                    )}
                    
                    {booking.status === 'completed' && (
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