'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// Mock data for owner's vehicles with more details
const mockOwnerVehicles = [
  {
    id: '1',
    make: 'Toyota',
    model: 'Vios',
    year: 2020,
    color: 'White',
    license_plate: 'ABC-1234',
    status: 'available',
    daily_rate: 2500,
    total_rentals: 15,
    total_days_rented: 45,
    this_month_rentals: 3,
    this_month_days: 9,
    this_month_earnings: 37500,
    total_earnings: 187500,
    next_rental: null,
    last_maintenance: '2025-09-15'
  },
  {
    id: '3',
    make: 'Fiat',
    model: 'Panda',
    year: 2019,
    color: 'Red',
    license_plate: 'DEF-9012',
    status: 'available',
    daily_rate: 2200,
    total_rentals: 8,
    total_days_rented: 24,
    this_month_rentals: 2,
    this_month_days: 8,
    this_month_earnings: 17600,
    total_earnings: 88000,
    next_rental: {
      pickup_date: '2025-10-25',
      dropoff_date: '2025-10-27'
    },
    last_maintenance: '2025-08-20'
  }
]

export default function OwnerVehiclesPage() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 hover:bg-green-100'
      case 'rented':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">My Vehicles</h2>
        <p className="text-muted-foreground">
          Track the performance of your vehicles leased to RentEase PH
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Vehicles</CardDescription>
            <CardTitle className="text-3xl">{mockOwnerVehicles.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {mockOwnerVehicles.filter(v => v.status === 'available').length} Available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Month Rentals</CardDescription>
            <CardTitle className="text-3xl">
              {mockOwnerVehicles.reduce((sum, v) => sum + v.this_month_rentals, 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {mockOwnerVehicles.reduce((sum, v) => sum + v.this_month_days, 0)} days total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Month Earnings</CardDescription>
            <CardTitle className="text-3xl">
              ₱{mockOwnerVehicles.reduce((sum, v) => sum + v.this_month_earnings, 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-600">Across all vehicles</p>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle List */}
      <div className="space-y-4">
        {mockOwnerVehicles.map((vehicle) => (
          <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">
                      {vehicle.make} {vehicle.model} {vehicle.year}
                    </CardTitle>
                    <Badge className={getStatusColor(vehicle.status)}>
                      {vehicle.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    License Plate: {vehicle.license_plate} • {vehicle.color}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">₱{vehicle.daily_rate.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">per day</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Performance Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Rentals</p>
                  <p className="text-2xl font-bold">{vehicle.total_rentals}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Days Rented</p>
                  <p className="text-2xl font-bold">{vehicle.total_days_rented}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">{vehicle.this_month_rentals}</p>
                  <p className="text-xs text-muted-foreground">{vehicle.this_month_days} days</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Month Earnings</p>
                  <p className="text-2xl font-bold">₱{vehicle.this_month_earnings.toLocaleString()}</p>
                </div>
              </div>

              <Separator />

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Earnings</p>
                  <p className="font-semibold">₱{vehicle.total_earnings.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Maintenance</p>
                  <p className="font-semibold">
                    {new Date(vehicle.last_maintenance).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Next Rental Info */}
              {vehicle.next_rental && (
                <>
                  <Separator />
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-blue-900 mb-1">Upcoming Rental</p>
                    <p className="text-sm text-blue-700">
                      {new Date(vehicle.next_rental.pickup_date).toLocaleDateString()} - {' '}
                      {new Date(vehicle.next_rental.dropoff_date).toLocaleDateString()}
                    </p>
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button asChild className="flex-1">
                  <Link href={`/owner/vehicles/${vehicle.id}`}>
                    View Details
                  </Link>
                </Button>
                <Button variant="outline" className="flex-1">
                  View Rental History
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>Have questions about your vehicles?</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4">
            Contact RentEase support if you have any concerns about your vehicles, 
            maintenance scheduling, or payment inquiries.
          </p>
          <Button variant="outline" asChild>
            <Link href="/contact">Contact Support</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}