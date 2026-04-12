/**
 * KanbanColumn.jsx — droppable column with card list and add form
 *
 * FIXES applied:
 *   Issue 8: Column now uses display:flex + flexDirection:column with
 *            flex:1 on the cards area, ensuring the drop zone fills
 *            the available height. alignItems:'stretch' in KanbanBoard
 *            (parent) makes height:100% work correctly here.
 *   Issue 4: COLUMN_COLORS imported from constants (not inline)
 */
import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, X, Loader2 } from 'lucide-react';
import { KanbanCard } from './KanbanCard';
import { COLUMN_COLORS } from '../../lib/constants';

export function KanbanColumn({ column, cards, onAddCard, onCardClick }) {
  const [showAdd,  setShowAdd]  = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [adding,   setAdding]   = useState(false);

  const { setNodeRef, isOver } = useDroppable({ id: column._id });
  const accent = COLUMN_COLORS[column._id] || column.color || '#F59E0B';

  const handleAdd = async (e) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    try {
      await onAddCard(column._id, title);
      setNewTitle('');
      setShowAdd(false);
    } finally {
      setAdding(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setShowAdd(false); setNewTitle(''); }
  };

  return (
    /**
     * FIX Issue 8: Outer div uses display:flex + flexDirection:column.
     * With the parent using alignItems:'stretch', this div fills the
     * full column height. Cards area (flex:1) takes remaining space.
     */
    <div style={styles.outer}>

      {/* ── Column header ──────────────────────────────────────────────── */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={{ ...styles.dot, background: accent, boxShadow: `0 0 8px ${accent}50` }} />
          <span style={styles.title}>
            {column.title?.toUpperCase() || column._id?.toUpperCase()}
          </span>
          <span style={styles.count}>{cards.length}</span>
        </div>

        <button
          onClick={() => setShowAdd(v => !v)}
          style={{
            ...styles.addBtn,
            color:      showAdd ? '#F59E0B' : 'rgba(229,231,235,0.3)',
            background: showAdd ? 'rgba(245,158,11,0.1)' : 'none',
          }}
          title="Add card"
        >
          <Plus style={{ width: 15, height: 15 }} />
        </button>
      </div>

      {/* ── Cards area (droppable) ──────────────────────────────────────── */}
      <div
        ref={setNodeRef}
        style={{
          ...styles.cardsArea,
          background: isOver ? `${accent}08` : 'rgba(255,255,255,0.02)',
          border:     isOver
            ? `1px solid ${accent}30`
            : '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <SortableContext
          items={cards.map(c => c._id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map(card => (
            <KanbanCard
              key={card._id}
              card={card}
              onClick={() => onCardClick(card)}
            />
          ))}
        </SortableContext>

        {/* Empty state — only show when not dragging over and no add form */}
        {cards.length === 0 && !isOver && !showAdd && (
          <div style={styles.empty}>
            <div style={{
              ...styles.emptyIcon,
              borderColor: `${accent}30`,
            }}>
              <Plus style={{ width: 12, height: 12, color: `${accent}40` }} />
            </div>
            <span>DROP HERE</span>
          </div>
        )}
      </div>

      {/* ── Add card form ───────────────────────────────────────────────── */}
      {showAdd && (
        <div style={styles.addForm}>
          <form onSubmit={handleAdd}>
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Card title..."
              maxLength={120}
              style={styles.addInput}
            />
            <div style={styles.addActions}>
              <button
                type="submit"
                disabled={adding || !newTitle.trim()}
                style={{
                  ...styles.addSubmit,
                  background: (adding || !newTitle.trim())
                    ? 'rgba(245,158,11,0.4)' : '#F59E0B',
                  cursor: (adding || !newTitle.trim()) ? 'not-allowed' : 'pointer',
                }}
              >
                {adding && <Loader2 style={{ width: 11, height: 11, animation: 'spin 1s linear infinite' }} />}
                ADD
              </button>
              <button
                type="button"
                onClick={() => { setShowAdd(false); setNewTitle(''); }}
                style={styles.cancelBtn}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  // FIX Issue 8: flex column so cards area can grow
  outer: {
    display:       'flex',
    flexDirection: 'column',
    width:         '272px',
    flexShrink:    0,
    // height: '100%' is no longer needed because parent uses alignItems:'stretch'
    // which already makes this element fill the cross-axis (full height)
  },
  header: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   '10px',
    padding:        '0 2px',
    flexShrink:     0,
  },
  headerLeft: {
    display:    'flex',
    alignItems: 'center',
    gap:        '8px',
  },
  dot: {
    display:      'block',
    width:        '8px',
    height:       '8px',
    borderRadius: '50%',
    flexShrink:   0,
  },
  title: {
    fontSize:      '11px',
    fontWeight:    600,
    color:         'rgba(229,231,235,0.8)',
    letterSpacing: '0.12em',
  },
  count: {
    fontSize:      '11px',
    color:         'rgba(229,231,235,0.4)',
    background:    'rgba(255,255,255,0.07)',
    borderRadius:  '10px',
    padding:       '1px 8px',
    letterSpacing: '0.04em',
    fontWeight:    500,
  },
  addBtn: {
    border:       'none',
    cursor:       'pointer',
    padding:      '5px',
    display:      'flex',
    alignItems:   'center',
    borderRadius: '6px',
    transition:   'all 0.2s',
  },
  // FIX Issue 8: flex:1 makes the drop zone fill remaining column height
  cardsArea: {
    flex:           1,           // fills remaining height in the flex column
    borderRadius:   '10px',
    padding:        '8px',
    display:        'flex',
    flexDirection:  'column',
    gap:            '8px',
    overflowY:      'auto',
    transition:     'all 0.2s',
    minHeight:      '80px',     // always at least draggable
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(245,158,11,0.15) transparent',
  },
  empty: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    flex:           1,
    color:          'rgba(229,231,235,0.15)',
    fontSize:       '11px',
    letterSpacing:  '0.1em',
    gap:            '8px',
    userSelect:     'none',
  },
  emptyIcon: {
    width:        '28px',
    height:       '28px',
    borderRadius: '6px',
    border:       '1px dashed',
    display:      'flex',
    alignItems:   'center',
    justifyContent: 'center',
  },
  addForm: {
    marginTop: '8px',
    flexShrink: 0,
  },
  addInput: {
    width:       '100%',
    background:  '#111827',
    border:      '1px solid rgba(245,158,11,0.25)',
    borderRadius: '10px 10px 0 0',
    outline:     'none',
    color:       '#E5E7EB',
    fontSize:    '13px',
    fontFamily:  'inherit',
    padding:     '10px 12px',
    boxSizing:   'border-box',
  },
  addActions: {
    display:        'flex',
    alignItems:     'center',
    gap:            '8px',
    padding:        '8px 10px',
    background:     '#111827',
    border:         '1px solid rgba(245,158,11,0.25)',
    borderTop:      'none',
    borderRadius:   '0 0 10px 10px',
  },
  addSubmit: {
    display:      'flex',
    alignItems:   'center',
    gap:          '5px',
    padding:      '6px 14px',
    fontSize:     '11px',
    fontWeight:   700,
    letterSpacing: '0.08em',
    border:       'none',
    borderRadius: '7px',
    color:        '#0B0F14',
    fontFamily:   'inherit',
    transition:   'all 0.15s',
  },
  cancelBtn: {
    background:   'none',
    border:       'none',
    cursor:       'pointer',
    padding:      '4px',
    color:        'rgba(229,231,235,0.35)',
    display:      'flex',
    alignItems:   'center',
    borderRadius: '6px',
    transition:   'all 0.2s',
  },
};
