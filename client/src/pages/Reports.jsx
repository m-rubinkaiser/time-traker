import { useEffect, useState } from 'react';
import { MdDownload, MdFilterList, MdSearch } from 'react-icons/md';
import API from '../services/api';
import { formatDuration, formatDate, formatDateShort } from '../utils/formatters';
import toast from 'react-hot-toast';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

const reportCache = {};

export default function Reports({ tab: defaultTab }) {
  const [tab, setTab] = useState(defaultTab || 'daily');
  const [projects, setProjects] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const formatYMD = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getInitialDates = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { startDate: formatYMD(start), endDate: formatYMD(end) };
  };

  // Filters
  const [filter, setFilter] = useState(() => ({
    type: 'this-month',
    year: CURRENT_YEAR,
    month: new Date().getMonth() + 1,
    projectId: '',
    status: '',
    ...getInitialDates()
  }));

  useEffect(() => {
    API.get('/projects').then(r => setProjects(r.data)).catch(() => {});
  }, []);

  const handlePresetChange = (preset) => {
    const now = new Date();
    let startDate = '';
    let endDate = '';

    if (preset === 'today') {
      startDate = formatYMD(now);
      endDate = formatYMD(now);
    } else if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      startDate = formatYMD(y);
      endDate = formatYMD(y);
    } else if (preset === 'this-month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      startDate = formatYMD(start);
      endDate = formatYMD(end);
    } else if (preset === 'last-month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      startDate = formatYMD(start);
      endDate = formatYMD(end);
    } else if (preset === 'this-year') {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      startDate = formatYMD(start);
      endDate = formatYMD(end);
    } else if (preset === 'custom') {
      startDate = filter.startDate || formatYMD(now);
      endDate = filter.endDate || formatYMD(now);
    }

    setFilter(p => ({
      ...p,
      type: preset,
      startDate,
      endDate
    }));
  };

  const loadReport = async () => {
    const cacheKey = `${tab}_${filter.type}_${filter.projectId}_${filter.startDate}_${filter.endDate}`;
    if (reportCache[cacheKey]) {
      setData(reportCache[cacheKey]);
      setLoading(false);
      const params = {
        filter: filter.type,
        year: filter.year,
        month: filter.month,
        projectId: filter.projectId,
        status: filter.status,
        startDate: filter.startDate,
        endDate: filter.endDate,
      };
      const endpoint = tab === 'daily' ? '/reports/daily' :
                       tab === 'monthly' ? '/reports/monthly' : '/reports/project';
      API.get(endpoint, { params }).then(({ data: res }) => {
        reportCache[cacheKey] = res;
        setData(res);
      }).catch(() => {});
      return;
    }

    setLoading(true);
    try {
      const params = {
        filter: filter.type,
        year: filter.year,
        month: filter.month,
        projectId: filter.projectId,
        status: filter.status,
        startDate: filter.startDate,
        endDate: filter.endDate,
      };
      const endpoint = tab === 'daily' ? '/reports/daily' :
                       tab === 'monthly' ? '/reports/monthly' : '/reports/project';
      const { data: res } = await API.get(endpoint, { params });
      reportCache[cacheKey] = res;
      setData(res);
    } catch {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReport(); }, [tab, filter]);

  const handleExport = async (format = 'xlsx') => {
    try {
      const params = new URLSearchParams({
        filter: filter.type, year: filter.year, month: filter.month,
        format, startDate: filter.startDate, endDate: filter.endDate, projectId: filter.projectId
      });
      const resp = await API.get(`/reports/export?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `time_report_${Date.now()}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export ready!');
    } catch {
      toast.error('Export failed');
    }
  };

  const totalMinutes = tab === 'daily'
    ? data.reduce((s, e) => s + (e.durationMinutes || 0), 0)
    : tab === 'monthly'
    ? data.reduce((s, g) => s + (g.totalMinutes || 0), 0)
    : data.reduce((s, p) => s + (p.totalMinutes || 0), 0);

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <div className="page-title">Reports</div>
          <div className="page-subtitle">Total: {formatDuration(totalMinutes)}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => handleExport('xlsx')}>
            <MdDownload /> Export Excel
          </button>
        </div>
      </div>

      {/* Tab Selector */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {['daily', 'monthly', 'project'].map(t => (
          <button key={t} className={`filter-chip ${tab === t ? 'active' : ''}`}
            onClick={() => { if (tab !== t) { setTab(t); setData([]); } }} style={{ padding: '8px 20px', fontSize: 13 }}>
            {t.charAt(0).toUpperCase() + t.slice(1)} Report
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-bar" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="filter-group">
          <span className="filter-label">Period:</span>
          <select className="filter-select" value={filter.type} onChange={e => handlePresetChange(e.target.value)}>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="this-year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        <div className="filter-group" style={{ gap: 6 }}>
          <span className="filter-label">From:</span>
          <input className="filter-select" type="date" value={filter.startDate}
            onChange={e => setFilter(p => ({ ...p, type: 'custom', startDate: e.target.value }))} />
          <span className="filter-label">To:</span>
          <input className="filter-select" type="date" value={filter.endDate}
            onChange={e => setFilter(p => ({ ...p, type: 'custom', endDate: e.target.value }))} />
        </div>

        <div className="filter-group">
          <span className="filter-label">Project:</span>
          <select className="filter-select" value={filter.projectId}
            onChange={e => setFilter(p => ({ ...p, projectId: e.target.value }))}>
            <option value="">All Projects</option>
            <option value="no-project">No Project (Unassigned)</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* Report Tables */}
      {loading ? (
        <div className="loading-overlay"><span className="spinner spinner-lg" /></div>
      ) : data.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-title">No data for selected filters</div>
          <div className="empty-desc">Try a different date range or project</div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <MdFilterList />
              {tab === 'daily' ? 'Daily Report' : tab === 'monthly' ? 'Monthly Report' : 'Project Report'}
            </div>
            <span className="tag">{data.length} records · {formatDuration(totalMinutes)} total</span>
          </div>

          <div className="table-wrapper">
            {/* Daily Report */}
            {tab === 'daily' && (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Project</th>
                    <th>Task</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(e => (
                    <tr key={e._id}>
                      <td className="td-muted">{formatDateShort(e.date)}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="color-dot" style={{ background: e.projectId?.color || 'var(--text-muted)' }} />
                          {e.projectId?.name || 'No Project'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{e.taskId?.title || '—'}</td>
                      <td className="td-muted">{e.startTime || '—'}</td>
                      <td className="td-muted">{e.endTime || '—'}</td>
                      <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{formatDuration(e.durationMinutes)}</td>
                      <td><span className={`badge badge-${e.taskId?.status || 'pending'}`}>{e.taskId?.status || '—'}</span></td>
                      <td><span className={`badge ${e.entryType === 'auto' ? 'badge-active' : 'badge-in-progress'}`}>{e.entryType}</span></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--bg-elevated)' }}>
                    <td colSpan={5} style={{ fontWeight: 700, padding: '10px 14px' }}>Total</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)', padding: '10px 14px' }}>{formatDuration(totalMinutes)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            )}

            {/* Monthly Report */}
            {tab === 'monthly' && (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Hours Worked</th>
                    <th>Completed Tasks</th>
                    <th>Pending Tasks</th>
                    <th>Entries</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(d => (
                    <tr key={d.date}>
                      <td style={{ fontWeight: 600 }}>{formatDate(d.date)}</td>
                      <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatDuration(d.totalMinutes)}</td>
                      <td><span style={{ color: 'var(--success)', fontWeight: 600 }}>{d.completedTasks}</span></td>
                      <td><span style={{ color: 'var(--warning)', fontWeight: 600 }}>{d.pendingTasks}</span></td>
                      <td className="td-muted">{d.entries?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--bg-elevated)' }}>
                    <td style={{ fontWeight: 700, padding: '10px 14px' }}>Total</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)', padding: '10px 14px' }}>{formatDuration(totalMinutes)}</td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            )}

            {/* Project Report */}
            {tab === 'project' && (
              <table>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Total Tasks</th>
                    <th>Completed</th>
                    <th>Pending</th>
                    <th>Total Hours</th>
                    <th>Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(d => {
                    const pct = d.totalTasks > 0 ? Math.round((d.completedTasks / d.totalTasks) * 100) : 0;
                    return (
                      <tr key={d.project?._id || Math.random()}>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="color-dot" style={{ background: d.project?.color }} />
                            <span style={{ fontWeight: 600 }}>{d.project?.name || 'Unknown Project'}</span>
                          </span>
                        </td>
                        <td><span className={`badge badge-${d.project?.status}`}>{d.project?.status}</span></td>
                        <td style={{ fontWeight: 600 }}>{d.totalTasks}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 600 }}>{d.completedTasks}</td>
                        <td style={{ color: 'var(--warning)', fontWeight: 600 }}>{d.pendingTasks}</td>
                        <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatDuration(d.totalMinutes)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 100 }}>
                            <div className="progress-bar" style={{ flex: 1, height: 6 }}>
                              <div className="progress-fill" style={{ width: `${pct}%`, background: d.project?.color || '#ccc' }} />
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 30 }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--bg-elevated)' }}>
                    <td colSpan={5} style={{ fontWeight: 700, padding: '10px 14px' }}>Total</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)', padding: '10px 14px' }}>{formatDuration(totalMinutes)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
