import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import BookingForm from '@/components/vehicles/BookingForm'
import VehicleCard from '@/components/vehicles/VehicleCard'
import { Vehicle } from '@/types/vehicle'

// Mock data (same as vehicles page - we'll use API later)
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

export default function VehicleDetailsPage({ params }: { params: { id: string } }) {
  // Find the vehicle
  const vehicle = mockVehicles.find(v => v.id === params.id)

  // If vehicle not found, show 404
  if (!vehicle) {
    notFound()
  }

  // Get similar vehicles (same category, exclude current)
  const similarVehicles = mockVehicles
    .filter(v => v.category_id === vehicle.category_id && v.id !== vehicle.id)
    .slice(0, 3)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        {' / '}
        <Link href="/vehicles" className="hover:text-foreground">Vehicles</Link>
        {' / '}
        <span className="text-foreground">{vehicle.make} {vehicle.model}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Vehicle Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <Card className="overflow-hidden">
            <div className="h-96 bg-muted flex items-center justify-center relative">
              {vehicle.image_urls && vehicle.image_urls.length > 0 ? (
                <img 
                  src={vehicle.image_urls[0]} 
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <p className="text-muted-foreground text-lg">No Image Available</p>
                  <p className="text-sm text-muted-foreground mt-2">Vehicle photos coming soon</p>
                </div>
              )}
              
              {/* Status Badge */}
              <Badge 
                variant={vehicle.status === 'available' ? 'default' : 'secondary'}
                className="absolute top-4 right-4"
              >
                {vehicle.status}
              </Badge>
            </div>
          </Card>

          {/* Vehicle Title */}
          <div>
            <h1 className="text-4xl font-bold mb-2">
              {vehicle.make} {vehicle.model} {vehicle.year}
            </h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{vehicle.category_name}</Badge>
              <Badge variant="outline">{vehicle.color}</Badge>
              <Badge variant="outline">License: {vehicle.license_plate}</Badge>
            </div>
          </div>

          {/* Tabs with Details */}
          <Tabs defaultValue="specs" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="specs">Specifications</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="terms">Rental Terms</TabsTrigger>
            </TabsList>

            <TabsContent value="specs" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <dl className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Make</dt>
                      <dd className="text-lg font-semibold">{vehicle.make}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Model</dt>
                      <dd className="text-lg font-semibold">{vehicle.model}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Year</dt>
                      <dd className="text-lg font-semibold">{vehicle.year}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Color</dt>
                      <dd className="text-lg font-semibold">{vehicle.color}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Transmission</dt>
                      <dd className="text-lg font-semibold capitalize">{vehicle.transmission_type}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Fuel Type</dt>
                      <dd className="text-lg font-semibold capitalize">{vehicle.fuel_type}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Seating</dt>
                      <dd className="text-lg font-semibold">{vehicle.seating_capacity} Passengers</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Mileage</dt>
                      <dd className="text-lg font-semibold">{vehicle.current_mileage.toLocaleString()} km</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Air Conditioning</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Power Steering</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Audio System</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Power Windows</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Central Locking</span>
                    </li>
                    {vehicle.category_name === 'Luxury' && (
                      <>
                        <li className="flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          <span>Leather Seats</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          <span>Navigation System</span>
                        </li>
                      </>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="terms" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Requirements</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Valid driver's license</li>
                      <li>• Government-issued ID</li>
                      <li>• Minimum age: 21 years old</li>
                      <li>• Proof of address</li>
                    </ul>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Rental Policy</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Minimum rental period: 1 day</li>
                      <li>• Late return fee: ₱500/hour</li>
                      <li>• Fuel policy: Return with same fuel level</li>
                      <li>• Cleaning fee: ₱1,000 if returned dirty</li>
                    </ul>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Payment Methods</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Cash payment at branch</li>
                      <li>• GCash transfer accepted</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Booking Form */}
        <div>
          <BookingForm 
            vehicleId={vehicle.id}
            dailyRate={vehicle.daily_rate}
            vehicleName={`${vehicle.make} ${vehicle.model}`}
          />
        </div>
      </div>

      {/* Similar Vehicles */}
      {similarVehicles.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Similar Vehicles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similarVehicles.map(v => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}