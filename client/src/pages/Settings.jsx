import { useEffect, useState } from 'react';
import { MdPerson, MdLock, MdLightMode, MdDarkMode, MdTimer, MdNotifications, MdSave, MdDelete } from 'react-icons/md';
import useAuthStore from '../store/authStore';
import useSettingsStore from '../store/settingsStore';
import { getInitials } from '../utils/formatters';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'profile', label: 'Profile', icon: <MdPerson /> },
  { id: 'password', label: 'Change Password', icon: <MdLock /> },
  { id: 'theme', label: 'Theme', icon: <MdLightMode /> },
  { id: 'working-hours', label: 'Working Hours', icon: <MdTimer /> },
  { id: 'notifications', label: 'Notifications', icon: <MdNotifications /> },
  { id: 'vocifer', label: 'vocifer Integration', icon: <MdLock /> },
  { id: 'data', label: 'Data Management', icon: <MdDelete /> },
];

import API from '../services/api';

function ProfileTab() {
  const { user, updateProfile, loading } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await updateProfile(form);
    if (result.success) toast.success('Profile updated!');
    else toast.error(result.message);
  };

  return (
    <div>
      <div className="settings-section-title">Profile Information</div>
      <div className="settings-section-desc">Update your personal details</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent), var(--purple))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, fontWeight: 700, color: 'white', flexShrink: 0
        }}>
          {getInitials(user?.name)}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{user?.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-control" value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-control" type="email" value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : <MdSave />}
          Save Changes
        </button>
      </form>
    </div>
  );
}

