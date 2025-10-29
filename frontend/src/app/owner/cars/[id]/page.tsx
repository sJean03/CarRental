'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { carsApi } from '@/lib/api/cars';
import { bookingsApi } from '@/lib/api/bookings';
import { Car, Booking } from '@/lib/api/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, DollarSign, Settings, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/formatNumber';

export default function OwnerCarDetailPage() {
  const router = useRouter();
  const params = useParams();
  const carId = params.id as string;
  const { user, isAuthenticated } = useAuthStore();
  const [car, setCar] = useState<Car | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'owner') {
      router.push('/');
      return;
    }
    fetchData();
  }, [isAuthenticated, user, carId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch car details and all owner bookings
      const [carRes, bookingsRes] = await Promise.all([
        carsApi.getById(carId),
        bookingsApi.getOwnerBookings(),
      ]);

      if (carRes.success && carRes.data) {
        setCar(carRes.data.car);
      } else {
        toast.error('Failed to load car details');
        router.push('/owner/dashboard');
        return;
      }

      if (bookingsRes.success && bookingsRes.data) {
        // Filter bookings for this specific car
        const carBookings = bookingsRes.data.bookings.filter(
          (booking) => booking.car_id === carId
        );
        setBookings(carBookings);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load car details');
      router.push('/owner/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      const response = await bookingsApi.confirm(bookingId);
      if (response.success) {
        toast.success('Booking confirmed successfully');
        fetchData(); // Refresh data
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to confirm booking';
      toast.error(message);
    }
  };

  const handleResubmit = async () => {
    try {
      const response = await carsApi.resubmit(carId);
      if (response.success) {
        toast.success('Car resubmitted for approval');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to resubmit car');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending_approval: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      listed: 'bg-green-100 text-green-800',
      unavailable: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getBookingStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending_payment: 'bg-yellow-100 text-yellow-800',
      payment_confirmed: 'bg-blue-100 text-blue-800',
      pending_owner_confirmation: 'bg-orange-100 text-orange-800',
      confirmed: 'bg-green-100 text-green-800',
      active: 'bg-purple-100 text-purple-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!car) {
    return null;
  }

  const totalEarnings = bookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + b.total_amount * 0.9, 0); // 90% after platform fee

  const pendingBookings = bookings.filter((b) => b.status === 'pending_owner_confirmation');
  const activeBookings = bookings.filter((b) => ['confirmed', 'active', 'awaiting_vehicle_dropoff', 'ready_for_pickup'].includes(b.status));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/owner/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {car.make} {car.model} {car.year}
            </h1>
            <p className="text-gray-600">{car.license_plate}</p>
          </div>
          <Badge className={getStatusColor(car.status)}>
            {car.status.replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>

      {/* Rejection Notice */}
      {car.status === 'rejected' && car.rejection_reason && (
        <div className="mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Car Listing Rejected</h3>
              <div className="mb-4">
                <p className="text-sm font-medium text-red-800 mb-1">Reason for rejection:</p>
                <p className="text-sm text-red-700 bg-red-100 p-3 rounded border border-red-200">
                  {car.rejection_reason}
                </p>
              </div>
              <p className="text-sm text-red-800 mb-4">
                Please review the rejection reason above and make necessary changes before resubmitting your car for approval.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="default"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleResubmit}
                >
                  Resubmit for Approval
                </Button>
                <Button variant="outline" asChild className="border-red-300 text-red-700 hover:bg-red-50">
                  <Link href={`/owner/cars/${car.id}/edit`}>
                    Edit Car Details
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{car.daily_rate.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Confirmations</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBookings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalEarnings)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Car Details */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Car Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Make</p>
              <p className="font-medium">{car.make}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Model</p>
              <p className="font-medium">{car.model}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Year</p>
              <p className="font-medium">{car.year}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Color</p>
              <p className="font-medium">{car.color}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Transmission</p>
              <p className="font-medium capitalize">{car.transmission}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fuel Type</p>
              <p className="font-medium capitalize">{car.fuel_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Seating</p>
              <p className="font-medium">{car.seating_capacity} seats</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">License Plate</p>
              <p className="font-medium">{car.license_plate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Rating</p>
              <p className="font-medium">{car.average_rating || 'N/A'}</p>
            </div>
          </div>

          {car.description && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">Description</p>
              <p className="mt-1">{car.description}</p>
            </div>
          )}

          {car.features && car.features.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Features</p>
              <div className="flex flex-wrap gap-2">
                {car.features.map((feature, index) => (
                  <Badge key={index} variant="secondary">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
          <CardDescription>Manage bookings for this car</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({pendingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="active">
                Active ({activeBookings.length})
              </TabsTrigger>
              <TabsTrigger value="all">
                All ({bookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingBookings.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No pending confirmations</p>
              ) : (
                pendingBookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-semibold">
                            {booking.customer_first_name} {booking.customer_last_name}
                          </p>
                          <p className="text-sm text-gray-600">{booking.booking_reference}</p>
                        </div>
                        <Badge className={getBookingStatusColor(booking.status)}>
                          {booking.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-gray-600">Pickup Date</p>
                          <p className="font-medium">{booking.pickup_date}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Return Date</p>
                          <p className="font-medium">{booking.return_date}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Days</p>
                          <p className="font-medium">{booking.total_days}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Your Earnings</p>
                          <p className="font-medium">
                            ₱{(booking.total_amount * 0.9).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {booking.customer_notes && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600">Customer Notes</p>
                          <p className="text-sm">{booking.customer_notes}</p>
                        </div>
                      )}
                      <Button
                        onClick={() => handleConfirmBooking(booking.id)}
                        className="w-full"
                      >
                        Confirm Booking
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {activeBookings.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No active bookings</p>
              ) : (
                activeBookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-semibold">
                            {booking.customer_first_name} {booking.customer_last_name}
                          </p>
                          <p className="text-sm text-gray-600">{booking.booking_reference}</p>
                        </div>
                        <Badge className={getBookingStatusColor(booking.status)}>
                          {booking.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Pickup Date</p>
                          <p className="font-medium">{booking.pickup_date}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Return Date</p>
                          <p className="font-medium">{booking.return_date}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Days</p>
                          <p className="font-medium">{booking.total_days}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Your Earnings</p>
                          <p className="font-medium">
                            ₱{(booking.total_amount * 0.9).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {bookings.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No bookings yet</p>
              ) : (
                bookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-semibold">
                            {booking.customer_first_name} {booking.customer_last_name}
                          </p>
                          <p className="text-sm text-gray-600">{booking.booking_reference}</p>
                        </div>
                        <Badge className={getBookingStatusColor(booking.status)}>
                          {booking.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Pickup Date</p>
                          <p className="font-medium">{booking.pickup_date}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Return Date</p>
                          <p className="font-medium">{booking.return_date}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Days</p>
                          <p className="font-medium">{booking.total_days}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Your Earnings</p>
                          <p className="font-medium">
                            ₱{(booking.total_amount * 0.9).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
