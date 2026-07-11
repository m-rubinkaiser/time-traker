import { useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import useAdminStore from '../store/adminStore';
import {
  MdPeople, MdFolder, MdChecklist, MdAttachMoney,
  MdPlayCircleOutline, MdPowerSettingsNew, MdTimer
} from 'react-icons/md';
import { formatDuration } from '../utils/formatters';

const StatCard = ({ icon, label, value, sub, accentColor, bgColor, textColor }) => (
  <div className="stat-card" style={{ '--card-accent': accentColor, '--card-bg': bgColor, '--card-color': textColor }}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
    {sub && <div className="stat-sub">{sub}</div>}
  </div>
);

const CHART_OPTS = (isDark) => ({
  chart: {
    background: 'transparent',
    toolbar: { show: false },
    animations: { enabled: true, speed: 600 }
  },
  theme: { mode: isDark ? 'dark' : 'light' },
  tooltip: {
    theme: isDark ? 'dark' : 'light',
    style: { fontFamily: 'Inter, sans-serif' }
  },
  grid: { borderColor: 'rgba(255,255,255,0.06)', strokeDashArray: 4 },
});

export default function AdminDashboard() {
  const { stats, fetchStats, loading } = useAdminStore();
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading || !stats) {
    return (
      <div className="loading-overlay">
        <span className="spinner spinner-lg" />
        <span>Loading Admin Panel...</span>
      </div>
    );
  }

  const statCards = [
    { icon: <MdPeople />, label: 'Total Users', value: stats.totalUsers || 0, accentColor: 'var(--accent)', bgColor: 'var(--accent-light)', textColor: 'var(--accent)' },
    { icon: <MdPlayCircleOutline />, label: 'Active Users', value: stats.activeUsers || 0, accentColor: 'var(--success)', bgColor: 'var(--success-light)', textColor: 'var(--success)' },
    { icon: <MdAttachMoney />, label: 'Monthly Revenue', value: `₹${stats.monthlyRevenue || 0}`, accentColor: 'var(--success)', bgColor: 'var(--success-light)', textColor: 'var(--success)' },
    { icon: <MdPowerSettingsNew />, label: 'Active Plans', value: stats.activeSubscriptions || 0, accentColor: 'var(--cyan)', bgColor: 'var(--cyan-light)', textColor: 'var(--cyan)' },
    { icon: <MdTimer />, label: 'Expired Plans', value: stats.expiredSubscriptions || 0, accentColor: 'var(--orange)', bgColor: 'var(--orange-light)', textColor: 'var(--orange)' },
    { icon: <MdFolder />, label: 'Total Projects', value: stats.totalProjects || 0, accentColor: 'var(--purple)', bgColor: 'var(--purple-light)', textColor: 'var(--purple)' },
    { icon: <MdChecklist />, label: 'Completed Tasks', value: stats.completedTasks || 0, accentColor: 'var(--success)', bgColor: 'var(--success-light)', textColor: 'var(--success)' },
    { icon: <MdTimer />, label: 'Total Hours logged', value: `${stats.totalWorkingHours}h`, accentColor: 'var(--info)', bgColor: 'var(--info-light)', textColor: 'var(--info)' },
  ];

  // Daily activity line chart
  const dailyChartOpts = {
    ...CHART_OPTS(isDark),
    chart: { ...CHART_OPTS(isDark).chart, type: 'area', id: 'daily-activity' },
    stroke: { curve: 'smooth', width: 2.5 },
    colors: ['#6366f1'],
    xaxis: {
      categories: stats.dailyActivity.map(d => d.date),
      labels: { style: { colors: 'var(--text-muted)', fontSize: '10px' } }
    },
    yaxis: {
      labels: {
        formatter: (v) => `${(v / 60).toFixed(1)}h`,
        style: { colors: 'var(--text-muted)' }
      }
    },
    dataLabels: { enabled: false }
  };

  // User-wise working hours bar chart
  const userHoursChartOpts = {
    ...CHART_OPTS(isDark),
    chart: { ...CHART_OPTS(isDark).chart, type: 'bar', id: 'user-hours' },
    colors: ['#3b82f6'],
    plotOptions: { bar: { borderRadius: 4, horizontal: true } },
    xaxis: {
      categories: stats.userWiseHours.map(u => u.name),
      labels: { style: { colors: 'var(--text-muted)' } }
    },
    yaxis: {
      labels: { style: { colors: 'var(--text-muted)' } }
    },
    dataLabels: { enabled: true, formatter: (v) => `${v}h` }
  };

  // New registrations line/area chart
  const registrationsChartOpts = {
    ...CHART_OPTS(isDark),
    chart: { ...CHART_OPTS(isDark).chart, type: 'bar', id: 'registrations' },
    colors: ['#10b981'],
    plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
    xaxis: {
      categories: stats.newRegistrations.filter((_, idx) => idx % 4 === 0).map(r => r.date), // Skip some labels for clean look
      labels: { style: { colors: 'var(--text-muted)' } }
    },
    dataLabels: { enabled: false }
  };

  return (
    <div className="animate-in">
      <style>{`
        @media (max-width: 768px) {
          .charts-grid {
            grid-template-columns: 1fr !important;
          }
          .charts-grid > .card {
            grid-column: span 1 !important;
          }
        }
      `}</style>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Overview of system health, users, and subscriptions</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {statCards.map((c, i) => (
          <StatCard key={i} {...c} />
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Daily activity */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">📈 System-wide Daily Activity</div>
          </div>
          <ReactApexChart
            type="area"
            options={dailyChartOpts}
            series={[{ name: 'Working Hours', data: stats.dailyActivity.map(d => d.minutes) }]}
            height={280}
          />
        </div>

        {/* User wise hours */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">👥 User-wise Logged Hours</div>
          </div>
          {stats.userWiseHours.length > 0 ? (
            <ReactApexChart
              type="bar"
              options={userHoursChartOpts}
              series={[{ name: 'Hours', data: stats.userWiseHours.map(u => u.hours) }]}
              height={280}
            />
          ) : (
            <div className="empty-state" style={{ height: 280 }}>No user time logged yet</div>
          )}
        </div>

        {/* Registrations */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <div className="card-title">🚀 New User Registrations (Last 30 Days)</div>
          </div>
          <ReactApexChart
            type="bar"
            options={registrationsChartOpts}
            series={[{ name: 'Registrations', data: stats.newRegistrations.map(r => r.count) }]}
            height={240}
          />
        </div>
      </div>
    </div>
  );
}
