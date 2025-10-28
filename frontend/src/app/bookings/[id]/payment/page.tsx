'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { bookingsApi } from '@/lib/api/bookings';
import { paymentsApi } from '@/lib/api/payments';
import { Booking } from '@/lib/api/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import toast from 'react-hot-toast';

const paymentSchema = z.object({
  payment_method: z.enum(['credit_card', 'debit_card']),
  card_number: z.string()
    .min(16, 'Card number must be 16 digits')
    .max(19, 'Card number is too long')
    .regex(/^[\d\s]+$/, 'Card number must contain only digits'),
  card_holder: z.string()
    .min(3, 'Card holder name is required')
    .regex(/^[a-zA-Z\s]+$/, 'Card holder name must contain only letters'),
  expiry_date: z.string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiry date must be in MM/YY format')
    .refine((val) => {
      const [month, year] = val.split('/').map(Number);
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;

      if (year < currentYear) return false;
      if (year === currentYear && month < currentMonth) return false;
      return true;
    }, 'Card has expired'),
  cvv: z.string()
    .length(3, 'CVV must be exactly 3 digits')
    .regex(/^\d{3}$/, 'CVV must be 3 digits'),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_method: 'credit_card',
      card_number: '',
      card_holder: '',
      expiry_date: '',
      cvv: '',
    },
  });

  useEffect(() => {
    fetchBooking();
  }, [params.id]);

  const fetchBooking = async () => {
    try {
      setIsLoading(true);
      const response = await bookingsApi.getById(params.id as string);
      if (response.success && response.data) {
        setBooking(response.data.booking);
      }
    } catch (error) {
      toast.error('Failed to load booking');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  const handlePayment = async (data: PaymentFormValues) => {
    if (!booking) return;

    try {
      setIsProcessing(true);
      const cardNumberDigits = data.card_number.replace(/\s+/g, '');

      const response = await paymentsApi.process({
        booking_id: booking.id,
        payment_method: data.payment_method,
        card_last4: cardNumberDigits.slice(-4),
        card_brand: data.payment_method === 'credit_card' ? 'Visa' : 'Mastercard',
      });

      if (response.success) {
        toast.success('Payment successful!');
        router.push('/dashboard');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Payment failed';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading || !booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Complete Your Payment</h1>

      <div className="grid gap-6">
        {/* Booking Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
            <CardDescription>{booking.booking_reference}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold">
                {booking.make} {booking.model} {booking.year}
              </p>
              <p className="text-sm text-gray-600">{booking.license_plate}</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Pickup Date</span>
                <span>{booking.pickup_date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Return Date</span>
                <span>{booking.return_date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Days</span>
                <span>{booking.total_days}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₱{booking.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Platform Fee</span>
                <span>₱{booking.platform_fee.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₱{booking.total_amount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>This is a mock payment system</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handlePayment)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="credit_card">Credit Card</SelectItem>
                          <SelectItem value="debit_card">Debit Card</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="card_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="1234 5678 9012 3456"
                          {...field}
                          onChange={(e) => {
                            const formatted = formatCardNumber(e.target.value);
                            field.onChange(formatted);
                          }}
                          maxLength={19}
                          disabled={isProcessing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="card_holder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Holder Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="JUAN DELA CRUZ"
                          {...field}
                          disabled={isProcessing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="expiry_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="MM/YY"
                            {...field}
                            onChange={(e) => {
                              const formatted = formatExpiryDate(e.target.value);
                              field.onChange(formatted);
                            }}
                            maxLength={5}
                            disabled={isProcessing}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cvv"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CVV</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123"
                            {...field}
                            maxLength={3}
                            disabled={isProcessing}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : `Pay ₱${booking.total_amount.toLocaleString()}`}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
