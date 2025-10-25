'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Car } from '@/lib/api/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Users, Gauge, Fuel } from 'lucide-react';

interface CarCardProps {
  car: Car;
}

export function CarCard({ car }: CarCardProps) {
  const imageUrl = car.image_urls?.[0] || '/images/car-placeholder.jpg';

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 w-full">
        <Image
          src={imageUrl}
          alt={`${car.make} ${car.model}`}
          fill
          className="object-cover"
        />
        {car.average_rating > 0 && (
          <Badge className="absolute top-2 right-2 bg-white text-black">
            <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
            {car.average_rating.toFixed(1)}
          </Badge>
        )}
      </div>

      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">
              {car.make} {car.model}
            </h3>
            <p className="text-sm text-muted-foreground">{car.year}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">₱{car.daily_rate.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">per day</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{car.seating_capacity}</span>
          </div>
          <div className="flex items-center gap-1">
            <Gauge className="w-4 h-4" />
            <span className="capitalize">{car.transmission}</span>
          </div>
          <div className="flex items-center gap-1">
            <Fuel className="w-4 h-4" />
            <span className="capitalize">{car.fuel_type}</span>
          </div>
        </div>

        {car.branch_city && (
          <p className="text-sm text-muted-foreground mt-2">
            📍 {car.branch_city}
          </p>
        )}
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/cars/${car.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}