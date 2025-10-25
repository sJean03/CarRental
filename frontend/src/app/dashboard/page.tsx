'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { bookingsApi } from '@/lib/api/bookings';
import { Booking } from '@/lib/api/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Car, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function CustomerDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchBookings();
  }, [isAuthenticated]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const response = await bookingsApi.getMyBookings();
      if (response.success && response.data) {
        setBookings(response.data.bookings);
      }
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending_payment: 'bg-yellow-100 text-yellow-800',
      payment_confirmed: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      active: 'bg-purple-100 text-purple-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filterBookings = (status?: string) => {
    if (!status) return bookings;
    if (status === 'upcoming') {
      return bookings.filter(
        (b) => b.status === 'confirmed' || b.status === 'payment_confirmed'
      );
    }
    if (status === 'active') {
      return bookings.filter((b) => b.status === 'active');
    }
    if (status === 'past') {
      return bookings.filter((b) => b.status === 'completed' || b.status === 'cancelled');
    }
    return bookings;
  };

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {booking.make} {booking.model} {booking.year}
            </CardTitle>
            <CardDescription>{booking.booking_reference}</CardDescription>
          </div>
          <Badge className={getStatusColor(booking.status)}>
            {booking.status.replace(/_/g, ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-gray-600">Pickup</p>
              <p className="font-medium">{format(new Date(booking.pickup_date), 'MMM dd, yyyy')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-gray-600">Return</p>
              <p className="font-medium">{format(new Date(booking.return_date), 'MMM dd, yyyy')}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div>
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-xl font-bold">₱{booking.total_amount.toLocaleString()}</p>
          </div>
          <Button asChild size="sm">
            <Link href={`/bookings/${booking.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user.first_name}!
        </h1>
        <p className="text-gray-600">Manage your bookings and profile</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filterBookings('active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings.filter((b) => b.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Bookings</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-48" />)
          ) : bookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Car className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No bookings yet</p>
                <Button asChild>
                  <Link href="/cars">Browse Cars</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            bookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {filterBookings('upcoming').length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-600">No upcoming bookings</p>
              </CardContent>
            </Card>
          ) : (
            filterBookings('upcoming').map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {filterBookings('active').length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-600">No active bookings</p>
              </CardContent>
            </Card>
          ) : (
            filterBookings('active').map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {filterBookings('past').length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-600">No past bookings</p>
              </CardContent>
            </Card>
          ) : (
            filterBookings('past').map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
