import { useEffect } from 'react';
import { getSocket } from '../socket/socket';
import useBoardStore from '../store/boardStore';

export const useWorkspaceSocket = (workspaceId) => {
  const { addCard, updateCard, deleteCard, moveCard, setOnlineUsers, setTypingUser, addActivity } = useBoardStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !workspaceId) return;

    socket.emit('joinWorkspace', workspaceId);

    socket.on('newCard', addCard);
    socket.on('updateCard', updateCard);
    socket.on('deleteCard', deleteCard);
    socket.on('moveCard', moveCard);
    socket.on('presenceUpdate', setOnlineUsers);
    socket.on('userTyping', setTypingUser);
    socket.on('newActivity', addActivity);

    return () => {
      socket.emit('leaveWorkspace', workspaceId);
      socket.off('newCard', addCard);
      socket.off('updateCard', updateCard);
      socket.off('deleteCard', deleteCard);
      socket.off('moveCard', moveCard);
      socket.off('presenceUpdate', setOnlineUsers);
      socket.off('userTyping', setTypingUser);
      socket.off('newActivity', addActivity);
    };
  }, [workspaceId]);
};
