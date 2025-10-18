'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// Mock payment history
const mockPayments = [
  {
    id: '1',
    payment_period_start: '2025-10-01',
    payment_period_end: '2025-10-31',
    total_rentals: 5,
    total_rental_income: 91833,
    owner_share: 55100,
    rentease_share: 36733,
    payment_status: 'pending',
    payment_date: null,
    payment_method: 'gcash'
  },
  {
    id: '2',
    payment_period_start: '2025-09-01',
    payment_period_end: '2025-09-30',
    total_rentals: 7,
    total_rental_income: 80500,
    owner_share: 48300,
    rentease_share: 32200,
    payment_status: 'paid',
    payment_date: '2025-10-05',
    payment_method: 'gcash',
    gcash_reference: 'GCASH-20251005-123456'
  },
  {
    id: '3',
    payment_period_start: '2025-08-01',
    payment_period_end: '2025-08-31',
    total_rentals: 6,
    total_rental_income: 72333,
    owner_share: 43400,
    rentease_share: 28933,
    payment_status: 'paid',
    payment_date: '2025-09-05',
    payment_method: 'gcash',
    gcash_reference: 'GCASH-20250905-789012'
  }
]

export default function OwnerEarningsPage() {
  const totalEarned = mockPayments
    .filter(p => p.payment_status === 'paid')
    .reduce((sum, p) => sum + p.owner_share, 0)

  const pendingPayment = mockPayments
    .filter(p => p.payment_status === 'pending')
    .reduce((sum, p) => sum + p.owner_share, 0)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 hover:bg-green-100'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Earnings</h2>
        <p className="text-muted-foreground">
          Track your payment history and earnings from RentEase PH
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Earned</CardDescription>
            <CardTitle className="text-3xl">₱{totalEarned.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Payment</CardDescription>
            <CardTitle className="text-3xl">₱{pendingPayment.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">To be paid out</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Payouts</CardDescription>
            <CardTitle className="text-3xl">
              {mockPayments.filter(p => p.payment_status === 'paid').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Completed payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your monthly payment records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockPayments.map((payment) => (
              <Card key={payment.id} className="border">
                <CardContent className="pt-6 space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">
                        {new Date(payment.payment_period_start).toLocaleDateString('en-US', { 
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.payment_period_start).toLocaleDateString()} - {' '}
                        {new Date(payment.payment_period_end).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getStatusColor(payment.payment_status)}>
                      {payment.payment_status === 'paid' ? 'Paid' : 'Pending'}
                    </Badge>
                  </div>

                  <Separator />

                  {/* Payment Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Rentals</span>
                      <span>{payment.total_rentals}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Rental Income</span>
                      <span>₱{payment.total_rental_income.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">RentEase Share (40%)</span>
                      <span>₱{payment.rentease_share.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Your Share (60%)</span>
                      <span className="text-xl">₱{payment.owner_share.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Payment Details */}
                  {payment.payment_status === 'paid' && (
                    <>
                      <Separator />
                      <div className="bg-green-50 p-3 rounded-md space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-green-900 font-medium">Payment Date:</span>
                          <span className="text-green-700">
                            {payment.payment_date && new Date(payment.payment_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-900 font-medium">Method:</span>
                          <span className="text-green-700 uppercase">{payment.payment_method}</span>
                        </div>
                        {payment.gcash_reference && (
                          <div className="flex justify-between text-sm">
                            <span className="text-green-900 font-medium">Reference:</span>
                            <span className="text-green-700 font-mono">{payment.gcash_reference}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {payment.payment_status === 'pending' && (
                    <>
                      <Separator />
                      <div className="bg-yellow-50 p-3 rounded-md">
                        <p className="text-sm text-yellow-900">
                          Payment will be processed within 5 business days after the period ends.
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Info */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium mb-2">Revenue Share Model</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• You receive 60% of all rental income</li>
              <li>• RentEase receives 40% for platform fees and services</li>
              <li>• Payments are processed monthly</li>
            </ul>
          </div>
          <Separator />
          <div>
            <p className="font-medium mb-2">Payment Schedule</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Payments processed within 5 business days after month end</li>
              <li>• Paid via GCash or Bank Transfer</li>
              <li>• Email notification sent when payment is completed</li>
            </ul>
          </div>
          <Separator />
          <div>
            <p className="font-medium mb-2">Need Help?</p>
            <Button variant="outline" size="sm">
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}