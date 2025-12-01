import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  level: number;
  totalXP: number;
  currentStreak: number;
  subscriptionTier: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user } = response.data;

      await SecureStore.setItemAsync('token', accessToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      set({
        user,
        token: accessToken,
        isAuthenticated: true,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '로그인에 실패했습니다.');
    }
  },

  register: async (email: string, password: string, username: string) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        username,
      });
      const { accessToken, user } = response.data;

      await SecureStore.setItemAsync('token', accessToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      set({
        user,
        token: accessToken,
        isAuthenticated: true,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '회원가입에 실패했습니다.');
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('token');
      delete api.defaults.headers.common['Authorization'];

      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('token');

      if (!token) {
        set({ isLoading: false });
        return;
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const response = await api.get('/users/me');

      set({
        user: response.data,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      await SecureStore.deleteItemAsync('token');
      delete api.defaults.headers.common['Authorization'];

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  updateUser: (userData) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, ...userData } });
    }
  },
}));
