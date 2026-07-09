// Format minutes to "Xh Ym" string
export const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// Format seconds (for live timer) to "HH:MM:SS"
export const formatTimer = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
};

// Format date to "DD MMM YYYY"
export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

// Format date to "DD-MM-YYYY"
export const formatDateShort = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
};

// Relative time e.g. "2 hours ago"
export const timeAgo = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

// Check if date is overdue
export const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
};

// Check if due today
export const isDueToday = (dueDate) => {
  if (!dueDate) return false;
  return new Date(dueDate).toDateString() === new Date().toDateString();
};

// Get initials from name
export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

// Convert "HH:mm" times to duration
export const timeToDuration = (start, end) => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
};

// Get today as YYYY-MM-DD for input[type=date]
export const todayIso = () => new Date().toISOString().split('T')[0];

// Status colors
export const statusColor = {
  active: 'var(--success)',
  completed: 'var(--info)',
  archived: 'var(--text-muted)',
  pending: 'var(--warning)',
  'in-progress': 'var(--accent)',
};

// Priority colors
export const priorityColor = {
  low: 'var(--success)',
  medium: 'var(--warning)',
  high: 'var(--orange)',
  urgent: 'var(--danger)',
};
