import { create } from 'zustand';
import API from '../services/api';

const useAdminStore = create((set, get) => ({
  stats: null,
  users: [],
  projects: [],
  subscriptions: [],
  tokenConfig: null,
  loading: false,
  error: null,

  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.get('/admin/stats');
      set({ stats: data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch stats', loading: false });
    }
  },

  fetchUsers: async (search = '') => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.get(`/admin/users?search=${search}`);
      set({ users: data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch users', loading: false });
    }
  },

  editUser: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      await API.put(`/admin/users/${id}`, updates);
      set({ loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update user';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  toggleSuspension: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.put(`/admin/users/${id}/suspend`);
      set((state) => ({
        users: state.users.map((u) => (u._id === id ? { ...u, isSuspended: data.user.isSuspended } : u)),
        loading: false
      }));
      return { success: true, isSuspended: data.user.isSuspended };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to toggle suspension';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  resetPassword: async (id, password) => {
    set({ loading: true, error: null });
    try {
      await API.put(`/admin/users/${id}/reset-password`, { password });
      set({ loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  revokeToken: async (id) => {
    set({ loading: true, error: null });
    try {
      await API.post(`/admin/users/${id}/revoke-token`);
      set({ loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to revoke token';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  forceLogoutAll: async () => {
    set({ loading: true, error: null });
    try {
      await API.post('/admin/force-logout-all');
      set({ loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to force logout all';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.get('/admin/projects');
      set({ projects: data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch projects', loading: false });
    }
  },

  deleteProject: async (id) => {
    set({ loading: true, error: null });
    try {
      await API.delete(`/admin/projects/${id}`);
      set((state) => ({
        projects: state.projects.filter((p) => p._id !== id),
        loading: false
      }));
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete project';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  fetchTokenConfig: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.get('/admin/token-config');
      set({ tokenConfig: data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch token config', loading: false });
    }
  },

  updateTokenConfig: async (updates) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.put('/admin/token-config', updates);
      set({ tokenConfig: data.config, loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update token config';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  regenerateSecretKey: async () => {
    set({ loading: true, error: null });
    try {
      await API.post('/admin/regenerate-secret');
      set({ loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to regenerate signing key';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  extendSubscription: async (id, days) => {
    set({ loading: true, error: null });
    try {
      await API.put(`/admin/users/${id}/subscription/extend`, { days });
      set({ loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to extend subscription';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  cancelSubscription: async (id) => {
    set({ loading: true, error: null });
    try {
      await API.put(`/admin/users/${id}/subscription/cancel`);
      set({ loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to cancel subscription';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  fetchSubscriptions: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.get('/admin/subscriptions');
      set({ subscriptions: data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch subscriptions', loading: false });
    }
  }
}));

export default useAdminStore;
