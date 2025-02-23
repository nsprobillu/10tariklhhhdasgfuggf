import { create } from 'zustand';
import axios from 'axios';
import { AuthState } from '../types/auth';
import { setUserData } from '../utils/analytics';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useAuthStore = create<AuthState>()((set) => {
  // Initialize state from localStorage
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  // If user exists, set analytics data
  if (user) {
    setUserData(user.id, {
      email: user.email,
      isAdmin: user.isAdmin
    });
  }

  return {
    user,
    token,
    isAuthenticated: !!token,

    login: async (email: string, password: string) => {
      try {
        const response = await axios.post(`${API_URL}/auth/login`, {
          email,
          password,
        });

        if (!response.data.token || !response.data.user) {
          throw new Error('Invalid response from server');
        }

        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Track user in analytics
        setUserData(user.id, {
          email: user.email,
          isAdmin: user.isAdmin
        });
        
        set({ user, token, isAuthenticated: true });
      } catch (error: any) {
        console.error('Login error:', error);
        throw new Error(error.response?.data?.error || 'Login failed');
      }
    },

    register: async (email: string, password: string) => {
      try {
        const response = await axios.post(`${API_URL}/auth/register`, {
          email,
          password,
        });

        if (!response.data.token || !response.data.user) {
          throw new Error('Invalid response from server');
        }

        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Track user in analytics
        setUserData(user.id, {
          email: user.email,
          isAdmin: user.isAdmin
        });
        
        set({ user, token, isAuthenticated: true });
      } catch (error: any) {
        console.error('Registration error:', error);
        throw new Error(error.response?.data?.error || 'Registration failed');
      }
    },

    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null, isAuthenticated: false });
    },
  };
});