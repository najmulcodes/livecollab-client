
import { create } from 'zustand';

const useBoardStore = create((set) => ({
  board:       null,    // null = not yet loaded | object = loaded (may have empty cards)
  onlineUsers: [],
  typingUsers: [],
  activities:  [],

  
  setBoard: (boardData) => set({ board: boardData }),

  
  addCard: (card) => set((state) => {
    if (!state.board) {
      return { board: { cards: [card] } };
    }
    const existing = (state.board.cards || []);
    // Avoid duplicates (socket may echo our own optimistic add)
    if (existing.some(c => c._id === card._id)) return state;
    return {
      board: { ...state.board, cards: [...existing, card] },
    };
  }),

  /**
   * updateCard — replace a card in the list by _id.
   */
  updateCard: (updatedCard) => set((state) => {
    if (!state.board) return state;
    return {
      board: {
        ...state.board,
        cards: (state.board.cards || []).map(c =>
          c._id === updatedCard._id ? { ...c, ...updatedCard } : c
        ),
      },
    };
  }),

  /**
   * deleteCard — remove card by _id.
   */
  deleteCard: (cardId) => set((state) => {
    if (!state.board) return state;
    return {
      board: {
        ...state.board,
        cards: (state.board.cards || []).filter(c => c._id !== cardId),
      },
    };
  }),

  /**
   * moveCard — update a card's column and order.
   *
   * CRITICAL FIXES (Issues 3 & 6):
   *   1. The API/DB uses field 'column', not 'columnId'.
   *      We must SET card.column AND clear card.columnId to avoid
   *      the filter `c.column || c.columnId` reading a stale value.
   *   2. Accept BOTH 'column' and 'columnId' from callers
   *      (socket may send either depending on server implementation).
   *
   * @param {{ cardId: string, column?: string, columnId?: string, order: number }}
   */
  moveCard: ({ cardId, column, columnId, order }) => set((state) => {
    if (!state.board) return state;
    // Resolve the canonical column value — prefer 'column', fall back to 'columnId'
    const resolvedColumn = column ?? columnId;
    if (!resolvedColumn) return state; // nothing to do
    return {
      board: {
        ...state.board,
        cards: (state.board.cards || []).map(c =>
          c._id === cardId
            ? {
                ...c,
                column:   resolvedColumn, // ← canonical field
                columnId: resolvedColumn, // ← keep in sync (some places use this)
                order:    order ?? c.order,
              }
            : c
        ),
      },
    };
  }),

  /**
   * setOnlineUsers — replace the entire online list from presenceUpdate socket event.
   */
  setOnlineUsers: (users) => set({ onlineUsers: Array.isArray(users) ? users : [] }),

  /**
   * setTypingUser — toggle typing indicator for a user.
   */
  setTypingUser: ({ userId, userName, cardId, isTyping }) => set((state) => {
    const filtered = state.typingUsers.filter(u => u.userId !== userId);
    return {
      typingUsers: isTyping
        ? [...filtered, { userId, userName, cardId }]
        : filtered,
    };
  }),

  /**
   * addActivity — prepend a new activity (max 50 kept).
   */
  addActivity: (activity) => set((state) => ({
    activities: [activity, ...state.activities].slice(0, 50),
  })),

  /**
   * setActivities — bulk set on initial load.
   */
  setActivities: (activities) => set({
    activities: Array.isArray(activities) ? activities : [],
  }),

  
  resetBoard: () => set({
    board:       null,
    onlineUsers: [],
    typingUsers: [],
    activities:  [],
  }),
}));

export default useBoardStore;
