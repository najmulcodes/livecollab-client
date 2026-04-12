/**
 * CardModal.jsx — card detail / edit modal
 *
 * FIXES applied:
 *   Issue 4: COLUMN_COLORS and PRIORITY_OPTIONS now imported from
 *            src/lib/constants.js (was undefined — ReferenceError on open)
 */
import { useState } from 'react';
import {
  X, Calendar, Flag, Trash2, Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { COLUMN_COLORS, PRIORITY_OPTIONS } from '../../lib/constants'; // FIX

export function CardModal({ card, columns, members, onClose, onUpdate, onDelete }) {
  const [title,       setTitle]       = useState(card.title ?? '');
  const [description, setDescription] = useState(card.description ?? '');
  const [priority,    setPriority]    = useState(card.priority ?? 'medium');
  const [dueDate,     setDueDate]     = useState(
    card.dueDate ? format(new Date(card.dueDate), 'yyyy-MM-dd') : ''
  );
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Resolve which column this card belongs to
  const column   = columns?.find(c => c._id === (card.column || card.columnId));
  const colColor = COLUMN_COLORS[column?._id] ?? column?.color ?? '#F59E0B';

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onUpdate(card._id, {
        title:       title.trim(),
        description: description.trim(),
        priority,
        dueDate:     dueDate || null,
      });
      onClose();
    } catch {
      // onUpdate already shows toast error
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this card? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await onDelete(card._id);
      onClose();
    } catch {
      // onDelete already shows toast error
    } finally {
      setDeleting(false);
    }
  };

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div style={styles.backdrop} onClick={handleBackdrop}>
      <div style={styles.modal} role="dialog" aria-modal="true">
        <div style={styles.body}>

          {/* ── Header ───────────────────────────────────────────────────── */}
          <div style={styles.headerRow}>
            <div style={{ flex: 1, marginRight: '12px' }}>
              {/* Column indicator */}
              {column && (
                <div style={styles.columnPill}>
                  <span style={{ ...styles.colDot, background: colColor }} />
                  <span style={styles.colLabel}>
                    {(column.title || column._id)?.toUpperCase()}
                  </span>
                </div>
              )}
              {/* Editable title */}
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Card title"
                style={styles.titleInput}
                onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                onBlur={e => e.target.style.borderColor  = 'rgba(255,255,255,0.08)'}
              />
            </div>

            {/* Action buttons */}
            <div style={styles.actions}>
              <button
                onClick={handleDelete}
                disabled={deleting}
                title="Delete card"
                style={{ ...styles.iconBtn, color: 'rgba(229,231,235,0.3)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(229,231,235,0.3)'; e.currentTarget.style.background = 'transparent'; }}
              >
                {deleting
                  ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />
                  : <Trash2  style={{ width: 15, height: 15 }} />
                }
              </button>
              <button
                onClick={onClose}
                title="Close"
                style={{ ...styles.iconBtn, color: 'rgba(229,231,235,0.3)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#E5E7EB'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(229,231,235,0.3)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <X style={{ width: 17, height: 17 }} />
              </button>
            </div>
          </div>

          {/* ── Description ──────────────────────────────────────────────── */}
          <div style={styles.field}>
            <label style={styles.label}>DESCRIPTION</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Add a description..."
              style={styles.textarea}
              onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.4)'}
              onBlur={e => e.target.style.borderColor  = 'rgba(255,255,255,0.08)'}
            />
          </div>

          {/* ── Priority + Due Date ───────────────────────────────────────── */}
          <div style={styles.twoCol}>
            {/* Priority */}
            <div style={styles.field}>
              <label style={styles.label}>
                <Flag style={{ width: 10, height: 10, display: 'inline', marginRight: '4px' }} />
                PRIORITY
              </label>
              <div style={styles.priorityRow}>
                {PRIORITY_OPTIONS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPriority(p.value)}
                    style={{
                      ...styles.priorityBtn,
                      background: priority === p.value ? `${p.color}20` : 'rgba(255,255,255,0.04)',
                      border:     priority === p.value ? `1px solid ${p.color}60` : '1px solid rgba(255,255,255,0.08)',
                      color:      priority === p.value ? p.color : 'rgba(229,231,235,0.35)',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Due date */}
            <div style={styles.field}>
              <label style={styles.label}>
                <Calendar style={{ width: 10, height: 10, display: 'inline', marginRight: '4px' }} />
                DUE DATE
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={styles.dateInput}
                onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.4)'}
                onBlur={e => e.target.style.borderColor  = 'rgba(255,255,255,0.08)'}
              />
            </div>
          </div>

          {/* ── Assignees (display only) ──────────────────────────────────── */}
          {members?.length > 0 && (
            <div style={{ ...styles.field, marginBottom: '24px' }}>
              <label style={styles.label}>ASSIGNEES</label>
              <div style={styles.assigneeRow}>
                {members.map(m => {
                  const mu         = m.userId || m;
                  const isAssigned = (card.assignees || []).some(
                    a => String(a._id || a) === String(mu._id || mu)
                  );
                  return (
                    <div
                      key={String(mu._id || mu)}
                      style={{
                        ...styles.assigneeChip,
                        background: isAssigned ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                        border:     isAssigned ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <div style={{
                        ...styles.assigneeAvatar,
                        background: mu.color || '#F59E0B',
                      }}>
                        {mu.name?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontSize: '12px', color: isAssigned ? '#F59E0B' : 'rgba(229,231,235,0.5)' }}>
                        {mu.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <div style={styles.footer}>
            <button onClick={onClose} style={styles.cancelBtn}>
              CANCEL
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              style={{
                ...styles.saveBtn,
                background: (saving || !title.trim()) ? 'rgba(245,158,11,0.5)' : '#F59E0B',
                cursor:     (saving || !title.trim()) ? 'not-allowed' : 'pointer',
                boxShadow:  saving ? 'none' : '0 4px 20px rgba(245,158,11,0.3)',
              }}
            >
              {saving && <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
              {saving ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
          </div>

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  backdrop: {
    position:       'fixed',
    inset:          0,
    zIndex:         200,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        '16px',
    background:     'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(8px)',
  },
  modal: {
    position:    'relative',
    width:       '100%',
    maxWidth:    '520px',
    background:  '#111827',
    border:      '1px solid rgba(245,158,11,0.2)',
    borderRadius: '12px',
    boxShadow:   '0 24px 80px rgba(0,0,0,0.8)',
    maxHeight:   '90vh',
    overflowY:   'auto',
    fontFamily:  "'DM Sans', sans-serif",
  },
  body: { padding: '24px' },

  // Header
  headerRow: {
    display:        'flex',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    marginBottom:   '20px',
  },
  columnPill: {
    display:     'flex',
    alignItems:  'center',
    gap:         '6px',
    marginBottom:'8px',
  },
  colDot: {
    display:      'block',
    width:        '6px',
    height:       '6px',
    borderRadius: '50%',
  },
  colLabel: {
    fontSize:      '10px',
    letterSpacing: '0.15em',
    color:         'rgba(229,231,235,0.45)',
    fontWeight:    500,
  },
  titleInput: {
    width:        '100%',
    background:   'transparent',
    border:       'none',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    outline:      'none',
    color:        '#E5E7EB',
    fontSize:     '18px',
    fontWeight:   500,
    fontFamily:   'inherit',
    paddingBottom: '6px',
    transition:   'border-color 0.2s',
  },
  actions: {
    display:    'flex',
    alignItems: 'center',
    gap:        '4px',
    flexShrink: 0,
  },
  iconBtn: {
    background:   'transparent',
    border:       'none',
    cursor:       'pointer',
    padding:      '6px',
    display:      'flex',
    alignItems:   'center',
    borderRadius: '8px',
    transition:   'all 0.2s',
  },

  // Fields
  field: { marginBottom: '18px' },
  label: {
    display:       'block',
    fontSize:      '10px',
    letterSpacing: '0.15em',
    color:         'rgba(229,231,235,0.4)',
    marginBottom:  '8px',
    fontWeight:    600,
  },
  textarea: {
    width:        '100%',
    padding:      '10px 14px',
    resize:       'vertical',
    background:   'rgba(255,255,255,0.04)',
    border:       '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    outline:      'none',
    color:        '#E5E7EB',
    fontSize:     '13px',
    fontFamily:   'inherit',
    lineHeight:   1.6,
    transition:   'border-color 0.2s',
    minHeight:    '80px',
    boxSizing:    'border-box',
  },

  // Priority / due date row
  twoCol: {
    display:             'grid',
    gridTemplateColumns: '1fr 1fr',
    gap:                 '16px',
    marginBottom:        '18px',
  },
  priorityRow: {
    display: 'flex',
    gap:     '4px',
  },
  priorityBtn: {
    flex:          1,
    padding:       '6px 4px',
    borderRadius:  '6px',
    fontSize:      '9px',
    fontWeight:    700,
    letterSpacing: '0.06em',
    cursor:        'pointer',
    fontFamily:    'inherit',
    transition:    'all 0.15s',
  },
  dateInput: {
    width:        '100%',
    padding:      '8px 10px',
    background:   'rgba(255,255,255,0.04)',
    border:       '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    outline:      'none',
    color:        '#E5E7EB',
    fontSize:     '13px',
    fontFamily:   'inherit',
    transition:   'border-color 0.2s',
    colorScheme:  'dark',
    boxSizing:    'border-box',
  },

  // Assignees
  assigneeRow: {
    display:   'flex',
    flexWrap:  'wrap',
    gap:       '8px',
  },
  assigneeChip: {
    display:      'flex',
    alignItems:   'center',
    gap:          '6px',
    padding:      '5px 10px',
    borderRadius: '20px',
  },
  assigneeAvatar: {
    width:          '18px',
    height:         '18px',
    borderRadius:   '50%',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       '9px',
    fontWeight:     700,
    color:          '#0B0F14',
  },

  // Footer
  footer: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'flex-end',
    gap:            '10px',
    paddingTop:     '16px',
    borderTop:      '1px solid rgba(255,255,255,0.06)',
  },
  cancelBtn: {
    padding:       '9px 18px',
    fontSize:      '12px',
    letterSpacing: '0.08em',
    fontWeight:    500,
    color:         'rgba(229,231,235,0.5)',
    background:    'none',
    border:        '1px solid rgba(255,255,255,0.1)',
    borderRadius:  '8px',
    cursor:        'pointer',
    fontFamily:    'inherit',
    transition:    'all 0.2s',
  },
  saveBtn: {
    padding:       '9px 22px',
    fontSize:      '12px',
    letterSpacing: '0.08em',
    fontWeight:    700,
    color:         '#0B0F14',
    border:        'none',
    borderRadius:  '8px',
    fontFamily:    'inherit',
    display:       'flex',
    alignItems:    'center',
    gap:           '6px',
    transition:    'all 0.2s',
  },
};
