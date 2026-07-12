import { create } from 'zustand';
import API from '../services/api';

const useSettingsStore = create((set) => ({
  theme: localStorage.getItem('theme') || 'dark',
  accent: localStorage.getItem('accent') || 'indigo',
  settings: null,
  loading: false,

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  setAccent: (accent) => {
    localStorage.setItem('accent', accent);
    set({ accent });
  },

  fetchSettings: async () => {
    set({ loading: true });
    try {
      const { data } = await API.get('/settings');
      set({ settings: data, loading: false });
      if (data.theme) {
        localStorage.setItem('theme', data.theme);
        document.documentElement.setAttribute('data-theme', data.theme);
        set({ theme: data.theme });
      }
    } catch {
      set({ loading: false });
    }
  },

  updateSettings: async (updates) => {
    set({ loading: true });
    try {
      const { data } = await API.put('/settings', updates);
      set({ settings: data, loading: false });
      if (updates.theme) {
        localStorage.setItem('theme', updates.theme);
        document.documentElement.setAttribute('data-theme', updates.theme);
        set({ theme: updates.theme });
      }
      return { success: true };
    } catch (err) {
      set({ loading: false });
      return { success: false, message: err.response?.data?.message || 'Failed' };
    }
  }
}));

export default useSettingsStore;
