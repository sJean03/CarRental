'use client'

import { useState, useEffect } from 'react'
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
import { paymentService } from '@/services'
import { Payment } from '@/types'
import { Loader2, CheckCircle, XCircle, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate, formatStatus, getStatusColor } from '@/lib/utils'

export default function AdminPaymentsPage() {
  const [selectedTab, setSelectedTab] = useState('pending')
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState<string | null>(null)

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    try {
      setLoading(true)
      const response = await paymentService.getAllPayments()
      
      const paymentsData = response.data || (response as any).payments || []
      setPayments(paymentsData)
    } catch (error) {
      console.error('Failed to load payments:', error)
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  const filterPayments = (status: string) => {
    if (status === 'all') return payments
    return payments.filter(p => p.payment_status === status)
  }

  const handleVerifyPayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to verify this payment?')) {
      return
    }

    try {
      setVerifying(paymentId)
      await paymentService.verifyPayment(paymentId)
      
      toast.success('Payment verified successfully!')
      // Reload payments
      loadPayments()
    } catch (error: any) {
      console.error('Failed to verify payment:', error)
      toast.error(error.response?.data?.error || 'Failed to verify payment')
    } finally {
      setVerifying(null)
    }
  }

  const handleRejectPayment = async (paymentId: string) => {
    const reason = prompt('Enter reason for rejection (optional):')
    
    if (reason === null) return // User cancelled

    if (!confirm('Are you sure you want to reject this payment?')) {
      return
    }

    try {
      setVerifying(paymentId)
      
      // For now, we'll just show a message since there's no reject endpoint yet
      // You can add a reject endpoint in the backend if needed
      toast.info('Reject functionality - contact customer to resubmit payment')
      
      // Optionally, you could delete or mark the payment somehow
    } catch (error: any) {
      console.error('Failed to reject payment:', error)
      toast.error('Failed to reject payment')
    } finally {
      setVerifying(null)
    }
  }

  const filteredPayments = filterPayments(selectedTab)

  // Calculate stats
  const totalPayments = payments.length
  const pendingCount = payments.filter(p => p.payment_status === 'pending').length
  const verifiedCount = payments.filter(p => p.payment_status === 'verified').length
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading payments...</p>
        </div>
      </div>
    )
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
            <CardTitle className="text-3xl">{totalPayments}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Verification</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              {pendingCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Verified</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {verifiedCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Amount</CardDescription>
            <CardTitle className="text-3xl">
              {formatCurrency(totalAmount)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending Verification
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All Payments</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payments ({filteredPayments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPayments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking Ref</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-sm">
                            {payment.booking_reference || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {payment.customer_name || 'N/A'}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="uppercase">
                              {payment.payment_method}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {payment.payment_type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {payment.payment_method === 'gcash' ? (
                              <div className="text-sm space-y-1">
                                <p className="font-mono text-xs">{payment.gcash_reference}</p>
                                <p className="text-muted-foreground text-xs">{payment.gcash_number}</p>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                Cash payment
                              </p>
                            )}
                            {payment.notes && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Note: {payment.notes}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(payment.payment_status)}>
                              {formatStatus(payment.payment_status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(payment.created_at)}
                            <p className="text-xs text-muted-foreground">
                              {new Date(payment.created_at).toLocaleTimeString()}
                            </p>
                          </TableCell>
                          <TableCell>
                            {payment.payment_status === 'pending' ? (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleVerifyPayment(payment.id)}
                                  disabled={verifying === payment.id}
                                  className="gap-1"
                                >
                                  {verifying === payment.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3" />
                                  )}
                                  Verify
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleRejectPayment(payment.id)}
                                  disabled={verifying === payment.id}
                                  className="gap-1"
                                >
                                  <XCircle className="h-3 w-3" />
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" className="gap-1">
                                <Eye className="h-3 w-3" />
                                View
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No {selectedTab === 'all' ? '' : selectedTab} payments found
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}