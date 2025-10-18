'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, LoginCredentials, RegisterData, OwnerRegisterData, AuthContextType } from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('rentease_user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  // Login function
  const login = async (credentials: LoginCredentials) => {
    try {
      // TODO: Replace with actual API call
      // For now, simulate login with mock data
      
      // Check if user exists in localStorage (mock database)
      const users = JSON.parse(localStorage.getItem('rentease_users') || '[]')
      const foundUser = users.find((u: any) => 
        u.email === credentials.email && u.password === credentials.password
      )

      if (!foundUser) {
        throw new Error('Invalid email or password')
      }

      // Remove password before storing
      const { password, ...userWithoutPassword } = foundUser
      
      setUser(userWithoutPassword)
      localStorage.setItem('rentease_user', JSON.stringify(userWithoutPassword))
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  // Register customer function
  const register = async (data: RegisterData) => {
    try {
      // TODO: Replace with actual API call
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: data.phone_number,
        date_of_birth: data.date_of_birth,
        driver_license_number: data.driver_license_number,
        driver_license_expiry: data.driver_license_expiry,
        role: 'customer',
        is_active: true,
        created_at: new Date().toISOString()
      }

      // Store in mock database
      const users = JSON.parse(localStorage.getItem('rentease_users') || '[]')
      users.push({ ...newUser, password: data.password })
      localStorage.setItem('rentease_users', JSON.stringify(users))

      // Auto-login after registration
      setUser(newUser)
      localStorage.setItem('rentease_user', JSON.stringify(newUser))
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  // Register owner function
  const registerOwner = async (data: OwnerRegisterData) => {
    try {
      // TODO: Replace with actual API call
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: data.phone_number,
        role: 'owner',
        is_active: true,
        created_at: new Date().toISOString()
      }

      // Store in mock database
      const users = JSON.parse(localStorage.getItem('rentease_users') || '[]')
      users.push({ 
        ...newUser, 
        password: data.password,
        address: data.address,
        bank_account_number: data.bank_account_number,
        bank_name: data.bank_name,
        gcash_number: data.gcash_number
      })
      localStorage.setItem('rentease_users', JSON.stringify(users))

      // Auto-login after registration
      setUser(newUser)
      localStorage.setItem('rentease_user', JSON.stringify(newUser))
    } catch (error) {
      console.error('Owner registration error:', error)
      throw error
    }
  }

  // Logout function
  const logout = () => {
    setUser(null)
    localStorage.removeItem('rentease_user')
  }

  const value: AuthContextType = {
    user,
    login,
    register,
    registerOwner,
    logout,
    isAuthenticated: !!user,
    isLoading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}