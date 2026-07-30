import { useEffect, useState } from 'react';
import { MdAdd, MdEdit, MdDelete, MdArchive, MdSearch, MdFolder } from 'react-icons/md';
import API from '../services/api';
import { formatDuration, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['active', 'completed', 'archived'];
const COLOR_PALETTE = ['#6366f1', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#3b82f6', '#ec4899'];

function ProjectModal({ project, onClose, onSave }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    client: project?.client || '',
    description: project?.description || '',
    status: project?.status || 'active',
    color: project?.color || '#6366f1',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Project name is required');
    setSaving(true);
    try {
      const { data } = project
        ? await API.put(`/projects/${project._id}`, form)
        : await API.post('/projects', form);
      toast.success(project ? 'Project updated' : 'Project created!');
      onSave(data, !!project);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal animate-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{project ? 'Edit Project' : 'Create New Project'}</div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input className="form-control" placeholder="e.g. Website Redesign" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Client (optional)</label>
                <input className="form-control" placeholder="Client name" value={form.client}
                  onChange={e => setForm(p => ({ ...p, client: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3} placeholder="Project description..." value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COLOR_PALETTE.map(c => (
                  <div key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                      border: form.color === c ? '3px solid white' : '3px solid transparent',
                      boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none',
                      transition: 'all 0.15s'
                    }} />
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : null}
              {project ? 'Update' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null); // 'create' | 'edit'
  const [selected, setSelected] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await API.get('/projects', { params });
      setProjects(data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, [search, statusFilter]);

  const handleSave = (project, isEdit) => {
    if (isEdit) {
      setProjects(p => p.map(x => x._id === project._id ? { ...x, ...project } : x));
    } else {
      setProjects(p => [{ ...project, totalTasks: 0, completedTasks: 0, totalMinutes: 0 }, ...p]);
    }
    setModal(null);
  };

  const handleArchive = async (project) => {
    const newStatus = project.status === 'archived' ? 'active' : 'archived';
    try {
      await API.put(`/projects/${project._id}`, { status: newStatus });
      setProjects(p => p.map(x => x._id === project._id ? { ...x, status: newStatus } : x));
      toast.success(`Project ${newStatus === 'archived' ? 'archived' : 'restored'}`);
    } catch {
      toast.error('Failed to update project');
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <div className="page-title">Projects</div>
          <div className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setSelected(null); setModal('create'); }}>
          <MdAdd /> New Project
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input-wrap">
          <MdSearch style={{ color: 'var(--text-muted)' }} />
          <input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-group">
          <span className="filter-label">Status:</span>
          {['', 'active', 'completed', 'archived'].map(s => (
            <button key={s} className={`filter-chip ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="loading-overlay"><span className="spinner spinner-lg" /></div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><MdFolder /></div>
          <div className="empty-title">No projects found</div>
          <div className="empty-desc">Create your first project to get started</div>
          <button className="btn btn-primary" onClick={() => { setSelected(null); setModal('create'); }}>
            <MdAdd /> Create Project
          </button>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map(p => (
            <div key={p._id} className="project-card" style={{ '--project-color': p.color }}>
              <div className="project-card-header">
                <div>
                  <div className="project-name">{p.name}</div>
                  {p.client && <div className="project-client">📌 {p.client}</div>}
                </div>
                <span className={`badge badge-${p.status}`}>{p.status}</span>
              </div>

              {p.description && <div className="project-desc">{p.description}</div>}

              <div className="project-stats">
                <div className="project-stat">
                  <div className="project-stat-value" style={{ color: p.color }}>{p.totalTasks || 0}</div>
                  <div className="project-stat-label">Tasks</div>
                </div>
                <div className="project-stat">
                  <div className="project-stat-value" style={{ color: 'var(--success)' }}>{p.completedTasks || 0}</div>
                  <div className="project-stat-label">Done</div>
                </div>
                <div className="project-stat">
                  <div className="project-stat-value">{formatDuration(p.totalMinutes || 0)}</div>
                  <div className="project-stat-label">Logged</div>
                </div>
              </div>

              {p.totalTasks > 0 && (
                <div className="project-progress">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>Progress</span>
                    <span>{Math.round((p.completedTasks / p.totalTasks) * 100)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(p.completedTasks / p.totalTasks) * 100}%` }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(p); setModal('edit'); }}>
                  <MdEdit /> Edit
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleArchive(p)}>
                  <MdArchive /> {p.status === 'archived' ? 'Restore' : 'Archive'}
                </button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(p)}>
                  <MdDelete /> Delete
                </button>
              </div>

              <div className="text-xs text-muted" style={{ marginTop: 4 }}>Created {formatDate(p.createdAt)}</div>
            </div>
          ))}
        </div>
      )}

      {(modal === 'create' || modal === 'edit') && (
        <ProjectModal project={modal === 'edit' ? selected : null} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </div>
  );
}
