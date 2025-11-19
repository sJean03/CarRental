'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiClient from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const damageSchema = z.object({
  description: z.string().min(10, 'Please provide detailed description'),
  damage_photos: z.string().optional(),
  estimated_cost: z.number().optional(),
});

type DamageFormValues = z.infer<typeof damageSchema>;

interface DamageReportFormProps {
  bookingId: string;
  carId: string;
  onSuccess?: () => void;
}

export function DamageReportForm({ bookingId, carId, onSuccess }: DamageReportFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DamageFormValues>({
    resolver: zodResolver(damageSchema),
    defaultValues: {
      description: '',
      damage_photos: '',
      estimated_cost: undefined,
    },
  });

  const onSubmit = async (data: DamageFormValues) => {
    try {
      setIsSubmitting(true);

      const damageData = {
        booking_id: bookingId,
        car_id: carId,
        description: data.description,
        damage_photos: data.damage_photos
          ? data.damage_photos.split(',').map(url => url.trim()).filter(url => url)
          : [],
        estimated_cost: data.estimated_cost,
      };

      const response = await apiClient.post('/damages', damageData);

      if (response.data.success) {
        toast.success('Damage report submitted successfully');
        form.reset();
        setIsOpen(false);
        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit damage report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Report Damage
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Damage</DialogTitle>
          <DialogDescription>
            Submit a damage report for this booking. Please provide detailed information.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the damage in detail..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="damage_photos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo URLs (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">
                    Comma-separated URLs to damage photos
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimated_cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Cost (₱) (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="5000"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
