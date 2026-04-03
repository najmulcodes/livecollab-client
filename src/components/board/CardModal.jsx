import { useState } from 'react';
import { X, Calendar, Flag, Tag, User, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
];

export default function CardModal({ card, columns, members, onClose, onUpdate, onDelete }) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [priority, setPriority] = useState(card.priority || 'medium');
  const [dueDate, setDueDate] = useState(card.dueDate ? format(new Date(card.dueDate), 'yyyy-MM-dd') : '');
  const [assignee, setAssignee] = useState(card.assignee?._id || card.assignee || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const column = columns?.find(c => c._id === card.columnId);
  const pri = PRIORITIES.find(p => p.value === priority);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onUpdate(card._id, { title: title.trim(), description, priority, dueDate: dueDate || null, assignee: assignee || null });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl w-full max-w-lg shadow-modal animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex-1">
              {column && (
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: column.color }} />
                  <span className="text-xs text-slate-400 font-medium">{column.title}</span>
                </div>
              )}
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="w-full bg-transparent text-xl font-bold text-white focus:outline-none border-b border-transparent focus:border-brand-500 pb-1 transition-all"
                placeholder="Card title" />
            </div>
            <div className="flex items-center gap-2 ml-3">
              <button onClick={handleDelete} disabled={deleting}
                className="text-slate-500 hover:text-red-400 transition-colors p-1.5 hover:bg-red-400/10 rounded-lg">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="mb-5">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-2">
              Description
            </label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all resize-none text-sm"
              placeholder="Add a description..." />
          </div>

          {/* Meta fields */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* Priority */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-2">
                <Flag className="w-3.5 h-3.5" /> Priority
              </label>
              <div className="flex gap-1.5">
                {PRIORITIES.map(p => (
                  <button key={p.value} onClick={() => setPriority(p.value)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all border ${priority === p.value ? 'text-white border-transparent' : 'text-slate-400 border-white/10 hover:border-white/20'}`}
                    style={priority === p.value ? { background: p.color + '30', borderColor: p.color + '60', color: p.color } : {}}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-2">
                <Calendar className="w-3.5 h-3.5" /> Due Date
              </label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500 transition-all" />
            </div>
          </div>

          {/* Assignee */}
          {members && members.length > 0 && (
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-2">
                <User className="w-3.5 h-3.5" /> Assignee
              </label>
              <select value={assignee} onChange={e => setAssignee(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 transition-all">
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3 pt-4 border-t border-white/5">
            <div className="text-xs text-slate-500">
              {card.createdBy && `Created by ${card.createdBy.name || 'Unknown'}`}
            </div>
            <div className="flex gap-2 ml-auto">
              <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">Cancel</button>
              <button onClick={handleSave} disabled={saving || !title.trim()}
                className="px-4 py-2 text-sm bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium rounded-xl transition-all flex items-center gap-2">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
