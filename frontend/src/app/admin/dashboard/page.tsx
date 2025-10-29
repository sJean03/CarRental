'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { carsApi } from '@/lib/api/cars';
import { paymentsApi } from '@/lib/api/payments';
import { Car, Payment, PaymentStats } from '@/lib/api/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car as CarIcon, DollarSign, CreditCard, TrendingUp, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatCurrencyFull } from '@/lib/utils/formatNumber';
import { RejectCarModal } from '@/components/admin/RejectCarModal';
import { DelistCarModal } from '@/components/admin/DelistCarModal';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [pendingCars, setPendingCars] = useState<Car[]>([]);
  const [delistRequests, setDelistRequests] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [activeCars, setActiveCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [delistModalOpen, setDelistModalOpen] = useState(false);
  const [delistReason, setDelistReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransmission, setSelectedTransmission] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchData();
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [pendingRes, paymentsRes, statsRes] = await Promise.all([
        carsApi.getAll({ status: 'pending_approval' }),
        paymentsApi.getRecent(10),
        paymentsApi.getStats(),
      ]);

      if (pendingRes.success && pendingRes.data) {
        setPendingCars(pendingRes.data.cars);
      }

      if (paymentsRes.success && paymentsRes.data) {
        setRecentPayments(paymentsRes.data.payments);
      }

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data.stats);
      }

      // Fetch delist requests
      const delistRes = await carsApi.getDelistRequests();
      if (delistRes.success && delistRes.data) {
        setDelistRequests(delistRes.data.requests);
      }

      // Fetch active listed cars for Carlisting tab (initial load)
      await fetchActiveCars({ status: 'listed', limit: 50 });
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActiveCars = async (filters: any = {}) => {
    try {
      const res = await carsApi.getAll(filters);
      if (res.success && res.data) {
        setActiveCars(res.data.cars);
      } else {
        setActiveCars([]);
      }
    } catch (err) {
      console.error('Failed to fetch active cars', err);
      setActiveCars([]);
    }
  };

  const handleApproveCar = async (carId: string) => {
    try {
      const response = await carsApi.approve(carId, 'Approved by admin');
      if (response.success) {
        toast.success('Car approved successfully');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to approve car');
    }
  };

  const handleRejectCar = async (rejectionReason: string, adminNotes: string) => {
    if (!selectedCar) return;

    try {
      const response = await carsApi.reject(selectedCar.id, rejectionReason, adminNotes);
      if (response.success) {
        toast.success('Car rejected successfully');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to reject car');
    }
  };

  const openRejectModal = (car: Car) => {
    setSelectedCar(car);
    setRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    setRejectModalOpen(false);
    setSelectedCar(null);
  };

  const closeDelistModal = () => {
    setDelistModalOpen(false);
    setSelectedCar(null);
  };

  const handleDelistConfirm = async (reason: string, notes?: string) => {
    if (!selectedCar) return;
    try {
      const resp = await carsApi.forceDelist(selectedCar.id, { reason, admin_notes: notes });
      if (resp.success) {
        toast.success('Car delisted successfully');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to delist car');
    } finally {
      closeDelistModal();
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold truncate"
              title={formatCurrencyFull(stats?.total_revenue || 0)}
            >
              {formatCurrency(stats?.total_revenue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_payments || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Car Listing</CardTitle>
            <CarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCars.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Payment</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold truncate"
              title={formatCurrencyFull(stats?.avg_payment_amount || 0)}
            >
              {formatCurrency(stats?.avg_payment_amount || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="approvals" className="space-y-6">
        <TabsList>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
          <TabsTrigger value="delist">Delist Pending Approvals</TabsTrigger>
          <TabsTrigger value="carlisting">Carlisting</TabsTrigger>
          <TabsTrigger value="payments">Recent Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-4">
          {pendingCars.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-600">No pending approvals</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingCars.map((car) => (
                <Card key={car.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>
                          {car.make} {car.model} {car.year}
                        </CardTitle>
                        <CardDescription>{car.license_plate}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {car.status === 'rejected' ? (
                          <Badge className="bg-red-100 text-red-800">
                            Rejected
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Pending Approval
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Transmission</p>
                          <p className="font-medium capitalize">{car.transmission}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Fuel Type</p>
                          <p className="font-medium capitalize">{car.fuel_type}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Seats</p>
                          <p className="font-medium">{car.seating_capacity}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Daily Rate</p>
                          <p
                            className="font-medium truncate"
                            title={formatCurrencyFull(car.daily_rate)}
                          >
                            {formatCurrency(car.daily_rate)}
                          </p>
                        </div>
                      </div>

                      {car.description && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Description</p>
                          <p className="text-sm">{car.description}</p>
                        </div>
                      )}

                      {car.rejection_reason && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm font-medium text-red-900 mb-1">Rejection Reason:</p>
                          <p className="text-sm text-red-800">{car.rejection_reason}</p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApproveCar(car.id)}
                          className="flex-1"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openRejectModal(car)}
                          className="flex-1"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="delist" className="space-y-4">
          {delistRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-600">No delist requests pending</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {delistRequests.map((req) => (
                <Card key={req.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{req.make} {req.model} {req.year}</CardTitle>
                        <CardDescription>{req.license_plate}</CardDescription>
                      </div>
                      <div className="text-sm text-gray-600">Requested: {new Date(req.created_at).toLocaleString()}</div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-gray-700">Reason: {req.reason || 'No reason provided'}</div>
                      <div className="flex gap-2 pt-4 border-t">
                        <Button size="sm" variant="default" onClick={async () => {
                          try {
                            const resp = await carsApi.approveDelist(req.id);
                            if (resp.success) {
                              toast.success('Delist request approved');
                              fetchData();
                            }
                          } catch (err) {
                            toast.error('Failed to approve request');
                          }
                        }}>
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={async () => {
                          try {
                            const resp = await carsApi.rejectDelist(req.id);
                            if (resp.success) {
                              toast.success('Delist request rejected');
                              fetchData();
                            }
                          } catch (err) {
                            toast.error('Failed to reject request');
                          }
                        }}>
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="carlisting" className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Search make or model"
                className="flex-1 border rounded px-3 py-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <select
                className="border rounded px-3 py-2"
                value={selectedTransmission ?? ''}
                onChange={(e) => setSelectedTransmission(e.target.value || null)}
              >
                <option value="">All Transmissions</option>
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </select>

              <select
                className="border rounded px-3 py-2"
                value={selectedBranch ?? ''}
                onChange={(e) => setSelectedBranch(e.target.value || null)}
              >
                <option value="">All Branches</option>
                <option value="11111111-1111-1111-1111-111111111111">Manila</option>
                <option value="22222222-2222-2222-2222-222222222222">Makati</option>
                <option value="33333333-3333-3333-3333-333333333333">Quezon City</option>
              </select>

              <Button onClick={async () => {
                const filters: any = { status: 'listed', limit: 50 };
                if (searchQuery) filters.search = searchQuery;
                if (selectedTransmission) filters.transmission = selectedTransmission;
                if (selectedBranch) filters.branch_id = selectedBranch;
                await fetchActiveCars(filters);
              }}>Search</Button>
            </div>

            {activeCars.length === 0 ? (
              <div className="text-center py-12 text-gray-600">No active cars</div>
            ) : (
              <div className="grid gap-4">
                {activeCars.map(car => (
                  <Card key={car.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{car.make} {car.model} {car.year}</CardTitle>
                          <CardDescription>{car.license_plate}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge className="bg-green-100 text-green-800">Listed</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-2xl font-bold">₱{car.daily_rate.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">per day</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="destructive" onClick={() => {
                            setSelectedCar(car);
                            setDelistModalOpen(true);
                          }}>
                            Delist
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          {recentPayments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-600">No recent payments</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {recentPayments.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{payment.transaction_id}</p>
                        <p className="text-sm text-gray-600">
                          {payment.booking_reference || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-xl font-bold truncate"
                          title={formatCurrencyFull(payment.amount)}
                        >
                          {formatCurrency(payment.amount)}
                        </p>
                        <Badge
                          className={
                            payment.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-gray-600">Method</p>
                        <p className="font-medium capitalize">
                          {payment.payment_method.replace('_', ' ')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Card</p>
                        <p className="font-medium">
                          {payment.card_brand} •••• {payment.card_last4}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Date</p>
                        <p className="font-medium">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Car Modal */}
      <RejectCarModal
        isOpen={rejectModalOpen}
        onClose={closeRejectModal}
        onConfirm={handleRejectCar}
        carName={selectedCar ? `${selectedCar.year} ${selectedCar.make} ${selectedCar.model}` : ''}
      />
      <DelistCarModal
        isOpen={delistModalOpen}
        onClose={closeDelistModal}
        onConfirm={handleDelistConfirm}
        carName={selectedCar ? `${selectedCar.year} ${selectedCar.make} ${selectedCar.model}` : ''}
      />
    </div>
  );
}
