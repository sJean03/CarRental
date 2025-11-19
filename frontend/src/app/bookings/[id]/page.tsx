'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { bookingsApi } from '@/lib/api/bookings';
import { paymentsApi } from '@/lib/api/payments';
import { useAuthStore } from '@/lib/store/authStore';
import { Booking, Payment } from '@/lib/api/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Car, User, MapPin, CreditCard, AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBookingDetails();
  }, [params.id]);

  const fetchBookingDetails = async () => {
    try {
      setIsLoading(true);
      const [bookingRes, paymentsRes] = await Promise.all([
        bookingsApi.getById(params.id as string),
        paymentsApi.getByBooking(params.id as string),
      ]);

      if (bookingRes.success && bookingRes.data) {
        setBooking(bookingRes.data.booking);
      }

      if (paymentsRes.success && paymentsRes.data) {
        setPayments(paymentsRes.data.payments);
      }
    } catch (error) {
      toast.error('Failed to load booking details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;

    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const response = await bookingsApi.cancel(booking.id, 'Customer cancelled');
      if (response.success) {
        toast.success('Booking cancelled successfully');
        fetchBookingDetails();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleConfirmBooking = async () => {
    if (!booking) return;

    try {
      const response = await bookingsApi.confirm(booking.id);
      if (response.success) {
        toast.success('Booking confirmed!');
        fetchBookingDetails();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to confirm booking');
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!booking) return;

    try {
      const response = await bookingsApi.updateStatus(booking.id, newStatus);
      if (response.success) {
        toast.success('Status updated successfully');
        fetchBookingDetails();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending_payment: 'bg-yellow-100 text-yellow-800',
      pending_owner_confirmation: 'bg-orange-100 text-orange-800',
      payment_confirmed: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      active: 'bg-purple-100 text-purple-800',
      returned: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      cancelled_with_refund: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    if (status.includes('completed')) return <CheckCircle className="h-4 w-4" />;
    if (status.includes('cancelled')) return <AlertCircle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const bookingSteps = [
    { status: 'pending_payment', label: 'Payment Pending' },
    { status: 'pending_owner_confirmation', label: 'Awaiting Owner' },
    { status: 'confirmed', label: 'Confirmed' },
    { status: 'active', label: 'Active' },
    { status: 'returned', label: 'Returned' },
    { status: 'completed', label: 'Completed' },
  ];

  if (isLoading || !booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading...</p>
      </div>
    );
  }

  // Check if current user is the actual owner of the car (not just any owner role)
  const isOwner = booking.owner_user_id === user?.id;
  const isCustomer = booking.customer_id === user?.id;
  const canCancel = isCustomer && ['pending_payment', 'payment_confirmed', 'confirmed', 'ready_for_pickup'].includes(booking.status);
  const canConfirm = isOwner && booking.status === 'pending_owner_confirmation';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Booking Details</h1>
          <p className="text-gray-600">{booking.booking_reference}</p>
        </div>
        <Badge className={getStatusColor(booking.status)}>
          {getStatusIcon(booking.status)}
          <span className="ml-1">{booking.status.replace(/_/g, ' ')}</span>
        </Badge>
      </div>

      {/* Status Timeline */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Booking Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="flex justify-between mb-2">
              {bookingSteps.map((step, index) => {
                const currentIndex = bookingSteps.findIndex(s => s.status === booking.status);
                const isCompleted = index <= currentIndex;
                const isCurrent = step.status === booking.status;

                return (
                  <div key={step.status} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                    </div>
                    <p className={`text-xs text-center ${isCompleted || isCurrent ? 'font-semibold' : 'text-gray-500'}`}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {/* Vehicle Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">
                {booking.make} {booking.model} {booking.year}
              </h3>
              <p className="text-sm text-gray-600">License Plate: {booking.license_plate}</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/cars/${booking.car_id}`}>View Car Details</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Rental Period */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Rental Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Pickup Date</p>
                <p className="font-semibold">{format(new Date(booking.pickup_date), 'MMM dd, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Return Date</p>
                <p className="font-semibold">{format(new Date(booking.return_date), 'MMM dd, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Days</p>
                <p className="font-semibold">{booking.total_days} days</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-semibold flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {booking.branch_name || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        {(isOwner || isCustomer) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {isOwner ? 'Customer' : 'Owner'} Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-semibold">
                  {isOwner
                    ? `${booking.customer_first_name} ${booking.customer_last_name}`
                    : `${booking.owner_first_name} ${booking.owner_last_name}`}
                </p>
                <p className="text-sm text-gray-600">
                  Email: {isOwner ? booking.customer_email : booking.owner_email}
                </p>
                <p className="text-sm text-gray-600">
                  Phone: {isOwner ? booking.customer_phone : booking.owner_phone}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Daily Rate</span>
                <span>₱{booking.daily_rate.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Number of Days</span>
                <span>{booking.total_days}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₱{booking.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Platform Fee (2%)</span>
                <span>₱{booking.platform_fee.toLocaleString()}</span>
              </div>
              {booking.late_fee > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Late Fee ({booking.days_late} days)</span>
                  <span>₱{booking.late_fee.toLocaleString()}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Amount</span>
                <span>₱{(booking.total_amount + booking.late_fee).toLocaleString()}</span>
              </div>
              {booking.payment_plan === 'installment' && (
                <p className="text-sm text-gray-600">
                  Installment Plan: {booking.installment_months} months @ ₱
                  {booking.monthly_payment?.toLocaleString()}/month
                </p>
              )}
            </div>

            {/* Payment Records */}
            {payments.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-semibold mb-3">Payment History</h4>
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium">
                          {payment.card_brand} •••• {payment.card_last4}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(payment.created_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₱{payment.amount.toLocaleString()}</p>
                        <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Notes */}
        {booking.customer_notes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Customer Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{booking.customer_notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          {canCancel && (
            <Button variant="destructive" onClick={handleCancelBooking} className="flex-1">
              Cancel Booking
            </Button>
          )}

          {canConfirm && (
            <Button onClick={handleConfirmBooking} className="flex-1">
              Confirm Booking
            </Button>
          )}

          {isOwner && booking.status === 'confirmed' && (
            <Button onClick={() => handleStatusUpdate('active')} className="flex-1">
              Mark as Picked Up
            </Button>
          )}

          {isOwner && booking.status === 'active' && (
            <Button onClick={() => handleStatusUpdate('returned')} className="flex-1">
              Mark as Returned
            </Button>
          )}

          {isOwner && booking.status === 'returned' && (
            <Button onClick={() => handleStatusUpdate('completed')} className="flex-1">
              Complete Booking
            </Button>
          )}
        </div>

        {booking.status === 'cancelled' && booking.refund_amount > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This booking was cancelled. Refund amount: ₱{booking.refund_amount.toLocaleString()}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
