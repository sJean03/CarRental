import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/lib/api/types';
import { ownerApi } from '@/lib/api/owner';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isOwner: boolean;
  ownerProfile: any | null;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setOwnerStatus: (isOwner: boolean, profile?: any) => void;
  checkOwnerStatus: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isOwner: false,
      ownerProfile: null,
      setUser: (user) => set({ user, isAuthenticated: true }),
      setToken: (token) => set({ token }),
      setOwnerStatus: (isOwner, profile) => set({ isOwner, ownerProfile: profile || null }),
      checkOwnerStatus: async () => {
        try {
          const response = await ownerApi.checkOwnerStatus();
          if (response.success) {
            set({
              isOwner: response.data.isOwner,
              ownerProfile: response.data.profile
            });
          }
        } catch (error) {
          console.error('Failed to check owner status:', error);
          set({ isOwner: false, ownerProfile: null });
        }
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, isOwner: false, ownerProfile: null });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);