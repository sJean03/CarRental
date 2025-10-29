'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { carsApi } from '@/lib/api/cars';
import type { Car } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';

const carSchema = z.object({
  make: z.string().min(2, 'Make is required'),
  model: z.string().min(2, 'Model is required'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  color: z.string().optional(),
  license_plate: z.string().min(1, 'License plate is required'),
  category_id: z.string().min(1, 'Please select a category'),
  transmission: z.enum(['automatic', 'manual']),
  fuel_type: z.enum(['petrol', 'diesel', 'electric', 'hybrid']),
  seating_capacity: z.number().min(2).max(50),
  daily_rate: z.number().min(100, 'Daily rate must be at least ₱100'),
  description: z.string().optional(),
  image_urls: z.string().optional(),
  rules: z.string().optional(),
});

type CarFormValues = z.infer<typeof carSchema>;

export default function NewCarPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string | undefined>(undefined);

  const form = useForm<CarFormValues>({
    resolver: zodResolver(carSchema),
    defaultValues: {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      license_plate: '',
      category_id: '',
      transmission: 'automatic',
      fuel_type: 'petrol',
      seating_capacity: 5,
      daily_rate: 1000,
      description: '',
      image_urls: '',
      rules: '',
    },
  });

  // Vehicle categories from database
  const categories = [
    { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Sedan' },
    { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'SUV' },
    { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', name: 'Hatchback' },
    { id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', name: 'Van' },
    { id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', name: 'Luxury' },
  ];

  const onSubmit = async (data: CarFormValues) => {
    try {
      setIsSubmitting(true);

      // Convert comma-separated image URLs to array and include selected branch
      const carData: Partial<Car> = {
        ...data,
        image_urls: data.image_urls
          ? data.image_urls.split(',').map((url: string) => url.trim()).filter((url: string) => url)
          : [],
        home_branch_id: selectedBranch || undefined,
      };

      const response = await carsApi.create(carData);

      if (response.success) {
        toast.success('Car listed successfully! Awaiting admin approval.');
        router.push('/owner/dashboard');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to list car';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>List Your Car</CardTitle>
          <CardDescription>
            Fill in the details to list your car for rent. Your listing will be reviewed by our team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="make"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Make</FormLabel>
                      <FormControl>
                        <Input placeholder="Toyota" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input placeholder="Vios" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input placeholder="White" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="license_plate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Plate</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC 1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="transmission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transmission</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="automatic">Automatic</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fuel_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fuel Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="petrol">Petrol</SelectItem>
                          <SelectItem value="diesel">Diesel</SelectItem>
                          <SelectItem value="electric">Electric</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Branch selection (single choice) */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Branch</p>
                <p className="text-xs text-gray-500 mb-2">Select the branch where this car will be located.</p>
                <div className="flex gap-6">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="home_branch"
                      value="11111111-1111-1111-1111-111111111111"
                      checked={selectedBranch === '11111111-1111-1111-1111-111111111111'}
                      onChange={() => setSelectedBranch('11111111-1111-1111-1111-111111111111')}
                      className="form-radio"
                    />
                    <span>Manila</span>
                  </label>

                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="home_branch"
                      value="33333333-3333-3333-3333-333333333333"
                      checked={selectedBranch === '33333333-3333-3333-3333-333333333333'}
                      onChange={() => setSelectedBranch('33333333-3333-3333-3333-333333333333')}
                      className="form-radio"
                    />
                    <span>Quezon City</span>
                  </label>

                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="home_branch"
                      value="22222222-2222-2222-2222-222222222222"
                      checked={selectedBranch === '22222222-2222-2222-2222-222222222222'}
                      onChange={() => setSelectedBranch('22222222-2222-2222-2222-222222222222')}
                      className="form-radio"
                    />
                    <span>Makati</span>
                  </label>
                </div>
              </div>

              <FormField
                control={form.control}
                name="seating_capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seating Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="daily_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Rate (₱)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Well-maintained car, perfect for city driving..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image_urls"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URLs (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/car1.jpg, https://example.com/car2.jpg"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">
                      Comma-separated URLs. Example: https://i.imgur.com/image1.jpg, https://i.imgur.com/image2.jpg
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rules"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rental Rules (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="No smoking, return with full tank, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
