import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Menu, ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import useBoardStore from '../store/boardStore';
import { useWorkspaceSocket } from '../hooks/useSocket';
import { initSocket } from '../socket/socket';
import KanbanBoard from '../components/board/KanbanBoard';
import Sidebar from '../components/layout/Sidebar';

export default function WorkspacePage() {
  const { id } = useParams();
  const { user, token } = useAuthStore();
  const { setBoard, setActivities } = useBoardStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Init socket if not already
  useEffect(() => {
    if (token) initSocket(token);
  }, [token]);

  // Attach socket listeners for this workspace
  useWorkspaceSocket(id);

  const { data: workspace, isLoading: wsLoading, error: wsError } = useQuery({
    queryKey: ['workspace', id],
    queryFn: () => api.get(`/workspaces/${id}`).then(r => r.data),
  });

  const { data: board, isLoading: boardLoading } = useQuery({
    queryKey: ['board', id],
    queryFn: () => api.get(`/boards/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const { data: activities } = useQuery({
    queryKey: ['activities', id],
    queryFn: () => api.get(`/activities/${id}`).then(r => r.data),
    enabled: !!id,
    refetchInterval: 30000,
  });

  useEffect(() => { if (board) setBoard(board); }, [board]);
  useEffect(() => { if (activities) setActivities(activities); }, [activities]);

  const navigate = useNavigate();

  if (wsLoading || boardLoading) return (
    <div className="min-h-screen bg-[#0f0e1a] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
    </div>
  );

  if (wsError) return (
    <div className="min-h-screen bg-[#0f0e1a] flex flex-col items-center justify-center gap-4">
      <p className="text-red-400">Failed to load workspace</p>
      <button onClick={() => navigate('/')} className="text-brand-400 hover:text-brand-300 flex items-center gap-2 text-sm">
        <ArrowLeft className="w-4 h-4" /> Go back
      </button>
    </div>
  );

  return (
    <div className="h-screen bg-[#0f0e1a] flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 h-full">
            <Sidebar workspace={workspace} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar workspace={workspace} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-white">{workspace?.name}</h1>
            <p className="text-xs text-slate-500">Task Board</p>
          </div>
        </div>

        {/* Board */}
        <div className="flex-1 overflow-hidden flex">
          <KanbanBoard workspaceId={id} members={workspace?.members || []} />
        </div>
      </div>
    </div>
  );
}
