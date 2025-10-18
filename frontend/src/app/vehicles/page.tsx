'use client'

import { useState } from 'react'
import VehicleCard from '@/components/vehicles/VehicleCard'
import VehicleFiltersComponent from '@/components/vehicles/VehicleFilters'
import { Vehicle, VehicleFilters } from '@/types/vehicle'

// Mock data (we'll replace this with API calls later)
const mockVehicles: Vehicle[] = [
  {
    id: '1',
    make: 'Toyota',
    model: 'Vios',
    year: 2020,
    color: 'White',
    license_plate: 'ABC-1234',
    category_id: '1',
    category_name: 'Sedan',
    transmission_type: 'automatic',
    fuel_type: 'petrol',
    seating_capacity: 5,
    current_mileage: 45230,
    daily_rate: 2500,
    status: 'available',
    image_urls: []
  },
  {
    id: '2',
    make: 'Honda',
    model: 'City',
    year: 2021,
    color: 'Silver',
    license_plate: 'XYZ-5678',
    category_id: '1',
    category_name: 'Sedan',
    transmission_type: 'automatic',
    fuel_type: 'petrol',
    seating_capacity: 5,
    current_mileage: 32000,
    daily_rate: 2800,
    status: 'available',
    image_urls: []
  },
  {
    id: '3',
    make: 'Mitsubishi',
    model: 'Montero Sport',
    year: 2022,
    color: 'Black',
    license_plate: 'DEF-9012',
    category_id: '3',
    category_name: 'SUV',
    transmission_type: 'automatic',
    fuel_type: 'diesel',
    seating_capacity: 7,
    current_mileage: 15000,
    daily_rate: 4500,
    status: 'available',
    image_urls: []
  },
  {
    id: '4',
    make: 'Fiat',
    model: 'Panda',
    year: 2019,
    color: 'Red',
    license_plate: 'GHI-3456',
    category_id: '0',
    category_name: 'Small Car',
    transmission_type: 'manual',
    fuel_type: 'petrol',
    seating_capacity: 4,
    current_mileage: 58000,
    daily_rate: 2200,
    status: 'available',
    image_urls: []
  },
  {
    id: '5',
    make: 'Toyota',
    model: 'Hiace',
    year: 2020,
    color: 'White',
    license_plate: 'JKL-7890',
    category_id: '4',
    category_name: 'Van',
    transmission_type: 'manual',
    fuel_type: 'diesel',
    seating_capacity: 15,
    current_mileage: 72000,
    daily_rate: 5500,
    status: 'rented',
    image_urls: []
  },
  {
    id: '6',
    make: 'BMW',
    model: '3 Series',
    year: 2021,
    color: 'Blue',
    license_plate: 'MNO-1234',
    category_id: '5',
    category_name: 'Luxury',
    transmission_type: 'automatic',
    fuel_type: 'petrol',
    seating_capacity: 5,
    current_mileage: 28000,
    daily_rate: 7500,
    status: 'available',
    image_urls: []
  }
]

export default function VehiclesPage() {
  const [filters, setFilters] = useState<VehicleFilters>({})

  // Filter vehicles based on current filters
  const filteredVehicles = mockVehicles.filter(vehicle => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch = 
        vehicle.make.toLowerCase().includes(searchLower) ||
        vehicle.model.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }

    if (filters.transmission && vehicle.transmission_type !== filters.transmission) {
      return false
    }

    if (filters.fuel_type && vehicle.fuel_type !== filters.fuel_type) {
      return false
    }

    if (filters.category && vehicle.category_name?.toLowerCase().replace(' ', '-') !== filters.category) {
      return false
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
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Vehicle Grid */}
      {filteredVehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map(vehicle => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No vehicles found matching your criteria.</p>
          <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters.</p>
        </div>
      )}
    </div>
  )
}