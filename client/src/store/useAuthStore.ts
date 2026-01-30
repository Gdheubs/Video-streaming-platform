import { create } from 'zustand';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isPremium: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    set({ user: res.data.user });
  },

  register: async (credentials) => {
    const res = await api.post('/auth/register', credentials);
    set({ user: res.data.user });
  },

  logout: async () => {
    await api.post('/auth/logout');
    set({ user: null });
  },

  checkAuth: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.user });
    } catch (err) {
      set({ user: null });
    } finally {
      set({ isLoading: false });
    }
  }
}));