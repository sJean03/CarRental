'use client'

import { useState } from 'react'
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

// Mock customers data
const mockCustomers = [
  {
    id: '1',
    first_name: 'Jace',
    last_name: 'Gonzales',
    email: 'jacegonzales25@gmail.com',
    phone_number: '09947551217',
    total_bookings: 3,
    active_bookings: 1,
    total_spent: 31500,
    driver_license_number: '12312313123',
    is_active: true,
    created_at: '2025-10-19T10:00:00'
  },
  {
    id: '2',
    first_name: 'Maria',
    last_name: 'Santos',
    email: 'maria.santos@email.com',
    phone_number: '0917-123-4567',
    total_bookings: 5,
    active_bookings: 0,
    total_spent: 45000,
    driver_license_number: 'DL-123456',
    is_active: true,
    created_at: '2025-08-15T09:30:00'
  },
  {
    id: '3',
    first_name: 'Juan',
    last_name: 'Reyes',
    email: 'juan.reyes@email.com',
    phone_number: '0918-234-5678',
    total_bookings: 2,
    active_bookings: 1,
    total_spent: 18000,
    driver_license_number: 'DL-789012',
    is_active: true,
    created_at: '2025-09-20T14:15:00'
  },
  {
    id: '4',
    first_name: 'Pedro',
    last_name: 'Santos',
    email: 'pedro.santos@email.com',
    phone_number: '0919-345-6789',
    total_bookings: 8,
    active_bookings: 0,
    total_spent: 72500,
    driver_license_number: 'DL-345678',
    is_active: true,
    created_at: '2025-06-10T11:00:00'
  },
  {
    id: '5',
    first_name: 'Ana',
    last_name: 'Cruz',
    email: 'ana.cruz@email.com',
    phone_number: '0920-456-7890',
    total_bookings: 1,
    active_bookings: 0,
    total_spent: 6600,
    driver_license_number: 'DL-901234',
    is_active: false,
    created_at: '2025-10-15T16:45:00'
  }
]

export default function AdminCustomersPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCustomers = mockCustomers.filter(customer => {
    const searchLower = searchQuery.toLowerCase()
    return (
      customer.first_name.toLowerCase().includes(searchLower) ||
      customer.last_name.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      customer.phone_number.includes(searchQuery)
    )
  })

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
            <CardDescription>Total Customers</CardDescription>
            <CardTitle className="text-3xl">{mockCustomers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Customers</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {mockCustomers.filter(c => c.is_active).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Bookings</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {mockCustomers.reduce((sum, c) => sum + c.active_bookings, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-3xl">
              ₱{mockCustomers.reduce((sum, c) => sum + c.total_spent, 0).toLocaleString()}
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
          <Input
            placeholder="Search by name, email, or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Total Bookings</TableHead>
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
                        Member since {new Date(customer.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{customer.email}</p>
                      <p className="text-muted-foreground">{customer.phone_number}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {customer.driver_license_number}
                  </TableCell>
                  <TableCell className="text-center">{customer.total_bookings}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={customer.active_bookings > 0 ? 'default' : 'secondary'}>
                      {customer.active_bookings}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₱{customer.total_spent.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={customer.is_active ? 'default' : 'secondary'}>
                      {customer.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}