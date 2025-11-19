'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { NotificationBell } from './NotificationBell';
import { Car, User, LogOut, LayoutDashboard } from 'lucide-react';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/dashboard';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'owner') return '/owner/dashboard';
    return '/dashboard';
  };

  const getInitials = () => {
    if (!user) return 'U';
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  };

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Car className="h-6 w-6 text-blue-700" />
            <span>RentEase</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/cars"
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                pathname === '/cars' ? 'text-blue-700' : 'text-gray-700'
              }`}
            >
              Browse Cars
            </Link>
            {isAuthenticated && user?.role === 'owner' && (
              <Link
                href="/owner/cars/new"
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                    pathname === '/owner/cars/new' ? 'text-blue-700' : 'text-gray-700'
                  }`}
              >
                List Your Car
              </Link>
            )}
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                <NotificationBell />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(getDashboardLink())}
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar>
                        {user.profile_photo_url && (
                          <img
                            src={user.profile_photo_url}
                            alt={`${user.first_name} ${user.last_name}`}
                            className="h-full w-full object-cover rounded-full"
                          />
                        )}
                        <AvatarFallback>{getInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(getDashboardLink())}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => router.push('/login')}>
                  Login
                </Button>
                <Button size="sm" onClick={() => router.push('/register')}>
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
