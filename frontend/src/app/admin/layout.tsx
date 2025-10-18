'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/admin' },
  { name: 'Vehicles', href: '/admin/vehicles' },
  { name: 'Reservations', href: '/admin/reservations' },
  { name: 'Customers', href: '/admin/customers' },
  { name: 'Owners', href: '/admin/owners' },
  { name: 'Payments', href: '/admin/payments' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <ProtectedRoute allowedRoles={['admin', 'staff']}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage RentEase PH operations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'block px-4 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-4">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}