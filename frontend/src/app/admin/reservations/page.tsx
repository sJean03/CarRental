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
import Link from 'next/link'
import { bookingService } from '@/services'
import { Reservation } from '@/types'
import { Loader2, Calendar, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate, formatStatus, getStatusColor } from '@/lib/utils'

export default function AdminReservationsPage() {
  const [selectedTab, setSelectedTab] = useState('all')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReservations()
  }, [])

  const loadReservations = async () => {
    try {
      setLoading(true)
      const response = await bookingService.getAllBookings()
      
      const bookingsData = response.data || (response as any).bookings || []
      setReservations(bookingsData)
    } catch (error) {
      console.error('Failed to load reservations:', error)
      toast.error('Failed to load reservations')
    } finally {
      setLoading(false)
    }
  }

  const filterReservations = (status: string) => {
    if (status === 'all') return reservations
    return reservations.filter(r => r.status === status)
  }

  const filteredReservations = filterReservations(selectedTab)

  // Calculate stats
  const totalCount = reservations.length
  const pendingCount = reservations.filter(r => r.status === 'pending_payment').length
  const confirmedCount = reservations.filter(r => r.status === 'confirmed').length
  const activeCount = reservations.filter(r => r.status === 'active').length
  const completedCount = reservations.filter(r => r.status === 'completed').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading reservations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Reservations Management</h2>
        <p className="text-muted-foreground">
          Monitor and manage all rental reservations
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{totalCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Payment</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              {pendingCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Confirmed</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {confirmedCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {activeCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl">
              {completedCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">
            All Reservations
          </TabsTrigger>
          <TabsTrigger value="pending_payment">
            Pending Payment
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Reservations ({filteredReservations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredReservations.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Pickup</TableHead>
                        <TableHead>Dropoff</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReservations.map((reservation) => (
                        <TableRow key={reservation.id}>
                          <TableCell className="font-mono text-sm font-semibold">
                            {reservation.booking_reference}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {reservation.customer_first_name} {reservation.customer_last_name}
                              </p>
                              {reservation.customer_email && (
                                <p className="text-xs text-muted-foreground">
                                  {reservation.customer_email}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {reservation.make} {reservation.model}
                              </p>
                              {reservation.year && (
                                <p className="text-xs text-muted-foreground">
                                  {reservation.year}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <div>
                                <p>{formatDate(reservation.pickup_date)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {reservation.pickup_location_name || 'TBD'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <div>
                                <p>{formatDate(reservation.dropoff_date)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {reservation.dropoff_location_name || 'TBD'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-semibold">
                                {formatCurrency(reservation.total_amount)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Deposit: {formatCurrency(reservation.deposit_amount)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(reservation.status)}>
                              {formatStatus(reservation.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(reservation.created_at)}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" className="gap-1" asChild>
                              <Link href={`/admin/reservations/${reservation.id}`}>
                                <Eye className="h-3 w-3" />
                                View
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No {selectedTab === 'all' ? '' : selectedTab.replace('_', ' ')} reservations found
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