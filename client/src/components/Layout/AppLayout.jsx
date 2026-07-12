import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import PortfolioModal from '../Portfolio/PortfolioModal';
import useSettingsStore from '../../store/settingsStore';
import useAuthStore from '../../store/authStore';

export default function AppLayout() {
  const { fetchSettings } = useSettingsStore();
  const { token } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [portfolioOpen, setPortfolioOpen] = useState(false);

  useEffect(() => {
    if (token) fetchSettings();
  }, [token]);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
            backdropFilter: 'blur(3px)',
            transition: 'opacity 0.2s ease-in'
          }}
        />
      )}
      <div className="main-content">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onTogglePortfolio={() => setPortfolioOpen(!portfolioOpen)}
        />
        <div className="page-wrapper" onClick={() => setSidebarOpen(false)}>
          <Outlet />
        </div>
      </div>
      <PortfolioModal isOpen={portfolioOpen} onClose={() => setPortfolioOpen(false)} />
    </div>
  );
}
