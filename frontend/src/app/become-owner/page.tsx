'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ownerApi } from '@/lib/api/owner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import { Car, DollarSign, TrendingUp, Shield } from 'lucide-react';

const ownerRegistrationSchema = z.object({
  business_name: z.string().optional(),
  tax_id: z.string().optional(),
  bank_account_number: z.string().min(5, 'Bank account number is required'),
  bank_name: z.string().min(2, 'Bank name is required'),
  preferred_payout_method: z.enum(['credit_card', 'debit_card']),
});

type OwnerRegistrationFormValues = z.infer<typeof ownerRegistrationSchema>;

export default function BecomeOwnerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OwnerRegistrationFormValues>({
    resolver: zodResolver(ownerRegistrationSchema),
    defaultValues: {
      business_name: '',
      tax_id: '',
      bank_account_number: '',
      bank_name: '',
      preferred_payout_method: 'debit_card',
    },
  });

  const onSubmit = async (data: OwnerRegistrationFormValues) => {
    try {
      setIsSubmitting(true);

      const response = await ownerApi.register(data);

      if (response.success) {
        toast.success('Welcome to RentEase Owners! You can now list your cars.');
        router.push('/owner/cars/new');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to register as owner';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Become a Car Owner</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Start earning money by listing your car on RentEase. Join thousands of owners already making passive income!
        </p>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <DollarSign className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <h3 className="font-semibold mb-2">Earn Money</h3>
            <p className="text-sm text-muted-foreground">
              Make up to ₱50,000/month by renting out your car
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto mb-3 text-blue-500" />
            <h3 className="font-semibold mb-2">Full Protection</h3>
            <p className="text-sm text-muted-foreground">
              Comprehensive insurance covers your vehicle
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 text-purple-500" />
            <h3 className="font-semibold mb-2">Easy Management</h3>
            <p className="text-sm text-muted-foreground">
              Control availability and pricing from your dashboard
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Registration Form */}
      <Card>
        <CardHeader>
          <CardTitle>Owner Registration</CardTitle>
          <CardDescription>
            Complete this form to start listing your cars. You'll keep your customer account and gain owner features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="business_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Car Rental Business" {...field} />
                    </FormControl>
                    <FormDescription>
                      Only if you're registering as a business
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tax_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax ID / TIN (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="123-456-789-000" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your Tax Identification Number for business owners
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-t pt-6 mt-6">
                <h3 className="font-semibold mb-4">Payout Information</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This is where we'll send your earnings
                </p>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="bank_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="BDO, BPI, Metrobank, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bank_account_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Account Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="1234567890" type="text" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preferred_payout_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Payout Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="debit_card">Debit Card</SelectItem>
                            <SelectItem value="credit_card">Credit Card</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Your bank details are encrypted and secure. We only use them to send your earnings.
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Registering...' : 'Complete Registration'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-1">Can I still rent cars as a customer?</h4>
            <p className="text-sm text-muted-foreground">
              Yes! You'll keep all your customer features and gain the ability to list cars.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">When do I get paid?</h4>
            <p className="text-sm text-muted-foreground">
              Payouts are processed within 3-5 business days after each completed rental.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">What's the platform fee?</h4>
            <p className="text-sm text-muted-foreground">
              RentEase charges 10% of each booking. You keep 90% of the rental fee.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
