import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Vehicle } from '@/types/vehicle'

interface VehicleCardProps {
  vehicle: Vehicle;
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Vehicle Image */}
      <div className="h-48 bg-muted flex items-center justify-center relative">
        {vehicle.image_urls && vehicle.image_urls.length > 0 ? (
          <img 
            src={vehicle.image_urls[0]} 
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-muted-foreground">No Image Available</span>
        )}
        
        {/* Status Badge */}
        {vehicle.status !== 'available' && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 right-2"
          >
            {vehicle.status}
          </Badge>
        )}
      </div>

      <CardHeader>
        <CardTitle>{vehicle.make} {vehicle.model}</CardTitle>
        <CardDescription>{vehicle.year}</CardDescription>
      </CardHeader>

      <CardContent>
        {/* Vehicle Specs */}
        <div className="flex flex-wrap gap-2 mb-4 text-sm text-muted-foreground">
          <Badge variant="outline">{vehicle.category_name || 'Sedan'}</Badge>
          <Badge variant="outline">
            {vehicle.transmission_type === 'automatic' ? 'Automatic' : 'Manual'}
          </Badge>
          <Badge variant="outline">{vehicle.seating_capacity} Seats</Badge>
          <Badge variant="outline">
            {vehicle.fuel_type.charAt(0).toUpperCase() + vehicle.fuel_type.slice(1)}
          </Badge>
        </div>

        {/* Price and Action */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-2xl font-bold">₱{vehicle.daily_rate.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">per day</p>
          </div>
          <Button asChild disabled={vehicle.status !== 'available'}>
            <Link href={`/vehicles/${vehicle.id}`}>
              {vehicle.status === 'available' ? 'View Details' : 'Unavailable'}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}