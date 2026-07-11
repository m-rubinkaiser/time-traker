import { useLocation } from 'react-router-dom';
import { MdSearch, MdLightMode, MdDarkMode, MdNotifications, MdMenu } from 'react-icons/md';
import { useState } from 'react';
import useSettingsStore from '../../store/settingsStore';

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard', sub: 'Overview of your work' },
  '/projects': { title: 'Projects', sub: 'Manage your projects' },
  '/tasks': { title: 'Tasks', sub: 'Your todo list' },
  '/time-tracking': { title: 'Time Tracking', sub: 'Track and log your time' },
  '/reports': { title: 'Reports', sub: 'Analytics and exports' },
  '/settings': { title: 'Settings', sub: 'Customize your preferences' },
};

export default function Topbar({ onToggleSidebar }) {
  const { pathname } = useLocation();
  const { theme, setTheme } = useSettingsStore();
  const [search, setSearch] = useState('');

  const pageInfo = PAGE_TITLES[pathname] || { title: 'TimeTrack', sub: '' };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <header className="topbar">
      <style>{`
        @media (max-width: 900px) {
          .menu-toggle-btn {
            display: inline-flex !important;
            margin-right: 12px;
          }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          className="btn btn-ghost btn-icon menu-toggle-btn"
          onClick={onToggleSidebar}
          style={{ display: 'none' }}
          title="Toggle Navigation Menu"
        >
          <MdMenu size={22} />
        </button>
        <div>
          <div className="topbar-title">{pageInfo.title}</div>
          {pageInfo.sub && <div className="topbar-subtitle">{pageInfo.sub}</div>}
        </div>
      </div>

      <div className="topbar-actions">
        <div className="topbar-search">
          <MdSearch style={{ color: 'var(--text-muted)', fontSize: 18, flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <button
          className="btn btn-ghost btn-icon"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <MdLightMode /> : <MdDarkMode />}
        </button>

        <button className="btn btn-ghost btn-icon" title="Notifications">
          <MdNotifications />
        </button>
      </div>
    </header>
  );
}
