import { useEffect, useState } from 'react';
import useAdminStore from '../store/adminStore';
import toast from 'react-hot-toast';
import { MdDelete, MdFolder, MdPerson, MdCheckCircle, MdPending, MdTimer } from 'react-icons/md';

export default function AdminProjects() {
  const { projects, fetchProjects, deleteProject, loading } = useAdminStore();
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDeleteProject = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete project "${name}"? This will permanently delete all tasks and logged time entries associated with it.`)) {
      const res = await deleteProject(id);
      if (res.success) {
        toast.success(`Project "${name}" and all associated data deleted successfully.`);
      } else {
        toast.error(res.message);
      }
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(filter.toLowerCase()) ||
    p.userId?.name.toLowerCase().includes(filter.toLowerCase()) ||
    p.userId?.email.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Monitor User Projects</h1>
          <p className="page-subtitle">Oversee all projects, track tasks, and delete inappropriate content if needed</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="topbar-search" style={{ maxWidth: 400, marginBottom: 24, padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
        <input
          type="text"
          placeholder="Filter by project name, creator, or email..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Projects Grid */}
      {loading && projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <span className="spinner spinner-lg" />
          <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="empty-state" style={{ padding: 48 }}>No projects found matching your query.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {filteredProjects.map((p) => {
            const projectColor = p.color || '#a855f7';
            return (
              <div key={p._id} className="card project-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: `4px solid ${projectColor}` }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MdFolder size={20} style={{ color: projectColor }} />
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{p.name}</h3>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDeleteProject(p._id, p.name)}
                      style={{ color: 'var(--danger)', padding: 6, border: '1px solid var(--border)' }}
                      title="Delete Project"
                    >
                      <MdDelete size={16} />
                    </button>
                  </div>

                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, minHeight: 38, lineBreak: 'anywhere' }}>
                    {p.description || 'No description provided.'}
                  </p>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MdPerson size={14} />
                      Created by: <strong style={{ color: 'var(--text-primary)' }}>{p.userId?.name || 'Unknown'}</strong> ({p.userId?.email || 'N/A'})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MdTimer size={14} />
                      Created: {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                    <MdCheckCircle size={14} style={{ color: 'var(--success)' }} />
                    Tasks: <strong style={{ color: 'var(--text-primary)' }}>{p.totalTasks || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                    <MdPending size={14} style={{ color: 'var(--warning)' }} />
                    Pending: <strong style={{ color: 'var(--text-primary)' }}>{p.pendingTasks || 0}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
