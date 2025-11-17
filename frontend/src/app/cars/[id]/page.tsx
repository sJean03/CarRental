'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { carsApi } from '@/lib/api/cars';
import { bookingsApi } from '@/lib/api/bookings';
import { Car } from '@/lib/api/types';
import { useAuthStore } from '@/lib/store/authStore';
import { PLATFORM_FEE_PERCENTAGE } from '@/lib/utils/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Star, Users, Gauge, Fuel, MapPin, Shield, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { addDays, format } from 'date-fns';

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [car, setCar] = useState<Car | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();
  const [isBooking, setIsBooking] = useState(false);
  const [hasActiveBooking, setHasActiveBooking] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchCar();
      if (isAuthenticated) {
        checkActiveBooking();
      }
    }
  }, [params.id, isAuthenticated]);

  const fetchCar = async () => {
    try {
      setIsLoading(true);
      const response = await carsApi.getById(params.id as string);
      if (response.success && response.data) {
        setCar(response.data.car);
      }
    } catch (error) {
      toast.error('Failed to load car details');
    } finally {
      setIsLoading(false);
    }
  };

  const checkActiveBooking = async () => {
    try {
      const response = await bookingsApi.getMyBookings();
      if (response.success && response.data) {
        const activeBooking = response.data.bookings.find(
          (booking) =>
            booking.car_id === params.id &&
            ['pending_payment', 'pending_owner_confirmation', 'confirmed', 'active'].includes(
              booking.status
            )
        );
        setHasActiveBooking(!!activeBooking);
      }
    } catch (error) {
      // Silently fail - user can still try to book
      console.error('Failed to check active bookings:', error);
    }
  };

  const calculateTotal = () => {
    if (!car || !dateRange?.from || !dateRange?.to) return 0;
    const days = Math.ceil(
      (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    const subtotal = car.daily_rate * days;
    const platformFee = subtotal * (PLATFORM_FEE_PERCENTAGE / 100);
    return subtotal + platformFee;
  };

  const handleBookNow = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to book a car');
      router.push('/login');
      return;
    }

    if (!dateRange?.from || !dateRange?.to) {
      toast.error('Please select rental dates');
      return;
    }

    // Safety check: warn if user already has an active booking for this car
    if (hasActiveBooking) {
      const confirmed = window.confirm(
        'You already have an active booking for this car. Are you sure you want to create another booking?'
      );
      if (!confirmed) {
        return;
      }
    }

    try {
      setIsBooking(true);
      const response = await bookingsApi.create({
        car_id: params.id as string,
        pickup_date: format(dateRange.from, 'yyyy-MM-dd'),
        return_date: format(dateRange.to, 'yyyy-MM-dd'),
        payment_plan: 'downpayment',
      });

      if (response.success && response.data) {
        toast.success('Booking created! Redirecting to payment...');
        router.push(`/bookings/${response.data.booking.id}/payment`);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Booking failed';
      toast.error(message);
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Car not found</p>
      </div>
    );
  }

  const imageUrl = car.image_urls?.[0] || '/images/car-placeholder.jpg';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Car Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Car Image */}
          <div className="relative h-96 w-full rounded-lg overflow-hidden">
            <Image src={imageUrl} alt={`${car.make} ${car.model}`} fill className="object-cover" />
          </div>

          {/* Car Info */}
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold">
                  {car.make} {car.model} {car.year}
                </h1>
                <p className="text-gray-600 flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4" />
                  {car.branch_city}
                </p>
              </div>
              {car.average_rating > 0 && (
                <Badge variant="secondary" className="text-lg">
                  <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                  {car.average_rating}
                </Badge>
              )}
            </div>

            <div className="flex gap-6 mb-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-500" />
                <span>{car.seating_capacity} seats</span>
              </div>
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-gray-500" />
                <span className="capitalize">{car.transmission}</span>
              </div>
              <div className="flex items-center gap-2">
                <Fuel className="h-5 w-5 text-gray-500" />
                <span className="capitalize">{car.fuel_type}</span>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Description */}
            {car.description && (
              <>
                <h2 className="text-xl font-semibold mb-3">Description</h2>
                <p className="text-gray-700 mb-6">{car.description}</p>
              </>
            )}

            {/* Features */}
            {car.features && car.features.length > 0 && (
              <>
                <h2 className="text-xl font-semibold mb-3">Features</h2>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {car.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Rules */}
            {car.rules && (
              <>
                <h2 className="text-xl font-semibold mb-3">Rental Rules</h2>
                <p className="text-gray-700">{car.rules}</p>
              </>
            )}
          </div>
        </div>

        {/* Right Column - Booking Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span className="text-3xl font-bold">₱{car.daily_rate.toLocaleString()}</span>
                <span className="text-sm font-normal text-gray-600">per day</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Select Dates</label>
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange as any}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
              </div>

              {dateRange?.from && dateRange?.to && (
                <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>
                      ₱{car.daily_rate.toLocaleString()} x{' '}
                      {Math.ceil(
                        (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
                      ) + 1}{' '}
                      days
                    </span>
                    <span>
                      ₱
                      {(
                        car.daily_rate *
                        (Math.ceil(
                          (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
                        ) +
                          1)
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Platform fee (2%)</span>
                    <span>
                      ₱
                      {(
                        car.daily_rate *
                        (Math.ceil(
                          (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
                        ) +
                          1) *
                        (PLATFORM_FEE_PERCENTAGE / 100)
                      ).toLocaleString()}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>₱{calculateTotal().toLocaleString()}</span>
                  </div>
                </div>
              )}

              {hasActiveBooking && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You already have an active booking for this car. Booking again may create a duplicate.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleBookNow}
                disabled={!dateRange?.from || !dateRange?.to || isBooking}
              >
                {isBooking ? 'Processing...' : 'Book Now'}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                You won't be charged yet
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