function PasswordTab() {
  const { updateProfile, loading } = useAuthStore();
  const [form, setForm] = useState({ current: '', newPass: '', confirm: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.current || !form.newPass) return toast.error('Fill in all fields');
    if (form.newPass !== form.confirm) return toast.error('Passwords do not match');
    if (form.newPass.length < 6) return toast.error('Password must be at least 6 characters');

    const result = await updateProfile({ password: form.newPass });
    if (result.success) {
      toast.success('Password changed!');
      setForm({ current: '', newPass: '', confirm: '' });
    } else toast.error(result.message);
  };

  return (
    <div>
      <div className="settings-section-title">Change Password</div>
      <div className="settings-section-desc">Update your account password</div>
      <form onSubmit={handleSubmit} style={{ maxWidth: 420 }}>
        <div className="form-group">
          <label className="form-label">Current Password</label>
          <input className="form-control" type="password" value={form.current}
            onChange={e => setForm(p => ({ ...p, current: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">New Password</label>
          <input className="form-control" type="password" value={form.newPass}
            onChange={e => setForm(p => ({ ...p, newPass: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <input className="form-control" type="password" value={form.confirm}
            onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : <MdLock />}
          Update Password
        </button>
      </form>
    </div>
  );
}

function ThemeTab() {
  const { theme, setTheme, accent, setAccent, updateSettings } = useSettingsStore();

  const handleTheme = async (t) => {
    setTheme(t);
    await updateSettings({ theme: t });
    toast.success(`${t === 'dark' ? 'Dark' : 'Light'} mode activated`);
  };

  const handleAccent = (acc) => {
    setAccent(acc);
    toast.success(`${acc.charAt(0).toUpperCase() + acc.slice(1)} accent theme activated`);
  };

  const accentOptions = [
    { id: 'indigo', label: 'Indigo', color: '#6366f1' },
    { id: 'purple', label: 'Purple', color: '#a855f7' },
    { id: 'green', label: 'Green', color: '#10b981' },
    { id: 'orange', label: 'Orange', color: '#f97316' },
    { id: 'cyan', label: 'Cyan', color: '#06b6d4' }
  ];

  return (
    <div>
      <div className="settings-section-title">Appearance</div>
      <div className="settings-section-desc">Choose your preferred theme mode</div>

      <div className="theme-toggle-wrap" style={{ marginBottom: 32 }}>
        <div className={`theme-option ${theme === 'dark' ? 'active' : ''}`} onClick={() => handleTheme('dark')}>
          <div className="theme-option-icon">🌙</div>
          <div className="theme-option-name">Dark Mode</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Easy on the eyes</div>
        </div>
        <div className={`theme-option ${theme === 'light' ? 'active' : ''}`} onClick={() => handleTheme('light')}>
          <div className="theme-option-icon">☀️</div>
          <div className="theme-option-name">Light Mode</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Classic look</div>
        </div>
      </div>

      <div className="settings-section-title" style={{ marginTop: 24 }}>Accent Theme Color</div>
      <div className="settings-section-desc">Customize accent highlights and button tones across the workspace</div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
        {accentOptions.map((opt) => (
          <div
            key={opt.id}
            onClick={() => handleAccent(opt.id)}
            style={{
              padding: '12px 20px',
              borderRadius: 'var(--radius)',
              border: `2px solid ${accent === opt.id ? 'var(--accent)' : 'var(--border)'}`,
              background: accent === opt.id ? 'var(--accent-light)' : 'var(--bg-elevated)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 120,
              transition: 'var(--transition)'
            }}
          >
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: opt.color }} />
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{opt.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkingHoursTab() {
  const { settings, updateSettings, loading } = useSettingsStore();
  const [form, setForm] = useState({
    startTime: settings?.workingHours?.startTime || '09:00',
    endTime: settings?.workingHours?.endTime || '18:00',
    dailyTarget: settings?.workingHours?.dailyTarget || 9,
    weeklyTarget: settings?.workingHours?.weeklyTarget || 42,
    monthlyTarget: settings?.workingHours?.monthlyTarget || 160,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await updateSettings({ workingHours: form });
    if (result.success) toast.success('Working hours saved!');
    else toast.error(result.message);
  };

  return (
    <div>
      <div className="settings-section-title">Working Hours</div>
      <div className="settings-section-desc">Configure your working schedule and targets</div>
      <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Work Start Time</label>
            <input className="form-control" type="time" value={form.startTime}
              onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Work End Time</label>
            <input className="form-control" type="time" value={form.endTime}
              onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} />
          </div>
        </div>
        <div className="form-row-3">
          <div className="form-group">
            <label className="form-label">Daily Target (hrs)</label>
            <input className="form-control" type="number" min="1" max="24" value={form.dailyTarget}
              onChange={e => setForm(p => ({ ...p, dailyTarget: Number(e.target.value) }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Weekly Target (hrs)</label>
            <input className="form-control" type="number" min="1" max="168" value={form.weeklyTarget}
              onChange={e => setForm(p => ({ ...p, weeklyTarget: Number(e.target.value) }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Monthly Target (hrs)</label>
            <input className="form-control" type="number" min="1" max="744" value={form.monthlyTarget}
              onChange={e => setForm(p => ({ ...p, monthlyTarget: Number(e.target.value) }))} />
          </div>
        </div>
        <div className="card" style={{ padding: 14, background: 'var(--bg-elevated)', marginBottom: 20, border: 'none' }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            📅 Schedule: <strong>{form.startTime}</strong> to <strong>{form.endTime}</strong> = {
              (() => {
                const [sh, sm] = form.startTime.split(':').map(Number);
                const [eh, em] = form.endTime.split(':').map(Number);
                const dur = (eh * 60 + em) - (sh * 60 + sm);
                return `${Math.floor(dur / 60)}h ${dur % 60}m / day`;
              })()
            }
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : <MdSave />}
          Save Settings
        </button>
      </form>
    </div>
  );
}

function NotificationsTab() {
  const { settings, updateSettings, loading } = useSettingsStore();
  const [form, setForm] = useState({
    dueTodayAlert: settings?.notifications?.dueTodayAlert ?? true,
    dailyReminder: settings?.notifications?.dailyReminder ?? false,
  });

  const handleSave = async () => {
    const result = await updateSettings({ notifications: form });
    if (result.success) toast.success('Notification preferences saved!');
    else toast.error(result.message);
  };

  return (
    <div>
      <div className="settings-section-title">Notifications</div>
      <div className="settings-section-desc">Manage your notification preferences</div>

      {[
        { key: 'dueTodayAlert', label: 'Tasks Due Today', desc: 'Get alerted when tasks are due today' },
        { key: 'dailyReminder', label: 'Daily Work Reminder', desc: 'Daily reminder to log your working hours' },
      ].map(({ key, label, desc }) => (
        <div key={key} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 0', borderBottom: '1px solid var(--border)'
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
          </div>
          <div
            onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))}
            style={{
              width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
              background: form[key] ? 'var(--accent)' : 'var(--border)',
              position: 'relative', transition: 'all 0.2s', flexShrink: 0
            }}
          >
            <div style={{
              position: 'absolute', top: 2, left: form[key] ? 22 : 2,
              width: 20, height: 20, borderRadius: '50%', background: 'white',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
            }} />
          </div>
        </div>
      ))}

      <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={handleSave} disabled={loading}>
        {loading ? <span className="spinner" /> : <MdSave />}
        Save Preferences
      </button>
    </div>
  );
}

function vociferTab() {
  const { settings, updateSettings, loading } = useSettingsStore();
  const [form, setForm] = useState({
    email: settings?.vociferCredentials?.email || '',
    password: settings?.vociferCredentials?.password || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await updateSettings({ vociferCredentials: form });
    if (result.success) toast.success('vocifer credentials saved!');
    else toast.error(result.message);
  };

  return (
    <div>
      <div className="settings-section-title">vocifer Integration</div>
      <div className="settings-section-desc">Manage your vocifer login credentials</div>
      <form onSubmit={handleSubmit} style={{ maxWidth: 420 }}>
        <div className="form-group">
          <label className="form-label">vocifer Email</label>
          <input className="form-control" type="email" placeholder="example@gmail.com" value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">vocifer Password</label>
          <input className="form-control" type="password" placeholder="••••••••" value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : <MdSave />}
          Save Credentials
        </button>
      </form>
    </div>
  );
}

function DataManagementTab() {
  const [activeSubTab, setActiveSubTab] = useState('projects'); // 'projects' | 'tasks'
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for projects
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState('');

  // Filters for tasks
  const [taskSearch, setTaskSearch] = useState('');
  const [taskProjectFilter, setTaskProjectFilter] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pRes, tRes] = await Promise.all([API.get('/projects'), API.get('/tasks')]);
        setProjects(pRes.data);
        setTasks(tRes.data);
      } catch (err) {
        toast.error('Failed to load data for management');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const deleteProject = async (id) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await API.delete(`/projects/${id}`);
      setProjects(p => p.filter(x => x._id !== id));
      setTasks(t => t.filter(x => x.projectId?._id !== id && x.projectId !== id));
      toast.success('Project deleted successfully');
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Failed to delete project'); 
    }
  };

  const deleteTask = async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await API.delete(`/tasks/${id}`);
      setTasks(p => p.filter(x => x._id !== id));
      toast.success('Task deleted successfully');
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Failed to delete task'); 
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = !projectSearch || 
      (p.name || '').toLowerCase().includes(projectSearch.toLowerCase()) || 
      (p.client || '').toLowerCase().includes(projectSearch.toLowerCase());
    const matchesStatus = !projectStatusFilter || p.status === projectStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = !taskSearch || 
      (t.title || '').toLowerCase().includes(taskSearch.toLowerCase()) || 
      (t.taskNumber || '').toLowerCase().includes(taskSearch.toLowerCase());
    
    let matchesProject = true;
    if (taskProjectFilter === 'no-project') {
      matchesProject = !t.projectId || !t.projectId._id;
    } else if (taskProjectFilter) {
      matchesProject = (t.projectId?._id || t.projectId) === taskProjectFilter;
    }

    const matchesStatus = !taskStatusFilter || t.status === taskStatusFilter;

    return matchesSearch && matchesProject && matchesStatus;
  });

  if (loading) return <div className="loading-overlay"><span className="spinner" /></div>;

  return (
    <div>
      <div className="settings-section-title">Data Management</div>
      <div className="settings-section-desc">Manage and permanently delete your projects and tasks</div>

      {/* Sub-tab navigation */}
      <div style={{ display: 'flex', gap: 8, marginTop: 20, marginBottom: 20 }}>
        <button
          className={`filter-chip ${activeSubTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('projects')}
          style={{ padding: '8px 18px', fontSize: 13, fontWeight: 600 }}
        >
          📁 Projects ({filteredProjects.length})
        </button>
        <button
          className={`filter-chip ${activeSubTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('tasks')}
          style={{ padding: '8px 18px', fontSize: 13, fontWeight: 600 }}
        >
          📋 Tasks ({filteredTasks.length})
        </button>
      </div>

      {activeSubTab === 'projects' && (
        <div>
          {/* Projects filter bar */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <input
              className="filter-select"
              placeholder="Search projects..."
              value={projectSearch}
              onChange={e => setProjectSearch(e.target.value)}
              style={{ minWidth: 200, flex: 1 }}
            />
            <select
              className="filter-select"
              value={projectStatusFilter}
              onChange={e => setProjectStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>No matching projects found.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8, maxHeight: 450, overflowY: 'auto' }}>
              {filteredProjects.map(p => (
                <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="color-dot" style={{ background: p.color || 'var(--accent)' }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.name} {p.client ? `(${p.client})` : ''}</div>
                      <div className="text-muted text-xs">Status: {p.status}</div>
                    </div>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteProject(p._id)}>
                    <MdDelete /> Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'tasks' && (
        <div>
          {/* Tasks filter bar */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <input
              className="filter-select"
              placeholder="Search task title or number..."
              value={taskSearch}
              onChange={e => setTaskSearch(e.target.value)}
              style={{ minWidth: 180, flex: 1 }}
            />
            <select
              className="filter-select"
              value={taskProjectFilter}
              onChange={e => setTaskProjectFilter(e.target.value)}
            >
              <option value="">All Projects</option>
              <option value="no-project">No Project (Unassigned)</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
            <select
              className="filter-select"
              value={taskStatusFilter}
              onChange={e => setTaskStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>No matching tasks found.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8, maxHeight: 450, overflowY: 'auto' }}>
              {filteredTasks.map(t => (
                <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {t.taskNumber && (
                        <span className="badge" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', fontSize: 11 }}>
                          {t.taskNumber}
                        </span>
                      )}
                      {t.title}
                    </div>
                    <div className="text-muted text-xs" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>Project: <strong>{t.projectId?.name || 'No Project'}</strong></span>
                      <span>·</span>
                      <span>Status: {t.status}</span>
                      <span>·</span>
                      <span>Priority: {t.priority}</span>
                    </div>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteTask(t._id)}>
                    <MdDelete /> Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  const TabComponent = {
    profile: ProfileTab,
    password: PasswordTab,
    theme: ThemeTab,
    'working-hours': WorkingHoursTab,
    notifications: NotificationsTab,
    vocifer: vociferTab,
    data: DataManagementTab,
  }[activeTab];

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-subtitle">Manage your account and preferences</div>
        </div>
      </div>

      <div className="settings-layout">
        <div className="settings-nav">
          {TABS.map(tab => (
            <div key={tab.id}
              className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}>
              {tab.icon}
              {tab.label}
            </div>
          ))}
        </div>

        <div className="settings-panel">
          {TabComponent && <TabComponent />}
        </div>
      </div>
    </div>
  );
}
