'use client'

import { useState, useEffect } from 'react'
import { notFound, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Reservation, Payment } from '@/types'
import { bookingService, paymentService } from '@/services'
import { Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate, calculateDays, getStatusColor, formatStatus } from '@/lib/utils'

export default function BookingDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [booking, setBooking] = useState<Reservation | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [submittingPayment, setSubmittingPayment] = useState(false)

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash'>('gcash')
  const [paymentType, setPaymentType] = useState<'deposit' | 'full_payment'>('deposit')
  const [gcashNumber, setGcashNumber] = useState('')
  const [gcashReference, setGcashReference] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadBookingData()
  }, [params.id])

  const loadBookingData = async () => {
    try {
      setLoading(true)

      // Fetch booking details
      const bookingResponse = await bookingService.getBookingById(params.id)
      const bookingData = bookingResponse.data || (bookingResponse as any).booking

      if (!bookingData) {
        toast.error('Booking not found')
        router.push('/dashboard/bookings')
        return
      }

      setBooking(bookingData)

      // Fetch payment history
      try {
        const paymentsResponse = await paymentService.getPaymentHistory(params.id)
        const paymentsData = paymentsResponse.data || (paymentsResponse as any).payments || []
        setPayments(paymentsData)
      } catch (error) {
        // Payment history might not exist yet, that's okay
        console.log('No payment history yet')
      }
    } catch (error: any) {
      console.error('Failed to load booking:', error)
      toast.error('Failed to load booking details')
      router.push('/dashboard/bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!booking || !confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    try {
      setCancelling(true)
      await bookingService.cancelBooking(booking.id)

      toast.success('Booking cancelled successfully')
      router.push('/dashboard/bookings')
    } catch (error: any) {
      console.error('Failed to cancel booking:', error)
      toast.error(error.response?.data?.error || 'Failed to cancel booking')
    } finally {
      setCancelling(false)
    }
  }

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!booking) return

    // Validation
    if (paymentMethod === 'gcash' && (!gcashNumber || !gcashReference)) {
      toast.error('Please provide GCash number and reference')
      return
    }

    try {
      setSubmittingPayment(true)

      const amount = paymentType === 'deposit' 
        ? booking.deposit_amount 
        : booking.total_amount

      const paymentData = {
        reservation_id: booking.id,
        amount,
        payment_method: paymentMethod,
        payment_type: paymentType,
        gcash_number: paymentMethod === 'gcash' ? gcashNumber : undefined,
        gcash_reference: paymentMethod === 'gcash' ? gcashReference : undefined,
        notes: notes || undefined,
      }

      const response = await paymentService.submitPayment(paymentData)

      if (response.success) {
        toast.success('Payment submitted successfully! Waiting for admin verification.')
        setShowPaymentForm(false)
        // Reload booking data
        loadBookingData()
      }
    } catch (error: any) {
      console.error('Failed to submit payment:', error)
      toast.error(error.response?.data?.error || 'Failed to submit payment')
    } finally {
      setSubmittingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (!booking) {
    notFound()
  }

  const rentalDays = calculateDays(booking.pickup_date, booking.dropoff_date)
  const totalPaid = payments
    .filter(p => p.payment_status === 'verified' || p.payment_status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)
  const remainingBalance = booking.total_amount - totalPaid

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
        {' / '}
        <Link href="/dashboard/bookings" className="hover:text-foreground">My Bookings</Link>
        {' / '}
        <span className="text-foreground">{booking.booking_reference}</span>
      </div>

      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Booking Details</h1>
          <p className="text-muted-foreground">{booking.booking_reference}</p>
        </div>
        <Badge className={getStatusColor(booking.status)}>
          {formatStatus(booking.status)}
        </Badge>
      </div>

      {/* Payment Alert */}
      {booking.status === 'pending_payment' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-amber-900">Payment Required</p>
                <p className="text-sm text-amber-700 mt-1">
                  Please submit your payment to confirm this booking. A {formatCurrency(booking.deposit_amount)} deposit is required.
                </p>
                <Button 
                  onClick={() => setShowPaymentForm(true)} 
                  className="mt-3"
                  size="sm"
                >
                  Submit Payment Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">No Image</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">
                    {booking.make} {booking.model} {booking.year || ''}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {formatCurrency(booking.daily_rate || 0)}/day
                  </p>
                  {booking.vehicle_id && (
                    <Button variant="link" className="px-0" asChild>
                      <Link href={`/vehicles/${booking.vehicle_id}`}>
                        View Vehicle Details →
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rental Period */}
          <Card>
            <CardHeader>
              <CardTitle>Rental Period</CardTitle>
              <CardDescription>
                {rentalDays} day{rentalDays > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {/* Pickup */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Pickup</p>
                  <p className="font-semibold">{formatDate(booking.pickup_date)}</p>
                  <p className="text-muted-foreground text-sm">
                    {new Date(booking.pickup_date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <Separator className="my-2" />
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-muted-foreground text-sm">
                    {booking.pickup_location_name || 'TBD'}
                  </p>
                </div>

                {/* Dropoff */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Dropoff</p>
                  <p className="font-semibold">{formatDate(booking.dropoff_date)}</p>
                  <p className="text-muted-foreground text-sm">
                    {new Date(booking.dropoff_date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <Separator className="my-2" />
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-muted-foreground text-sm">
                    {booking.dropoff_location_name || 'TBD'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          {showPaymentForm && booking.status === 'pending_payment' && (
            <Card>
              <CardHeader>
                <CardTitle>Submit Payment</CardTitle>
                <CardDescription>
                  Choose your payment method and provide details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitPayment} className="space-y-4">
                  <div>
                    <Label>Payment Type</Label>
                    <Select value={paymentType} onValueChange={(v: any) => setPaymentType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deposit">
                          Deposit Only ({formatCurrency(booking.deposit_amount)})
                        </SelectItem>
                        <SelectItem value="full_payment">
                          Full Payment ({formatCurrency(booking.total_amount)})
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gcash">GCash</SelectItem>
                        <SelectItem value="cash">Cash (at branch)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentMethod === 'gcash' && (
                    <>
                      <div>
                        <Label htmlFor="gcashNumber">GCash Number</Label>
                        <Input
                          id="gcashNumber"
                          value={gcashNumber}
                          onChange={(e) => setGcashNumber(e.target.value)}
                          placeholder="09XX-XXX-XXXX"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="gcashReference">GCash Reference Number</Label>
                        <Input
                          id="gcashReference"
                          value={gcashReference}
                          onChange={(e) => setGcashReference(e.target.value)}
                          placeholder="Reference number from GCash"
                          required
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional information..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={submittingPayment} className="flex-1">
                      {submittingPayment ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Payment'
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowPaymentForm(false)}
                      disabled={submittingPayment}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Payment History */}
          {payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {payment.payment_status === 'verified' || payment.payment_status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-amber-600" />
                        )}
                        <div>
                          <p className="font-medium">{formatCurrency(payment.amount)}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {payment.payment_method} - {payment.payment_type.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={payment.payment_status === 'verified' ? 'default' : 'secondary'}>
                        {formatStatus(payment.payment_status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Important Information */}
          <Card>
            <CardHeader>
              <CardTitle>Important Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <p>Please bring your valid driver's license and government-issued ID upon pickup</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <p>Vehicle must be returned with the same fuel level</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <p>Late return fee: {formatCurrency(200)}/hour</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <p>Contact us at (02) 8123-4567 for any concerns</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Price Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total Amount</span>
                  <span className="text-xl">{formatCurrency(booking.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Deposit Required (20%)</span>
                  <span>{formatCurrency(booking.deposit_amount)}</span>
                </div>
                {totalPaid > 0 && (
                  <>
                    <Separator />
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Paid</span>
                      <span>{formatCurrency(totalPaid)}</span>
                    </div>
                    {remainingBalance > 0 && (
                      <div className="flex justify-between text-sm text-amber-600">
                        <span>Balance Due</span>
                        <span>{formatCurrency(remainingBalance)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {booking.status === 'pending_payment' && (
                <>
                  <Button className="w-full" onClick={() => setShowPaymentForm(true)}>
                    Submit Payment
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleCancelBooking}
                    disabled={cancelling}
                  >
                    {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                  </Button>
                </>
              )}
              {booking.status === 'confirmed' && (
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleCancelBooking}
                  disabled={cancelling}
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                </Button>
              )}
              {booking.status === 'completed' && booking.vehicle_id && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/vehicles/${booking.vehicle_id}`}>
                    Book Again
                  </Link>
                </Button>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/bookings">
                  Back to Bookings
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Booking Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium">Created</p>
                <p className="text-muted-foreground">
                  {new Date(booking.created_at).toLocaleString()}
                </p>
              </div>
              <Separator />
              <div>
                <p className="font-medium">Last Updated</p>
                <p className="text-muted-foreground">
                  {new Date(booking.updated_at).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}