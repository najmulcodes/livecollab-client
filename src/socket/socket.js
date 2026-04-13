/**
 * socket.js — Socket.IO client singleton
 *
 * CHANGE vs original:
 *   Pass userId in socket auth so the server can socket.join(userId),
 *   which is required for direct-to-user signaling in video calls.
 *
 *   If your server already uses socket.id for routing, you can skip this
 *   and use socket.id as the call target instead. But userId is more stable
 *   (socket.id changes on reconnect).
 */
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';

let socket = null;

export function initSocket(token) {
  if (socket?.connected) return socket;

  // Disconnect stale socket before creating a new one
  socket?.disconnect();

  // Pull userId from store at init time
  const user = useAuthStore.getState().user;

  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    auth: {
      token,
      userId: user?.id ?? user?._id, // ← required for personal room join on server
    },
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay:    1000,
  });

  socket.on('connect_error', (err) => {
    console.warn('[socket] connect error:', err.message);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
