import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Flag, GripVertical } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

const PRIORITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };

export default function KanbanCard({ card, onClick, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } = useSortable({ id: card._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortDragging ? 0.4 : 1,
  };

  const dueDateObj = card.dueDate ? new Date(card.dueDate) : null;
  const isOverdue = dueDateObj && isPast(dueDateObj) && !isToday(dueDateObj);
  const isDueToday = dueDateObj && isToday(dueDateObj);

  return (
    <div ref={setNodeRef} style={style}
      className={`group bg-[#16132a] border border-white/8 rounded-xl p-3.5 cursor-pointer hover:border-brand-500/40 hover:shadow-card-hover transition-all duration-200 ${isDragging ? 'drag-overlay' : ''}`}
      onClick={onClick}>
      <div className="flex items-start gap-2">
        <div {...attributes} {...listeners} onClick={e => e.stopPropagation()}
          className="mt-0.5 text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white leading-snug mb-2 line-clamp-2">{card.title}</p>

          {card.description && (
            <p className="text-xs text-slate-500 line-clamp-1 mb-2">{card.description}</p>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {card.priority && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium" style={{ background: PRIORITY_COLORS[card.priority] + '20', color: PRIORITY_COLORS[card.priority] }}>
                  <Flag className="w-2.5 h-2.5" />
                  {card.priority}
                </div>
              )}
              {dueDateObj && (
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs ${isOverdue ? 'bg-red-500/20 text-red-400' : isDueToday ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-400'}`}>
                  <Calendar className="w-2.5 h-2.5" />
                  {format(dueDateObj, 'MMM d')}
                </div>
              )}
            </div>

            {card.assignee && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                style={{ background: card.assignee.color || '#6366f1' }}
                title={card.assignee.name}>
                {card.assignee.name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
