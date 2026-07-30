import { useState } from 'react';
import toast from 'react-hot-toast';
import API from '../services/api';
import { formatDuration, timeToDuration, todayIso } from '../utils/formatters';

export default function ManualEntryModal({ tasks, onClose, onSave, editEntry, defaultTaskId = '' }) {
  const [form, setForm] = useState({
    taskId: editEntry?.taskId?._id || editEntry?.taskId || defaultTaskId || (tasks[0]?._id || ''),
    date: editEntry?.date ? new Date(editEntry.date).toISOString().split('T')[0] : todayIso(),
    startTime: editEntry?.startTime || '',
    endTime: editEntry?.endTime || '',
    durationMinutes: editEntry?.durationMinutes || '',
    remarks: editEntry?.remarks || '',
    useTimeRange: !!(editEntry?.startTime),
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.taskId) return toast.error('Select a task');
    if (!form.date) return toast.error('Enter a date');

    const payload = {
      taskId: form.taskId,
      date: form.date,
      remarks: form.remarks,
      entryType: 'manual',
    };

    if (form.useTimeRange) {
      if (!form.startTime || !form.endTime) return toast.error('Enter start and end time');
      const dur = timeToDuration(form.startTime, form.endTime);
      if (dur <= 0) return toast.error('End time must be after start time');
      payload.startTime = form.startTime;
      payload.endTime = form.endTime;
      payload.durationMinutes = dur;
    } else {
      if (!form.durationMinutes || Number(form.durationMinutes) <= 0) return toast.error('Enter a valid duration');
      payload.durationMinutes = Number(form.durationMinutes);
    }

    setSaving(true);
    try {
      const { data } = editEntry
        ? await API.put(`/time-entries/${editEntry._id}`, payload)
        : await API.post('/time-entries', payload);
      toast.success(editEntry ? 'Entry updated' : 'Time entry saved!');
      onSave(data, !!editEntry);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal animate-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{editEntry ? 'Edit Time Entry' : 'Manual Time Entry'}</div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Task *</label>
              <select className="form-control" value={form.taskId}
                onChange={e => setForm(p => ({ ...p, taskId: e.target.value }))}>
                <option value="">Select task...</option>
                {tasks.map(t => (
                  <option key={t._id} value={t._id}>
                    {t.projectId?.name ? `[${t.projectId.name}] ` : ''}{t.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Date *</label>
              <input className="form-control" type="date" value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button type="button"
                className={`filter-chip ${form.useTimeRange ? 'active' : ''}`}
                onClick={() => setForm(p => ({ ...p, useTimeRange: true }))}>
                Start / End Time
              </button>
              <button type="button"
                className={`filter-chip ${!form.useTimeRange ? 'active' : ''}`}
                onClick={() => setForm(p => ({ ...p, useTimeRange: false }))}>
                Direct Duration
              </button>
            </div>

            {form.useTimeRange ? (
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Start Time</label>
                  <input className="form-control" type="time" value={form.startTime}
                    onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">End Time</label>
                  <input className="form-control" type="time" value={form.endTime}
                    onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} />
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <input className="form-control" type="number" min="1" placeholder="e.g. 90 = 1h 30m"
                  value={form.durationMinutes}
                  onChange={e => setForm(p => ({ ...p, durationMinutes: e.target.value }))} />
                <div className="form-hint">
                  {form.durationMinutes > 0 ? `= ${formatDuration(Number(form.durationMinutes))}` : ''}
                </div>
              </div>
            )}

            {form.useTimeRange && form.startTime && form.endTime && (
              <div className="tag" style={{ marginBottom: 12 }}>
                Auto duration: {formatDuration(Math.max(0, timeToDuration(form.startTime, form.endTime)))}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Remarks (optional)</label>
              <input className="form-control" placeholder="What did you work on?" value={form.remarks}
                onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : null}
              {editEntry ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
