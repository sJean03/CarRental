'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

// Mock admin dashboard data
const mockAdminStats = {
  total_vehicles: 6,
  available_vehicles: 4,
  rented_vehicles: 1,
  maintenance_vehicles: 1,
  total_customers: 24,
  total_owners: 2,
  active_rentals: 1,
  pending_reservations: 2,
  completed_rentals: 18,
  total_revenue_month: 142500,
  total_revenue_all: 875000,
  pending_payments: 3
}

const mockRecentActivity = [
  {
    id: '1',
    type: 'new_booking',
    description: 'New booking for Toyota Vios 2020',
    customer: 'Juan Dela Cruz',
    time: '2025-10-19T14:30:00',
    status: 'confirmed'
  },
  {
    id: '2',
    type: 'payment_verified',
    description: 'Payment verified for Honda City',
    customer: 'Maria Santos',
    time: '2025-10-19T13:15:00',
    status: 'completed'
  },
  {
    id: '3',
    type: 'vehicle_returned',
    description: 'Mitsubishi Montero Sport returned',
    customer: 'Pedro Reyes',
    time: '2025-10-19T10:00:00',
    status: 'completed'
  }
]

const mockPendingActions = [
  {
    id: '1',
    type: 'payment_verification',
    title: 'Verify GCash Payment',
    description: 'Booking RES-2025-0005 awaiting payment verification',
    priority: 'high'
  },
  {
    id: '2',
    type: 'vehicle_maintenance',
    title: 'Schedule Maintenance',
    description: 'Toyota Hiace needs routine maintenance',
    priority: 'medium'
  },
  {
    id: '3',
    type: 'owner_payment',
    title: 'Process Owner Payment',
    description: 'Monthly payment for Maria Santos (September)',
    priority: 'high'
  }
]

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Manage vehicles, reservations, and monitor system performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Vehicles</CardDescription>
            <CardTitle className="text-3xl">{mockAdminStats.total_vehicles}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 text-xs">
              <span className="text-green-600">{mockAdminStats.available_vehicles} Available</span>
              <span className="text-blue-600">{mockAdminStats.rented_vehicles} Rented</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Rentals</CardDescription>
            <CardTitle className="text-3xl">{mockAdminStats.active_rentals}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {mockAdminStats.pending_reservations} pending reservations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Month Revenue</CardDescription>
            <CardTitle className="text-3xl">
              ₱{mockAdminStats.total_revenue_month.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-600">+18% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">
              {mockAdminStats.total_customers + mockAdminStats.total_owners}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 text-xs">
              <span className="text-muted-foreground">{mockAdminStats.total_customers} Customers</span>
              <span className="text-muted-foreground">{mockAdminStats.total_owners} Owners</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Pending Actions</CardTitle>
                <CardDescription>Tasks requiring attention</CardDescription>
              </div>
              <Badge variant="destructive">{mockPendingActions.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockPendingActions.map((action) => (
                <div key={action.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{action.title}</p>
                      <Badge 
                        variant={action.priority === 'high' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {action.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.customer} • {new Date(activity.time).toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button asChild className="h-auto py-4">
              <Link href="/admin/vehicles">
                <div className="text-left">
                  <p className="font-semibold">Manage Vehicles</p>
                  <p className="text-xs opacity-90">Add, edit, or remove</p>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4">
              <Link href="/admin/reservations">
                <div className="text-left">
                  <p className="font-semibold">View Reservations</p>
                  <p className="text-xs">Check bookings</p>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4">
              <Link href="/admin/customers">
                <div className="text-left">
                  <p className="font-semibold">Manage Customers</p>
                  <p className="text-xs">View user accounts</p>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4">
              <Link href="/admin/payments">
                <div className="text-left">
                  <p className="font-semibold">Payment Verification</p>
                  <p className="text-xs">Review payments</p>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completed Rentals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{mockAdminStats.completed_rentals}</p>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₱{mockAdminStats.total_revenue_all.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{mockAdminStats.pending_payments}</p>
            <p className="text-xs text-muted-foreground mt-1">Awaiting verification</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}