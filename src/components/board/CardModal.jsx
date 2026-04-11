import { useState as useStateModal } from 'react';
import { X as XIcon, Calendar as CalIcon, Flag as FlagIcon, Trash2, Loader2 as Spin } from 'lucide-react';
import { format } from 'date-fns';
 
const PRIORITIES = [
  { value:'low',    label:'LOW',    color:'#10b981' },
  { value:'medium', label:'MED',    color:'#e8a24a' },
  { value:'high',   label:'HIGH',   color:'#ef4444' },
  { value:'urgent', label:'URGENT', color:'#dc2626' },
];
 
export function CardModal({ card, columns, members, onClose, onUpdate, onDelete }) {
  const [title,       setTitle]       = useStateModal(card.title);
  const [description, setDescription] = useStateModal(card.description || '');
  const [priority,    setPriority]    = useStateModal(card.priority || 'medium');
  const [dueDate,     setDueDate]     = useStateModal(card.dueDate ? format(new Date(card.dueDate), 'yyyy-MM-dd') : '');
  const [saving,      setSaving]      = useStateModal(false);
  const [deleting,    setDeleting]    = useStateModal(false);
 
  const column  = columns?.find(c => c._id === (card.column || card.columnId));
  const colColor = COLUMN_COLORS[column?._id] || column?.color || '#e8a24a';
 
  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onUpdate(card._id, { title: title.trim(), description, priority, dueDate: dueDate || null });
    setSaving(false);
    onClose();
  };
 
  const handleDelete = async () => {
    if (!confirm('Delete this card?')) return;
    setDeleting(true);
    await onDelete(card._id);
    setDeleting(false);
    onClose();
  };
 
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:200,
      display:'flex', alignItems:'center', justifyContent:'center', padding:'16px',
    }}>
      <div onClick={onClose} style={{
        position:'absolute', inset:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(8px)',
      }} />
      <div style={{
        position:'relative', width:'100%', maxWidth:'520px',
        background:'rgba(14,12,10,0.98)',
        border:'1px solid rgba(232,162,74,0.2)',
        borderRadius:'2px',
        boxShadow:'0 24px 80px rgba(0,0,0,0.8)',
        maxHeight:'90vh', overflowY:'auto',
        fontFamily:"'DM Sans',sans-serif",
      }}>
        <div style={{ padding:'24px' }}>
 
          {/* header */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px' }}>
            <div style={{ flex:1, marginRight:'12px' }}>
              {column && (
                <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'8px' }}>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', background: colColor }} />
                  <span style={{ fontSize:'10px', letterSpacing:'0.15em', color:'rgba(240,237,232,0.4)' }}>
                    {(column.title || column._id)?.toUpperCase()}
                  </span>
                </div>
              )}
              <input
                value={title} onChange={e => setTitle(e.target.value)}
                style={{
                  width:'100%', background:'transparent', border:'none',
                  borderBottom:'1px solid rgba(255,255,255,0.08)',
                  outline:'none', color:'#f0ede8', fontSize:'18px', fontWeight:500,
                  fontFamily:'inherit', paddingBottom:'6px', transition:'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor='rgba(232,162,74,0.4)'}
                onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'}
                placeholder="Card title"
              />
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'4px', flexShrink:0 }}>
              <button onClick={handleDelete} disabled={deleting} style={{
                background:'none', border:'none', cursor:'pointer', padding:'6px',
                color:'rgba(240,237,232,0.25)', display:'flex', alignItems:'center',
                borderRadius:'2px', transition:'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.color='#ef4444'; e.currentTarget.style.background='rgba(239,68,68,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.color='rgba(240,237,232,0.25)'; e.currentTarget.style.background='transparent'; }}
              >
                {deleting ? <Spin style={{ width:15, height:15, animation:'spin 1s linear infinite' }} /> : <Trash2 style={{ width:15, height:15 }} />}
              </button>
              <button onClick={onClose} style={{
                background:'none', border:'none', cursor:'pointer', padding:'6px',
                color:'rgba(240,237,232,0.25)', display:'flex', alignItems:'center',
                borderRadius:'2px', transition:'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.color='#f0ede8'; e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.color='rgba(240,237,232,0.25)'; e.currentTarget.style.background='transparent'; }}
              >
                <XIcon style={{ width:17, height:17 }} />
              </button>
            </div>
          </div>
 
          {/* description */}
          <div style={{ marginBottom:'20px' }}>
            <label style={{ display:'block', fontSize:'10px', letterSpacing:'0.15em', color:'rgba(240,237,232,0.35)', marginBottom:'8px' }}>
              DESCRIPTION
            </label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="Add a description..."
              style={{
                width:'100%', padding:'10px 14px', resize:'none',
                background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
                borderRadius:'2px', outline:'none', color:'#f0ede8',
                fontSize:'13px', fontFamily:'inherit', lineHeight:1.5, transition:'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor='rgba(232,162,74,0.3)'}
              onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.07)'}
            />
          </div>
 
          {/* priority + due date */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'20px' }}>
            <div>
              <label style={{ display:'block', fontSize:'10px', letterSpacing:'0.15em', color:'rgba(240,237,232,0.35)', marginBottom:'8px' }}>
                <FlagIcon style={{ width:10, height:10, display:'inline', marginRight:'4px' }} />
                PRIORITY
              </label>
              <div style={{ display:'flex', gap:'4px' }}>
                {PRIORITIES.map(p => (
                  <button key={p.value} onClick={() => setPriority(p.value)} style={{
                    flex:1, padding:'6px 4px', borderRadius:'2px',
                    fontSize:'10px', fontWeight:500, letterSpacing:'0.06em',
                    cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
                    background: priority === p.value ? `${p.color}20` : 'rgba(255,255,255,0.04)',
                    border: priority === p.value ? `1px solid ${p.color}50` : '1px solid rgba(255,255,255,0.08)',
                    color: priority === p.value ? p.color : 'rgba(240,237,232,0.35)',
                  }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'10px', letterSpacing:'0.15em', color:'rgba(240,237,232,0.35)', marginBottom:'8px' }}>
                <CalIcon style={{ width:10, height:10, display:'inline', marginRight:'4px' }} />
                DUE DATE
              </label>
              <input
                type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                style={{
                  width:'100%', padding:'8px 10px',
                  background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
                  borderRadius:'2px', outline:'none', color:'#f0ede8',
                  fontSize:'13px', fontFamily:'inherit', transition:'border-color 0.2s',
                  colorScheme:'dark',
                }}
                onFocus={e => e.target.style.borderColor='rgba(232,162,74,0.3)'}
                onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'}
              />
            </div>
          </div>
 
          {/* assignees */}
          {members?.length > 0 && (
            <div style={{ marginBottom:'24px' }}>
              <label style={{ display:'block', fontSize:'10px', letterSpacing:'0.15em', color:'rgba(240,237,232,0.35)', marginBottom:'8px' }}>
                ASSIGNEES
              </label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                {members.map(m => {
                  const memberUser = m.userId || m;
                  const isAssigned = card.assignees?.some(a => (a._id || a) === (memberUser._id || memberUser));
                  return (
                    <div key={memberUser._id} style={{
                      display:'flex', alignItems:'center', gap:'6px',
                      padding:'5px 10px', borderRadius:'2px', cursor:'default',
                      background: isAssigned ? 'rgba(232,162,74,0.12)' : 'rgba(255,255,255,0.04)',
                      border: isAssigned ? '1px solid rgba(232,162,74,0.3)' : '1px solid rgba(255,255,255,0.07)',
                    }}>
                      <div style={{
                        width:'18px', height:'18px', borderRadius:'50%',
                        background: memberUser.color || '#e8a24a',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:'9px', fontWeight:700, color:'#0b0b0c',
                      }}>
                        {memberUser.name?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontSize:'12px', color: isAssigned ? '#e8a24a' : 'rgba(240,237,232,0.5)' }}>
                        {memberUser.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
 
          {/* footer */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'10px', paddingTop:'16px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={onClose} style={{
              padding:'9px 18px', fontSize:'12px', letterSpacing:'0.06em',
              color:'rgba(240,237,232,0.4)', background:'none',
              border:'1px solid rgba(255,255,255,0.08)', borderRadius:'2px',
              cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color='#f0ede8'; e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.color='rgba(240,237,232,0.4)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; }}
            >
              CANCEL
            </button>
            <button onClick={handleSave} disabled={saving || !title.trim()} style={{
              padding:'9px 22px', fontSize:'12px', letterSpacing:'0.08em', fontWeight:600,
              color:'#0b0b0c', background: saving || !title.trim() ? 'rgba(232,162,74,0.5)' : '#e8a24a',
              border:'none', borderRadius:'2px',
              cursor: saving || !title.trim() ? 'not-allowed' : 'pointer',
              fontFamily:'inherit', display:'flex', alignItems:'center', gap:'6px',
              transition:'all 0.2s', boxShadow: saving ? 'none' : '0 4px 20px rgba(232,162,74,0.3)',
            }}>
              {saving && <Spin style={{ width:13, height:13, animation:'spin 1s linear infinite' }} />}
              {saving ? 'SAVING...' : 'SAVE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}