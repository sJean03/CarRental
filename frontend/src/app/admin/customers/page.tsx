'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Loader2, Search, Users, Eye, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'

// Since there's no specific endpoint for customers list, we'll use a simplified version
// In a real app, you'd create an endpoint like /api/admin/customers

interface Customer {
  id: string
  first_name: string
  last_name: string
  email: string
  phone_number?: string
  driver_license_number?: string
  is_active: boolean
  created_at: string
  // These would come from aggregated queries
  total_bookings?: number
  active_bookings?: number
  total_spent?: number
}

export default function AdminCustomersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      
      // Note: This endpoint doesn't exist yet in your backend
      // You would need to create GET /api/admin/customers
      // For now, we'll show loading state
      
      // Simulated data structure - replace with actual API call when endpoint is ready
      toast.info('Customer management endpoint not yet implemented')
      setCustomers([])
    } catch (error) {
      console.error('Failed to load customers:', error)
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      customer.first_name.toLowerCase().includes(searchLower) ||
      customer.last_name.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      (customer.phone_number?.includes(searchQuery) ?? false)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Customer Management</h2>
        <p className="text-muted-foreground">
          View and manage customer accounts
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Customers
            </CardDescription>
            <CardTitle className="text-3xl">{customers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Customers</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {customers.filter(c => c.is_active).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>With Active Bookings</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {customers.filter(c => (c.active_bookings ?? 0) > 0).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-3xl">
              {formatCurrency(customers.reduce((sum, c) => sum + (c.total_spent ?? 0), 0))}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers ({filteredCustomers.length})</CardTitle>
          <CardDescription>
            Note: Customer management endpoint needs to be implemented in the backend
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {customer.first_name} {customer.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Since {formatDate(customer.created_at)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{customer.email}</p>
                          <p className="text-muted-foreground">{customer.phone_number || 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {customer.driver_license_number || 'Not provided'}
                      </TableCell>
                      <TableCell className="text-center">{customer.total_bookings || 0}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={(customer.active_bookings ?? 0) > 0 ? 'default' : 'secondary'}>
                          {customer.active_bookings || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(customer.total_spent || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.is_active ? 'default' : 'secondary'}>
                          {customer.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-1">
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">
                {searchQuery ? 'No customers found matching your search' : 'No customers yet'}
              </p>
              <p className="text-sm text-muted-foreground">
                Backend endpoint needed: GET /api/admin/customers
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}