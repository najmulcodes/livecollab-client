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
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { setBoard, setActivities } = useBoardStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (token) initSocket(token);
  }, [token]);

  useWorkspaceSocket(id);

  // ✅ FIX: extract .workspace from response
  const { data: wsData, isLoading: wsLoading, error: wsError } = useQuery({
    queryKey: ['workspace', id],
    queryFn: () => api.get(`/workspaces/${id}`).then(r => r.data),
    enabled: !!id,
  });
  const workspace = wsData?.workspace ?? null;

  // ✅ FIX: extract .cards from response
  const { data: boardData, isLoading: boardLoading } = useQuery({
    queryKey: ['board', id],
    queryFn: () => api.get(`/boards/${id}/cards`).then(r => r.data),
    enabled: !!id,
  });
  const cards = boardData?.cards ?? [];

  // ✅ FIX: extract .activities from response (handles both array and object)
  const { data: activitiesData } = useQuery({
    queryKey: ['activities', id],
    queryFn: () => api.get(`/activities/${id}`).then(r => r.data),
    enabled: !!id,
    refetchInterval: 30_000,
  });
  const activities = Array.isArray(activitiesData)
    ? activitiesData
    : (activitiesData?.activities ?? []);

  // Sync into Zustand store
  useEffect(() => {
    if (cards.length > 0) setBoard({ cards });
  }, [cards, setBoard]);

  useEffect(() => {
    if (activities.length > 0) setActivities(activities);
  }, [activities, setActivities]);

  if (wsLoading || boardLoading) {
    return (
      <div className="min-h-screen bg-[#0f0e1a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (wsError) {
    return (
      <div className="min-h-screen bg-[#0f0e1a] flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">Failed to load workspace</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-brand-400 hover:text-brand-300 flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Go back
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0f0e1a] flex overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 h-full">
            <Sidebar workspace={workspace} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="hidden lg:flex">
        <Sidebar workspace={workspace} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-white">{workspace?.name}</h1>
            <p className="text-xs text-slate-500">Task Board</p>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <KanbanBoard workspaceId={id} members={workspace?.members || []} />
        </div>
      </div>
    </div>
  );
}