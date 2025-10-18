'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

interface BookingFormProps {
  vehicleId: string;
  dailyRate: number;
  vehicleName: string;
}

export default function BookingForm({ vehicleId, dailyRate, vehicleName }: BookingFormProps) {
  const [pickupDate, setPickupDate] = useState('')
  const [dropoffDate, setDropoffDate] = useState('')
  const [pickupLocation, setPickupLocation] = useState('')
  const [dropoffLocation, setDropoffLocation] = useState('')
  const [insurance, setInsurance] = useState('no-insurance')

  // Calculate rental days
  const calculateDays = () => {
    if (!pickupDate || !dropoffDate) return 0
    const start = new Date(pickupDate)
    const end = new Date(dropoffDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays || 0
  }

  const rentalDays = calculateDays()
  
  // Insurance prices (from your database schema)
  const insurancePrices = {
    'no-insurance': 0,
    'basic': 200,
    'premium': 500
  }

  const insurancePrice = insurancePrices[insurance as keyof typeof insurancePrices]
  const baseAmount = dailyRate * rentalDays
  const insuranceAmount = insurancePrice * rentalDays
  const totalAmount = baseAmount + insuranceAmount

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // We'll implement booking logic later
    console.log('Booking:', {
      vehicleId,
      pickupDate,
      dropoffDate,
      pickupLocation,
      dropoffLocation,
      insurance,
      totalAmount
    })
    alert('Booking functionality will be implemented with backend integration!')
  }

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Book This Vehicle</CardTitle>
        <CardDescription>Complete the form to reserve {vehicleName}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pickup Date */}
          <div>
            <label className="text-sm font-medium mb-2 block">Pickup Date</label>
            <Input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Dropoff Date */}
          <div>
            <label className="text-sm font-medium mb-2 block">Dropoff Date</label>
            <Input
              type="date"
              value={dropoffDate}
              onChange={(e) => setDropoffDate(e.target.value)}
              min={pickupDate || new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Pickup Location */}
          <div>
            <label className="text-sm font-medium mb-2 block">Pickup Location</label>
            <Select value={pickupLocation} onValueChange={setPickupLocation} required>
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manila">Manila Branch</SelectItem>
                <SelectItem value="quezon-city">Quezon City Branch</SelectItem>
                <SelectItem value="makati">Makati Branch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dropoff Location */}
          <div>
            <label className="text-sm font-medium mb-2 block">Dropoff Location</label>
            <Select value={dropoffLocation} onValueChange={setDropoffLocation} required>
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manila">Manila Branch</SelectItem>
                <SelectItem value="quezon-city">Quezon City Branch</SelectItem>
                <SelectItem value="makati">Makati Branch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Insurance */}
          <div>
            <label className="text-sm font-medium mb-2 block">Insurance Plan</label>
            <Select value={insurance} onValueChange={setInsurance}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-insurance">No Insurance (₱0/day)</SelectItem>
                <SelectItem value="basic">Basic Insurance (₱200/day)</SelectItem>
                <SelectItem value="premium">Premium Insurance (₱500/day)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Pricing Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>₱{dailyRate.toLocaleString()} × {rentalDays} day{rentalDays !== 1 ? 's' : ''}</span>
              <span>₱{baseAmount.toLocaleString()}</span>
            </div>
            {insuranceAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span>Insurance</span>
                <span>₱{insuranceAmount.toLocaleString()}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>₱{totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" size="lg" disabled={rentalDays === 0}>
            {rentalDays === 0 ? 'Select Dates' : 'Proceed to Payment'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Payment methods: Cash or GCash
          </p>
        </form>
      </CardContent>
    </Card>
  )
}