import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Zap, Plus, LogOut, Hash, Users, ArrowRight,
  Loader2, X, Sparkles, FolderOpen
} from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import { disconnectSocket } from '../socket/socket';

const ICONS = ['🚀', '💡', '🎯', '🔥', '⚡', '🛠️', '📦', '🌊', '🎨', '🧠', '📊', '🌿'];
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

function Avatar({ user, size = 8 }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}
      style={{ background: user.color || '#6366f1' }}
    >
      {user.name?.[0]?.toUpperCase()}
    </div>
  );
}

function WorkspaceCard({ ws, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group text-left w-full glass-light rounded-2xl p-5 border border-white/5 hover:border-brand-500/40 hover:shadow-card-hover transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: ws.color + '20', border: `1px solid ${ws.color}30` }}
        >
          {ws.icon}
        </div>
        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
      </div>
      <p className="text-sm font-semibold text-white mb-1 truncate">{ws.name}</p>
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Users className="w-3.5 h-3.5" />
        {ws.members?.length || 1} member{ws.members?.length !== 1 ? 's' : ''}
      </div>
    </button>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl w-full max-w-md shadow-modal animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function CreateModal({ onClose }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🚀');
  const [color, setColor] = useState('#6366f1');
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (body) => api.post('/workspaces', body).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries(['workspaces']);
      toast.success('Workspace created!');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    mutation.mutate({ name: name.trim(), icon, color });
  };

  return (
    <Modal title="New Workspace" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Name</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
            placeholder="e.g. Product Sprint"
            maxLength={40}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Icon</label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map(ic => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${icon === ic ? 'bg-brand-500/30 ring-1 ring-brand-500' : 'bg-white/5 hover:bg-white/10'}`}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Color</label>
          <div className="flex gap-2">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1e1b4b]' : ''}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending || !name.trim()}
          className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {mutation.isPending ? 'Creating...' : 'Create Workspace'}
        </button>
      </form>
    </Modal>
  );
}

function JoinModal({ onClose }) {
  const [code, setCode] = useState('');
  const navigate = useNavigate();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (inviteCode) => api.post(`/workspaces/join/${inviteCode}`).then(r => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries(['workspaces']);
      toast.success(`Joined ${data.workspace.name}!`);
      onClose();
      navigate(`/workspace/${data.workspace._id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Invalid invite code'),
  });

  return (
    <Modal title="Join Workspace" onClose={onClose}>
      <div className="space-y-5">
        <p className="text-sm text-slate-400">Enter the 8-character invite code shared by your teammate.</p>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Invite Code</label>
          <input
            autoFocus
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().slice(0, 8))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all font-mono tracking-widest text-center text-lg"
            placeholder="XXXXXXXX"
            maxLength={8}
          />
        </div>
        <button
          onClick={() => mutation.mutate(code)}
          disabled={mutation.isPending || code.length < 4}
          className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
          {mutation.isPending ? 'Joining...' : 'Join Workspace'}
        </button>
      </div>
    </Modal>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);

  // ✅ FIX: extract .workspaces from response
  const { data, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api.get('/workspaces').then(r => r.data),
  });
  const workspaces = data?.workspaces ?? [];

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0f0e1a]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-60 -left-60 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <header className="relative border-b border-white/5 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">LiveCollab</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 pr-3 border-r border-white/10">
              <Avatar user={user} size={7} />
              <span className="text-sm text-slate-300 font-medium hidden sm:block">{user.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-400/10"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs text-brand-400 font-medium tracking-widest uppercase mb-1">Your workspaces</p>
            <h1 className="text-2xl font-bold text-white">
              {workspaces.length === 0 ? "Let's get started" : `Good to see you, ${user.name.split(' ')[0]}`}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setModal('join')}
              className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-xl transition-all"
            >
              <Hash className="w-4 h-4" /> Join
            </button>
            <button
              onClick={() => setModal('create')}
              className="flex items-center gap-1.5 text-sm text-white bg-brand-500 hover:bg-brand-600 px-4 py-2 rounded-xl transition-all shadow-lg shadow-brand-500/25"
            >
              <Plus className="w-4 h-4" /> New
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-white/3 animate-pulse" />
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-2">
              <FolderOpen className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-300 font-medium">No workspaces yet</p>
            <p className="text-sm text-slate-500 max-w-xs">Create your first workspace or join one with an invite code from a teammate.</p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setModal('join')}
                className="text-sm text-slate-300 border border-white/10 px-4 py-2 rounded-xl hover:border-white/20 transition-all"
              >
                Join with code
              </button>
              <button
                onClick={() => setModal('create')}
                className="text-sm text-white bg-brand-500 hover:bg-brand-600 px-4 py-2 rounded-xl transition-all"
              >
                Create workspace
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map(ws => (
              <WorkspaceCard
                key={ws._id}
                ws={ws}
                onClick={() => navigate(`/workspace/${ws._id}`)}
              />
            ))}
            <button
              onClick={() => setModal('create')}
              className="group h-full min-h-[110px] rounded-2xl border border-dashed border-white/10 hover:border-brand-500/40 flex flex-col items-center justify-center gap-2 text-slate-600 hover:text-brand-400 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs font-medium">New workspace</span>
            </button>
          </div>
        )}
      </main>

      {modal === 'create' && <CreateModal onClose={() => setModal(null)} />}
      {modal === 'join' && <JoinModal onClose={() => setModal(null)} />}
    </div>
  );
}