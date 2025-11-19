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
import { Car as CarIcon, DollarSign, CreditCard, TrendingUp, Check, X, User, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatCurrencyFull } from '@/lib/utils/formatNumber';
import { RejectCarModal } from '@/components/admin/RejectCarModal';
import { DelistCarModal } from '@/components/admin/DelistCarModal';

// Reject License Modal Component
function RejectLicenseModal({ isOpen, onClose, onConfirm, userName }: any) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    onConfirm(reason, notes);
    setReason('');
    setNotes('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl">Reject License Verification</CardTitle>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Please provide a reason for rejecting this license verification request.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[100px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="e.g., Image is blurry, license is expired, information not readable..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Notes <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[80px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Additional notes for internal reference..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Reject License
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [rejectLicenseModalOpen, setRejectLicenseModalOpen] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);

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

      // Mock verification requests data
      setVerificationRequests([
        {
          id: '1',
          user_id: 'user-001',
          user_name: 'Juan Pedro Dela Cruz',
          user_email: 'juanpedro@example.com',
          user_role: 'customer',
          license_number: 'N01-12-345678',
          license_image_url: 'https://th.bing.com/th/id/R.677e7166fbbfc64e659578a456b49087?rik=cTUSqc9jDQp5ew&riu=http%3a%2f%2fsun9-66.userapi.com%2fimpg%2fuqvnr7WY6zF1JsRulKtbhexdVlcdYGHeTR6L5Q%2fL_5uzXdl7C8.jpg%3fsize%3d1654x2019%26quality%3d95%26sign%3d1448e5aae984f7034a08ed3be87a2230%26type%3dalbum&ehk=rRFJzTbYhdVyib5Nk7gTaREinGoG%2fksK2nEV2JmiEgE%3d&risl=&pid=ImgRaw&r=0',
          submitted_at: '2025-11-08T18:30:00Z',
          status: 'pending',
        },
        {
          id: '2',
          user_id: 'user-002',
          user_name: 'Marie Jumio',
          user_email: 'marie.jumio@example.com',
          user_role: 'owner',
          license_number: 'N02-34-567890',
          license_image_url: 'https://th.bing.com/th/id/R.677e7166fbbfc64e659578a456b49087?rik=cTUSqc9jDQp5ew&riu=http%3a%2f%2fsun9-66.userapi.com%2fimpg%2fuqvnr7WY6zF1JsRulKtbhexdVlcdYGHeTR6L5Q%2fL_5uzXdl7C8.jpg%3fsize%3d1654x2019%26quality%3d95%26sign%3d1448e5aae984f7034a08ed3be87a2230%26type%3dalbum&ehk=rRFJzTbYhdVyib5Nk7gTaREinGoG%2fksK2nEV2JmiEgE%3d&risl=&pid=ImgRaw&r=0',
          submitted_at: '2025-11-18T17:15:00Z',
          status: 'pending',
        },
        {
          id: '3',
          user_id: 'user-003',
          user_name: 'Pedro Santos',
          user_email: 'pedro.santos@example.com',
          user_role: 'customer',
          license_number: 'N03-56-789012',
          license_image_url: 'https://th.bing.com/th/id/R.677e7166fbbfc64e659578a456b49087?rik=cTUSqc9jDQp5ew&riu=http%3a%2f%2fsun9-66.userapi.com%2fimpg%2fuqvnr7WY6zF1JsRulKtbhexdVlcdYGHeTR6L5Q%2fL_5uzXdl7C8.jpg%3fsize%3d1654x2019%26quality%3d95%26sign%3d1448e5aae984f7034a08ed3be87a2230%26type%3dalbum&ehk=rRFJzTbYhdVyib5Nk7gTaREinGoG%2fksK2nEV2JmiEgE%3d&risl=&pid=ImgRaw&r=0',
          submitted_at: '2025-11-17T16:45:00Z',
          status: 'pending',
        },
      ]);
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

  const handleApproveVerification = async (requestId: string) => {
    try {
      // Mock API call - replace with actual API
      toast.success('User verification approved');
      setVerificationRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      toast.error('Failed to approve verification');
    }
  };

  const handleRejectVerification = async (reason: string, notes?: string) => {
    if (!selectedVerification) return;
    try {
      // Mock API call - replace with actual API
      toast.success('License verification rejected');
      setVerificationRequests(prev => prev.filter(req => req.id !== selectedVerification.id));
      setRejectLicenseModalOpen(false);
      setSelectedVerification(null);
    } catch (error) {
      toast.error('Failed to reject verification');
    }
  };

  const openRejectLicenseModal = (verification: any) => {
    setSelectedVerification(verification);
    setRejectLicenseModalOpen(true);
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
          <TabsTrigger value="verification" className="relative">
            License Verification
            {verificationRequests.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {verificationRequests.length}
              </span>
            )}
          </TabsTrigger>
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

        <TabsContent value="verification" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <h2 className="text-lg font-semibold">Pending Verification ({verificationRequests.length})</h2>
          </div>

          {verificationRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-600">No pending verification requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {verificationRequests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-yellow-400">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 rounded-full p-2">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{request.user_name}</CardTitle>
                          <CardDescription className="flex flex-col gap-1 mt-1">
                            <span>{request.user_email}</span>
                            <span className="inline-flex items-center gap-1">
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded capitalize">
                                {request.user_role}
                              </span>
                              <span className="text-xs">• Submitted: {new Date(request.submitted_at).toLocaleString()}</span>
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">License Number</p>
                        <p className="text-base font-semibold">{request.license_number}</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">License Images:</p>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-xs text-gray-600 mb-2">Front & Back</p>
                          <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                            <img
                              src={request.license_image_url}
                              alt="License Front"
                              className="w-full h-64 object-contain cursor-pointer hover:opacity-90 transition"
                              onClick={() => window.open(request.license_image_url, '_blank')}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Click images to view full size
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          size="default"
                          className="flex-1 bg-gray-900 hover:bg-gray-800"
                          onClick={() => handleApproveVerification(request.id)}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve & Verify User
                        </Button>
                        <Button
                          size="default"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => openRejectLicenseModal(request)}
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

      {/* Reject License Modal */}
      <RejectLicenseModal
        isOpen={rejectLicenseModalOpen}
        onClose={() => {
          setRejectLicenseModalOpen(false);
          setSelectedVerification(null);
        }}
        onConfirm={handleRejectVerification}
        userName={selectedVerification?.user_name || ''}
      />
    </div>
  );
}