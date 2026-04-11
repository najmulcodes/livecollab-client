import { useState, useCallback } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'react-hot-toast';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { CardModal } from './CardModal';
import api from '../../lib/api';
import useBoardStore from '../../store/boardStore';
import { getSocket } from '../../socket/socket';

// Default columns matching backend enum
const DEFAULT_COLUMNS = [
  { _id:'todo',       title:'To Do',      color:'#e8a24a' },
  { _id:'inprogress', title:'In Progress', color:'#3b82f6' },
  { _id:'review',     title:'Review',     color:'#8b5cf6' },
  { _id:'done',       title:'Done',       color:'#10b981' },
];

export default function KanbanBoard({ workspaceId, members }) {
  const { board, addCard, updateCard, deleteCard, moveCard } = useBoardStore();
  const [activeCard,   setActiveCard]   = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const columns = board?.columns?.length ? board.columns : DEFAULT_COLUMNS;

  const getCardsForColumn = useCallback((columnId) => {
    if (!board) return [];
    return (board.cards || [])
      .filter(c => (c.column || c.columnId) === columnId && !c.isArchived)
      .sort((a, b) => a.order - b.order);
  }, [board]);

  const handleDragStart = ({ active }) => {
    const card = board?.cards?.find(c => c._id === active.id);
    setActiveCard(card || null);
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveCard(null);
    if (!over || !board) return;

    const cardId = active.id;
    const card   = board.cards?.find(c => c._id === cardId);
    if (!card) return;

    const targetColumnId = columns.find(c => c._id === over.id)?._id
      || board.cards?.find(c => c._id === over.id)?.(c => c.column || c.columnId);

    if (!targetColumnId) return;

    const targetCards = getCardsForColumn(targetColumnId);
    const overIndex   = targetCards.findIndex(c => c._id === over.id);
    const newOrder    = overIndex >= 0 ? overIndex : targetCards.length;

    moveCard({ cardId, columnId: targetColumnId, order: newOrder });

    try {
      await api.patch(`/boards/cards/${cardId}`, { column: targetColumnId, order: newOrder });
      getSocket()?.emit('moveCard', { workspaceId, cardId, columnId: targetColumnId, order: newOrder });
    } catch {
      toast.error('Failed to move card');
    }
  };

  const handleAddCard = async (columnId, title) => {
    try {
      const { data } = await api.post('/boards/cards', { workspaceId, title, column: columnId, priority:'medium' });
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

  if (!board) {
    return (
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'center',
        height:'100%', color:'rgba(240,237,232,0.25)',
        fontSize:'13px', letterSpacing:'0.1em',
        fontFamily:"'DM Sans',sans-serif",
      }}>
        LOADING BOARD...
      </div>
    );
  }

  return (
    <div style={{ flex:1, overflow:'hidden', position:'relative' }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div style={{
          display:'flex', gap:'20px', overflowX:'auto',
          padding:'24px 24px 32px', height:'100%',
          scrollbarWidth:'thin', scrollbarColor:'rgba(232,162,74,0.2) transparent',
        }}>
          {columns.sort((a,b) => (a.order ?? 0) - (b.order ?? 0)).map(column => (
            <KanbanColumn
              key={column._id}
              column={column}
              cards={getCardsForColumn(column._id)}
              onAddCard={handleAddCard}
              onCardClick={setSelectedCard}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard && <KanbanCard card={activeCard} isDragging onClick={() => {}} />}
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
