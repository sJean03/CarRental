'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { carsApi } from '@/lib/api/cars';
import { bookingsApi } from '@/lib/api/bookings';
import { Car, Booking } from '@/lib/api/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car as CarIcon, Calendar, DollarSign, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatCurrencyFull } from '@/lib/utils/formatNumber';

export default function OwnerDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'owner') {
      router.push('/');
      return;
    }
    fetchData();
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Fetch ALL cars including pending (no status filter)
      const [carsRes, bookingsRes] = await Promise.all([
        carsApi.getMyCars(), // Gets all statuses
        bookingsApi.getOwnerBookings(),
      ]);

      if (carsRes.success && carsRes.data) {
        setCars(carsRes.data.cars);
      }

      if (bookingsRes.success && bookingsRes.data) {
        setBookings(bookingsRes.data.bookings);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
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

  const handleResubmit = async (carId: string) => {
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

  const totalEarnings = bookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + b.total_amount * 0.9, 0); // 90% after platform fee

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Owner Dashboard</h1>
          <p className="text-gray-600">Manage your cars and bookings</p>
        </div>
        <Button asChild>
          <Link href="/owner/cars/new">
            <Plus className="h-4 w-4 mr-2" />
            List a Car
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cars</CardTitle>
            <CarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cars.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <CarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cars.filter((c) => c.status === 'listed').length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <CarIcon className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">
              {cars.filter((c) => c.status === 'pending_approval').length}
            </div>
            {cars.filter((c) => c.status === 'pending_approval').length > 0 && (
              <p className="text-xs text-yellow-600 mt-1">Awaiting admin review</p>
            )}
          </CardContent>
        </Card>

        {cars.filter((c) => c.status === 'rejected').length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <CarIcon className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">
                {cars.filter((c) => c.status === 'rejected').length}
              </div>
              <p className="text-xs text-red-600 mt-1">Needs resubmission</p>
            </CardContent>
          </Card>
        )}

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
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold truncate"
              title={formatCurrencyFull(totalEarnings)}
            >
              {formatCurrency(totalEarnings)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="cars" className="space-y-6">
        <TabsList>
          <TabsTrigger value="cars">My Cars</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="cars" className="space-y-4">
          {cars.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CarIcon className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No cars listed yet</p>
                <Button asChild>
                  <Link href="/owner/cars/new">List Your First Car</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Pending Approval Notice */}
              {cars.filter((c) => c.status === 'pending_approval').length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        {cars.filter((c) => c.status === 'pending_approval').length} car(s) awaiting approval
                      </h3>
                      <p className="mt-1 text-sm text-yellow-700">
                        Your newly listed car(s) are under review by our admin team. This usually takes 24-48 hours. You'll be notified once approved.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4">
                {/* Sort cars: rejected first, then pending, then listed, then others */}
                {cars
                  .sort((a, b) => {
                    const statusOrder: Record<string, number> = {
                      rejected: 0,
                      pending_approval: 1,
                      listed: 2,
                      approved: 3,
                      unavailable: 4,
                      suspended: 5,
                    };
                    return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
                  })
                  .map((car) => (
                    <Card
                      key={car.id}
                      className={
                        car.status === 'pending_approval'
                          ? 'border-yellow-200'
                          : car.status === 'rejected'
                          ? 'border-red-200'
                          : ''
                      }
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>
                              {car.make} {car.model} {car.year}
                            </CardTitle>
                            <CardDescription>{car.license_plate}</CardDescription>
                          </div>
                          <Badge className={getStatusColor(car.status)}>
                            {car.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Rejection Reason */}
                          {car.status === 'rejected' && car.rejection_reason && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                              <p className="text-sm font-medium text-red-900 mb-1">
                                Rejection Reason:
                              </p>
                              <p className="text-sm text-red-800">{car.rejection_reason}</p>
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-3 border-red-300 text-red-700 hover:bg-red-50"
                                onClick={() => handleResubmit(car.id)}
                              >
                                Edit & Resubmit
                              </Button>
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-2xl font-bold">₱{car.daily_rate.toLocaleString()}</p>
                              <p className="text-sm text-gray-600">per day</p>
                            </div>
                            <div className="text-right text-sm">
                              <p className="text-gray-600">Total Bookings</p>
                              <p className="font-semibold">{car.total_bookings}</p>
                            </div>
                            <Button asChild size="sm">
                              <Link href={`/owner/cars/${car.id}`}>Manage</Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          {bookings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-600">No bookings yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {bookings.map((booking) => (
                <Card key={booking.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {booking.make} {booking.model}
                        </CardTitle>
                        <CardDescription>{booking.booking_reference}</CardDescription>
                      </div>
                      <Badge>{booking.status.replace(/_/g, ' ')}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-600">Customer</p>
                        <p className="font-medium">
                          {booking.customer_first_name} {booking.customer_last_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Dates</p>
                        <p className="font-medium">
                          {booking.pickup_date} - {booking.return_date}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Earnings</p>
                        <p className="font-medium">
                          ₱{(booking.total_amount * 0.9).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button asChild size="sm" variant="outline" className="w-full">
                      <Link href={`/bookings/${booking.id}`}>View Details</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
