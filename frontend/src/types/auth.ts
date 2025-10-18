export type UserRole = 'customer' | 'owner' | 'admin' | 'staff';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  date_of_birth?: string;
  driver_license_number?: string;
  driver_license_expiry?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth?: string;
  driver_license_number?: string;
  driver_license_expiry?: string;
}

export interface OwnerRegisterData extends RegisterData {
  address?: string;
  bank_account_number?: string;
  bank_name?: string;
  gcash_number?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  registerOwner: (data: OwnerRegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}