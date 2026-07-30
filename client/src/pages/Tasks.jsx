import { useEffect, useState } from 'react';
import { MdAdd, MdEdit, MdSearch, MdTimer, MdCheckCircle, MdPlayArrow, MdStop, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import API from '../services/api';
import { formatDuration, formatDate, isOverdue, isDueToday, todayIso } from '../utils/formatters';
import toast from 'react-hot-toast';
import useTimerStore from '../store/timerStore';
import ManualEntryModal from '../components/ManualEntryModal';

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];
const STATUS_CONFIG = [
  { id: 'pending', label: 'Pending', color: '#7adcf6' },
  { id: 'in-progress', label: 'In Progress', color: '#00c55a' },
  { id: 'completed', label: 'Completed', color: '#13d266' },
  { id: 'cancelled', label: 'Cancelled', color: '#e08f9a' }
];
const STATUS_OPTIONS = STATUS_CONFIG.map(s => s.id);

function NewTaskModal({ dateFilter, onClose, onSave, onSaveAndStart }) {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAction = async (startTimer = false) => {
    setSaving(true);
    try {
      const payload = { title: title.trim() || undefined };
      if (dateFilter) {
        payload.createdAt = new Date(dateFilter).toISOString();
      }
      const { data } = await API.post('/tasks', payload);
      toast.success(`Task ${data.taskNumber || data.title} created!`);
      if (startTimer) {
        onSaveAndStart(data);
      } else {
        onSave(data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal animate-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div className="modal-title">New Task</div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleAction(false); }}>
          <div className="modal-body">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Task Name</label>
              <input
                className="form-control"
                placeholder="Enter task name... (Optional)"
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-secondary" disabled={saving}>
                Save
              </button>
              <button type="button" className="btn btn-primary" disabled={saving} onClick={() => handleAction(true)}>
                <MdPlayArrow /> Save & Start Timing
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskModal({ task, projects, dateFilter, vociferEmployees = [], onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    projectId: task?.projectId?._id || task?.projectId || '',
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'pending',
    developerId: '',
    testerId: ''
  });
  const [saving, setSaving] = useState(false);

  const handleDeleteTask = async () => {
    if (!confirm(`Are you sure you want to delete task "${task.title}"?`)) return;
    setSaving(true);
    try {
      await API.delete(`/tasks/${task._id}`);
      toast.success('Task deleted successfully');
      onDelete(task._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Task title is required');
    setSaving(true);
    try {
      const payload = { ...form };
      
      if (form.developerId) {
        const dev = vociferEmployees.find(e => (e.empid || e.id) == form.developerId);
        if (dev) payload.developer = { id: dev.empid || dev.id, name: dev.name || dev.firstName || `User ${dev.empid || dev.id}` };
      }
      if (form.testerId) {
        const tst = vociferEmployees.find(e => (e.empid || e.id) == form.testerId);
        if (tst) payload.tester = { id: tst.empid || tst.id, name: tst.name || tst.firstName || `User ${tst.empid || tst.id}` };
      }

      if (!task && dateFilter) {
        payload.createdAt = new Date(dateFilter).toISOString();
      }
      const { data } = task
        ? await API.put(`/tasks/${task._id}`, payload)
        : await API.post('/tasks', payload);
      toast.success(task ? 'Task updated' : 'Task created!');
      onSave(data, !!task);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal animate-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{task ? `Edit Task ${task.taskNumber ? `(${task.taskNumber})` : ''}` : 'Add New Task'}</div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Project (Optional)</label>
              <select className="form-control" value={form.projectId}
                onChange={e => setForm(p => ({ ...p, projectId: e.target.value }))}>
                <option value="">No Project</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Task Title *</label>
              <input className="form-control" placeholder="What needs to be done?" value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={2} placeholder="Additional details..." value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Priority</label>
                <select className="form-control" value={form.priority}
                  onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  {PRIORITY_OPTIONS.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o.replace('-', ' ').replace(/^\w/, c => c.toUpperCase())}</option>)}
                </select>
              </div>
            </div>
            {vociferEmployees && vociferEmployees.length > 0 && (
              <div className="form-row" style={{ marginTop: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Vocifer Developer</label>
                  <select className="form-control" value={form.developerId}
                    onChange={e => setForm(p => ({ ...p, developerId: e.target.value }))}>
                    <option value="">Default (Me)</option>
                    {vociferEmployees.map(e => <option key={e.empid || e.id} value={e.empid || e.id}>{e.name || e.firstName || e.email || `User ${e.empid || e.id}`}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Vocifer Tester</label>
                  <select className="form-control" value={form.testerId}
                    onChange={e => setForm(p => ({ ...p, testerId: e.target.value }))}>
                    <option value="">Default (Me)</option>
                    {vociferEmployees.map(e => <option key={e.empid || e.id} value={e.empid || e.id}>{e.name || e.firstName || e.email || `User ${e.empid || e.id}`}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {task ? (
              <button type="button" className="btn btn-danger btn-sm" onClick={handleDeleteTask} disabled={saving}>
                Delete Task
              </button>
            ) : <div />}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner" /> : null}
                {task ? 'Update Task' : 'Add Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

import useTaskStore from '../store/taskStore';
import useProjectStore from '../store/projectStore';

export default function Tasks() {
  const timer = useTimerStore();
  const { tasks, loading: tasksLoading, fetchTasks, addTask, updateTaskInStore, removeTaskFromStore } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();
  const [vociferEmployees, setVociferEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(todayIso());
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'manual'
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchTasks({ date: dateFilter });
    fetchProjects();
  }, [dateFilter, fetchTasks, fetchProjects]);

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = !search || 
      (t.title || '').toLowerCase().includes(search.toLowerCase()) || 
      (t.taskNumber || '').toLowerCase().includes(search.toLowerCase());
    
    let matchesProject = true;
    if (projectFilter === 'no-project') {
      matchesProject = !t.projectId || !t.projectId._id;
    } else if (projectFilter) {
      matchesProject = (t.projectId?._id || t.projectId) === projectFilter;
    }

    const matchesStatus = !statusFilter || t.status === statusFilter;
    const matchesPriority = !priorityFilter || t.priority === priorityFilter;

    return matchesSearch && matchesProject && matchesStatus && matchesPriority;
  });

  useEffect(() => {
    API.get('/tasks/vocifer/employees')
      .then(res => setVociferEmployees(res.data || []))
      .catch(() => setVociferEmployees([]));
  }, []);

  const changeDate = (days) => {
    if (!dateFilter) {
      setDateFilter(todayIso());
      return;
    }
    const d = new Date(dateFilter);
    d.setDate(d.getDate() + days);
    setDateFilter(d.toISOString().split('T')[0]);
  };

  const handleSaveNewTask = (task) => {
    addTask(task);
    setModal(null);
  };

  const handleSaveAndStartTask = (task) => {
    addTask(task);
    setModal(null);
    timer.start(task);
  };

  const handleSave = (task, isEdit) => {
    if (isEdit) updateTaskInStore(task);
    else addTask(task);
    setModal(null);
  };

  const handleComplete = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const payload = { status: newStatus };
      if (newStatus === 'completed' && dateFilter) {
        payload.completedAt = new Date(dateFilter).toISOString();
      }
      const { data } = await API.put(`/tasks/${task._id}`, payload);
      updateTaskInStore(data);
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleStopTimer = async () => {
    try {
      const res = await timer.stopAndSave();
      if (res.success) {
        const taskTitle = res.entry.taskId?.title || 'task';
        if (res.offline) {
          toast.success(`💾 Saved offline: ${formatDuration(res.entry.durationMinutes)} for ${taskTitle}. Will sync when online.`);
        } else {
          toast.success(`✅ ${formatDuration(res.entry.durationMinutes)} logged for ${taskTitle}`);
        }
        fetchTasks({ date: dateFilter }, true);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save time entry');
    }
  };

  const getStatusCount = (s) => tasks.filter(t => t.status === s).length;

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginBottom: 12 }}>
        <div>
          <div className="page-title">Tasks</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setSelected(null); setModal('create'); }}>
          <MdAdd /> New
        </button>
      </div>

      {/* Top Menu for Statuses */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {STATUS_CONFIG.map(s => {
          const count = getStatusCount(s.id);
          const isActive = statusFilter === s.id;
          return (
            <button key={s.id} onClick={() => setStatusFilter(isActive ? '' : s.id)}
              style={{
                flex: 1, minWidth: 100, height: 40, borderRadius: 6, border: 'none', cursor: 'pointer',
                background: s.color, color: 'white', fontWeight: 600, fontSize: 13,
                boxShadow: isActive ? 'inset 0 0 0 3px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                opacity: (statusFilter && !isActive) ? 0.6 : 1, transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="filters-bar" style={{ flexWrap: 'wrap' }}>
        <div className="search-input-wrap">
          <MdSearch style={{ color: 'var(--text-muted)' }} />
          <input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="filter-group">
          <span className="filter-label">Project:</span>
          <select className="filter-select" value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
            <option value="">All Projects</option>
            <option value="no-project">No Project (Unassigned)</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>

        <div className="filter-group">
          <span className="filter-label">Priority:</span>
          <select className="filter-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="">All</option>
            {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>

        <div className="filter-group">
          <span className="filter-label">Date:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-elevated)', padding: '2px 4px', borderRadius: 6, border: '1px solid var(--border)' }}>
            <button className="btn btn-ghost btn-icon btn-sm" style={{ padding: 4 }} onClick={() => changeDate(-1)}>
              <MdChevronLeft size={20} />
            </button>
            <input className="filter-select" type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ border: 'none', background: 'transparent', margin: 0, padding: '4px 8px' }} />
            <button className="btn btn-ghost btn-icon btn-sm" style={{ padding: 4 }} onClick={() => changeDate(1)}>
              <MdChevronRight size={20} />
            </button>
            {dateFilter && (
              <button className="btn btn-ghost btn-sm" style={{ padding: '0 8px', marginLeft: 4 }} onClick={() => setDateFilter('')} title="Show all time">
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Task List */}
      {tasksLoading ? (
        <div className="loading-overlay"><span className="spinner spinner-lg" /></div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">No tasks found</div>
          <div className="empty-desc">Click New to create your task</div>
          <button className="btn btn-primary" onClick={() => { setSelected(null); setModal('create'); }}>
            <MdAdd /> New
          </button>
        </div>
      ) : (
        <div className="task-list">
          {filteredTasks.map(task => {
            const isCompleted = task.status === 'completed';
            const statusColor = STATUS_CONFIG.find(c => c.id === task.status)?.color || 'var(--text-muted)';
            
            return (
              <div key={task._id} className={`task-item ${isCompleted ? 'completed' : ''}`}>
                <div
                  className={`task-checkbox ${isCompleted ? 'checked' : ''}`}
                  onClick={() => handleComplete(task)}
                  title={isCompleted ? 'Mark ToDo' : 'Mark Complete'}
                  style={{ borderColor: isCompleted ? statusColor : 'var(--border)' }}
                >
                  {isCompleted ? <span style={{ color: statusColor }}>✓</span> : ''}
                </div>

                <div className="task-content">
                  <div className="task-title">
                    {task.taskNumber && task.title !== task.taskNumber && (
                      <span className="badge" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', marginRight: 8, fontSize: 11, fontWeight: 600 }}>
                        {task.taskNumber}
                      </span>
                    )}
                    {task.title}
                  </div>
                  <div className="task-meta">
                    <span className="task-project">
                      <span className="task-dot" style={{ background: task.projectId?.color || 'var(--text-muted)' }} />
                      {task.projectId?.name || 'No Project'}
                    </span>
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    <span className="badge" style={{ background: statusColor, color: 'white', borderColor: statusColor }}>
                      {STATUS_CONFIG.find(c => c.id === task.status)?.label || task.status}
                    </span>
                    {task.totalMinutes > 0 && (
                      <span className="task-time-logged"><MdTimer size={12} /> {formatDuration(task.totalMinutes)}</span>
                    )}
                  </div>
                </div>

                <div className="task-actions">
                  {timer.activeTaskId === task._id && timer.status === 'running' ? (
                    <button className="btn btn-danger btn-icon btn-sm" title="Stop Timer"
                      onClick={() => handleStopTimer()}>
                      <MdStop size={15} />
                    </button>
                  ) : (
                    <button className="btn btn-ghost btn-icon btn-sm" title="Start Timer"
                      onClick={() => timer.start(task)}>
                      <MdPlayArrow size={15} />
                    </button>
                  )}
                  <button className="btn btn-ghost btn-icon btn-sm" title="Log Time Manually"
                    onClick={() => { setSelected(task); setModal('manual'); }}>
                    <MdTimer size={15} />
                  </button>
                  <button className="btn btn-ghost btn-icon btn-sm" title="Edit task"
                    onClick={() => { setSelected(task); setModal('edit'); }}>
                    <MdEdit size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal === 'create' && (
        <NewTaskModal
          dateFilter={dateFilter}
          onClose={() => setModal(null)}
          onSave={handleSaveNewTask}
          onSaveAndStart={handleSaveAndStartTask}
        />
      )}
      {modal === 'edit' && selected && (
        <TaskModal
          task={selected}
          projects={projects}
          dateFilter={dateFilter}
          vociferEmployees={vociferEmployees}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={(id) => { setTasks(p => p.filter(t => t._id !== id)); setModal(null); }}
        />
      )}
      {modal === 'manual' && selected && (
        <ManualEntryModal
          tasks={tasks}
          defaultTaskId={selected._id}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchData(); }}
        />
      )}
    </div>
  );
}
