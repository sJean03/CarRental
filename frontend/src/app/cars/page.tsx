'use client';

import { useEffect, useState } from 'react';
import { carsApi } from '@/lib/api/cars';
import { Car, CarFilters } from '@/lib/api/types';
import { CarCard } from '@/components/cars/carCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<CarFilters>({
    status: 'listed',
  });

  useEffect(() => {
    fetchCars();
  }, [filters]);

  const fetchCars = async () => {
    try {
      setIsLoading(true);
      const response = await carsApi.getAll(filters);
      if (response.success && response.data) {
        setCars(response.data.cars);
      }
    } catch (error: any) {
      toast.error('Failed to load cars');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('search') as string;
    setFilters({ ...filters, search });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse Cars</h1>
        <p className="text-gray-600">Find your perfect ride</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                name="search"
                placeholder="Search by make or model..."
                className="w-full"
              />
            </div>
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            value={filters.transmission || ''}
            onValueChange={(value) =>
              setFilters({ ...filters, transmission: value as any })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Transmission" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="automatic">Automatic</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.fuel_type || ''}
            onValueChange={(value) =>
              setFilters({ ...filters, fuel_type: value as any })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Fuel Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="petrol">Petrol</SelectItem>
              <SelectItem value="diesel">Diesel</SelectItem>
              <SelectItem value="electric">Electric</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.min_seats?.toString() || ''}
            onValueChange={(value) =>
              setFilters({ ...filters, min_seats: parseInt(value) })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Min Seats" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
              <SelectItem value="5">5+</SelectItem>
              <SelectItem value="7">7+</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sort_by || 'created_at'}
            onValueChange={(value) =>
              setFilters({ ...filters, sort_by: value as any })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Newest</SelectItem>
              <SelectItem value="daily_rate">Price: Low to High</SelectItem>
              <SelectItem value="average_rating">Top Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {Object.keys(filters).length > 1 && (
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setFilters({ status: 'listed' })}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Cars Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : cars.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No cars found matching your criteria.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setFilters({ status: 'listed' })}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
          <div className="mt-8 text-center text-gray-600">
            Showing {cars.length} car{cars.length !== 1 ? 's' : ''}
          </div>
        </>
      )}
    </div>
  );
}
