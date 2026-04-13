const jwt = require('jsonwebtoken');
const User = require('../models/User');

// workspaceId -> Map<userId, { user, socketId }>
const workspaceUsers = new Map();

// userId -> socketId (for direct signaling)
const userSocketMap = new Map();

const initSockets = (io) => {

  // ── Auth middleware ──────────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('No token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId || decoded.id;
      const user = await User.findById(userId);
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Auth failed'));
    }
  });

  // ── Connection ───────────────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.user.name}`);

    // ✅ Join a personal room using userId — required for direct call signaling
    const userId = socket.user._id.toString();
    socket.join(userId);
    userSocketMap.set(userId, socket.id);

    // ── Workspace presence ─────────────────────────────────────────────────────
    socket.on('joinWorkspace', (workspaceId) => {
      socket.join(workspaceId);
      socket.currentWorkspace = workspaceId;

      if (!workspaceUsers.has(workspaceId)) {
        workspaceUsers.set(workspaceId, new Map());
      }

      workspaceUsers.get(workspaceId).set(userId, {
        user: {
          id:    userId,
          _id:   userId,
          name:  socket.user.name,
          email: socket.user.email,
          color: socket.user.color,
        },
        socketId: socket.id,
      });

      const onlineUsers = [...workspaceUsers.get(workspaceId).values()].map(u => u.user);
      io.to(workspaceId).emit('presenceUpdate', onlineUsers);
    });

    socket.on('leaveWorkspace', (workspaceId) => {
      socket.leave(workspaceId);
      removeFromPresence(workspaceId, socket, io);
    });

    // ── Board events ───────────────────────────────────────────────────────────
    socket.on('card-created', ({ workspaceId, card }) => {
      if (workspaceId && card) socket.to(workspaceId).emit('card-created', card);
    });

    socket.on('card-updated', ({ workspaceId, card }) => {
      if (workspaceId && card) socket.to(workspaceId).emit('card-updated', card);
    });

    socket.on('card-deleted', ({ workspaceId, cardId }) => {
      if (workspaceId && cardId) socket.to(workspaceId).emit('card-deleted', cardId);
    });

    // ✅ card-moved: uses 'column' (DB field name)
    socket.on('card-moved', ({ workspaceId, cardId, column, order }) => {
      if (workspaceId && cardId) socket.to(workspaceId).emit('card-moved', { cardId, column, order });
    });

    // Legacy aliases for backward compat
    socket.on('newCard',    ({ workspaceId, card })            => socket.to(workspaceId).emit('card-created', card));
    socket.on('updateCard', ({ workspaceId, card })            => socket.to(workspaceId).emit('card-updated', card));
    socket.on('deleteCard', ({ workspaceId, cardId })          => socket.to(workspaceId).emit('card-deleted', cardId));
    socket.on('moveCard',   ({ workspaceId, cardId, column, columnId, order }) => {
      socket.to(workspaceId).emit('card-moved', { cardId, column: column || columnId, order });
    });

    // ── Activity ───────────────────────────────────────────────────────────────
    socket.on('newActivity', ({ workspaceId, activity }) => {
      if (workspaceId && activity) socket.to(workspaceId).emit('newActivity', activity);
    });

    // ── Typing ─────────────────────────────────────────────────────────────────
    socket.on('typing', ({ workspaceId, cardId, isTyping }) => {
      socket.to(workspaceId).emit('userTyping', {
        userId:   userId,
        userName: socket.user.name,
        cardId,
        isTyping,
      });
    });

    // ── WebRTC signaling ───────────────────────────────────────────────────────
    /**
     * These events are routed directly to the target user's personal room (userId).
     * This works because each connected socket joins `socket.join(userId)` above.
     *
     * call-user     → caller → callee  (offer)
     * answer-call   → callee → caller  (answer)
     * ice-candidate → both directions  (ICE)
     * end-call      → either → other   (hangup)
     * call-answered → server rebroadcasts answer to caller
     * incoming-call → server rebroadcasts offer to callee
     */

    // ✅ Caller sends offer to callee
    socket.on('call-user', ({ to, from, offer }) => {
      if (!to || !offer) return;
      // Emit to the callee's personal room
      io.to(to).emit('incoming-call', { from, offer });
    });

    // ✅ Callee sends answer back to caller
    socket.on('answer-call', ({ to, answer }) => {
      if (!to || !answer) return;
      io.to(to).emit('call-answered', { answer });
    });

    // ✅ ICE candidates — both directions
    socket.on('ice-candidate', ({ to, candidate }) => {
      if (!to || !candidate) return;
      io.to(to).emit('ice-candidate', { candidate });
    });

    // ✅ End call — notify the other party
    socket.on('end-call', ({ to }) => {
      if (!to) return;
      io.to(to).emit('end-call');
    });

    // ── Disconnect ─────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔌 Disconnected: ${socket.user.name}`);
      userSocketMap.delete(userId);
      if (socket.currentWorkspace) {
        removeFromPresence(socket.currentWorkspace, socket, io);
      }
    });
  });
};

function removeFromPresence(workspaceId, socket, io) {
  if (!workspaceUsers.has(workspaceId)) return;
  workspaceUsers.get(workspaceId).delete(socket.user._id.toString());
  const onlineUsers = [...workspaceUsers.get(workspaceId).values()].map(u => u.user);
  io.to(workspaceId).emit('presenceUpdate', onlineUsers);
}

module.exports = { initSockets };
