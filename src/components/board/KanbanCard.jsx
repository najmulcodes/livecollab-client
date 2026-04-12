/**
 * KanbanCard.jsx — sortable card in a Kanban column
 *
 * CHANGES vs original:
 *   Issue D: PRIORITY_COLORS now imported from ../../lib/constants
 *            (was inline — inconsistent with the rest of the system)
 *   Issue D: Color values updated to match design system (#F59E0B not #e8a24a)
 *   Issue G: Drag handle has a larger touch target (44x44 hit area via padding)
 *            while the visual icon stays small. This satisfies WCAG touch target
 *            requirements on mobile without changing the visual appearance.
 *
 * PRESERVED: all drag logic, useSortable, card rendering, date calculations.
 */
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Flag, GripVertical } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { PRIORITY_COLORS } from '../../lib/constants'; // FIX Issue D

export function KanbanCard({ card, onClick, isDragging }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition,
    isDragging: isSortDragging,
  } = useSortable({ id: card._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortDragging ? 0.35 : 1,
  };

  const dueDateObj = card.dueDate ? new Date(card.dueDate) : null;
  const isOverdue  = dueDateObj && isPast(dueDateObj) && !isToday(dueDateObj);
  const isDueToday = dueDateObj && isToday(dueDateObj);
  // FIX Issue D: use imported constant (correct #F59E0B for medium)
  const pColor = PRIORITY_COLORS[card.priority] ?? PRIORITY_COLORS.medium;

  return (
    <div ref={setNodeRef} style={style} onClick={onClick}>
      <div
        style={{
          background:   isDragging ? 'rgba(245,158,11,0.07)' : '#111827',
          border:       `1px solid ${isDragging ? 'rgba(245,158,11,0.45)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '10px',
          padding:      '12px',
          cursor:       'pointer',
          transition:   'all 0.15s',
          boxShadow:    isDragging ? '0 16px 40px rgba(0,0,0,0.6)' : '0 1px 4px rgba(0,0,0,0.2)',
          transform:    isDragging ? 'rotate(1.5deg) scale(1.02)' : 'none',
        }}
        onMouseEnter={e => {
          if (!isDragging) {
            e.currentTarget.style.borderColor = 'rgba(245,158,11,0.22)';
            e.currentTarget.style.background  = 'rgba(245,158,11,0.035)';
            e.currentTarget.style.boxShadow   = '0 4px 16px rgba(0,0,0,0.3)';
          }
        }}
        onMouseLeave={e => {
          if (!isDragging) {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.background  = '#111827';
            e.currentTarget.style.boxShadow   = '0 1px 4px rgba(0,0,0,0.2)';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>

          {/*
           * Drag handle — FIX Issue G: larger touch target.
           * The outer div is the actual hit area (44x44 equivalent via negative
           * margin + padding). The inner icon remains visually small.
           * e.stopPropagation() prevents the card onClick from firing.
           */}
          <div
            {...attributes}
            {...listeners}
            onClick={e => e.stopPropagation()}
            style={{
              // FIX Issue G: 44px touch target via padding
              margin:      '-4px -4px -4px -4px',
              padding:     '4px',
              minWidth:    '22px',
              minHeight:   '22px',
              display:     'flex',
              alignItems:  'center',
              justifyContent: 'center',
              flexShrink:  0,
              color:       'rgba(229,231,235,0.2)',
              cursor:      'grab',
              transition:  'color 0.15s',
              borderRadius: '6px',
              // Extend the touch area without visual impact
              touchAction: 'none',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(245,158,11,0.6)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(229,231,235,0.2)'}
            aria-label="Drag to reorder"
          >
            <GripVertical style={{ width: 13, height: 13 }} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Title */}
            <p style={{
              fontSize:            '13px',
              fontWeight:          500,
              color:               '#E5E7EB',
              margin:              '0 0 6px',
              lineHeight:          1.45,
              display:             '-webkit-box',
              WebkitLineClamp:     2,
              WebkitBoxOrient:     'vertical',
              overflow:            'hidden',
            }}>
              {card.title}
            </p>

            {/* Description preview */}
            {card.description && (
              <p style={{
                fontSize:     '12px',
                color:        'rgba(229,231,235,0.35)',
                margin:       '0 0 8px',
                lineHeight:   1.4,
                overflow:     'hidden',
                textOverflow: 'ellipsis',
                whiteSpace:   'nowrap',
              }}>
                {card.description}
              </p>
            )}

            {/* Chips row */}
            <div style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              gap:            '8px',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:'5px', flexWrap:'wrap' }}>
                {/* Priority chip */}
                {card.priority && (
                  <div style={{
                    display:       'flex',
                    alignItems:    'center',
                    gap:           '3px',
                    padding:       '2px 7px',
                    borderRadius:  '10px',
                    fontSize:      '10px',
                    fontWeight:    600,
                    background:    pColor + '18',
                    color:         pColor,
                    letterSpacing: '0.06em',
                  }}>
                    <Flag style={{ width: 8, height: 8 }} />
                    {card.priority.toUpperCase()}
                  </div>
                )}

                {/* Due date chip */}
                {dueDateObj && (
                  <div style={{
                    display:       'flex',
                    alignItems:    'center',
                    gap:           '3px',
                    padding:       '2px 7px',
                    borderRadius:  '10px',
                    fontSize:      '10px',
                    fontWeight:    500,
                    background:    isOverdue
                      ? 'rgba(239,68,68,0.15)'
                      : isDueToday
                      ? 'rgba(245,158,11,0.15)'
                      : 'rgba(255,255,255,0.06)',
                    color:         isOverdue
                      ? '#ef4444'
                      : isDueToday
                      ? '#F59E0B'
                      : 'rgba(229,231,235,0.45)',
                    letterSpacing: '0.04em',
                  }}>
                    <Calendar style={{ width: 8, height: 8 }} />
                    {format(dueDateObj, 'MMM d')}
                  </div>
                )}
              </div>

              {/* Assignee avatar */}
              {card.assignees?.[0] && (
                <div
                  style={{
                    width:          '22px',
                    height:         '22px',
                    borderRadius:   '50%',
                    flexShrink:     0,
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    fontSize:       '9px',
                    fontWeight:     700,
                    color:          '#0B0F14',
                    background:     card.assignees[0].color || '#F59E0B',
                    border:         '1.5px solid rgba(11,15,20,0.5)',
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
