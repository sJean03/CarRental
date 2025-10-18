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
import Link from 'next/link'

// Mock reservations data
const mockReservations = [
  {
    id: '1',
    booking_reference: 'RES-2025-0001',
    customer: 'Jace Gonzales',
    vehicle: 'Toyota Vios 2020',
    pickup_date: '2025-10-25T09:00:00',
    dropoff_date: '2025-10-28T17:00:00',
    total_amount: 7500,
    status: 'confirmed',
    payment_status: 'verified',
    created_at: '2025-10-19T10:00:00'
  },
  {
    id: '2',
    booking_reference: 'RES-2025-0002',
    customer: 'Maria Santos',
    vehicle: 'Honda City 2021',
    pickup_date: '2025-10-22T10:00:00',
    dropoff_date: '2025-10-24T18:00:00',
    total_amount: 5600,
    status: 'pending_payment',
    payment_status: 'pending',
    created_at: '2025-10-20T14:30:00'
  },
  {
    id: '3',
    booking_reference: 'RES-2025-0003',
    customer: 'Juan Reyes',
    vehicle: 'Mitsubishi Montero Sport 2022',
    pickup_date: '2025-10-21T08:00:00',
    dropoff_date: '2025-10-23T20:00:00',
    total_amount: 13500,
    status: 'active',
    payment_status: 'verified',
    created_at: '2025-10-18T09:15:00'
  },
  {
    id: '4',
    booking_reference: 'RES-2025-0004',
    customer: 'Pedro Santos',
    vehicle: 'BMW 3 Series 2021',
    pickup_date: '2025-09-15T09:00:00',
    dropoff_date: '2025-09-20T18:00:00',
    total_amount: 37500,
    status: 'completed',
    payment_status: 'completed',
    created_at: '2025-09-10T11:00:00'
  },
  {
    id: '5',
    booking_reference: 'RES-2025-0005',
    customer: 'Ana Cruz',
    vehicle: 'Fiat Panda 2019',
    pickup_date: '2025-10-30T10:00:00',
    dropoff_date: '2025-11-02T16:00:00',
    total_amount: 6600,
    status: 'cancelled',
    payment_status: 'refunded',
    created_at: '2025-10-15T16:45:00'
  }
]

export default function AdminReservationsPage() {
  const [selectedTab, setSelectedTab] = useState('all')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
      case 'active':
        return 'bg-green-100 text-green-800 hover:bg-green-100'
      case 'completed':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-100'
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    }
  }

  const getPaymentStatusColor = (status: string) => {
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

  const filterReservations = (status: string) => {
    if (status === 'all') return mockReservations
    return mockReservations.filter(r => r.status === status)
  }

  const reservations = filterReservations(selectedTab)

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
            <CardTitle className="text-3xl">{mockReservations.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Payment</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              {mockReservations.filter(r => r.status === 'pending_payment').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Confirmed</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {mockReservations.filter(r => r.status === 'confirmed').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {mockReservations.filter(r => r.status === 'active').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl">
              {mockReservations.filter(r => r.status === 'completed').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All Reservations</TabsTrigger>
          <TabsTrigger value="pending_payment">Pending Payment</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Reservations ({reservations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-mono text-sm">
                        {reservation.booking_reference}
                      </TableCell>
                      <TableCell>{reservation.customer}</TableCell>
                      <TableCell>{reservation.vehicle}</TableCell>
                      <TableCell className="text-sm">
                        <div>
                          <p>{new Date(reservation.pickup_date).toLocaleDateString()}</p>
                          <p className="text-muted-foreground">
                            to {new Date(reservation.dropoff_date).toLocaleDateString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₱{reservation.total_amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(reservation.status)}>
                          {reservation.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPaymentStatusColor(reservation.payment_status)}>
                          {reservation.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/reservations/${reservation.id}`}>View</Link>
                        </Button>
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