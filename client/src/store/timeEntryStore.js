import { create } from 'zustand';
import API from '../services/api';

const useTimeEntryStore = create((set, get) => ({
  entries: [],
  loading: false,
  initialized: false,

  fetchEntries: async (force = false) => {
    if (get().initialized && !force && get().entries.length > 0) {
      // Revalidate in background silently
      API.get('/time-entries').then(({ data }) => {
        set({ entries: data, initialized: true });
      }).catch(() => {});
      return get().entries;
    }

    if (!get().initialized && get().entries.length === 0) set({ loading: true });

    try {
      const { data } = await API.get('/time-entries');
      set({ entries: data, loading: false, initialized: true });
      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  setEntries: (entries) => set({ entries, initialized: true }),

  addEntry: (entry) => {
    set(state => ({ entries: [entry, ...state.entries] }));
  },

  updateEntryInStore: (entry) => {
    set(state => ({
      entries: state.entries.map(e => e._id === entry._id ? { ...e, ...entry } : e)
    }));
  },

  removeEntryFromStore: (id) => {
    set(state => ({
      entries: state.entries.filter(e => e._id !== id)
    }));
  }
}));

export default useTimeEntryStore;
