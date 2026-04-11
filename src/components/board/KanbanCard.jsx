import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Flag, GripVertical } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
 
const PRIORITY_COLORS = { low:'#10b981', medium:'#e8a24a', high:'#ef4444', urgent:'#dc2626' };
 
export function KanbanCard({ card, onClick, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } = useSortable({ id: card._id });
 
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortDragging ? 0.4 : 1,
  };
 
  const dueDateObj = card.dueDate ? new Date(card.dueDate) : null;
  const isOverdue  = dueDateObj && isPast(dueDateObj) && !isToday(dueDateObj);
  const isDueToday = dueDateObj && isToday(dueDateObj);
  const pColor     = PRIORITY_COLORS[card.priority] || PRIORITY_COLORS.medium;
 
  return (
    <div
      ref={setNodeRef} style={style}
      onClick={onClick}
    >
      <div style={{
        background: isDragging ? 'rgba(232,162,74,0.08)' : 'rgba(20,18,14,0.9)',
        border: `1px solid ${isDragging ? 'rgba(232,162,74,0.4)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius:'2px', padding:'14px',
        cursor:'pointer', transition:'all 0.15s',
        boxShadow: isDragging ? '0 16px 40px rgba(0,0,0,0.5)' : 'none',
        transform: isDragging ? 'rotate(2deg) scale(1.02)' : 'none',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(232,162,74,0.25)';
          e.currentTarget.style.background  = 'rgba(232,162,74,0.04)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
          e.currentTarget.style.background  = 'rgba(20,18,14,0.9)';
        }}
      >
        <div style={{ display:'flex', alignItems:'flex-start', gap:'8px' }}>
          {/* drag handle */}
          <div
            {...attributes} {...listeners}
            onClick={e => e.stopPropagation()}
            style={{
              marginTop:'2px', color:'rgba(240,237,232,0.2)',
              cursor:'grab', flexShrink:0, transition:'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color='rgba(232,162,74,0.6)'}
            onMouseLeave={e => e.currentTarget.style.color='rgba(240,237,232,0.2)'}
          >
            <GripVertical style={{ width:14, height:14 }} />
          </div>
 
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{
              fontSize:'13px', fontWeight:500, color:'#f0ede8',
              margin:'0 0 6px', lineHeight:1.4,
              display:'-webkit-box', WebkitLineClamp:2,
              WebkitBoxOrient:'vertical', overflow:'hidden',
            }}>{card.title}</p>
 
            {card.description && (
              <p style={{
                fontSize:'12px', color:'rgba(240,237,232,0.35)',
                margin:'0 0 8px', lineHeight:1.4,
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              }}>{card.description}</p>
            )}
 
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap' }}>
                {card.priority && (
                  <div style={{
                    display:'flex', alignItems:'center', gap:'4px',
                    padding:'2px 6px', borderRadius:'2px', fontSize:'10px', fontWeight:500,
                    background: pColor + '18', color: pColor,
                    letterSpacing:'0.06em',
                  }}>
                    <Flag style={{ width:9, height:9 }} />
                    {card.priority.toUpperCase()}
                  </div>
                )}
                {dueDateObj && (
                  <div style={{
                    display:'flex', alignItems:'center', gap:'4px',
                    padding:'2px 6px', borderRadius:'2px', fontSize:'10px',
                    background: isOverdue ? 'rgba(239,68,68,0.15)' : isDueToday ? 'rgba(232,162,74,0.15)' : 'rgba(255,255,255,0.05)',
                    color: isOverdue ? '#ef4444' : isDueToday ? '#e8a24a' : 'rgba(240,237,232,0.4)',
                    letterSpacing:'0.04em',
                  }}>
                    <Calendar style={{ width:9, height:9 }} />
                    {format(dueDateObj, 'MMM d')}
                  </div>
                )}
              </div>
 
              {card.assignees?.[0] && (
                <div style={{
                  width:'22px', height:'22px', borderRadius:'50%', flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'10px', fontWeight:600, color:'#0b0b0c',
                  background: card.assignees[0].color || '#e8a24a',
                }}
                  title={card.assignees[0].name}
                >
                  {card.assignees[0].name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}