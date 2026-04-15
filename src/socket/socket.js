import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';

let socket = null;
let currentWorkspaceId = null; // track so we can re-join after server restart

export function initSocket(token) {
  // Reuse if already connected
  if (socket?.connected) {
    console.log('[socket] reusing existing connected socket');
    return socket;
  }

  // Disconnect stale socket
  if (socket) {
    console.log('[socket] disconnecting stale socket before reinit');
    socket.disconnect();
    socket = null;
  }

  const user   = useAuthStore.getState().user;
  const userId = user?._id?.toString() ?? user?.id?.toString();

  console.log(`[socket] initialising | userId: ${userId}`);

  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    auth: { token },
    // Use polling fallback so Render free tier works reliably.
    // Socket.IO upgrades to websocket automatically when possible.
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay:    1500,
  });

  socket.on('connect', () => {
    console.log(`[socket] ✅ connected | socketId: ${socket.id}`);
    // CRITICAL FIX for Render free tier:
    // When Render restarts the server, all socket rooms are wiped.
    // Every socket that reconnects must re-join its workspace room,
    // otherwise io.to(userId) has no sockets in it and calls never arrive.
    if (currentWorkspaceId) {
      console.log(`[socket] 🔄 re-joining workspace after reconnect: ${currentWorkspaceId}`);
      socket.emit('joinWorkspace', currentWorkspaceId);
    }
  });

  socket.on('connect_error', (err) => {
    console.warn('[socket] connect error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.warn('[socket] disconnected | reason:', reason);
  });

  return socket;
}

/**
 * Call this whenever the user navigates into a workspace.
 * Stored so the socket can automatically re-join after a server restart.
 */
export function setCurrentWorkspace(workspaceId) {
  currentWorkspaceId = workspaceId;
  // If socket is already connected, join immediately
  if (socket?.connected) {
    socket.emit('joinWorkspace', workspaceId);
  }
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  currentWorkspaceId = null;
  socket?.disconnect();
  socket = null;
}