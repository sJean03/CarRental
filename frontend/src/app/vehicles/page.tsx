'use client'

import { useState, useEffect } from 'react'
import VehicleCard from '@/components/vehicles/VehicleCard'
import VehicleFiltersComponent from '@/components/vehicles/VehicleFilters'
import { Vehicle, VehicleFilters } from '@/types' // ← Fixed import
import { vehicleService } from '@/services'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<VehicleFilters>({})

  // Load vehicles on mount and when filters change
  useEffect(() => {
    loadVehicles()
  }, [filters])

  const loadVehicles = async () => {
    try {
      setLoading(true)
      const response = await vehicleService.getVehicles(filters)
      
      // Handle different response formats from backend
      let vehicleData: Vehicle[] = []
      
      if (Array.isArray(response)) {
        vehicleData = response
      } else if (response.data && Array.isArray(response.data)) {
        vehicleData = response.data
      } else if ((response as any).vehicles && Array.isArray((response as any).vehicles)) {
        vehicleData = (response as any).vehicles
      }
      
      setVehicles(vehicleData)
    } catch (error: any) {
      console.error('Failed to load vehicles:', error)
      toast.error('Failed to load vehicles. Please try again.')
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }

  // Filter vehicles on client-side for immediate feedback
  const filteredVehicles = vehicles.filter(vehicle => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch = 
        vehicle.make.toLowerCase().includes(searchLower) ||
        vehicle.model.toLowerCase().includes(searchLower) ||
        (vehicle.category_name?.toLowerCase().includes(searchLower) ?? false)
      if (!matchesSearch) return false
    }
    return true
  })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Browse Vehicles</h1>
        <p className="text-muted-foreground">
          Choose from our wide selection of vehicles available for rent
        </p>
      </div>

      {/* Filters */}
      <VehicleFiltersComponent filters={filters} onFilterChange={setFilters} />

      {/* Results Count */}
      {!loading && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading vehicles...</p>
          </div>
        </div>
      ) : (
        /* Vehicle Grid */
        filteredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map(vehicle => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No vehicles found matching your criteria.</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters.</p>
          </div>
        )
      )}
    </div>
  )
}