'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import Link from 'next/link'
import { vehicleService } from '@/services'
import { Vehicle } from '@/types'
import { Loader2, Search, Car, Plus, Eye, Edit2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, getStatusColor, formatStatus } from '@/lib/utils'

export default function AdminVehiclesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVehicles()
  }, [])

  const loadVehicles = async () => {
    try {
      setLoading(true)
      const response = await vehicleService.getVehicles()
      
      const vehiclesData = response.data || (response as any).vehicles || []
      setVehicles(vehiclesData)
    } catch (error) {
      console.error('Failed to load vehicles:', error)
      toast.error('Failed to load vehicles')
    } finally {
      setLoading(false)
    }
  }

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.license_plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vehicle.category_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    
    const matchesStatus = filterStatus === 'all' || vehicle.status === filterStatus

    return matchesSearch && matchesStatus
  })

  // Calculate stats
  const totalCount = vehicles.length
  const availableCount = vehicles.filter(v => v.status === 'available').length
  const rentedCount = vehicles.filter(v => v.status === 'rented').length
  const maintenanceCount = vehicles.filter(v => v.status === 'maintenance').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading vehicles...</p>
        </div>
      </div>
    )
  }

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
        <Button className="gap-2" asChild>
          <Link href="/admin/vehicles/add">
            <Plus className="h-4 w-4" />
            Add New Vehicle
          </Link>
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Total Vehicles
            </CardDescription>
            <CardTitle className="text-3xl">{totalCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {availableCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Currently Rented</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {rentedCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Maintenance</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              {maintenanceCount}
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
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by make, model, or license plate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Vehicles ({filteredVehicles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredVehicles.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>License Plate</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Specs</TableHead>
                    <TableHead>Daily Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ownership</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {vehicle.make} {vehicle.model}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.year} • {vehicle.color}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-semibold">
                        {vehicle.license_plate}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {vehicle.category_name || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <p className="capitalize">{vehicle.transmission_type}</p>
                          <p className="text-muted-foreground capitalize">
                            {vehicle.fuel_type} • {vehicle.seating_capacity} seats
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(vehicle.daily_rate)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(vehicle.status)}>
                          {formatStatus(vehicle.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {vehicle.owner_name && (
                            <p className="font-medium">{vehicle.owner_name}</p>
                          )}
                          <p className="text-muted-foreground capitalize">
                            {vehicle.ownership_type?.replace('_', ' ') || 'RentEase owned'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-1" asChild>
                            <Link href={`/vehicles/${vehicle.id}`}>
                              <Eye className="h-3 w-3" />
                              View
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1" asChild>
                            <Link href={`/admin/vehicles/${vehicle.id}/edit`}>
                              <Edit2 className="h-3 w-3" />
                              Edit
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Car className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterStatus !== 'all' 
                  ? 'No vehicles found matching your filters' 
                  : 'No vehicles in the system yet'}
              </p>
              {!searchQuery && filterStatus === 'all' && (
                <Button asChild>
                  <Link href="/admin/vehicles/add">
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Vehicle
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}