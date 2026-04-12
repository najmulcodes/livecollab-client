// src/store/authStore.js
/**
 * Reads from localStorage synchronously at module init.
 * By the time any component renders, user + token are already populated.
 * No flash-of-unauthenticated-content. No extra localStorage reads needed in guards.
 */
import { create } from 'zustand';

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('lc_user');
    if (!raw || raw === 'undefined') return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const getStoredToken = () => {
  try {
    return localStorage.getItem('lc_token') || null;
  } catch {
    return null;
  }
};

const useAuthStore = create((set) => ({
  user:  getStoredUser(),
  token: getStoredToken(),

  setAuth: (user, token) => {
    localStorage.setItem('lc_user',  JSON.stringify(user));
    localStorage.setItem('lc_token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('lc_user');
    localStorage.removeItem('lc_token');
    set({ user: null, token: null });
  },
}));

export default useAuthStore;
