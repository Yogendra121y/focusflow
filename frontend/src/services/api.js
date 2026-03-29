import axios from 'axios';
import toast from 'react-hot-toast';

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('focusflow_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    if (error.response?.status === 401) {
      localStorage.removeItem('focusflow_token');
      localStorage.removeItem('focusflow_user');
      window.location.href = '/login';
    } else if (error.response?.status !== 404) {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
   register:       (data) => api.post('/auth/register', data),
  login:          (data) => api.post('/auth/login', data),
  getMe:          ()     => api.get('/auth/me'),
  updateProfile:  (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
  deleteAccount:  ()     => api.delete('/auth/account'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword:  (data) => api.post('/auth/reset-password', data),
};

// ─── Tasks API ────────────────────────────────────────────────────────────────
export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getToday: () => api.get('/tasks/today'),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  bulkUpdate: (data) => api.patch('/tasks/bulk', data),
};

// ─── Goals API ────────────────────────────────────────────────────────────────
export const goalsAPI = {
  getAll: (params) => api.get('/goals', { params }),
  getById: (id) => api.get(`/goals/${id}`),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
  addMilestone: (goalId, data) => api.post(`/goals/${goalId}/milestones`, data),
  updateMilestone: (goalId, milestoneId, data) => api.put(`/goals/${goalId}/milestones/${milestoneId}`, data),
  deleteMilestone: (goalId, milestoneId) => api.delete(`/goals/${goalId}/milestones/${milestoneId}`),
};

// ─── Journal API ──────────────────────────────────────────────────────────────
export const journalAPI = {
  getAll: (params) => api.get('/journal', { params }),
  getByDate: (date) => api.get(`/journal/date/${date}`),
  create: (data) => api.post('/journal', data),
  update: (id, data) => api.put(`/journal/${id}`, data),
  delete: (id) => api.delete(`/journal/${id}`),
};

// ─── Analytics API ────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getWeekly: () => api.get('/analytics/weekly'),
  getMonthly: (params) => api.get('/analytics/monthly', { params }),
  getCategories: (params) => api.get('/analytics/categories', { params }),
  getTrends: (params) => api.get('/analytics/trends', { params }),
};

// ─── Time Planner API ─────────────────────────────────────────────────────────
export const timePlannerAPI = {
  getByDate: (date) => api.get(`/time-planner/${date}`),
  create: (data) => api.post('/time-planner', data),
  update: (id, data) => api.put(`/time-planner/${id}`, data),
  delete: (id) => api.delete(`/time-planner/${id}`),
};

export default api;
