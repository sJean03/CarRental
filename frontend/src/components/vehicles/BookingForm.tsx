'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { bookingService } from '@/services'
import { useAuth } from '@/context/AuthContext'
import { Location, InsurancePlan } from '@/types'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface BookingFormProps {
  vehicleId: string;
  dailyRate: number;
  vehicleName: string;
}

export default function BookingForm({ vehicleId, dailyRate, vehicleName }: BookingFormProps) {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  
  // Form state
  const [pickupDate, setPickupDate] = useState('')
  const [dropoffDate, setDropoffDate] = useState('')
  const [pickupLocation, setPickupLocation] = useState('')
  const [dropoffLocation, setDropoffLocation] = useState('')
  const [insurancePlanId, setInsurancePlanId] = useState('')
  const [comments, setComments] = useState('')
  
  // Data state
  const [locations, setLocations] = useState<Location[]>([])
  const [insurancePlans, setInsurancePlans] = useState<InsurancePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Cost calculation
  const [costBreakdown, setCostBreakdown] = useState<any>(null)
  const [calculatingCost, setCalculatingCost] = useState(false)

  // Load locations and insurance plans
  useEffect(() => {
    loadFormData()
  }, [])

  // Calculate cost when dates or insurance change
  useEffect(() => {
    if (pickupDate && dropoffDate && vehicleId) {
      calculateCost()
    }
  }, [pickupDate, dropoffDate, insurancePlanId])

  const loadFormData = async () => {
  try {
    setLoading(true)
    const [locationsRes, insuranceRes] = await Promise.all([
      bookingService.getLocations(),
      bookingService.getInsurancePlans()
    ])

    // Handle different response formats
    const locationsData = locationsRes.data || (locationsRes as any).locations || []
    const insuranceData = insuranceRes.data || (insuranceRes as any).insurancePlans || []

    setLocations(locationsData)
    setInsurancePlans(insuranceData)
  } catch (error) {
    console.error('Failed to load form data:', error)
    toast.error('Failed to load booking options')
  } finally {
    setLoading(false)
  }
}

  const calculateCost = async () => {
    if (!pickupDate || !dropoffDate) return

    try {
      setCalculatingCost(true)
      const response = await bookingService.calculateCost({
        vehicle_id: vehicleId,
        pickup_date: pickupDate,
        dropoff_date: dropoffDate,
        insurance_plan_id: insurancePlanId || undefined
      })

      if (response.success && response.data) {
        setCostBreakdown(response.data)
      }
    } catch (error: any) {
      console.error('Failed to calculate cost:', error)
      // Don't show error toast for cost calculation - just fail silently
    } finally {
      setCalculatingCost(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if user is logged in
    if (!isAuthenticated) {
      toast.error('Please login to make a booking')
      router.push(`/login?redirect=/vehicles/${vehicleId}`)
      return
    }

    // Validate form
    if (!pickupDate || !dropoffDate || !pickupLocation || !dropoffLocation) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSubmitting(true)

      const bookingData = {
        vehicle_id: vehicleId,
        pickup_location_id: pickupLocation,
        dropoff_location_id: dropoffLocation,
        pickup_date: pickupDate,
        dropoff_date: dropoffDate,
        insurance_plan_id: insurancePlanId || undefined,
        booking_comments: comments || undefined
      }

      const response = await bookingService.createBooking(bookingData)

      if (response.success && response.data) {
        toast.success('Booking created successfully!')
        // Redirect to booking details or payment page
        router.push(`/dashboard/bookings/${response.data.id}`)
      }
    } catch (error: any) {
      console.error('Failed to create booking:', error)
      const errorMessage = error.response?.data?.error || 'Failed to create booking. Please try again.'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

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

  // Use API cost breakdown if available, otherwise calculate locally
  const baseAmount = costBreakdown?.base_amount || (dailyRate * rentalDays)
  const insuranceAmount = costBreakdown?.insurance_amount || 0
  const totalAmount = costBreakdown?.total_amount || baseAmount
  const depositAmount = costBreakdown?.deposit_amount || (totalAmount * 0.2)

  if (loading) {
    return (
      <Card className="sticky top-4">
        <CardContent className="pt-6 flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
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
            <Label htmlFor="pickupDate">Pickup Date *</Label>
            <Input
              id="pickupDate"
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
              disabled={submitting}
            />
          </div>

          {/* Dropoff Date */}
          <div>
            <Label htmlFor="dropoffDate">Dropoff Date *</Label>
            <Input
              id="dropoffDate"
              type="date"
              value={dropoffDate}
              onChange={(e) => setDropoffDate(e.target.value)}
              min={pickupDate || new Date().toISOString().split('T')[0]}
              required
              disabled={submitting}
            />
          </div>

          {/* Pickup Location */}
          <div>
            <Label htmlFor="pickupLocation">Pickup Location *</Label>
            <Select 
              value={pickupLocation} 
              onValueChange={setPickupLocation} 
              required
              disabled={submitting}
            >
              <SelectTrigger id="pickupLocation">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name} - {location.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dropoff Location */}
          <div>
            <Label htmlFor="dropoffLocation">Dropoff Location *</Label>
            <Select 
              value={dropoffLocation} 
              onValueChange={setDropoffLocation} 
              required
              disabled={submitting}
            >
              <SelectTrigger id="dropoffLocation">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name} - {location.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Insurance */}
          <div>
            <Label htmlFor="insurance">Insurance Plan (Optional)</Label>
            <Select 
              value={insurancePlanId} 
              onValueChange={setInsurancePlanId}
              disabled={submitting}
            >
              <SelectTrigger id="insurance">
                <SelectValue placeholder="No insurance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Insurance</SelectItem>
                {insurancePlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} (₱{plan.daily_rate.toLocaleString()}/day)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Comments */}
          <div>
            <Label htmlFor="comments">Additional Comments (Optional)</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Any special requests or requirements..."
              disabled={submitting}
              rows={3}
            />
          </div>

          <Separator />

          {/* Pricing Summary */}
          <div className="space-y-2">
            {calculatingCost ? (
              <div className="text-center py-2">
                <Loader2 className="h-4 w-4 animate-spin mx-auto text-primary" />
              </div>
            ) : (
              <>
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
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Deposit Required (20%)</span>
                  <span>₱{depositAmount.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            size="lg" 
            disabled={rentalDays === 0 || submitting || calculatingCost}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Booking...
              </>
            ) : rentalDays === 0 ? (
              'Select Dates'
            ) : (
              'Proceed to Booking'
            )}
          </Button>

          {!isAuthenticated && (
            <p className="text-xs text-amber-600 text-center">
              You need to login to make a booking
            </p>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Payment methods: Cash or GCash • 20% deposit required
          </p>
        </form>
      </CardContent>
    </Card>
  )
}