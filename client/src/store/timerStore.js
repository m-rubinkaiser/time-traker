import { create } from 'zustand';

const useTimerStore = create((set, get) => ({
  status: 'idle', // 'idle' | 'running' | 'paused'
  seconds: 0,
  startTs: null,
  accumulated: 0,
  intervalId: null,
  activeTaskId: null,
  activeTaskObj: null, // to display task info globally if needed

  tick: () => set((state) => ({ seconds: state.accumulated + Math.floor((Date.now() - state.startTs) / 1000) })),

  start: (task) => {
    const { status, intervalId, activeTaskId, pause } = get();
    
    // If starting a different task, we shouldn't auto-save here because saving is async and requires API calls. 
    // The UI should enforce stopping the old one first, or we just override it and lose the time.
    // For simplicity, we just stop the old timer without saving if they force start a new one, 
    // OR the UI will block them from starting a new one.
    if (intervalId) {
      clearInterval(intervalId);
    }

    const isResume = (task._id === activeTaskId && status === 'paused');
    
    set({
      activeTaskId: task._id,
      activeTaskObj: task,
      status: 'running',
      startTs: Date.now(),
      accumulated: isResume ? get().accumulated : 0,
      seconds: isResume ? get().accumulated : 0,
      intervalId: setInterval(get().tick, 1000)
    });
  },

  pause: () => {
    const { intervalId, startTs, accumulated, status } = get();
    if (status !== 'running') return;
    
    if (intervalId) clearInterval(intervalId);
    
    const newAccumulated = accumulated + Math.floor((Date.now() - startTs) / 1000);
    
    set({
      status: 'paused',
      accumulated: newAccumulated,
      seconds: newAccumulated,
      intervalId: null
    });
  },

  stop: () => {
    const { intervalId, startTs, accumulated, status, activeTaskId } = get();
    if (intervalId) clearInterval(intervalId);
    
    const total = accumulated + (status === 'running' ? Math.floor((Date.now() - startTs) / 1000) : 0);
    const ts = startTs || Date.now();
    
    set({
      status: 'idle',
      seconds: 0,
      accumulated: 0,
      startTs: null,
      intervalId: null,
      activeTaskId: null,
      activeTaskObj: null
    });
    
    return { totalSeconds: total, startedAt: ts, taskId: activeTaskId };
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
  }
}));

export default useTimerStore;
