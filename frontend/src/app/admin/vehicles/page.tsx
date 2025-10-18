'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import Link from 'next/link'

// Mock vehicles data
const mockVehicles = [
  {
    id: '1',
    make: 'Toyota',
    model: 'Vios',
    year: 2020,
    license_plate: 'ABC-1234',
    category: 'Sedan',
    transmission: 'Automatic',
    fuel_type: 'Petrol',
    daily_rate: 2500,
    status: 'available',
    owner: 'Maria Santos',
    ownership_type: 'leased'
  },
  {
    id: '2',
    make: 'Honda',
    model: 'City',
    year: 2021,
    license_plate: 'XYZ-5678',
    category: 'Sedan',
    transmission: 'Automatic',
    fuel_type: 'Petrol',
    daily_rate: 2800,
    status: 'available',
    owner: 'RentEase',
    ownership_type: 'owned'
  },
  {
    id: '3',
    make: 'Mitsubishi',
    model: 'Montero Sport',
    year: 2022,
    license_plate: 'DEF-9012',
    category: 'SUV',
    transmission: 'Automatic',
    fuel_type: 'Diesel',
    daily_rate: 4500,
    status: 'rented',
    owner: 'RentEase',
    ownership_type: 'owned'
  },
  {
    id: '4',
    make: 'Fiat',
    model: 'Panda',
    year: 2019,
    license_plate: 'GHI-3456',
    category: 'Small Car',
    transmission: 'Manual',
    fuel_type: 'Petrol',
    daily_rate: 2200,
    status: 'available',
    owner: 'Juan Reyes',
    ownership_type: 'leased'
  },
  {
    id: '5',
    make: 'Toyota',
    model: 'Hiace',
    year: 2020,
    license_plate: 'JKL-7890',
    category: 'Van',
    transmission: 'Manual',
    fuel_type: 'Diesel',
    daily_rate: 5500,
    status: 'maintenance',
    owner: 'RentEase',
    ownership_type: 'owned'
  },
  {
    id: '6',
    make: 'BMW',
    model: '3 Series',
    year: 2021,
    license_plate: 'MNO-1234',
    category: 'Luxury',
    transmission: 'Automatic',
    fuel_type: 'Petrol',
    daily_rate: 7500,
    status: 'available',
    owner: 'RentEase',
    ownership_type: 'owned'
  }
]

export default function AdminVehiclesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 hover:bg-green-100'
      case 'rented':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
      case 'retired':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    }
  }

  const filteredVehicles = mockVehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.license_plate.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || vehicle.status === filterStatus

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold mb-2">Vehicles Management</h2>
          <p className="text-muted-foreground">
            Manage all vehicles in the RentEase fleet
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/vehicles/add">Add New Vehicle</Link>
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Vehicles</CardDescription>
            <CardTitle className="text-3xl">{mockVehicles.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {mockVehicles.filter(v => v.status === 'available').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Currently Rented</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {mockVehicles.filter(v => v.status === 'rented').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Maintenance</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              {mockVehicles.filter(v => v.status === 'maintenance').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Search by make, model, or license plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Vehicles ({filteredVehicles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>License Plate</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Daily Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                      <p className="text-sm text-muted-foreground">{vehicle.year}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{vehicle.license_plate}</TableCell>
                  <TableCell>{vehicle.category}</TableCell>
                  <TableCell>₱{vehicle.daily_rate.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(vehicle.status)}>
                      {vehicle.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{vehicle.owner}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {vehicle.ownership_type}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/vehicles/${vehicle.id}`}>View</Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/vehicles/${vehicle.id}/edit`}>Edit</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}