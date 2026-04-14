import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';

let socket = null;

export function initSocket(token) {
  // If already connected with a live socket, reuse it.
  // This prevents the connect → disconnect → connect loop that breaks calls.
  if (socket?.connected) {
    console.log('[socket] reusing existing connected socket');
    return socket;
  }

  // Disconnect any stale/disconnected socket before creating a new one.
  if (socket) {
    console.log('[socket] disconnecting stale socket before reinit');
    socket.disconnect();
    socket = null;
  }

  // Pull userId from store at init time.
  // IMPORTANT: always use _id (MongoDB ObjectId string) — this is what the
  // server uses as the personal room key, so it must match exactly.
  const user   = useAuthStore.getState().user;
  const userId = user?._id?.toString() ?? user?.id?.toString();

  console.log(`[socket] initialising | userId: ${userId}`);

  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    auth: {
      token,
      userId, // sent for context; server derives the authoritative id from JWT
    },
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay:    1000,
  });

  socket.on('connect', () => {
    console.log(`[socket] ✅ connected | socketId: ${socket.id}`);
  });

  socket.on('connect_error', (err) => {
    console.warn('[socket] connect error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.warn('[socket] disconnected | reason:', reason);
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