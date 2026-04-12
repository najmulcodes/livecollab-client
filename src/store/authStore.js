/**
 * authStore.js — Zustand auth state
 *
 * FIXES applied:
 *   Issue 5: Normalize user object so both user.id AND user._id are always
 *            populated with the same string value.
 *            Backend returns _id (MongoDB ObjectId as string).
 *            Consumer code used both user.id and user._id inconsistently.
 *
 * CONTRACT: After setAuth(), user.id === user._id === string (always).
 */
import { create } from 'zustand';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEYS = { user: 'lc_user', token: 'lc_token' };

/**
 * normalizeUser — ensure both .id and ._id are present as strings.
 * Safe to call with null / malformed objects.
 */
function normalizeUser(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw._id || raw.id || '');
  if (!id) return null;
  return { ...raw, _id: id, id };
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    if (!raw || raw === 'undefined') return null;
    return normalizeUser(JSON.parse(raw));
  } catch {
    return null;
  }
}

function getStoredToken() {
  try {
    return localStorage.getItem(STORAGE_KEYS.token) || null;
  } catch {
    return null;
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

const useAuthStore = create((set) => ({
  user:  getStoredUser(),
  token: getStoredToken(),

  setAuth: (rawUser, token) => {
    const user = normalizeUser(rawUser);
    try {
      localStorage.setItem(STORAGE_KEYS.user,  JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.token, token);
    } catch {
      // Private browsing may reject localStorage writes — still set in memory
    }
    set({ user, token });
  },

  logout: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.user);
      localStorage.removeItem(STORAGE_KEYS.token);
    } catch { /* ignore */ }
    set({ user: null, token: null });
  },
}));

export default useAuthStore;
