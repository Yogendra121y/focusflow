import { create } from 'zustand';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('focusflow_user')) || null,
  token: localStorage.getItem('focusflow_token') || null,
  isLoading: false,
  isAuthenticated: !!localStorage.getItem('focusflow_token'),

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const data = await authAPI.login(credentials);
      localStorage.setItem('focusflow_token', data.token);
      localStorage.setItem('focusflow_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
      toast.success(`Welcome back, ${data.user.name}! 👋`);
      return true;
    } catch (error) {
      set({ isLoading: false });
      return false;
    }
  },

  register: async (userData) => {
    set({ isLoading: true });
    try {
      const data = await authAPI.register(userData);
      localStorage.setItem('focusflow_token', data.token);
      localStorage.setItem('focusflow_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
      toast.success(`Account created! Welcome to FocusFlow 🚀`);
      return true;
    } catch (error) {
      set({ isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('focusflow_token');
    localStorage.removeItem('focusflow_user');
    set({ user: null, token: null, isAuthenticated: false });
    toast.success('Logged out successfully');
  },

  updateUser: (updates) => {
    const updatedUser = { ...get().user, ...updates };
    localStorage.setItem('focusflow_user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  fetchProfile: async () => {
    try {
      const data = await authAPI.getMe();
      localStorage.setItem('focusflow_user', JSON.stringify(data.user));
      set({ user: data.user });
    } catch (error) {
      get().logout();
    }
  },
}));

export default useAuthStore;
