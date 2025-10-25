'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'z od';
import { useAuthStore } from '@/lib/store/authStore';
import { authApi } from '@/lib/api/auth';
import apiClient from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Plus, Trash2, Star } from 'lucide-react';
import toast from 'react-hot-toast';

interface Address {
  id: string;
  street_address: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

const profileSchema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  phone_number: z.string().optional(),
  driver_license_number: z.string().optional(),
  driver_license_expiry: z.string().optional(),
});

const addressSchema = z.object({
  street_address: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  province: z.string().min(2, 'Province is required'),
  postal_code: z.string().min(4, 'Postal code is required'),
  is_default: z.boolean().optional(),
});

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, setUser } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone_number: user?.phone_number || '',
      driver_license_number: user?.driver_license_number || '',
      driver_license_expiry: user?.driver_license_expiry || '',
    },
  });

  const addressForm = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street_address: '',
      city: '',
      province: '',
      postal_code: '',
      is_default: false,
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchAddresses();
  }, [isAuthenticated]);

  const fetchAddresses = async () => {
    try {
      const response = await apiClient.get('/addresses');
      if (response.data.success) {
        setAddresses(response.data.data.addresses);
      }
    } catch (error) {
      console.error('Failed to fetch addresses');
    }
  };

  const onProfileSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      const response = await authApi.updateProfile(data);
      if (response.success && response.data) {
        setUser(response.data.user);
        toast.success('Profile updated successfully');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const onAddressSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      const response = await apiClient.post('/addresses', data);
      if (response.data.success) {
        toast.success('Address added successfully');
        addressForm.reset();
        setShowAddressForm(false);
        fetchAddresses();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add address');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const response = await apiClient.delete(`/addresses/${id}`);
      if (response.data.success) {
        toast.success('Address deleted');
        fetchAddresses();
      }
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await apiClient.put(`/addresses/${id}`, { is_default: true });
      if (response.data.success) {
        toast.success('Default address updated');
        fetchAddresses();
      }
    } catch (error) {
      toast.error('Failed to update default address');
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input {...profileForm.register('first_name')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input {...profileForm.register('last_name')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user.email} disabled className="bg-gray-50" />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input {...profileForm.register('phone_number')} placeholder="+63 912 345 6789" />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Driver's License Number</Label>
                  <Input {...profileForm.register('driver_license_number')} />
                </div>

                <div className="space-y-2">
                  <Label>Driver's License Expiry</Label>
                  <Input {...profileForm.register('driver_license_expiry')} type="date" />
                </div>

                <div className="flex gap-2">
                  <Badge variant={user.is_verified ? 'default' : 'secondary'}>
                    {user.is_verified ? 'Verified' : 'Not Verified'}
                  </Badge>
                  <Badge variant="outline">{user.role}</Badge>
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Addresses Tab */}
        <TabsContent value="addresses">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    My Addresses
                  </CardTitle>
                  <CardDescription>Manage your saved addresses</CardDescription>
                </div>
                <Button onClick={() => setShowAddressForm(!showAddressForm)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Address
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddressForm && (
                <Card className="bg-gray-50">
                  <CardContent className="pt-6">
                    <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Street Address</Label>
                        <Input {...addressForm.register('street_address')} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>City</Label>
                          <Input {...addressForm.register('city')} />
                        </div>
                        <div className="space-y-2">
                          <Label>Province</Label>
                          <Input {...addressForm.register('province')} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Postal Code</Label>
                        <Input {...addressForm.register('postal_code')} />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={isLoading}>
                          Save Address
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowAddressForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {addresses.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No addresses saved</p>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <Card key={address.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{address.street_address}</p>
                              {address.is_default && (
                                <Badge variant="default" className="text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  Default
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {address.city}, {address.province} {address.postal_code}
                            </p>
                            <p className="text-sm text-gray-500">{address.country}</p>
                          </div>
                          <div className="flex gap-2">
                            {!address.is_default && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetDefault(address.id)}
                              >
                                Set Default
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAddress(address.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Password change functionality coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
