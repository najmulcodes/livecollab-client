import { useState, useCallback } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'react-hot-toast';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import CardModal from './CardModal';
import api from '../../lib/api';
import useBoardStore from '../../store/boardStore';
import { getSocket } from '../../socket/socket';

export default function KanbanBoard({ workspaceId, members }) {
  const { board, addCard, updateCard, deleteCard, moveCard } = useBoardStore();
  const [activeCard, setActiveCard] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const getCardsForColumn = useCallback((columnId) => {
    if (!board) return [];
    return board.cards.filter(c => c.columnId === columnId).sort((a, b) => a.order - b.order);
  }, [board]);

  const handleDragStart = ({ active }) => {
    const card = board?.cards.find(c => c._id === active.id);
    setActiveCard(card || null);
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveCard(null);
    if (!over || !board) return;

    const cardId = active.id;
    const overId = over.id;

    const card = board.cards.find(c => c._id === cardId);
    if (!card) return;

    // Check if over a column or another card
    const targetColumnId = board.columns.find(c => c._id === overId)?._id
      || board.cards.find(c => c._id === overId)?.columnId;

    if (!targetColumnId) return;

    const targetCards = getCardsForColumn(targetColumnId);
    const overCardIndex = targetCards.findIndex(c => c._id === overId);
    const newOrder = overCardIndex >= 0 ? overCardIndex : targetCards.length;

    // Optimistic update
    moveCard({ cardId, columnId: targetColumnId, order: newOrder });

    try {
      await api.patch(`/boards/${workspaceId}/cards/${cardId}/move`, { columnId: targetColumnId, order: newOrder });
      const socket = getSocket();
      socket?.emit('moveCard', { workspaceId, cardId, columnId: targetColumnId, order: newOrder });
    } catch (err) {
      toast.error('Failed to move card');
    }
  };

  const handleAddCard = async (columnId, title) => {
    try {
      const { data } = await api.post(`/boards/${workspaceId}/cards`, { columnId, title, priority: 'medium' });
      addCard(data);
      const socket = getSocket();
      socket?.emit('newCard', { workspaceId, card: data });
      // Emit activity
      const actRes = await api.get(`/activities/${workspaceId}`);
      if (actRes.data[0]) socket?.emit('newActivity', { workspaceId, activity: actRes.data[0] });
    } catch (err) {
      toast.error('Failed to add card');
    }
  };

  const handleUpdateCard = async (cardId, updates) => {
    try {
      const { data } = await api.put(`/boards/${workspaceId}/cards/${cardId}`, updates);
      updateCard(data);
      const socket = getSocket();
      socket?.emit('updateCard', { workspaceId, card: data });
    } catch (err) {
      toast.error('Failed to update card');
      throw err;
    }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      await api.delete(`/boards/${workspaceId}/cards/${cardId}`);
      deleteCard(cardId);
      const socket = getSocket();
      socket?.emit('deleteCard', { workspaceId, cardId });
    } catch (err) {
      toast.error('Failed to delete card');
      throw err;
    }
  };

  if (!board) return (
    <div className="flex items-center justify-center h-64 text-slate-400">Loading board...</div>
  );

  return (
    <div className="flex-1 overflow-hidden">
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-5 overflow-x-auto pb-6 px-6 h-full pt-2">
          {board.columns.sort((a, b) => a.order - b.order).map(column => (
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
          columns={board.columns}
          members={members}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleUpdateCard}
          onDelete={handleDeleteCard}
        />
      )}
    </div>
  );
}
