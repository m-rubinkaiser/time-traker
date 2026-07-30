import { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import {
  MdFolder, MdChecklist, MdTimer, MdTrendingUp,
  MdCheckCircle, MdPending, MdWork, MdSchedule
} from 'react-icons/md';
import API from '../services/api';
import { formatDuration, timeAgo, formatDate } from '../utils/formatters';

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

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [daily, setDaily] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [projectChart, setProjectChart] = useState([]);
  const [recent, setRecent] = useState({ recentEntries: [], recentTasks: [] });
  const [loading, setLoading] = useState(true);
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

  useEffect(() => {
    const load = async () => {
      try {
        const [s, d, m, p, r] = await Promise.all([
          API.get('/dashboard/stats'),
          API.get('/dashboard/daily-chart?days=30'),
          API.get('/dashboard/monthly-chart'),
          API.get('/dashboard/project-chart'),
          API.get('/dashboard/recent'),
        ]);
        setStats(s.data);
        setDaily(d.data);
        setMonthly(m.data);
        setProjectChart(p.data);
        setRecent(r.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="loading-overlay">
        <span className="spinner spinner-lg" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  const statCards = [
    { icon: <MdFolder />, label: 'Total Projects', value: stats?.totalProjects || 0, accentColor: 'var(--accent)', bgColor: 'var(--accent-light)', textColor: 'var(--accent)' },
    { icon: <MdWork />, label: 'Active Projects', value: stats?.activeProjects || 0, accentColor: 'var(--success)', bgColor: 'var(--success-light)', textColor: 'var(--success)' },
    { icon: <MdSchedule />, label: "Today's Hours", value: formatDuration(stats?.todayMinutes || 0), accentColor: 'var(--cyan)', bgColor: 'var(--cyan-light)', textColor: 'var(--cyan)' },
    { icon: <MdTrendingUp />, label: 'This Week', value: formatDuration(stats?.weekMinutes || 0), accentColor: 'var(--purple)', bgColor: 'var(--purple-light)', textColor: 'var(--purple)' },
    { icon: <MdTimer />, label: 'This Month', value: formatDuration(stats?.monthMinutes || 0), accentColor: 'var(--orange)', bgColor: 'var(--orange-light)', textColor: 'var(--orange)' },
    { icon: <MdCheckCircle />, label: 'Completed Tasks', value: stats?.completedTasks || 0, accentColor: 'var(--success)', bgColor: 'var(--success-light)', textColor: 'var(--success)' },
    { icon: <MdPending />, label: 'Pending Tasks', value: stats?.pendingTasks || 0, accentColor: 'var(--warning)', bgColor: 'var(--warning-light)', textColor: 'var(--warning)' },
    { icon: <MdChecklist />, label: 'Total Time Logged', value: formatDuration(stats?.totalMinutes || 0), accentColor: 'var(--info)', bgColor: 'var(--info-light)', textColor: 'var(--info)' },
  ];

  // Daily chart config
  const dailyChartOptions = {
    ...CHART_OPTS(isDark),
    chart: { ...CHART_OPTS(isDark).chart, type: 'area', id: 'daily-hours' },
    stroke: { curve: 'smooth', width: 2.5 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] }
    },
    colors: ['#6366f1'],
    xaxis: {
      categories: daily.map(d => d.date.split('-').slice(1).join('/')),
      labels: { style: { colors: 'var(--text-muted)', fontSize: '10px' } },
      tickAmount: 10,
    },
    yaxis: {
      labels: {
        formatter: (v) => `${(v / 60).toFixed(1)}h`,
        style: { colors: 'var(--text-muted)', fontSize: '11px' }
      }
    },
    dataLabels: { enabled: false },
  };

  // Monthly chart
  const monthlyChartOptions = {
    ...CHART_OPTS(isDark),
    chart: { ...CHART_OPTS(isDark).chart, type: 'bar', id: 'monthly-hours' },
    colors: ['#a855f7'],
    plotOptions: { bar: { borderRadius: 6, columnWidth: '55%' } },
    xaxis: {
      categories: monthly.map(m => m.month),
      labels: { style: { colors: 'var(--text-muted)', fontSize: '11px' } }
    },
    yaxis: {
      labels: {
        formatter: (v) => `${(v / 60).toFixed(0)}h`,
        style: { colors: 'var(--text-muted)', fontSize: '11px' }
      }
    },
    dataLabels: { enabled: false },
  };

  // Donut for projects
  const donutOpts = {
    ...CHART_OPTS(isDark),
    chart: { ...CHART_OPTS(isDark).chart, type: 'donut' },
    labels: projectChart.map(p => p.name),
    colors: projectChart.map(p => p.color),
    legend: { position: 'bottom', labels: { colors: 'var(--text-secondary)' } },
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: '65%' } } },
  };

  // Task status pie
  const total = (stats?.completedTasks || 0) + (stats?.pendingTasks || 0);
  const taskPieOpts = {
    ...CHART_OPTS(isDark),
    chart: { ...CHART_OPTS(isDark).chart, type: 'radialBar' },
    colors: ['#22c55e'],
    plotOptions: {
      radialBar: {
        hollow: { size: '60%' },
        dataLabels: {
          name: { show: true, color: 'var(--text-muted)', fontSize: '12px' },
          value: { color: 'var(--text-primary)', fontSize: '24px', fontWeight: 700, formatter: (v) => `${v.toFixed(0)}%` }
        }
      }
    },
    labels: ['Completed'],
  };

  return (
    <div className="animate-in">
      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((c, i) => (
          <StatCard key={i} {...c} />
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid" style={{ marginBottom: 24 }}>
        {/* Daily */}
        <div className="card chart-full">
          <div className="card-header">
            <div className="card-title"><span className="card-title-icon">📈</span> Daily Working Hours (Last 30 Days)</div>
          </div>
          {daily.length > 0 ? (
            <ReactApexChart
              type="area"
              options={dailyChartOptions}
              series={[{ name: 'Hours', data: daily.map(d => d.minutes) }]}
              height={220}
            />
          ) : <div className="empty-state" style={{ padding: 32 }}><div>No time data yet</div></div>}
        </div>

        {/* Monthly */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="card-title-icon">📅</span> Monthly Overview</div>
          </div>
          <ReactApexChart
            type="bar"
            options={monthlyChartOptions}
            series={[{ name: 'Hours', data: monthly.map(m => m.minutes) }]}
            height={220}
          />
        </div>

        {/* Project wise */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="card-title-icon">🗂️</span> Project-wise Time</div>
          </div>
          {projectChart.length > 0 ? (
            <ReactApexChart
              type="donut"
              options={donutOpts}
              series={projectChart.map(p => p.minutes)}
              height={220}
            />
          ) : (
            <div className="empty-state" style={{ padding: 32 }}>
              <div>No project time data yet</div>
            </div>
          )}
        </div>

        {/* Task status */}
        <div className="card" style={{ '--chart-col': 'span 1' }}>
          <div className="card-header">
            <div className="card-title"><span className="card-title-icon">✅</span> Task Completion</div>
          </div>
          {total > 0 ? (
            <ReactApexChart
              type="radialBar"
              options={taskPieOpts}
              series={[total > 0 ? ((stats?.completedTasks / total) * 100) : 0]}
              height={220}
            />
          ) : (
            <div className="empty-state" style={{ padding: 32 }}>
              <div>No tasks yet</div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <style>{`
        @media (max-width: 768px) {
          .dashboard-recent-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div className="dashboard-recent-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Recent Time Entries */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="card-title-icon">⏱</span> Recent Time Entries</div>
          </div>
          <div className="activity-feed">
            {recent.recentEntries.length === 0 ? (
              <div className="text-muted text-sm" style={{ padding: '16px 0' }}>No time logged yet</div>
            ) : recent.recentEntries.map(e => (
              <div key={e._id} className="activity-item">
                <div className="activity-icon" style={{ background: e.projectId?.color + '22', color: e.projectId?.color }}>⏱</div>
                <div className="activity-text">
                  <div className="activity-title">{e.taskId?.title || 'Deleted task'}</div>
                  <div className="activity-sub">
                    <span className="color-dot" style={{ background: e.projectId?.color, marginRight: 4 }} />
                    {e.projectId?.name} · {formatDuration(e.durationMinutes)}
                  </div>
                </div>
                <div className="activity-time">{timeAgo(e.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="card-title-icon">📋</span> Recent Tasks</div>
          </div>
          <div className="activity-feed">
            {recent.recentTasks.length === 0 ? (
              <div className="text-muted text-sm" style={{ padding: '16px 0' }}>No tasks created yet</div>
            ) : recent.recentTasks.map(t => (
              <div key={t._id} className="activity-item">
                <div className="activity-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>📋</div>
                <div className="activity-text">
                  <div className="activity-title">{t.title}</div>
                  <div className="activity-sub">
                    <span className="color-dot" style={{ background: t.projectId?.color || 'var(--text-muted)', marginRight: 4 }} />
                    {t.projectId?.name || 'No Project'}
                    {t.dueDate && <span> · Due: {formatDate(t.dueDate)}</span>}
                  </div>
                </div>
                <div>
                  <span className={`badge badge-${t.status}`}>{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
