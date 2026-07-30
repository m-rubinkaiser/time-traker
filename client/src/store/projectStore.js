import { create } from 'zustand';
import API from '../services/api';

const useProjectStore = create((set, get) => ({
  projects: [],
  loading: false,
  initialized: false,

  fetchProjects: async (force = false) => {
    if (get().initialized && !force && get().projects.length > 0) {
      // Revalidate in background silently without setting loading to true
      API.get('/projects').then(({ data }) => {
        set({ projects: data, initialized: true });
      }).catch(() => {});
      return get().projects;
    }

    if (get().projects.length === 0) set({ loading: true });

    try {
      const { data } = await API.get('/projects');
      set({ projects: data, loading: false, initialized: true });
      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  setProjects: (projects) => set({ projects, initialized: true }),

  addProject: (project) => {
    set(state => ({ projects: [project, ...state.projects] }));
  },

  updateProjectInStore: (project) => {
    set(state => ({
      projects: state.projects.map(p => p._id === project._id ? { ...p, ...project } : p)
    }));
  },

  removeProjectFromStore: (id) => {
    set(state => ({
      projects: state.projects.filter(p => p._id !== id)
    }));
  }
}));

export default useProjectStore;
