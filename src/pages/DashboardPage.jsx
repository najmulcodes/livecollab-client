import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Plus, Zap, LogOut, Users, Link2, Loader2, X, Hash } from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import { disconnectSocket, initSocket } from '../socket/socket';

const ICONS = ['🚀','⚡','🎯','💡','🔥','🌊','🎨','🏗️','📊','🤝'];
const COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#14b8a6'];

function Avatar({ user, size = 'md' }) {
  const s = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div className={`${s} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0`} style={{ background: user.color || '#6366f1' }}>
      {user.name?.[0]?.toUpperCase()}
    </div>
  );
}

function CreateModal({ onClose, onSuccess }) {
  const [tab, setTab] = useState('create');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [icon, setIcon] = useState('🚀');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Workspace name required');
    setLoading(true);
    try {
      const { data } = await api.post('/workspaces', { name: name.trim(), description, color, icon });
      toast.success('Workspace created!');
      onSuccess(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally { setLoading(false); }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return toast.error('Invite code required');
    setLoading(true);
    try {
      const { data } = await api.post('/workspaces/join', { inviteCode: inviteCode.trim().toUpperCase() });
      toast.success(`Joined ${data.name}!`);
      onSuccess(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid invite code');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl w-full max-w-md p-6 shadow-modal animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Add Workspace</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex bg-white/5 rounded-xl p-1 mb-6">
          {['create', 'join'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-brand-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
              {t === 'create' ? 'Create New' : 'Join with Code'}
            </button>
          ))}
        </div>

        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Workspace Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
                placeholder="My Awesome Team" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
              <input value={description} onChange={e => setDescription(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
                placeholder="What's this workspace for?" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Icon</label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map(ic => (
                  <button key={ic} type="button" onClick={() => setIcon(ic)}
                    className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all ${icon === ic ? 'bg-brand-500 ring-2 ring-brand-400' : 'bg-white/5 hover:bg-white/10'}`}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Color</label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1e1b4b] scale-110' : ''}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {loading ? 'Creating...' : 'Create Workspace'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Invite Code</label>
              <input value={inviteCode} onChange={e => setInviteCode(e.target.value)} required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all font-mono tracking-widest uppercase"
                placeholder="XXXXXXXX" maxLength={8} />
              <p className="text-slate-500 text-xs mt-1">Ask your team for the 8-character code</p>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              {loading ? 'Joining...' : 'Join Workspace'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (token) initSocket(token);
    return () => disconnectSocket();
  }, [token]);

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api.get('/workspaces').then(r => r.data),
  });

  const handleSuccess = (ws) => {
    qc.invalidateQueries({ queryKey: ['workspaces'] });
    setShowModal(false);
    navigate(`/workspace/${ws._id}`);
  };

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0f0e1a]">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="text-lg font-bold text-white">LiveCollab</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Avatar user={user} size="sm" />
              <span className="text-sm text-slate-300 hidden sm:block">{user.name}</span>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Your Workspaces</h1>
            <p className="text-slate-400">Collaborate with your teams in real-time</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-brand-500/25">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:block">New Workspace</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-xl font-semibold text-white mb-2">No workspaces yet</h2>
            <p className="text-slate-400 mb-6">Create your first workspace to start collaborating</p>
            <button onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl transition-all">
              <Plus className="w-4 h-4" /> Create Workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map(ws => (
              <button key={ws._id} onClick={() => navigate(`/workspace/${ws._id}`)}
                className="glass-light rounded-2xl p-5 text-left hover:border-brand-500/30 transition-all duration-200 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: ws.color + '20', border: `1px solid ${ws.color}30` }}>
                    {ws.icon}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                    <Users className="w-3.5 h-3.5" />
                    {ws.members?.length}
                  </div>
                </div>
                <h3 className="font-semibold text-white mb-1 group-hover:text-brand-300 transition-colors">{ws.name}</h3>
                {ws.description && <p className="text-slate-400 text-sm line-clamp-2 mb-3">{ws.description}</p>}
                <div className="flex items-center gap-1 mt-3">
                  {ws.members?.slice(0, 5).map(m => (
                    <div key={m._id} className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white -ml-1 first:ml-0 border border-[#0f0e1a]" style={{ background: m.color }}>
                      {m.name?.[0]}
                    </div>
                  ))}
                  {ws.members?.length > 5 && <span className="text-xs text-slate-400 ml-1">+{ws.members.length - 5}</span>}
                </div>
                <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500">
                  <Hash className="w-3 h-3" />
                  <span className="font-mono">{ws.inviteCode}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {showModal && <CreateModal onClose={() => setShowModal(false)} onSuccess={handleSuccess} />}
    </div>
  );
}
