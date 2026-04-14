
import { useEffect, useRef } from 'react';
import { getSocket } from '../socket/socket';
import useBoardStore from '../store/boardStore';

export const useWorkspaceSocket = (workspaceId) => {
  const {
    addCard, updateCard, deleteCard, moveCard,
    setOnlineUsers, setTypingUser, addActivity,
  } = useBoardStore();

  // Stable refs so socket handlers always use fresh store actions
  const handlers = useRef({});
  handlers.current = {
    addCard, updateCard, deleteCard, moveCard,
    setOnlineUsers, setTypingUser, addActivity,
  };

  useEffect(() => {
    if (!workspaceId) return;

    const socket = getSocket();
    if (!socket) return;

    socket.emit('joinWorkspace', workspaceId);

    // ─── Event handlers ────────────────────────────────────────────────────

    const onNewCard    = (card)     => handlers.current.addCard(card);
    const onUpdateCard = (card)     => handlers.current.updateCard(card);
    const onDeleteCard = (cardId)   => handlers.current.deleteCard(cardId);
    const onPresence   = (users)    => handlers.current.setOnlineUsers(users);
    const onTyping     = (payload)  => handlers.current.setTypingUser(payload);
    const onActivity   = (activity) => handlers.current.addActivity(activity);

    /**
     * onMoveCard — handles BOTH server payload shapes:
     *   { cardId, column, order }   ← server re-broadcasts with DB field name
     *   { cardId, columnId, order } ← legacy / client-side emit shape
     *
     * We pass BOTH fields to store.moveCard which resolves them safely.
     */
    const onMoveCard = (payload) => {
      if (!payload || !payload.cardId) return;
      handlers.current.moveCard({
        cardId:   payload.cardId,
        column:   payload.column,    // may be undefined
        columnId: payload.columnId,  // may be undefined
        order:    payload.order,
      });
    };

    socket.on('newCard',        onNewCard);
    socket.on('updateCard',     onUpdateCard);
    socket.on('deleteCard',     onDeleteCard);
    socket.on('moveCard',       onMoveCard);
    socket.on('presenceUpdate', onPresence);
    socket.on('userTyping',     onTyping);
    socket.on('newActivity',    onActivity);

    return () => {
      socket.emit('leaveWorkspace', workspaceId);
      socket.off('newCard',        onNewCard);
      socket.off('updateCard',     onUpdateCard);
      socket.off('deleteCard',     onDeleteCard);
      socket.off('moveCard',       onMoveCard);
      socket.off('presenceUpdate', onPresence);
      socket.off('userTyping',     onTyping);
      socket.off('newActivity',    onActivity);
    };
  }, [workspaceId]); // Only re-run when workspace changes
};
