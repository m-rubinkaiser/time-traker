import { create } from 'zustand';
import API from '../services/api';

const loadPersistedState = () => {
  try {
    const saved = localStorage.getItem('timer_store_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      let currentSeconds = parsed.accumulated || 0;
      if (parsed.status === 'running' && parsed.startTs) {
        currentSeconds = (parsed.accumulated || 0) + Math.floor((Date.now() - parsed.startTs) / 1000);
      }
      return {
        status: parsed.status || 'idle',
        seconds: currentSeconds || 0,
        startTs: parsed.startTs || null,
        accumulated: parsed.accumulated || 0,
        activeTaskId: parsed.activeTaskId || null,
        activeTaskObj: parsed.activeTaskObj || null,
      };
    }
  } catch (err) {
    console.error('Failed to load persisted timer state:', err);
  }
  return {
    status: 'idle',
    seconds: 0,
    startTs: null,
    accumulated: 0,
    activeTaskId: null,
    activeTaskObj: null,
  };
};

const saveState = (state) => {
  try {
    const stateToSave = {
      status: state.status,
      startTs: state.startTs,
      accumulated: state.accumulated,
      activeTaskId: state.activeTaskId,
      activeTaskObj: state.activeTaskObj,
    };
    localStorage.setItem('timer_store_state', JSON.stringify(stateToSave));
  } catch (err) {
    console.error('Failed to save timer state:', err);
  }
};

const persisted = loadPersistedState();

const useTimerStore = create((set, get) => {
  // If it was running on page load, start the interval automatically
  let initialIntervalId = null;
  if (persisted.status === 'running') {
    initialIntervalId = setInterval(() => {
      get().tick();
    }, 1000);
  }

  return {
    ...persisted,
    intervalId: initialIntervalId,

    tick: () => {
      const { startTs, accumulated, status } = get();
      if (status !== 'running' || !startTs) return;
      set({ seconds: accumulated + Math.floor((Date.now() - startTs) / 1000) });
    },

    start: (task) => {
      const { status, intervalId, activeTaskId } = get();
      
      if (intervalId) {
        clearInterval(intervalId);
      }

      const isResume = (task._id === activeTaskId && status === 'paused');
      const nextAccumulated = isResume ? get().accumulated : 0;
      const nextStartTs = Date.now();

      const nextState = {
        activeTaskId: task._id,
        activeTaskObj: task,
        status: 'running',
        startTs: nextStartTs,
        accumulated: nextAccumulated,
        seconds: nextAccumulated,
        intervalId: setInterval(() => get().tick(), 1000)
      };

      set(nextState);
      saveState(nextState);
    },

    resume: () => {
      const { status, intervalId, activeTaskId, activeTaskObj, accumulated } = get();
      if (status !== 'paused' || !activeTaskId) return;

      if (intervalId) clearInterval(intervalId);

      const nextStartTs = Date.now();
      const nextState = {
        status: 'running',
        startTs: nextStartTs,
        seconds: accumulated,
        intervalId: setInterval(() => get().tick(), 1000)
      };

      set(nextState);
      saveState({
        status: 'running',
        startTs: nextStartTs,
        accumulated,
        activeTaskId,
        activeTaskObj
      });
    },

    pause: () => {
      const { intervalId, startTs, accumulated, status, activeTaskId, activeTaskObj } = get();
      if (status !== 'running') return;
      
      if (intervalId) clearInterval(intervalId);
      
      const newAccumulated = accumulated + Math.floor((Date.now() - startTs) / 1000);
      
      const nextState = {
        status: 'paused',
        accumulated: newAccumulated,
        seconds: newAccumulated,
        intervalId: null
      };

      set(nextState);
      saveState({
        status: 'paused',
        startTs: null,
        accumulated: newAccumulated,
        activeTaskId,
        activeTaskObj
      });
    },

    stop: () => {
      const { intervalId, startTs, accumulated, status, activeTaskId, activeTaskObj } = get();
      if (intervalId) clearInterval(intervalId);
      
      const total = accumulated + (status === 'running' ? Math.floor((Date.now() - startTs) / 1000) : 0);
      const ts = startTs || Date.now();
      
      const resetState = {
        status: 'idle',
        seconds: 0,
        accumulated: 0,
        startTs: null,
        intervalId: null,
        activeTaskId: null,
        activeTaskObj: null
      };

      set(resetState);
      localStorage.removeItem('timer_store_state');
      
      return { totalSeconds: total, startedAt: ts, taskId: activeTaskId, taskObj: activeTaskObj };
    },

    stopAndSave: async () => {
      const { intervalId, startTs, accumulated, status, activeTaskId, activeTaskObj } = get();
      if (intervalId) clearInterval(intervalId);

      const totalSeconds = accumulated + (status === 'running' ? Math.floor((Date.now() - startTs) / 1000) : 0);
      if (totalSeconds < 60) {
        // Reset the timer since it ran for less than 1 minute
        get().reset();
        throw new Error('Timer must run for at least 1 minute');
      }

      const minutes = Math.round(totalSeconds / 60);
      const startTime = new Date(startTs || Date.now()).toTimeString().slice(0, 5);
      const endTime = new Date().toTimeString().slice(0, 5);
      const date = new Date().toISOString().split('T')[0];

      const payload = {
        taskId: activeTaskId,
        projectId: activeTaskObj?.projectId?._id || activeTaskObj?.projectId,
        date,
        startTime,
        endTime,
        durationMinutes: minutes,
        entryType: 'auto',
        remarks: 'Auto-tracked via timer'
      };

      // Reset store state immediately
      const resetState = {
        status: 'idle',
        seconds: 0,
        accumulated: 0,
        startTs: null,
        intervalId: null,
        activeTaskId: null,
        activeTaskObj: null
      };
      set(resetState);
      localStorage.removeItem('timer_store_state');

      try {
        const { data } = await API.post('/time-entries', payload);
        return { success: true, offline: false, entry: data };
      } catch (err) {
        const isNetworkError = !err.response || err.message === 'Network Error' || (typeof window !== 'undefined' && !window.navigator.onLine);
        if (isNetworkError) {
          // Save to offline queue
          const tempId = `temp-${Date.now()}`;
          const offlineEntry = {
            _id: tempId,
            ...payload,
            taskId: activeTaskObj ? { _id: activeTaskObj._id, title: activeTaskObj.title } : { _id: activeTaskId, title: 'Unknown Task' },
            projectId: activeTaskObj?.projectId ? { 
              _id: activeTaskObj.projectId._id || activeTaskObj.projectId, 
              name: activeTaskObj.projectId.name || 'Unknown Project', 
              color: activeTaskObj.projectId.color 
            } : null,
            isOfflinePending: true
          };

          try {
            const pending = JSON.parse(localStorage.getItem('unsynced_time_entries') || '[]');
            pending.push(offlineEntry);
            localStorage.setItem('unsynced_time_entries', JSON.stringify(pending));
          } catch (storageErr) {
            console.error('Storage write error:', storageErr);
          }

          return { success: true, offline: true, entry: offlineEntry };
        } else {
          // Server validation / auth error, etc. Show raw error to UI
          throw err;
        }
      }
    },

    reset: () => {
      const { intervalId } = get();
      if (intervalId) clearInterval(intervalId);
      
      set({
        status: 'idle',
        seconds: 0,
        accumulated: 0,
        startTs: null,
        intervalId: null,
        activeTaskId: null,
        activeTaskObj: null
      });
      localStorage.removeItem('timer_store_state');
    }
  };
});

export default useTimerStore;
