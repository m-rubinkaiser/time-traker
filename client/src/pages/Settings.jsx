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
  const { theme, setTheme, settings, updateSettings } = useSettingsStore();

  const handleTheme = async (t) => {
    setTheme(t);
    await updateSettings({ theme: t });
    toast.success(`${t === 'dark' ? 'Dark' : 'Light'} mode activated`);
  };

  return (
    <div>
      <div className="settings-section-title">Appearance</div>
      <div className="settings-section-desc">Choose your preferred theme</div>

      <div className="theme-toggle-wrap">
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
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

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
    if (!confirm('Delete this project? This will also delete all its tasks and time entries!')) return;
    try {
      await API.delete(`/projects/${id}`);
      setProjects(p => p.filter(x => x._id !== id));
      setTasks(t => t.filter(x => x.projectId?._id !== id && x.projectId !== id));
      toast.success('Project deleted');
    } catch { toast.error('Failed to delete project'); }
  };

  const deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await API.delete(`/tasks/${id}`);
      setTasks(p => p.filter(x => x._id !== id));
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete task'); }
  };

  if (loading) return <div className="loading-overlay"><span className="spinner" /></div>;

  return (
    <div>
      <div className="settings-section-title">Data Management</div>
      <div className="settings-section-desc">Permanently delete your projects and tasks</div>

      <div style={{ marginTop: 24 }}>
        <h4 style={{ marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Projects ({projects.length})</h4>
        {projects.length === 0 ? <div className="text-muted">No projects found.</div> : (
          <div style={{ display: 'grid', gap: 8, maxHeight: 300, overflowY: 'auto', marginBottom: 32 }}>
            {projects.map(p => (
              <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                <div><strong>{p.name}</strong> <span className="text-muted text-sm ml-2">({p.status})</span></div>
                <button className="btn btn-danger btn-sm" onClick={() => deleteProject(p._id)}>
                  <MdDelete /> Delete
                </button>
              </div>
            ))}
          </div>
        )}

        <h4 style={{ marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Tasks ({tasks.length})</h4>
        {tasks.length === 0 ? <div className="text-muted">No tasks found.</div> : (
          <div style={{ display: 'grid', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
            {tasks.map(t => (
              <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                <div>
                  <strong>{t.title}</strong>
                  <div className="text-muted text-sm">{t.projectId?.name || 'Unknown Project'} - {t.status}</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => deleteTask(t._id)}>
                  <MdDelete /> Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
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
