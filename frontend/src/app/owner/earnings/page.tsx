'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import apiClient from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, Calendar, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { formatCurrency, formatCurrencyFull } from '@/lib/utils/formatNumber';

interface Payout {
  id: string;
  booking_id: string;
  rental_amount: number;
  platform_fee: number;
  warehouse_fee: number;
  late_fee_owner_share: number;
  damage_deduction: number;
  net_payout: number;
  payout_method: string;
  bank_account: string;
  status: string;
  paid_at?: string;
  created_at: string;
  booking_reference?: string;
}

interface OwnerProfile {
  total_earnings: number;
  total_rentals: number;
  average_rating: number;
  response_rate: number;
}

export default function OwnerEarningsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'owner') {
      router.push('/');
      return;
    }
    fetchData();
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [payoutsRes, profileRes] = await Promise.all([
        apiClient.get('/owner/payouts'),
        apiClient.get('/owner/profile'),
      ]);

      if (payoutsRes.data.success) {
        setPayouts(payoutsRes.data.data.payouts || []);
      }

      if (profileRes.data.success) {
        setProfile(profileRes.data.data.profile);
      }
    } catch (error) {
      toast.error('Failed to load earnings data');
    } finally {
      setIsLoading(false);
    }
  };

  const pendingEarnings = payouts
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.net_payout, 0);

  const paidEarnings = payouts
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.net_payout, 0);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Earnings & Payouts</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold truncate"
              title={formatCurrencyFull(profile?.total_earnings || 0)}
            >
              {formatCurrency(profile?.total_earnings || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold truncate"
              title={formatCurrencyFull(pendingEarnings)}
            >
              {formatCurrency(pendingEarnings)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold truncate"
              title={formatCurrencyFull(paidEarnings)}
            >
              {formatCurrency(paidEarnings)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rentals</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.total_rentals || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Payouts */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Payouts</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {payouts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-600">No payouts yet</p>
              </CardContent>
            </Card>
          ) : (
            payouts.map((payout) => (
              <Card key={payout.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        Payout #{payout.id.substring(0, 8)}
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(payout.created_at), 'MMM dd, yyyy')}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(payout.status)}>{payout.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rental Amount</span>
                      <span className="font-semibold" title={formatCurrencyFull(payout.rental_amount)}>
                        {formatCurrency(payout.rental_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Platform Fee (2%)</span>
                      <span title={formatCurrencyFull(payout.platform_fee)}>
                        -{formatCurrency(payout.platform_fee)}
                      </span>
                    </div>
                    {payout.warehouse_fee > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Warehouse Fee</span>
                        <span title={formatCurrencyFull(payout.warehouse_fee)}>
                          -{formatCurrency(payout.warehouse_fee)}
                        </span>
                      </div>
                    )}
                    {payout.late_fee_owner_share > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Late Fee Share</span>
                        <span title={formatCurrencyFull(payout.late_fee_owner_share)}>
                          +{formatCurrency(payout.late_fee_owner_share)}
                        </span>
                      </div>
                    )}
                    {payout.damage_deduction > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Damage Deduction</span>
                        <span title={formatCurrencyFull(payout.damage_deduction)}>
                          -{formatCurrency(payout.damage_deduction)}
                        </span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                      <span>Net Payout</span>
                      <span className="text-green-600" title={formatCurrencyFull(payout.net_payout)}>
                        {formatCurrency(payout.net_payout)}
                      </span>
                    </div>
                    {payout.paid_at && (
                      <p className="text-xs text-gray-500">
                        Paid on {format(new Date(payout.paid_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="pending">
          {payouts.filter(p => p.status === 'pending').length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-600">No pending payouts</p>
              </CardContent>
            </Card>
          ) : (
            payouts.filter(p => p.status === 'pending').map((payout) => (
              <Card key={payout.id}>
                {/* Same content as above */}
                <CardContent className="pt-6">
                  <p className="text-center text-sm text-gray-600" title={formatCurrencyFull(payout.net_payout)}>
                    Payout {formatCurrency(payout.net_payout)} pending
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="completed">
          {payouts.filter(p => p.status === 'completed').length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-600">No completed payouts</p>
              </CardContent>
            </Card>
          ) : (
            payouts.filter(p => p.status === 'completed').map((payout) => (
              <Card key={payout.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold" title={formatCurrencyFull(payout.net_payout)}>
                        {formatCurrency(payout.net_payout)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(payout.paid_at!), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Paid</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
