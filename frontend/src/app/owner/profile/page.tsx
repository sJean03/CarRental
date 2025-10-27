'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/lib/store/authStore';
import apiClient from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, CreditCard, Star, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface OwnerProfile {
  business_name?: string;
  tax_id?: string;
  bank_account_number?: string;
  bank_name?: string;
  preferred_payout_method: 'credit_card' | 'debit_card';
  total_earnings: number;
  total_rentals: number;
  average_rating: number;
  response_rate: number;
  is_verified: boolean;
}

export default function OwnerProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      business_name: '',
      tax_id: '',
      bank_account_number: '',
      bank_name: '',
      preferred_payout_method: 'debit_card',
    },
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'owner') {
      router.push('/');
      return;
    }
    fetchProfile();
  }, [isAuthenticated, user]);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/owner/profile');
      if (response.data.success) {
        const profileData = response.data.data.profile;
        setProfile(profileData);
        form.reset({
          business_name: profileData.business_name || '',
          tax_id: profileData.tax_id || '',
          bank_account_number: profileData.bank_account_number || '',
          bank_name: profileData.bank_name || '',
          preferred_payout_method: profileData.preferred_payout_method || 'debit_card',
        });
      }
    } catch (error) {
      toast.error('Failed to load owner profile');
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      const response = await apiClient.put('/owner/profile', data);
      if (response.data.success) {
        toast.success('Profile updated successfully');
        fetchProfile();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Owner Profile</h1>

      <div className="grid gap-6">
        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  ₱{profile.total_earnings.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Total Earnings</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{profile.total_rentals}</p>
                <p className="text-sm text-gray-600">Total Rentals</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <p className="text-2xl font-bold">{Math.round(Number(profile.average_rating) * 10) / 10}</p>
                </div>
                <p className="text-sm text-gray-600">Average Rating</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <p className="text-2xl font-bold">{Math.round(Number(profile.response_rate))}%</p>
                </div>
                <p className="text-sm text-gray-600">Response Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Information
            </CardTitle>
            <CardDescription>
              Optional business details for tax and legal purposes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Business Name (Optional)</Label>
                <Input {...form.register('business_name')} placeholder="e.g., Juan's Car Rental" />
              </div>

              <div className="space-y-2">
                <Label>Tax ID / TIN (Optional)</Label>
                <Input {...form.register('tax_id')} placeholder="000-000-000-000" />
              </div>

              <div className="flex items-center gap-2 my-4">
                <Badge variant={profile.is_verified ? 'default' : 'secondary'}>
                  {profile.is_verified ? 'Verified Owner' : 'Not Verified'}
                </Badge>
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Business Info'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Payout Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payout Settings
            </CardTitle>
            <CardDescription>
              Configure how you receive your earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input
                  {...form.register('bank_name')}
                  placeholder="e.g., BDO, BPI, Metrobank"
                />
              </div>

              <div className="space-y-2">
                <Label>Bank Account Number</Label>
                <Input
                  {...form.register('bank_account_number')}
                  placeholder="000-000-000000-0"
                />
              </div>

              <div className="space-y-2">
                <Label>Preferred Payout Method</Label>
                <Select
                  value={form.watch('preferred_payout_method')}
                  onValueChange={(value) => form.setValue('preferred_payout_method', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit_card">Bank Transfer / Debit Card</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Payout Settings'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
