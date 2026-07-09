import { useEffect, useState } from 'react';
import useAdminStore from '../store/adminStore';
import toast from 'react-hot-toast';
import {
  MdSearch, MdEdit, MdDelete, MdBlock, MdLockReset,
  MdPlayCircleFilled, MdExtension, MdCancel, MdVpnKey
} from 'react-icons/md';

export default function AdminUsers() {
  const {
    users, fetchUsers, editUser, toggleSuspension,
    deleteUser, resetPassword, revokeToken, extendSubscription, cancelSubscription, loading
  } = useAdminStore();

  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  
  // Modal forms state
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '' });
  const [newPassword, setNewPassword] = useState('');
  const [extendDays, setExtendDays] = useState('30');

  useEffect(() => {
    fetchUsers(search);
  }, [fetchUsers, search]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleEditClick = (u) => {
    setSelectedUser(u);
    setEditForm({ name: u.name, email: u.email, role: u.role });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.email) return toast.error('Fill in all fields');
    const res = await editUser(selectedUser._id, editForm);
    if (res.success) {
      toast.success('User updated successfully');
      setShowEditModal(false);
      fetchUsers(search);
    } else {
      toast.error(res.message);
    }
  };

  const handleToggleSuspend = async (u) => {
    if (u.role === 'admin') return toast.error('Cannot suspend an admin');
    const res = await toggleSuspension(u._id);
    if (res.success) {
      toast.success(`User ${res.isSuspended ? 'suspended' : 'activated'} successfully`);
    } else {
      toast.error(res.message);
    }
  };

  const handleDeleteClick = async (u) => {
    if (u.role === 'admin') return toast.error('Cannot delete an admin');
    if (window.confirm(`Are you absolutely sure you want to delete ${u.name}? This will purge all their projects, tasks, and time logs permanently.`)) {
      try {
        await deleteUser(u._id);
        toast.success('User deleted successfully');
        fetchUsers(search);
      } catch (err) {
        toast.error('Failed to delete user');
      }
    }
  };

  const handlePasswordClick = (u) => {
    setSelectedUser(u);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    const res = await resetPassword(selectedUser._id, newPassword);
    if (res.success) {
      toast.success('Password updated and user logged out of active sessions');
      setShowPasswordModal(false);
    } else {
      toast.error(res.message);
    }
  };

  const handleRevokeClick = async (u) => {
    if (window.confirm(`Force log out ${u.name} by invalidating all active API tokens?`)) {
      const res = await revokeToken(u._id);
      if (res.success) {
        toast.success('Session token revoked successfully');
      } else {
        toast.error(res.message);
      }
    }
  };

  const handleExtendClick = (u) => {
    setSelectedUser(u);
    setExtendDays('30');
    setShowExtendModal(true);
  };

  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    const daysVal = parseInt(extendDays, 10);
    if (isNaN(daysVal) || daysVal <= 0) return toast.error('Please enter a valid number of days');
    const res = await extendSubscription(selectedUser._id, daysVal);
    if (res.success) {
      toast.success(`Subscription extended by ${daysVal} days`);
      setShowExtendModal(false);
      fetchUsers(search);
    } else {
      toast.error(res.message);
    }
  };

  const handleCancelSubClick = async (u) => {
    if (window.confirm(`Cancel active subscription for ${u.name}?`)) {
      const res = await cancelSubscription(u._id);
      if (res.success) {
        toast.success('Subscription cancelled successfully');
        fetchUsers(search);
      } else {
        toast.error(res.message);
      }
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Search, suspend, manage subscriptions, and reset user sessions</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="topbar-search" style={{ maxWidth: 400, marginBottom: 24, padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
        <MdSearch size={20} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={handleSearch}
        />
      </div>

      {/* Users Table */}
      <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-card)', borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '16px 20px', textAlign: 'left' }}>User Details</th>
              <th style={{ padding: '16px 20px', textAlign: 'left' }}>Role</th>
              <th style={{ padding: '16px 20px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '16px 20px', textAlign: 'left' }}>Subscription Plan</th>
              <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state" style={{ padding: 48 }}>No users found matching your search.</td>
              </tr>
            ) : users.map((u) => {
              const isSubActive = u.subscription && u.subscription.status === 'active';
              return (
                <tr key={u._id} style={{ borderBottom: '1px solid var(--border)', background: u.isSuspended ? 'rgba(239, 68, 68, 0.02)' : 'none' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span className={`badge ${u.role === 'admin' ? 'badge-completed' : 'badge-pending'}`} style={{ textTransform: 'uppercase', fontSize: 11 }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {u.isSuspended ? (
                      <span className="badge badge-cancelled" style={{ fontSize: 11 }}>SUSPENDED</span>
                    ) : (
                      <span className="badge badge-completed" style={{ fontSize: 11 }}>ACTIVE</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {u.subscription ? (
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{u.subscription.planName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Expires: {new Date(u.subscription.expiryDate).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No Active Plan</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(u)} title="Edit User">
                        <MdEdit size={16} />
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => handlePasswordClick(u)} title="Reset Password">
                        <MdLockReset size={16} />
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleRevokeClick(u)} title="Revoke Session Token">
                        <MdVpnKey size={16} />
                      </button>
                      
                      {u.role !== 'admin' && (
                        <>
                          <button
                            className={`btn btn-sm ${u.isSuspended ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => handleToggleSuspend(u)}
                            style={{ background: u.isSuspended ? 'var(--success)' : 'none', color: u.isSuspended ? '#fff' : 'var(--danger)', border: '1px solid var(--border)' }}
                            title={u.isSuspended ? 'Activate User' : 'Suspend User'}
                          >
                            {u.isSuspended ? <MdPlayCircleFilled size={16} /> : <MdBlock size={16} />}
                          </button>
                          
                          <button className="btn btn-secondary btn-sm" onClick={() => handleExtendClick(u)} title="Extend Trial/Plan">
                            <MdExtension size={16} />
                          </button>

                          {isSubActive && (
                            <button className="btn btn-secondary btn-sm" onClick={() => handleCancelSubClick(u)} title="Cancel Subscription" style={{ color: 'var(--orange)' }}>
                              <MdCancel size={16} />
                            </button>
                          )}

                          <button className="btn btn-secondary btn-sm" onClick={() => handleDeleteClick(u)} title="Delete User" style={{ color: 'var(--danger)' }}>
                            <MdDelete size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 400 }}>
            <h2 className="modal-title">Edit User</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.name}
                  onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={editForm.email}
                  onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-control"
                  value={editForm.role}
                  onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PASSWORD RESET MODAL */}
      {showPasswordModal && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 400 }}>
            <h2 className="modal-title">Reset User Password</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Setting a new password will force log out the user from all active browser sessions.
            </p>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter at least 6 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--danger)' }}>Reset & Log Out</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXTEND TRIAL/PLAN MODAL */}
      {showExtendModal && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 400 }}>
            <h2 className="modal-title">Extend Active Plan / Trial</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Manually add days to the active trial or subscription plan for {selectedUser?.name}.
            </p>
            <form onSubmit={handleExtendSubmit}>
              <div className="form-group">
                <label className="form-label">Number of Days</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  value={extendDays}
                  onChange={e => setExtendDays(e.target.value)}
                />
              </div>
              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowExtendModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Extend Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
