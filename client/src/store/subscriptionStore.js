import { create } from 'zustand';
import API from '../services/api';

const useSubscriptionStore = create((set) => ({
  active: true, // Default to true while loading
  subscription: null,
  history: [],
  loading: false,
  error: null,

  checkStatus: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.get('/subscription/status');
      set({
        active: data.active,
        subscription: data.subscription,
        history: data.history,
        loading: false
      });
      return data;
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'PAYMENT_REQUIRED') {
        set({ active: false, loading: false });
      } else {
        set({ error: err.response?.data?.message || 'Error checking subscription', loading: false });
      }
      return { active: false };
    }
  },

  checkout: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.post('/subscription/checkout');
      set({ loading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Checkout failed';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  verifyPayment: async (orderId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.post('/subscription/verify', { orderId });
      set({
        active: true,
        subscription: data.subscription,
        loading: false
      });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Payment verification failed';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  activateWithToken: async (token) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.post('/subscription/activate-token', { token });
      set({
        active: true,
        subscription: data.subscription,
        loading: false
      });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Token activation failed';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  }
}));

export default useSubscriptionStore;
