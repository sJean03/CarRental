'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'

// Mock payments data
const mockPayments = [
  {
    id: '1',
    reservation_id: '2',
    booking_reference: 'RES-2025-0002',
    customer: 'Maria Santos',
    vehicle: 'Honda City 2021',
    amount: 5600,
    payment_method: 'gcash',
    payment_type: 'full_payment',
    gcash_number: '0917-123-4567',
    gcash_reference: 'GCASH-20251020-123456',
    payment_status: 'pending',
    submitted_at: '2025-10-20T14:30:00'
  },
  {
    id: '2',
    reservation_id: '1',
    booking_reference: 'RES-2025-0001',
    customer: 'Jace Gonzales',
    vehicle: 'Toyota Vios 2020',
    amount: 7500,
    payment_method: 'gcash',
    payment_type: 'full_payment',
    gcash_number: '09947551217',
    gcash_reference: 'GCASH-20251019-789012',
    payment_status: 'verified',
    verified_by: 'Admin',
    submitted_at: '2025-10-19T10:30:00',
    verified_at: '2025-10-19T11:00:00'
  },
  {
    id: '3',
    reservation_id: '3',
    booking_reference: 'RES-2025-0003',
    customer: 'Juan Reyes',
    vehicle: 'Mitsubishi Montero Sport 2022',
    amount: 13500,
    payment_method: 'cash',
    payment_type: 'full_payment',
    payment_status: 'completed',
    received_by: 'Staff',
    submitted_at: '2025-10-18T09:15:00',
    verified_at: '2025-10-18T09:20:00'
  }
]

export default function AdminPaymentsPage() {
  const [selectedTab, setSelectedTab] = useState('pending')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-100'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
      case 'refunded':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    }
  }

  const filterPayments = (status: string) => {
    if (status === 'all') return mockPayments
    return mockPayments.filter(p => p.payment_status === status)
  }

  const payments = filterPayments(selectedTab)

  const handleVerifyPayment = (paymentId: string) => {
    // TODO: Implement payment verification
    alert(`Verifying payment ${paymentId}... (Backend integration required)`)
  }

  const handleRejectPayment = (paymentId: string) => {
    // TODO: Implement payment rejection
    alert(`Rejecting payment ${paymentId}... (Backend integration required)`)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Payment Verification</h2>
        <p className="text-muted-foreground">
          Review and verify customer payments
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Payments</CardDescription>
            <CardTitle className="text-3xl">{mockPayments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Verification</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              {mockPayments.filter(p => p.payment_status === 'pending').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Verified Today</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {mockPayments.filter(p => p.payment_status === 'verified').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Amount</CardDescription>
            <CardTitle className="text-3xl">
              ₱{mockPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending Verification</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All Payments</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payments ({payments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking Ref</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">
                        {payment.booking_reference}
                      </TableCell>
                      <TableCell>{payment.customer}</TableCell>
                      <TableCell className="text-sm">{payment.vehicle}</TableCell>
                      <TableCell className="font-semibold">
                        ₱{payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase">
                          {payment.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.payment_method === 'gcash' ? (
                          <div className="text-sm">
                            <p className="font-mono">{payment.gcash_reference}</p>
                            <p className="text-muted-foreground">{payment.gcash_number}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Received by {payment.received_by}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payment.payment_status)}>
                          {payment.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(payment.submitted_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {payment.payment_status === 'pending' ? (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleVerifyPayment(payment.id)}
                            >
                              Verify
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleRejectPayment(payment.id)}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}