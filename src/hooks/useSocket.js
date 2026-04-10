import { useEffect, useRef } from 'react';
import { getSocket } from '../socket/socket';
import useBoardStore from '../store/boardStore';

export const useWorkspaceSocket = (workspaceId) => {
  const { addCard, updateCard, deleteCard, moveCard, setOnlineUsers, setTypingUser, addActivity } = useBoardStore();

  // Use refs so the socket handlers always have fresh store actions
  // without needing them in the deps array (store actions are stable refs)
  const handlers = useRef({ addCard, updateCard, deleteCard, moveCard, setOnlineUsers, setTypingUser, addActivity });
  handlers.current = { addCard, updateCard, deleteCard, moveCard, setOnlineUsers, setTypingUser, addActivity };

  useEffect(() => {
    if (!workspaceId) return;

    const socket = getSocket();
    if (!socket) return;

    socket.emit('joinWorkspace', workspaceId);

    const onNewCard      = (card)    => handlers.current.addCard(card);
    const onUpdateCard   = (card)    => handlers.current.updateCard(card);
    const onDeleteCard   = (cardId)  => handlers.current.deleteCard(cardId);
    const onMoveCard     = (payload) => handlers.current.moveCard(payload);
    const onPresence     = (users)   => handlers.current.setOnlineUsers(users);
    const onTyping       = (payload) => handlers.current.setTypingUser(payload);
    const onNewActivity  = (activity) => handlers.current.addActivity(activity);

    socket.on('newCard',        onNewCard);
    socket.on('updateCard',     onUpdateCard);
    socket.on('deleteCard',     onDeleteCard);
    socket.on('moveCard',       onMoveCard);
    socket.on('presenceUpdate', onPresence);
    socket.on('userTyping',     onTyping);
    socket.on('newActivity',    onNewActivity);

    return () => {
      socket.emit('leaveWorkspace', workspaceId);
      socket.off('newCard',        onNewCard);
      socket.off('updateCard',     onUpdateCard);
      socket.off('deleteCard',     onDeleteCard);
      socket.off('moveCard',       onMoveCard);
      socket.off('presenceUpdate', onPresence);
      socket.off('userTyping',     onTyping);
      socket.off('newActivity',    onNewActivity);
    };
  }, [workspaceId]); // only re-run when workspaceId changes
};
