import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './context/authStore';
import useThemeStore from './context/themeStore';

import AppLayout         from './components/layout/AppLayout';
import LoginPage         from './pages/LoginPage';
import RegisterPage      from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage  from './pages/ResetPasswordPage';
import DashboardPage     from './pages/DashboardPage';
import TasksPage         from './pages/TasksPage';
import GoalsPage         from './pages/GoalsPage';
import JournalPage       from './pages/JournalPage';
import AnalyticsPage     from './pages/AnalyticsPage';
import TimePlannerPage   from './pages/TimePlannerPage';
import ProfilePage       from './pages/ProfilePage';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  const initTheme = useThemeStore(s => s.initTheme);
  useEffect(() => { initTheme(); }, [initTheme]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--toast-bg, #1e293b)',
            color: 'var(--toast-color, #f8fafc)',
            border: '1px solid var(--toast-border, #334155)',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 500,
          },
        }}
      />
      <Routes>
        <Route path="/login"           element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register"        element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />

        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<DashboardPage />} />
          <Route path="tasks"      element={<TasksPage />} />
          <Route path="goals"      element={<GoalsPage />} />
          <Route path="journal"    element={<JournalPage />} />
          <Route path="analytics"  element={<AnalyticsPage />} />
          <Route path="planner"    element={<TimePlannerPage />} />
          <Route path="profile"    element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;