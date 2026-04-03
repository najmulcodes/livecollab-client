import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, ChevronLeft, Users, Activity, Hash, Copy, Check, LogOut, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import useBoardStore from '../../store/boardStore';
import { disconnectSocket } from '../../socket/socket';
import { formatDistanceToNow } from 'date-fns';

function Avatar({ user, size = 'md', showOnline }) {
  const s = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm';
  return (
    <div className="relative flex-shrink-0">
      <div className={`${s} rounded-full flex items-center justify-center font-semibold text-white`} style={{ background: user.color || '#6366f1' }}>
        {user.name?.[0]?.toUpperCase()}
      </div>
      {showOnline && <div className="absolute -bottom-0.5 -right-0.5 dot-online" />}
    </div>
  );
}

export default function Sidebar({ workspace, onClose }) {
  const { user, logout } = useAuthStore();
  const { onlineUsers, activities } = useBoardStore();
  const [tab, setTab] = useState('members');
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const copyCode = () => {
    navigator.clipboard.writeText(workspace.inviteCode);
    setCopied(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/login');
  };

  const onlineIds = onlineUsers.map(u => u._id?.toString());

  return (
    <div className="w-72 flex flex-col glass border-r border-white/5 h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" fill="white" />
            </div>
            <span className="text-sm font-bold text-white">LiveCollab</span>
          </Link>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors lg:hidden">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: workspace.color + '20', border: `1px solid ${workspace.color}30` }}>
            {workspace.icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{workspace.name}</p>
            <p className="text-xs text-slate-400">{workspace.members?.length} members</p>
          </div>
        </div>

        {/* Invite code */}
        <button onClick={copyCode}
          className="mt-3 w-full flex items-center gap-2 bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl px-3 py-2 transition-all group">
          <Hash className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-mono text-sm text-slate-400 flex-1 text-left tracking-widest">{workspace.inviteCode}</span>
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        {[{ id: 'members', icon: Users, label: 'Members' }, { id: 'activity', icon: Activity, label: 'Activity' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-all border-b-2 ${tab === t.id ? 'text-brand-400 border-brand-500' : 'text-slate-500 hover:text-slate-300 border-transparent'}`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'members' ? (
          <div className="space-y-1">
            {/* Online users */}
            {onlineUsers.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-slate-500 font-medium px-2 mb-1.5">Online now</p>
                {onlineUsers.map(u => (
                  <div key={u._id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl">
                    <Avatar user={u} size="sm" showOnline />
                    <span className="text-sm text-white">{u.name}</span>
                    {u._id?.toString() === user._id?.toString() && (
                      <span className="text-xs text-brand-400 ml-auto">you</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-500 font-medium px-2 mb-1.5">All members</p>
            {workspace.members?.map(m => {
              const isOnline = onlineIds.includes(m._id?.toString());
              return (
                <div key={m._id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/3 transition-all">
                  <Avatar user={m} size="sm" showOnline={isOnline} />
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{m.name}</p>
                    <p className="text-xs text-slate-500 truncate">{m.email}</p>
                  </div>
                  {workspace.ownerId?._id === m._id && (
                    <span className="text-xs text-amber-400 ml-auto flex-shrink-0">owner</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No activity yet</p>
            ) : activities.map((a, i) => (
              <div key={a._id || i} className="px-2 py-2 rounded-xl hover:bg-white/3 transition-all">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold text-white mt-0.5"
                    style={{ background: a.userId?.color || '#6366f1' }}>
                    {a.userId?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <span className="font-medium text-white">{a.userId?.name || 'Someone'}</span>{' '}{a.action}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 transition-all">
          <Avatar user={user} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors p-1" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
