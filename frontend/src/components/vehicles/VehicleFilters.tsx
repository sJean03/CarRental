'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { VehicleFilters } from '@/types/vehicle'

interface VehicleFiltersProps {
  filters: VehicleFilters;
  onFilterChange: (filters: VehicleFilters) => void;
}

export default function VehicleFiltersComponent({ filters, onFilterChange }: VehicleFiltersProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value })
  }

  const handleCategoryChange = (value: string) => {
    onFilterChange({ ...filters, category: value === 'all' ? undefined : value })
  }

  const handleTransmissionChange = (value: string) => {
    onFilterChange({ 
      ...filters, 
      transmission: value === 'all' ? undefined : value as 'automatic' | 'manual' 
    })
  }

  const handleFuelTypeChange = (value: string) => {
    onFilterChange({ 
      ...filters, 
      fuel_type: value === 'all' ? undefined : value as any
    })
  }

  const handleReset = () => {
    onFilterChange({})
  }

  return (
    <div className="bg-card border rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Filter Vehicles</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <Input
          placeholder="Search by make or model..."
          value={filters.search || ''}
          onChange={handleSearchChange}
        />

        {/* Category */}
        <Select value={filters.category || 'all'} onValueChange={handleCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="small-car">Small Car</SelectItem>
            <SelectItem value="sedan">Sedan</SelectItem>
            <SelectItem value="suv">SUV</SelectItem>
            <SelectItem value="van">Van</SelectItem>
            <SelectItem value="luxury">Luxury</SelectItem>
          </SelectContent>
        </Select>

        {/* Transmission */}
        <Select value={filters.transmission || 'all'} onValueChange={handleTransmissionChange}>
          <SelectTrigger>
            <SelectValue placeholder="Transmission" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Transmission</SelectItem>
            <SelectItem value="automatic">Automatic</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>

        {/* Fuel Type */}
        <Select value={filters.fuel_type || 'all'} onValueChange={handleFuelTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Fuel Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fuel Types</SelectItem>
            <SelectItem value="petrol">Petrol</SelectItem>
            <SelectItem value="diesel">Diesel</SelectItem>
            <SelectItem value="electric">Electric</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset Button */}
        <Button variant="outline" onClick={handleReset}>
          Reset Filters
        </Button>
      </div>
    </div>
  )
}