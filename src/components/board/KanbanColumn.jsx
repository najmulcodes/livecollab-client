import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, X, Loader2 } from 'lucide-react';
import KanbanCard from './KanbanCard';

export default function KanbanColumn({ column, cards, onAddCard, onCardClick }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const { setNodeRef, isOver } = useDroppable({ id: column._id });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    await onAddCard(column._id, newTitle.trim());
    setNewTitle('');
    setShowAdd(false);
    setAdding(false);
  };

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: column.color }} />
          <span className="text-sm font-semibold text-white">{column.title}</span>
          <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{cards.length}</span>
        </div>
        <button onClick={() => setShowAdd(v => !v)}
          className="text-slate-500 hover:text-white hover:bg-white/5 rounded-lg p-1 transition-all">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Cards area */}
      <div ref={setNodeRef}
        className={`flex-1 rounded-2xl p-3 space-y-2 min-h-[120px] transition-all duration-200 ${isOver ? 'bg-brand-500/10 border border-brand-500/30' : 'card-column'}`}>
        <SortableContext items={cards.map(c => c._id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <KanbanCard key={card._id} card={card} onClick={() => onCardClick(card)} />
          ))}
        </SortableContext>

        {cards.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-16 text-slate-600 text-xs">
            Drop cards here
          </div>
        )}
      </div>

      {/* Add card */}
      {showAdd && (
        <div className="mt-2">
          <form onSubmit={handleAdd} className="bg-[#16132a] border border-white/10 rounded-xl p-3">
            <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
              className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none mb-2"
              placeholder="Card title..." />
            <div className="flex items-center gap-2">
              <button type="submit" disabled={adding || !newTitle.trim()}
                className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all">
                {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                Add card
              </button>
              <button type="button" onClick={() => { setShowAdd(false); setNewTitle(''); }}
                className="text-slate-400 hover:text-white transition-colors p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
