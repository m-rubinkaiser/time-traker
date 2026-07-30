import { create } from 'zustand';
import API from '../services/api';

const useTaskStore = create((set, get) => ({
  tasks: [],
  loading: false,
  initialized: false,

  fetchTasks: async (params = {}, force = false) => {
    // If params are passed (filters), fetch directly
    const hasParams = Object.keys(params).some(k => params[k]);
    
    if (get().initialized && !force && !hasParams && get().tasks.length > 0) {
      // Background revalidation
      API.get('/tasks').then(({ data }) => {
        set({ tasks: data, initialized: true });
      }).catch(() => {});
      return get().tasks;
    }

    if (!get().initialized && get().tasks.length === 0) set({ loading: true });

    try {
      const { data } = await API.get('/tasks', { params });
      if (!hasParams) {
        set({ tasks: data, loading: false, initialized: true });
      }
      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  setTasks: (tasks) => set({ tasks, initialized: true }),

  addTask: (task) => {
    set(state => ({ tasks: [task, ...state.tasks] }));
  },

  updateTaskInStore: (task) => {
    set(state => ({
      tasks: state.tasks.map(t => t._id === task._id ? { ...t, ...task } : t)
    }));
  },

  removeTaskFromStore: (id) => {
    set(state => ({
      tasks: state.tasks.filter(t => t._id !== id)
    }));
  }
}));

export default useTaskStore;
