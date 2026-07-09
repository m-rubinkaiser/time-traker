import { NavLink, useNavigate } from 'react-router-dom';
import { 
  MdDashboard, MdFolder, MdChecklist, MdTimer,
  MdBarChart, MdSettings, MdLogout, MdPerson
} from 'react-icons/md';
import useAuthStore from '../../store/authStore';
import { getInitials } from '../../utils/formatters';
import toast from 'react-hot-toast';

const userNavItems = [
  { to: '/dashboard', icon: <MdDashboard />, label: 'Dashboard' },
  { to: '/projects', icon: <MdFolder />, label: 'Projects' },
  { to: '/tasks', icon: <MdChecklist />, label: 'Tasks' },
  { to: '/time-tracking', icon: <MdTimer />, label: 'Time Tracking' },
  { to: '/reports', icon: <MdBarChart />, label: 'Reports' },
];

const adminNavItems = [
  { to: '/admin/dashboard', icon: <MdDashboard />, label: 'Admin Dash' },
  { to: '/admin/users', icon: <MdPerson />, label: 'Manage Users' },
  { to: '/admin/projects', icon: <MdFolder />, label: 'Monitor Projects' },
  { to: '/admin/token-settings', icon: <MdSettings />, label: 'System Settings' }
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';
  const activeNavItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⏱</div>
        <div>
          <div className="sidebar-logo-text">Time<span>Track</span></div>
          <div className="sidebar-logo-sub">{isAdmin ? 'Admin Portal' : 'Project Manager'}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>
        {activeNavItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="nav-section-label">Account</div>
        {!isAdmin && (
          <NavLink
            to="/settings"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon"><MdSettings /></span>
            <span>Settings</span>
          </NavLink>
        )}
        <div className="nav-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
          <span className="nav-icon"><MdLogout /></span>
          <span>Logout</span>
        </div>
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/settings" className="user-card" style={{ textDecoration: 'none' }}>
          <div className="user-avatar">{getInitials(user?.name)}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-email">{user?.email}</div>
          </div>
          <MdPerson style={{ color: 'var(--text-muted)', fontSize: 16, flexShrink: 0 }} />
        </NavLink>
      </div>
    </aside>
  );
}
