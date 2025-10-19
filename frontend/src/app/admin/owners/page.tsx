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
import { Loader2, Search, Users, Eye, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'

// Since there's no specific endpoint for owners list, we'll use a simplified version
// In a real app, you'd create an endpoint like /api/admin/owners

interface Owner {
  id: string
  first_name: string
  last_name: string
  email: string
  phone_number?: string
  total_vehicles?: number
  active_vehicles?: number
  total_rentals?: number
  total_earned?: number
  pending_payment?: number
  contract_status?: string
  percentage_share?: number
  created_at: string
}

export default function AdminOwnersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [owners, setOwners] = useState<Owner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOwners()
  }, [])

  const loadOwners = async () => {
    try {
      setLoading(true)
      
      // Note: This endpoint doesn't exist yet in your backend
      // You would need to create GET /api/admin/owners or similar
      // For now, we'll show loading state
      
      toast.info('Owner management endpoint not yet implemented')
      setOwners([])
    } catch (error) {
      console.error('Failed to load owners:', error)
      toast.error('Failed to load owners')
    } finally {
      setLoading(false)
    }
  }

  const filteredOwners = owners.filter(owner => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      owner.first_name.toLowerCase().includes(searchLower) ||
      owner.last_name.toLowerCase().includes(searchLower) ||
      owner.email.toLowerCase().includes(searchLower) ||
      (owner.phone_number?.includes(searchQuery) ?? false)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading owners...</p>
        </div>
      </div>
    )
  }

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
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Owners
            </CardDescription>
            <CardTitle className="text-3xl">{owners.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Contracts</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {owners.filter(o => o.contract_status === 'active').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Vehicles Leased</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {owners.reduce((sum, o) => sum + (o.total_vehicles ?? 0), 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pending Payments
            </CardDescription>
            <CardTitle className="text-3xl text-amber-600">
              {formatCurrency(owners.reduce((sum, o) => sum + (o.pending_payment ?? 0), 0))}
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

      {/* Owners Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Vehicle Owners ({filteredOwners.length})</CardTitle>
          <CardDescription>
            Note: Owner management endpoint needs to be implemented in the backend
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOwners.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Owner</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Vehicles</TableHead>
                    <TableHead>Rentals</TableHead>
                    <TableHead>Total Earned</TableHead>
                    <TableHead>Pending</TableHead>
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
                            Since {formatDate(owner.created_at)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{owner.email}</p>
                          <p className="text-muted-foreground">{owner.phone_number || 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div>
                          <p className="font-semibold">{owner.total_vehicles || 0}</p>
                          <p className="text-xs text-muted-foreground">
                            {owner.active_vehicles || 0} active
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{owner.total_rentals || 0}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(owner.total_earned || 0)}
                      </TableCell>
                      <TableCell className="font-semibold text-amber-600">
                        {formatCurrency(owner.pending_payment || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{owner.percentage_share || 60}%</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={owner.contract_status === 'active' ? 'default' : 'secondary'}>
                          {owner.contract_status || 'active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-1">
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                          {(owner.pending_payment ?? 0) > 0 && (
                            <Button size="sm" className="gap-1">
                              <DollarSign className="h-3 w-3" />
                              Pay
                            </Button>
                          )}
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
                {searchQuery ? 'No owners found matching your search' : 'No vehicle owners yet'}
              </p>
              <p className="text-sm text-muted-foreground">
                Backend endpoint needed: GET /api/admin/owners
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}