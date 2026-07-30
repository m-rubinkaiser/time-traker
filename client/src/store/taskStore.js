import { create } from 'zustand';
import API from '../services/api';

const useTaskStore = create((set, get) => ({
  tasks: [],
  loading: false,
  initialized: false,

  fetchTasks: async (params = {}, force = false) => {
    // If cache initialized and not forcing, render instantly and revalidate in background
    if (get().initialized && !force && get().tasks.length > 0) {
      API.get('/tasks', { params }).then(({ data }) => {
        set({ tasks: data, initialized: true });
      }).catch(() => {});
      return get().tasks;
    }

    if (get().tasks.length === 0) set({ loading: true });

    try {
      const { data } = await API.get('/tasks', { params });
      set({ tasks: data, loading: false, initialized: true });
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
