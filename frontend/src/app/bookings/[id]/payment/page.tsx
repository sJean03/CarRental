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
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
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
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

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
        toast.success('Downpayment successful!');
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

  // Calculate downpayment (20%) and remaining (80%)
  const downpayment = parseFloat((booking.total_amount * 0.20).toFixed(2));
  const remainingBalance = parseFloat((booking.total_amount - downpayment).toFixed(2));

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Complete Your Downpayment</h1>

      <div className="grid gap-6">
        {/* Payment Plan Info Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Payment Plan:</strong> Pay 20% downpayment now, and the remaining 80% after you complete your rental.
          </AlertDescription>
        </Alert>

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

            {/* Price Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Rental Subtotal</span>
                <span>₱{booking.subtotal?.toLocaleString() || '0.00'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Platform Fee (2%)</span>
                <span>₱{booking.platform_fee?.toLocaleString() || '0.00'}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-bold text-base">
                <span>Total Amount</span>
                <span>₱{booking.total_amount?.toLocaleString() || '0.00'}</span>
              </div>
            </div>

            {/* Payment Schedule */}
            <Separator />
            
            <div className="space-y-3 bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-base mb-2">Payment Schedule</p>
              
              <div className="space-y-2">
                {/* Downpayment */}
                <div className="flex items-start gap-3 p-3 bg-white rounded border-2 border-green-500">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Pay Now (20%)</p>
                    <p className="text-xs text-gray-600">Downpayment to secure your booking</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">₱{downpayment.toLocaleString()}</p>
                  </div>
                </div>

                {/* Remaining Balance */}
                <div className="flex items-start gap-3 p-3 bg-white rounded border border-gray-300">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-400 mt-0.5 flex-shrink-0 flex items-center justify-center">
                    <span className="text-xs text-gray-400">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Pay After Rental (80%)</p>
                    <p className="text-xs text-gray-600">Complete payment when you return the car</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-700">₱{remainingBalance.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>Enter your card details for the 20% downpayment</CardDescription>
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

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="terms" 
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                      className="mt-1"
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm text-red-800 cursor-pointer"
                    >
                      By proceeding with payment, you agree to our{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowTermsDialog(true);
                        }}
                        className="font-semibold underline hover:text-red-900"
                      >
                        Terms and Conditions
                      </button>
                      . Please ensure you have read and understood them before completing your payment.
                    </label>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg" 
                  disabled={isProcessing || !termsAccepted}
                >
                  {isProcessing ? 'Processing...' : `Pay Downpayment: ₱${downpayment.toLocaleString()}`}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Terms and Conditions Dialog */}
      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Terms and Conditions</DialogTitle>
            <DialogDescription>
              Please read these terms carefully before proceeding with your payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">1. Acceptance of Terms</h3>
              <p className="text-gray-700">
                By using our car rental platform and making a booking, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. Payment Terms</h3>
              <p className="text-gray-700">
                A 20% downpayment is required to secure your booking. The remaining 80% is due upon completion of your rental. All payments must be completed as scheduled.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. Cancellation Policy</h3>
              <p className="text-gray-700">
                Cancellations made more than 48 hours before the pickup date will receive a full refund of your downpayment. Cancellations made within 48 hours are non-refundable.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Vehicle Use</h3>
              <p className="text-gray-700">
                The rented vehicle must only be used for lawful purposes. Smoking, transporting illegal substances, or using the vehicle for commercial purposes without authorization is strictly prohibited.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. Insurance and Liability</h3>
              <p className="text-gray-700">
                Basic insurance is included in the rental fee. Renters are responsible for any damages, theft, or loss of the vehicle during the rental period up to the excess amount specified in the insurance policy.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Return Conditions</h3>
              <p className="text-gray-700">
                Vehicles must be returned at the agreed time and location with the same fuel level as at pickup. Late returns may incur additional charges. The vehicle must be returned in the same condition as received.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. Platform Fees</h3>
              <p className="text-gray-700">
                A 2% platform service fee is charged to facilitate the booking and ensure quality service. This fee covers operational costs, customer support, and platform maintenance.
              </p>
            </section>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowTermsDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}