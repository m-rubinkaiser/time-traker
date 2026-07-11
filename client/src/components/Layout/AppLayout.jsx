import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import useSettingsStore from '../../store/settingsStore';
import useAuthStore from '../../store/authStore';

export default function AppLayout() {
  const { fetchSettings } = useSettingsStore();
  const { token } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (token) fetchSettings();
  }, [token]);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-wrapper" onClick={() => setSidebarOpen(false)}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
