'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Overview', href: '/dashboard' },
  { name: 'My Bookings', href: '/dashboard/bookings' },
  { name: 'Profile', href: '/dashboard/profile' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Customer Dashboard</h1>
          <p className="text-muted-foreground">Manage your bookings and profile</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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
          <main className="lg:col-span-3">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}