import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, X, Loader2 } from 'lucide-react';
 
const COLUMN_COLORS = {
  todo:       '#e8a24a',
  inprogress: '#3b82f6',
  review:     '#8b5cf6',
  done:       '#10b981',
};
 
export function KanbanColumn({ column, cards, onAddCard, onCardClick }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding]   = useState(false);
 
  const { setNodeRef, isOver } = useDroppable({ id: column._id });
  const accentColor = COLUMN_COLORS[column._id] || column.color || '#e8a24a';
 
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    await onAddCard(column._id, newTitle.trim());
    setNewTitle(''); setShowAdd(false); setAdding(false);
  };
 
  return (
    <div style={{ display:'flex', flexDirection:'column', width:'272px', flexShrink:0 }}>
      {/* column header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px', padding:'0 2px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: accentColor, boxShadow:`0 0 6px ${accentColor}50` }} />
          <span style={{ fontSize:'11px', fontWeight:500, color:'rgba(240,237,232,0.7)', letterSpacing:'0.1em' }}>
            {column.title?.toUpperCase() || column._id?.toUpperCase()}
          </span>
          <span style={{
            fontSize:'11px', color:'rgba(240,237,232,0.35)',
            background:'rgba(255,255,255,0.06)', borderRadius:'2px',
            padding:'1px 7px', letterSpacing:'0.04em',
          }}>{cards.length}</span>
        </div>
        <button onClick={() => setShowAdd(v => !v)} style={{
          background:'none', border:'none', cursor:'pointer', padding:'4px',
          color:'rgba(240,237,232,0.25)', display:'flex', alignItems:'center', transition:'color 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.color='#e8a24a'}
          onMouseLeave={e => e.currentTarget.style.color='rgba(240,237,232,0.25)'}
        >
          <Plus style={{ width:15, height:15 }} />
        </button>
      </div>
 
      {/* cards area */}
      <div ref={setNodeRef} style={{
        flex:1, borderRadius:'2px', padding:'8px',
        minHeight:'120px', display:'flex', flexDirection:'column', gap:'8px',
        transition:'all 0.2s',
        background: isOver ? `${accentColor}08` : 'rgba(255,255,255,0.02)',
        border: isOver ? `1px solid ${accentColor}30` : '1px solid rgba(255,255,255,0.05)',
      }}>
        <SortableContext items={cards.map(c => c._id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <KanbanCard key={card._id} card={card} onClick={() => onCardClick(card)} />
          ))}
        </SortableContext>
 
        {cards.length === 0 && !isOver && (
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'center',
            height:'60px', color:'rgba(240,237,232,0.15)',
            fontSize:'12px', letterSpacing:'0.08em',
          }}>
            DROP CARDS HERE
          </div>
        )}
      </div>
 
      {/* add card form */}
      {showAdd && (
        <div style={{ marginTop:'8px' }}>
          <form onSubmit={handleAdd} style={{
            background:'rgba(20,18,14,0.95)',
            border:'1px solid rgba(232,162,74,0.2)',
            borderRadius:'2px', padding:'12px',
          }}>
            <input
              autoFocus value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Card title..."
              style={{
                width:'100%', background:'transparent', border:'none',
                outline:'none', color:'#f0ede8', fontSize:'13px',
                fontFamily:'inherit', marginBottom:'10px',
              }}
            />
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <button type="submit" disabled={adding || !newTitle.trim()} style={{
                display:'flex', alignItems:'center', gap:'5px',
                padding:'6px 14px', fontSize:'11px', fontWeight:600,
                letterSpacing:'0.08em', background:'#e8a24a', border:'none',
                borderRadius:'2px', cursor: adding || !newTitle.trim() ? 'not-allowed' : 'pointer',
                color:'#0b0b0c', fontFamily:'inherit', opacity: !newTitle.trim() ? 0.5 : 1,
              }}>
                {adding ? <Loader2 style={{ width:11, height:11, animation:'spin 1s linear infinite' }} /> : null}
                ADD
              </button>
              <button type="button" onClick={() => { setShowAdd(false); setNewTitle(''); }} style={{
                background:'none', border:'none', cursor:'pointer', padding:'4px',
                color:'rgba(240,237,232,0.3)', display:'flex', alignItems:'center',
              }}>
                <X style={{ width:14, height:14 }} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}