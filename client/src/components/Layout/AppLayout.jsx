import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import useSettingsStore from '../../store/settingsStore';
import useAuthStore from '../../store/authStore';

export default function AppLayout() {
  const { fetchSettings } = useSettingsStore();
  const { token } = useAuthStore();

  useEffect(() => {
    if (token) fetchSettings();
  }, [token]);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="page-wrapper">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
