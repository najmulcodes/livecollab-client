import { create } from 'zustand';

const useBoardStore = create((set) => ({
  board: null,
  onlineUsers: [],
  typingUsers: [],
  activities: [],

  setBoard: (board) => set({ board }),

  addCard: (card) => set((state) => ({
    board: state.board ? { ...state.board, cards: [...state.board.cards, card] } : null,
  })),

  updateCard: (updatedCard) => set((state) => ({
    board: state.board ? {
      ...state.board,
      cards: state.board.cards.map(c => c._id === updatedCard._id ? updatedCard : c),
    } : null,
  })),

  deleteCard: (cardId) => set((state) => ({
    board: state.board ? { ...state.board, cards: state.board.cards.filter(c => c._id !== cardId) } : null,
  })),

  moveCard: ({ cardId, columnId, order }) => set((state) => ({
    board: state.board ? {
      ...state.board,
      cards: state.board.cards.map(c => c._id === cardId ? { ...c, columnId, order } : c),
    } : null,
  })),

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  setTypingUser: ({ userId, userName, cardId, isTyping }) => set((state) => {
    const filtered = state.typingUsers.filter(u => u.userId !== userId);
    return { typingUsers: isTyping ? [...filtered, { userId, userName, cardId }] : filtered };
  }),

  addActivity: (activity) => set((state) => ({
    activities: [activity, ...state.activities].slice(0, 50),
  })),

  setActivities: (activities) => set({ activities }),
}));

export default useBoardStore;
