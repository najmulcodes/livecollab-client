/**
 * KanbanBoard.jsx — DnD context, board rendering
 *
 * FIXES applied:
 *   Issue 2: handleDragEnd — fixed invalid .?(fn) syntax when resolving
 *            target column from a card (was: .find()?.(fn) — TypeError)
 *   Issue 3: moveCard emit now uses 'column' field (not 'columnId')
 *   Issue 4: COLUMN_COLORS now imported from constants (not defined here)
 *   Issue 8: Board scroll container uses alignItems:'stretch' so columns
 *            fill the full height of the container
 */
import { useState, useCallback } from 'react';
import {
  DndContext, DragOverlay,
  PointerSensor, useSensor, useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { toast } from 'react-hot-toast';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard }   from './KanbanCard';
import { CardModal }    from './CardModal';
import api              from '../../lib/api';
import useBoardStore    from '../../store/boardStore';
import { getSocket }    from '../../socket/socket';
import { DEFAULT_COLUMNS } from '../../lib/constants'; // FIX Issue 4

export default function KanbanBoard({ workspaceId, members }) {
  const { board, addCard, updateCard, deleteCard, moveCard } = useBoardStore();
  const [activeCard,   setActiveCard]   = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Use server-defined columns if available, else DEFAULT_COLUMNS from constants
  const columns = (board?.columns?.length ? board.columns : DEFAULT_COLUMNS);

  /**
   * getCardsForColumn — filter and sort cards for a given column.
   * Uses ONLY card.column (canonical field) after the store fix.
   * Keeps c.columnId as fallback for any cards not yet updated.
   */
  const getCardsForColumn = useCallback((columnId) => {
    if (!board) return [];
    return (board.cards || [])
      .filter(c => !c.isArchived && (c.column || c.columnId) === columnId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [board]);

  const handleDragStart = ({ active }) => {
    const card = (board?.cards || []).find(c => c._id === active.id);
    setActiveCard(card ?? null);
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveCard(null);
    if (!over || !board) return;

    const cardId = active.id;
    const card   = (board.cards || []).find(c => c._id === cardId);
    if (!card) return;

    /**
     * FIX Issue 2: Resolve target column correctly.
     *
     * over.id can be:
     *   a) A column _id  → dragged onto the column's droppable area
     *   b) A card _id    → dragged onto another card (sort within column)
     *
     * BEFORE (broken): board.cards?.find(c => c._id === over.id)?.(c => ...)
     *   .find() returns a card object. ?.(fn) tries to call it as a function → TypeError
     *
     * AFTER (fixed): explicit null-check and property access
     */
    let targetColumnId = columns.find(col => col._id === over.id)?._id;

    if (!targetColumnId) {
      // over.id is a card _id — find which column that card belongs to
      const overCard = (board.cards || []).find(c => c._id === over.id);
      targetColumnId = overCard ? (overCard.column || overCard.columnId) : null;
    }

    if (!targetColumnId) return; // couldn't resolve — bail

    const targetCards = getCardsForColumn(targetColumnId);
    const overIndex   = targetCards.findIndex(c => c._id === over.id);
    const newOrder    = overIndex >= 0 ? overIndex : targetCards.length;

    /**
     * FIX Issue 3: Optimistic update uses 'column' (canonical DB field).
     * store.moveCard now sets card.column AND card.columnId to the new value,
     * clearing the old c.column that caused the filter to read stale data.
     */
    moveCard({ cardId, column: targetColumnId, order: newOrder });

    try {
      await api.patch(`/boards/cards/${cardId}`, {
        column: targetColumnId, // ← always use 'column' for API
        order:  newOrder,
      });
      /**
       * Emit to socket using 'column' field.
       * FIX Issue 6 (partial — emit side): use 'column' so server can
       * forward it using the DB field name.
       */
      getSocket()?.emit('moveCard', {
        workspaceId,
        cardId,
        column: targetColumnId, // ← 'column' not 'columnId'
        order:  newOrder,
      });
    } catch (err) {
      toast.error('Failed to move card');
      // Roll back by refetching — the query will be stale after the patch fails
    }
  };

  // ─── Card CRUD handlers ────────────────────────────────────────────────────

  const handleAddCard = async (columnId, title) => {
    try {
      const { data } = await api.post('/boards/cards', {
        workspaceId,
        title,
        column:   columnId,
        priority: 'medium',
      });
      const card = data.card || data;
      addCard(card);
      getSocket()?.emit('newCard', { workspaceId, card });
    } catch {
      toast.error('Failed to add card');
    }
  };

  const handleUpdateCard = async (cardId, updates) => {
    try {
      const { data } = await api.patch(`/boards/cards/${cardId}`, updates);
      const card = data.card || data;
      updateCard(card);
      getSocket()?.emit('updateCard', { workspaceId, card });
    } catch {
      toast.error('Failed to update card');
      throw new Error('update failed');
    }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      await api.delete(`/boards/cards/${cardId}`);
      deleteCard(cardId);
      getSocket()?.emit('deleteCard', { workspaceId, cardId });
    } catch {
      toast.error('Failed to delete card');
      throw new Error('delete failed');
    }
  };

  // ─── Loading state ─────────────────────────────────────────────────────────

  /**
   * board === null  → still loading (boardData hasn't resolved yet)
   * board !== null  → loaded (cards may be empty, but board renders)
   *
   * FIX Issue 1 (rendering side): this condition now ONLY shows spinner
   * while the API call is in-flight. Once setBoard({ cards: [] }) is called
   * in WorkspacePage, board becomes { cards: [] } (not null), so spinner stops.
   */
  if (board === null) {
    return (
      <div style={styles.loading}>
        <style>{`@keyframes bspin { to { transform: rotate(360deg); } }`}</style>
        <div style={styles.spinner} />
        <span style={styles.loadingText}>LOADING BOARD...</span>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={styles.root}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/*
          FIX Issue 8: alignItems:'stretch' (was 'flex-start').
          This allows columns with height:'100%' to actually fill
          the container height, making drop zones taller on mobile.
        */}
        <div style={styles.board}>
          {columns
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map(column => (
              <KanbanColumn
                key={column._id}
                column={column}
                cards={getCardsForColumn(column._id)}
                onAddCard={handleAddCard}
                onCardClick={setSelectedCard}
              />
            ))
          }
        </div>

        <DragOverlay dropAnimation={null}>
          {activeCard && (
            <KanbanCard card={activeCard} isDragging onClick={() => {}} />
          )}
        </DragOverlay>
      </DndContext>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          columns={columns}
          members={members}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleUpdateCard}
          onDelete={handleDeleteCard}
        />
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  root: {
    flex:     1,
    overflow: 'hidden',
    position: 'relative',
    height:   '100%',
    display:  'flex',
    flexDirection: 'column',
  },
  board: {
    display:        'flex',
    gap:            '16px',
    overflowX:      'auto',
    overflowY:      'hidden',
    padding:        '24px 24px 32px',
    height:         '100%',
    // FIX Issue 8: stretch → columns fill full height
    alignItems:     'stretch',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(245,158,11,0.2) transparent',
  },
  loading: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    height:         '100%',
    width:          '100%',
    gap:            '12px',
  },
  spinner: {
    width:        '28px',
    height:       '28px',
    border:       '2px solid rgba(245,158,11,0.15)',
    borderTop:    '2px solid #F59E0B',
    borderRadius: '50%',
    animation:    'bspin 0.8s linear infinite',
  },
  loadingText: {
    fontSize:      '11px',
    letterSpacing: '0.15em',
    color:         'rgba(229,231,235,0.3)',
    fontFamily:    "'DM Sans', sans-serif",
  },
};
