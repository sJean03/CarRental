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

// Mock owners data
const mockOwners = [
  {
    id: '1',
    first_name: 'Maria',
    last_name: 'Santos',
    email: 'maria.santos@email.com',
    phone_number: '0917-123-4567',
    total_vehicles: 1,
    active_vehicles: 1,
    total_rentals: 15,
    total_earned: 187500,
    pending_payment: 37500,
    contract_status: 'active',
    payment_type: 'percentage_based',
    percentage_share: 60,
    created_at: '2024-01-01T00:00:00'
  },
  {
    id: '2',
    first_name: 'Juan',
    last_name: 'Reyes',
    email: 'juan.reyes@email.com',
    phone_number: '0918-234-5678',
    total_vehicles: 1,
    active_vehicles: 1,
    total_rentals: 8,
    total_earned: 88000,
    pending_payment: 17600,
    contract_status: 'active',
    payment_type: 'percentage_based',
    percentage_share: 65,
    created_at: '2023-06-01T00:00:00'
  }
]

export default function AdminOwnersPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredOwners = mockOwners.filter(owner => {
    const searchLower = searchQuery.toLowerCase()
    return (
      owner.first_name.toLowerCase().includes(searchLower) ||
      owner.last_name.toLowerCase().includes(searchLower) ||
      owner.email.toLowerCase().includes(searchLower) ||
      owner.phone_number.includes(searchQuery)
    )
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Vehicle Owners Management</h2>
        <p className="text-muted-foreground">
          Manage vehicle owners and their contracts
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Owners</CardDescription>
            <CardTitle className="text-3xl">{mockOwners.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Contracts</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {mockOwners.filter(o => o.contract_status === 'active').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Vehicles Leased</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {mockOwners.reduce((sum, o) => sum + o.total_vehicles, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Payments</CardDescription>
            <CardTitle className="text-3xl">
              ₱{mockOwners.reduce((sum, o) => sum + o.pending_payment, 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Owners</CardTitle>
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

      {/* Owners Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Vehicle Owners ({filteredOwners.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Owner</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Vehicles</TableHead>
                <TableHead>Total Rentals</TableHead>
                <TableHead>Total Earned</TableHead>
                <TableHead>Pending Payment</TableHead>
                <TableHead>Share</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOwners.map((owner) => (
                <TableRow key={owner.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {owner.first_name} {owner.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Since {new Date(owner.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{owner.email}</p>
                      <p className="text-muted-foreground">{owner.phone_number}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div>
                      <p className="font-semibold">{owner.total_vehicles}</p>
                      <p className="text-xs text-muted-foreground">
                        {owner.active_vehicles} active
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{owner.total_rentals}</TableCell>
                  <TableCell className="font-semibold">
                    ₱{owner.total_earned.toLocaleString()}
                  </TableCell>
                  <TableCell className="font-semibold text-yellow-600">
                    ₱{owner.pending_payment.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{owner.percentage_share}%</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={owner.contract_status === 'active' ? 'default' : 'secondary'}>
                      {owner.contract_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        Pay
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