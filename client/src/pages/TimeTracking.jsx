import { useEffect, useState, useRef } from 'react';
import { MdPlayArrow, MdPause, MdStop, MdAdd, MdEdit, MdDelete, MdTimer } from 'react-icons/md';
import API from '../services/api';
import { formatTimer, formatDuration, formatDate, formatDateShort, timeToDuration, todayIso } from '../utils/formatters';
import toast from 'react-hot-toast';

import useTimerStore from '../store/timerStore';
import ManualEntryModal from '../components/ManualEntryModal';

export default function TimeTracking() {
  const timer = useTimerStore();
  const [tasks, setTasks] = useState([]);
  const [entries, setEntries] = useState([]);
  const [activeTask, setActiveTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editEntry, setEditEntry] = useState(null);
  const timerStartRef = useRef(null);

  const syncOfflineEntries = async () => {
    const pending = JSON.parse(localStorage.getItem('unsynced_time_entries') || '[]');
    if (pending.length === 0) return;

    toast.loading('Syncing offline time entries...', { id: 'offline-sync' });
    let successCount = 0;
    const remaining = [];
    const syncedDataMap = {};

    for (const entry of pending) {
      try {
        const payload = {
          taskId: entry.taskId?._id || entry.taskId,
          projectId: entry.projectId?._id || entry.projectId,
          date: entry.date,
          startTime: entry.startTime,
          endTime: entry.endTime,
          durationMinutes: entry.durationMinutes,
          entryType: entry.entryType,
          remarks: entry.remarks
        };
        const { data } = await API.post('/time-entries', payload);
        syncedDataMap[entry._id] = data;
        successCount++;
      } catch (err) {
        console.error('Failed to sync offline entry:', err);
        remaining.push(entry);
      }
    }

    localStorage.setItem('unsynced_time_entries', JSON.stringify(remaining));
    toast.dismiss('offline-sync');

    if (successCount > 0) {
      toast.success(`Successfully synced ${successCount} offline entries!`);
      setEntries(prev => prev.map(e => syncedDataMap[e._id] ? syncedDataMap[e._id] : e));
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [tasksRes, entriesRes] = await Promise.all([
          API.get('/tasks', { params: { status: 'in-progress' } }),
          API.get('/time-entries'),
        ]);
        const allTasks = await API.get('/tasks');
        setTasks(allTasks.data);
        
        // Merge offline pending entries so they display in UI logs
        const pending = JSON.parse(localStorage.getItem('unsynced_time_entries') || '[]');
        setEntries([...pending, ...entriesRes.data]);

        if (pending.length > 0 && window.navigator.onLine) {
          setTimeout(syncOfflineEntries, 500);
        }
      } catch {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    load();

    window.addEventListener('online', syncOfflineEntries);
    return () => {
      window.removeEventListener('online', syncOfflineEntries);
    };
  }, []);

  useEffect(() => {
    if (timer.activeTaskId && !activeTask) {
      setActiveTask(timer.activeTaskId);
    }
  }, [timer.activeTaskId, activeTask]);

  const handleStart = () => {
    if (!activeTask) return toast.error('Select a task first');
    const taskObj = tasks.find(t => t._id === activeTask);
    if (taskObj) timer.start(taskObj);
  };

  const handleStop = async () => {
    try {
      const res = await timer.stopAndSave();
      if (res.success) {
        setEntries(prev => [res.entry, ...prev]);
        const taskTitle = res.entry.taskId?.title || 'task';
        if (res.offline) {
          toast.success(`💾 Saved offline: ${formatDuration(res.entry.durationMinutes)} for ${taskTitle}. Will sync when online.`);
        } else {
          toast.success(`✅ ${formatDuration(res.entry.durationMinutes)} logged for ${taskTitle}`);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save time entry');
    }
  };

  const handleSaveEntry = (entry, isEdit) => {
    if (isEdit) setEntries(p => p.map(e => e._id === entry._id ? entry : e));
    else setEntries(p => [entry, ...p]);
    setModal(null);
    setEditEntry(null);
  };

  const handleDeleteEntry = async (entry) => {
    if (!confirm('Delete this time entry?')) return;
    try {
      await API.delete(`/time-entries/${entry._id}`);
      setEntries(p => p.filter(e => e._id !== entry._id));
      toast.success('Entry deleted');
    } catch {
      toast.error('Failed to delete entry');
    }
  };

  const currentTask = tasks.find(t => t._id === activeTask);

  return (
    <div className="animate-in">
      <style>{`
        @media (max-width: 800px) {
          .timetrack-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div className="page-header">
        <div>
          <div className="page-title">Time Tracking</div>
          <div className="page-subtitle">Start a timer or manually log time</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditEntry(null); setModal('manual'); }}>
          <MdAdd /> Manual Entry
        </button>
      </div>

      <div className="timetrack-layout" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Timer Widget */}
        <div className="timer-widget">
          <div>
            <span className={`timer-status ${timer.status}`}>
              <span className="timer-dot" />
              {timer.status === 'idle' ? 'Ready' : timer.status === 'running' ? 'Running' : 'Paused'}
            </span>
          </div>

          <div className="timer-display">{formatTimer(timer.seconds)}</div>

          {currentTask && (
            <div className="timer-task-name">
              <span className="color-dot" style={{ background: currentTask.projectId?.color || 'var(--text-muted)', display: 'inline-block', marginRight: 6 }} />
              {currentTask.title}
            </div>
          )}

          {/* Task selector */}
          <div style={{ marginBottom: 20 }}>
            <select
              className="form-control"
              value={activeTask}
              onChange={e => setActiveTask(e.target.value)}
              disabled={timer.status !== 'idle'}
              style={{ textAlign: 'center' }}
            >
              <option value="">— Select a task —</option>
              {tasks.map(t => (
                <option key={t._id} value={t._id}>
                  {t.projectId?.name ? `[${t.projectId.name}] ` : ''}{t.title}
                </option>
              ))}
            </select>
          </div>

          <div className="timer-controls">
            {timer.status === 'idle' && (
              <button className="timer-btn timer-btn-play" onClick={handleStart} title="Start timer">
                <MdPlayArrow />
              </button>
            )}
            {timer.status === 'running' && (<>
              <button className="timer-btn timer-btn-pause" onClick={timer.pause} title="Pause">
                <MdPause />
              </button>
              <button className="timer-btn timer-btn-play timer-btn-stop" onClick={handleStop}
                style={{ background: 'var(--danger)', border: 'none', boxShadow: 'none' }} title="Stop & Save">
                <MdStop />
              </button>
            </>)}
            {timer.status === 'paused' && (<>
              <button className="timer-btn timer-btn-play" onClick={timer.resume} title="Resume">
                <MdPlayArrow />
              </button>
              <button className="timer-btn timer-btn-stop" onClick={handleStop} title="Stop & Save">
                <MdStop />
              </button>
            </>)}
          </div>

          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
            {timer.status === 'running' ? 'Click stop to save the tracked time' :
              timer.status === 'paused' ? 'Timer paused – resume or stop' :
              'Select a task and press play to start'}
          </div>
        </div>

        {/* Time Entries Log */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title"><MdTimer /> Time Log</div>
              <span className="tag">{entries.length} entries</span>
            </div>

            {loading ? (
              <div className="loading-overlay" style={{ padding: 40 }}><span className="spinner" /></div>
            ) : entries.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-icon">⏱</div>
                <div className="empty-title">No time entries yet</div>
                <div className="empty-desc">Start a timer or add a manual entry</div>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Task</th>
                      <th>Project</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Duration</th>
                      <th>Type</th>
                      <th>Remarks</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(e => (
                      <tr key={e._id}>
                        <td className="td-muted">{formatDateShort(e.date)}</td>
                        <td style={{ fontWeight: 500 }}>{e.taskId?.title || '—'}</td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="color-dot" style={{ background: e.projectId?.color || 'var(--text-muted)' }} />
                            {e.projectId?.name || 'No Project'}
                          </span>
                        </td>
                        <td className="td-muted">{e.startTime || '—'}</td>
                        <td className="td-muted">{e.endTime || '—'}</td>
                        <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{formatDuration(e.durationMinutes)}</td>
                        <td>
                          <span className={`badge ${e.entryType === 'auto' ? 'badge-active' : 'badge-in-progress'}`}>
                            {e.entryType}
                          </span>
                          {e.isOfflinePending && (
                            <span className="badge badge-warning" style={{ marginLeft: 6, background: 'var(--orange)', color: 'white', borderColor: 'var(--orange)' }}>
                              Pending Sync
                            </span>
                          )}
                        </td>
                        <td className="td-muted" style={{ maxWidth: 140 }}>{e.remarks || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => { setEditEntry(e); setModal('manual'); }}>
                              <MdEdit size={14} />
                            </button>
                            <button className="btn btn-danger btn-icon btn-sm"
                              onClick={() => handleDeleteEntry(e)}>
                              <MdDelete size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {modal === 'manual' && (
        <ManualEntryModal
          tasks={tasks}
          editEntry={editEntry}
          onClose={() => { setModal(null); setEditEntry(null); }}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
}
