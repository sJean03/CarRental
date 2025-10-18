'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui/badge'

// Mock data for owner's vehicles
const mockOwnerVehicles = [
  {
    id: '1',
    make: 'Toyota',
    model: 'Vios',
    year: 2020,
    license_plate: 'ABC-1234',
    status: 'available',
    total_rentals: 15,
    current_rental: null,
    monthly_earnings: 37500
  },
  {
    id: '3',
    make: 'Fiat',
    model: 'Panda',
    year: 2019,
    license_plate: 'DEF-9012',
    status: 'available',
    total_rentals: 8,
    current_rental: null,
    monthly_earnings: 17600
  }
]

const mockEarnings = {
  this_month: 55100,
  last_month: 48300,
  total_earned: 325000,
  pending_payment: 55100
}

export default function OwnerDashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome back, {user?.first_name}!</CardTitle>
          <CardDescription>
            Track your vehicles and earnings with RentEase PH
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>My Vehicles</CardDescription>
            <CardTitle className="text-3xl">{mockOwnerVehicles.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Leased to RentEase</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-3xl">₱{mockEarnings.this_month.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-600">
              +14% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Earned</CardDescription>
            <CardTitle className="text-3xl">₱{mockEarnings.total_earned.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Payment</CardDescription>
            <CardTitle className="text-3xl">₱{mockEarnings.pending_payment.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">To be paid out</p>
          </CardContent>
        </Card>
      </div>

      {/* My Vehicles */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>My Vehicles</CardTitle>
              <CardDescription>Vehicles leased to RentEase PH</CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/owner/vehicles">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockOwnerVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">
                      {vehicle.make} {vehicle.model} {vehicle.year}
                    </p>
                    <Badge variant={vehicle.status === 'available' ? 'default' : 'secondary'}>
                      {vehicle.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    License: {vehicle.license_plate}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total Rentals: {vehicle.total_rentals}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">₱{vehicle.monthly_earnings.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">This month</p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <Link href={`/owner/vehicles/${vehicle.id}`}>View Details</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest rentals of your vehicles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Toyota Vios 2020</p>
                <p className="text-sm text-muted-foreground">Rented Oct 15-18, 2025</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">₱7,500</p>
                <Badge variant="outline">Completed</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Fiat Panda 2019</p>
                <p className="text-sm text-muted-foreground">Rented Oct 10-12, 2025</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">₱4,400</p>
                <Badge variant="outline">Completed</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild className="h-auto py-4">
              <Link href="/owner/vehicles">
                <div className="text-left">
                  <p className="font-semibold">View Vehicles</p>
                  <p className="text-xs opacity-90">See all your vehicles</p>
                </div>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4">
              <Link href="/owner/earnings">
                <div className="text-left">
                  <p className="font-semibold">Earnings Report</p>
                  <p className="text-xs">View payment history</p>
                </div>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4">
              <Link href="/contact">
                <div className="text-left">
                  <p className="font-semibold">Contact Support</p>
                  <p className="text-xs">Get help from RentEase</p>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}