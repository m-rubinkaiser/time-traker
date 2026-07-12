import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';
import useSettingsStore from './store/settingsStore';
import useSubscriptionStore from './store/subscriptionStore';
import AppLayout from './components/Layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import TimeTracking from './pages/TimeTracking';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Subscribe from './pages/Subscribe';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminProjects from './pages/AdminProjects';
import AdminTokenSettings from './pages/AdminTokenSettings';
import './index.css';

const PrivateRoute = ({ children }) => {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { token, user } = useAuthStore();
  if (token && user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
  }
  return children;
};

const SubscriptionRoute = ({ children }) => {
  const { active, checkStatus, loading } = useSubscriptionStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      checkStatus();
    }
  }, [user, checkStatus]);

  if (user?.role === 'admin') return children;
  
  if (loading) {
    return (
      <div className="loading-overlay">
        <span className="spinner spinner-lg" />
        <span>Verifying subscription status...</span>
      </div>
    );
  }

  return active ? children : <Navigate to="/subscribe" replace />;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuthStore();
  return user && user.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  const { theme, accent } = useSettingsStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const acc = localStorage.getItem('accent') || 'indigo';
    const values = {
      indigo: { accent: '#6366f1', hover: '#4f52d8', light: 'rgba(99, 102, 241, 0.15)', glow: 'rgba(99, 102, 241, 0.4)' },
      purple: { accent: '#a855f7', hover: '#9333ea', light: 'rgba(168, 85, 247, 0.15)', glow: 'rgba(168, 85, 247, 0.4)' },
      green: { accent: '#10b981', hover: '#059669', light: 'rgba(16, 185, 129, 0.15)', glow: 'rgba(16, 185, 129, 0.4)' },
      orange: { accent: '#f97316', hover: '#ea580c', light: 'rgba(249, 115, 22, 0.15)', glow: 'rgba(249, 115, 22, 0.4)' },
      cyan: { accent: '#06b6d4', hover: '#0891b2', light: 'rgba(6, 182, 212, 0.15)', glow: 'rgba(6, 182, 212, 0.4)' }
    }[acc] || { accent: '#6366f1', hover: '#4f52d8', light: 'rgba(99, 102, 241, 0.15)', glow: 'rgba(99, 102, 241, 0.4)' };

    const root = document.documentElement;
    root.style.setProperty('--accent', values.accent);
    root.style.setProperty('--accent-hover', values.hover);
    root.style.setProperty('--accent-light', values.light);
    root.style.setProperty('--accent-glow', values.glow);
  }, [accent]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: 'white' } },
          error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
        }}
      />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/subscribe" element={<PrivateRoute><Subscribe /></PrivateRoute>} />
        
        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="time-tracking" element={<TimeTracking />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/daily" element={<Reports tab="daily" />} />
          <Route path="reports/monthly" element={<Reports tab="monthly" />} />
          <Route path="reports/project" element={<Reports tab="project" />} />
          <Route path="settings" element={<Settings />} />

          {/* Admin routes */}
          <Route path="admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="admin/projects" element={<AdminRoute><AdminProjects /></AdminRoute>} />
          <Route path="admin/token-settings" element={<AdminRoute><AdminTokenSettings /></AdminRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
