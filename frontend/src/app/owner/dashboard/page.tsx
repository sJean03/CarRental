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
      listed: 'bg-green-100 text-green-800',
      unavailable: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
            <div className="grid gap-4">
              {cars.map((car) => (
                <Card key={car.id}>
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
                  </CardContent>
                </Card>
              ))}
            </div>
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
                    <div className="grid grid-cols-3 gap-4 text-sm">
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
