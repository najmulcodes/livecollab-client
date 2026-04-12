/**
 * Sidebar.jsx — workspace sidebar: members, activity, role management
 *
 * CHANGES vs previous version:
 *   Issue E: Added per-member action menu (⋮) visible to owner/admin only.
 *
 *   OWNER can:
 *     - Promote member → admin  (PATCH /workspaces/:id/members/:uid { role:'admin' })
 *     - Demote admin → member   (PATCH /workspaces/:id/members/:uid { role:'member' })
 *     - Remove any non-owner member
 *   ADMIN can:
 *     - Remove regular members (not owner, not other admins)
 *   MEMBER: no actions
 *
 *   The action button only renders when the current user has any
 *   applicable permission over the target member. The workspace owner
 *   can never be targeted.
 *
 *   API assumed (add to backend if not present):
 *     PATCH  /workspaces/:id/members/:userId   body: { role: 'admin'|'member' }
 *     DELETE /workspaces/:id/members/:userId
 *
 * PRESERVED: all existing sidebar logic, socket presence, activity tab, etc.
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Users, Activity, Hash, Copy, Check,
  LogOut, Trash2, LogIn, Crown, Shield,
  MoreVertical, UserMinus, UserCheck, ChevronDown,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useAuthStore  from '../../store/authStore';
import useBoardStore from '../../store/boardStore';
import { disconnectSocket } from '../../socket/socket';
import api  from '../../lib/api';
import Logo from '../ui/Logo';

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ user, size = 'md', isOnline }) {
  const dim = size === 'sm' ? 28 : 34;
  return (
    <div style={{ position:'relative', flexShrink:0 }}>
      <div style={{ width:`${dim}px`,height:`${dim}px`,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize: size==='sm'?'11px':'13px',fontWeight:700,color:'#0B0F14',background: user?.color||'#F59E0B',border:`1.5px solid ${(user?.color||'#F59E0B')}40` }}>
        {user?.name?.[0]?.toUpperCase() ?? '?'}
      </div>
      {isOnline && (
        <div style={{ position:'absolute',bottom:'-1px',right:'-1px',width:'9px',height:'9px',borderRadius:'50%',background:'#10b981',boxShadow:'0 0 0 2px rgba(16,185,129,0.25)',border:'1.5px solid #0B0F14' }} />
      )}
    </div>
  );
}

function RoleBadge({ role }) {
  if (role === 'owner')
    return <span style={{ display:'inline-flex',alignItems:'center',gap:'3px',fontSize:'9px',color:'#F59E0B',fontWeight:700,letterSpacing:'0.08em',padding:'2px 6px',borderRadius:'10px',background:'rgba(245,158,11,0.12)',border:'1px solid rgba(245,158,11,0.2)',flexShrink:0 }}><Crown style={{ width:8,height:8 }} /> OWNER</span>;
  if (role === 'admin')
    return <span style={{ display:'inline-flex',alignItems:'center',gap:'3px',fontSize:'9px',color:'#8b5cf6',fontWeight:700,letterSpacing:'0.08em',padding:'2px 6px',borderRadius:'10px',background:'rgba(139,92,246,0.1)',border:'1px solid rgba(139,92,246,0.2)',flexShrink:0 }}><Shield style={{ width:8,height:8 }} /> ADMIN</span>;
  return null;
}

function DangerRow({ icon: Icon, label, color, onClick, loading }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{ width:'100%',display:'flex',alignItems:'center',gap:'8px',padding:'9px 12px',fontSize:'12px',letterSpacing:'0.06em',fontWeight:500,color: loading?`${color}60`:color,background:'transparent',border:'1px solid transparent',borderRadius:'8px',cursor: loading?'not-allowed':'pointer',fontFamily:'inherit',transition:'all 0.2s',textAlign:'left' }}
      onMouseEnter={e => { if (!loading) { e.currentTarget.style.background=`${color}10`; e.currentTarget.style.borderColor=`${color}25`; } }}
      onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='transparent'; }}
    >
      <Icon style={{ width:13,height:13,flexShrink:0 }} />
      {loading ? 'Please wait…' : label}
    </button>
  );
}

function ConfirmBox({ message, confirmLabel, confirmColor, onCancel, onConfirm, loading }) {
  return (
    <div style={{ padding:'12px',borderRadius:'8px',background:`${confirmColor}08`,border:`1px solid ${confirmColor}20` }}>
      <p style={{ fontSize:'12px',color:'rgba(229,231,235,0.65)',margin:'0 0 10px',lineHeight:1.5 }}>{message}</p>
      <div style={{ display:'flex',gap:'6px' }}>
        <button onClick={onCancel} style={{ flex:1,padding:'7px',fontSize:'11px',fontWeight:500,letterSpacing:'0.06em',color:'rgba(229,231,235,0.5)',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'7px',cursor:'pointer',fontFamily:'inherit' }}>CANCEL</button>
        <button onClick={onConfirm} disabled={loading} style={{ flex:1,padding:'7px',fontSize:'11px',fontWeight:700,letterSpacing:'0.06em',color: confirmColor==='#ef4444'?'#fff':'#0B0F14',background: loading?`${confirmColor}50`:confirmColor,border:'none',borderRadius:'7px',cursor: loading?'not-allowed':'pointer',fontFamily:'inherit' }}>
          {loading ? '…' : confirmLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Member action menu ────────────────────────────────────────────────────────
/**
 * MemberMenu — ⋮ button that shows role/remove actions.
 *
 * currentRole: role of the viewer (owner | admin | member)
 * targetRole:  role of the member being viewed
 * targetId:    userId string of the member being viewed
 * workspaceId: for API calls
 * isMe:        don't show actions on yourself
 */
function MemberMenu({ currentRole, targetRole, targetId, workspaceId }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const qc = useQueryClient();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Determine what actions are available
  const canPromote  = currentRole === 'owner' && targetRole === 'member';
  const canDemote   = currentRole === 'owner' && targetRole === 'admin';
  const canRemove   = (currentRole === 'owner' && targetRole !== 'owner')
                   || (currentRole === 'admin' && targetRole === 'member');

  // No actions available → don't render button
  if (!canPromote && !canDemote && !canRemove) return null;

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) =>
      api.patch(`/workspaces/${workspaceId}/members/${userId}`, { role }).then(r => r.data),
    onSuccess: (_, { role }) => {
      qc.invalidateQueries(['workspace', workspaceId]);
      toast.success(role === 'admin' ? 'Member promoted to admin' : 'Admin demoted to member');
      setOpen(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update role'),
  });

  const removeMutation = useMutation({
    mutationFn: ({ userId }) =>
      api.delete(`/workspaces/${workspaceId}/members/${userId}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries(['workspace', workspaceId]);
      toast.success('Member removed from workspace');
      setOpen(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to remove member'),
  });

  const isLoading = updateRoleMutation.isPending || removeMutation.isPending;

  return (
    <div ref={menuRef} style={{ position:'relative', flexShrink:0 }}>
      <button
        onClick={() => setOpen(v => !v)}
        disabled={isLoading}
        style={{
          width:        '26px',
          height:       '26px',
          borderRadius: '6px',
          display:      'flex',
          alignItems:   'center',
          justifyContent:'center',
          background:   open ? 'rgba(255,255,255,0.08)' : 'transparent',
          border:       'none',
          cursor:       'pointer',
          color:        'rgba(229,231,235,0.35)',
          transition:   'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.color='rgba(229,231,235,0.7)'; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(229,231,235,0.35)'; } }}
        title="Member actions"
        aria-label="Member actions"
      >
        <MoreVertical style={{ width:13, height:13 }} />
      </button>

      {open && (
        <div style={{
          position:   'absolute',
          right:      0,
          top:        '30px',
          zIndex:     50,
          background: '#0D1117',
          border:     '1px solid rgba(255,255,255,0.1)',
          borderRadius:'10px',
          boxShadow:  '0 12px 40px rgba(0,0,0,0.7)',
          minWidth:   '180px',
          padding:    '6px',
        }}>
          {/* Promote to Admin */}
          {canPromote && (
            <button
              onClick={() => updateRoleMutation.mutate({ userId: targetId, role: 'admin' })}
              disabled={isLoading}
              style={menuItemStyle('#8b5cf6')}
              onMouseEnter={e => e.currentTarget.style.background='rgba(139,92,246,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              <Shield style={{ width:12, height:12 }} />
              Make Admin
            </button>
          )}

          {/* Demote to Member */}
          {canDemote && (
            <button
              onClick={() => updateRoleMutation.mutate({ userId: targetId, role: 'member' })}
              disabled={isLoading}
              style={menuItemStyle('rgba(229,231,235,0.6)')}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              <UserCheck style={{ width:12, height:12 }} />
              Remove Admin
            </button>
          )}

          {/* Separator */}
          {(canPromote || canDemote) && canRemove && (
            <div style={{ height:'1px', background:'rgba(255,255,255,0.06)', margin:'4px 0' }} />
          )}

          {/* Remove from workspace */}
          {canRemove && (
            <button
              onClick={() => removeMutation.mutate({ userId: targetId })}
              disabled={isLoading}
              style={menuItemStyle('#ef4444')}
              onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              <UserMinus style={{ width:12, height:12 }} />
              Remove Member
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const menuItemStyle = (color) => ({
  width:        '100%',
  display:      'flex',
  alignItems:   'center',
  gap:          '8px',
  padding:      '9px 12px',
  fontSize:     '12px',
  letterSpacing:'0.04em',
  fontWeight:   500,
  color,
  background:   'transparent',
  border:       'none',
  cursor:       'pointer',
  fontFamily:   'inherit',
  borderRadius: '7px',
  transition:   'background 0.15s',
  textAlign:    'left',
});

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export default function Sidebar({ workspace, onClose }) {
  const { user, logout } = useAuthStore();
  const { onlineUsers, activities } = useBoardStore();
  const [tab,     setTab]     = useState('members');
  const [copied,  setCopied]  = useState(false);
  const [confirm, setConfirm] = useState(null);
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const currentUserId = String(user?._id || user?.id || '');

  // Current user always in online set (socket may not include self)
  const onlineIdSet = new Set([
    ...onlineUsers.map(u => String(u._id || u.id || '')),
    currentUserId,
  ]);

  const currentMember = workspace?.members?.find(m =>
    String(m.userId?._id || m.userId || '') === currentUserId
  );
  const currentRole    = currentMember?.role ?? 'member';
  const isOwner        = currentRole === 'owner';
  const isOwnerOrAdmin = isOwner || currentRole === 'admin';

  const leaveMutation = useMutation({
    mutationFn: () => api.post(`/workspaces/${workspace?._id}/leave`).then(r => r.data),
    onSuccess:  () => { qc.invalidateQueries(['workspaces']); toast.success('Left workspace'); navigate('/dashboard'); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed to leave'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/workspaces/${workspace?._id}`).then(r => r.data),
    onSuccess:  () => { qc.invalidateQueries(['workspaces']); toast.success('Workspace deleted'); navigate('/dashboard'); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed to delete'),
  });

  const copyCode = () => {
    navigator.clipboard.writeText(workspace?.inviteCode ?? '').catch(() => {});
    setCopied(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => { disconnectSocket(); logout(); navigate('/login'); };

  return (
    <div style={{ width:'264px',flexShrink:0,display:'flex',flexDirection:'column',height:'100%',fontFamily:"'DM Sans',sans-serif",background:'#0D1117',borderRight:'1px solid rgba(245,158,11,0.08)' }}>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div style={{ padding:'16px',borderBottom:'1px solid rgba(255,255,255,0.05)',flexShrink:0 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px' }}>
          <Logo size={14} />
          {onClose && (
            <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(229,231,235,0.35)',padding:'5px',display:'flex',alignItems:'center',borderRadius:'6px',transition:'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color='#E5E7EB'; e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.color='rgba(229,231,235,0.35)'; e.currentTarget.style.background='none'; }}
            ><X style={{ width:16,height:16 }} /></button>
          )}
        </div>

        {workspace && (
          <>
            <div style={{ display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px' }}>
              <div style={{ width:'38px',height:'38px',borderRadius:'10px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',background:(workspace.color||'#F59E0B')+'18',border:`1px solid ${(workspace.color||'#F59E0B')}25` }}>
                {workspace.icon}
              </div>
              <div style={{ minWidth:0 }}>
                <p style={{ fontSize:'14px',fontWeight:600,color:'#E5E7EB',margin:'0 0 3px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{workspace.name}</p>
                <p style={{ fontSize:'11px',color:'rgba(229,231,235,0.35)',margin:0,letterSpacing:'0.06em' }}>
                  {workspace.members?.length??0} MEMBER{workspace.members?.length!==1?'S':''}
                </p>
              </div>
            </div>

            {workspace.inviteCode && (
              <button onClick={copyCode} style={{ width:'100%',display:'flex',alignItems:'center',gap:'8px',padding:'9px 12px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'8px',cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(245,158,11,0.07)'; e.currentTarget.style.borderColor='rgba(245,158,11,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; }}
              >
                <Hash style={{ width:12,height:12,color:'rgba(229,231,235,0.3)',flexShrink:0 }} />
                <span style={{ fontFamily:"'DM Mono',monospace",fontSize:'12px',color:'rgba(229,231,235,0.5)',flex:1,textAlign:'left',letterSpacing:'0.2em' }}>{workspace.inviteCode}</span>
                {copied
                  ? <Check style={{ width:12,height:12,color:'#10b981',flexShrink:0 }} />
                  : <Copy  style={{ width:12,height:12,color:'rgba(229,231,235,0.2)',flexShrink:0 }} />
                }
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <div style={{ display:'flex',borderBottom:'1px solid rgba(255,255,255,0.05)',flexShrink:0 }}>
        {[{ id:'members',icon:Users,label:'Members' },{ id:'activity',icon:Activity,label:'Activity' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',padding:'11px 8px',fontSize:'11px',fontWeight:600,letterSpacing:'0.08em',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',color: tab===t.id?'#F59E0B':'rgba(229,231,235,0.35)',borderBottom: tab===t.id?'2px solid #F59E0B':'2px solid transparent',transition:'all 0.2s',marginBottom:'-1px' }}>
            <t.icon style={{ width:12,height:12 }} />{t.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div style={{ flex:1,overflowY:'auto',padding:'6px',scrollbarWidth:'thin' }}>
        {tab === 'members'
          ? <MembersTab
              workspace={workspace}
              onlineIdSet={onlineIdSet}
              currentUserId={currentUserId}
              currentRole={currentRole}
            />
          : <ActivityTab activities={activities} />
        }
      </div>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)',flexShrink:0 }}>
        {workspace && (
          <div style={{ padding:'6px 8px',borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            {confirm === 'leave' ? (
              <ConfirmBox message={`Leave "${workspace.name}"?`} confirmLabel="LEAVE" confirmColor="#F59E0B" onCancel={() => setConfirm(null)} onConfirm={() => leaveMutation.mutate()} loading={leaveMutation.isPending} />
            ) : confirm === 'delete' ? (
              <ConfirmBox message={`Delete "${workspace.name}"? Cannot be undone.`} confirmLabel="DELETE" confirmColor="#ef4444" onCancel={() => setConfirm(null)} onConfirm={() => deleteMutation.mutate()} loading={deleteMutation.isPending} />
            ) : (
              <>
                {!isOwner     && <DangerRow icon={LogIn}  label="Leave Workspace"  color="#F59E0B" onClick={() => setConfirm('leave')} />}
                {isOwnerOrAdmin && <DangerRow icon={Trash2} label="Delete Workspace" color="#ef4444" onClick={() => setConfirm('delete')} />}
              </>
            )}
          </div>
        )}

        {/* Current user row */}
        <div style={{ padding:'10px' }}>
          <div style={{ display:'flex',alignItems:'center',gap:'10px',padding:'8px 10px',borderRadius:'8px',transition:'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}
          >
            <Avatar user={user} size="sm" isOnline />
            <div style={{ minWidth:0,flex:1 }}>
              <p style={{ fontSize:'13px',fontWeight:600,color:'#E5E7EB',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user?.name}</p>
              <p style={{ fontSize:'11px',color:'rgba(229,231,235,0.3)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user?.email}</p>
            </div>
            <button onClick={handleLogout} title="Sign out" style={{ background:'none',border:'none',cursor:'pointer',padding:'5px',color:'rgba(229,231,235,0.25)',display:'flex',alignItems:'center',borderRadius:'6px',transition:'all 0.2s',flexShrink:0 }}
              onMouseEnter={e => { e.currentTarget.style.color='#ef4444'; e.currentTarget.style.background='rgba(239,68,68,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.color='rgba(229,231,235,0.25)'; e.currentTarget.style.background='none'; }}
            ><LogOut style={{ width:14,height:14 }} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Members tab ──────────────────────────────────────────────────────────────

function MembersTab({ workspace, onlineIdSet, currentUserId, currentRole }) {
  const members = workspace?.members ?? [];

  const roleWeight = { owner:0, admin:1, member:2 };
  const sorted = [...members].sort((a, b) => {
    const aId = String(a.userId?._id || a.userId || '');
    const bId = String(b.userId?._id || b.userId || '');
    const aOn = onlineIdSet.has(aId) ? 0 : 1;
    const bOn = onlineIdSet.has(bId) ? 0 : 1;
    if (aOn !== bOn) return aOn - bOn;
    return (roleWeight[a.role]??2) - (roleWeight[b.role]??2);
  });

  const onlineCount = sorted.filter(m => {
    const id = String(m.userId?._id || m.userId || '');
    return onlineIdSet.has(id);
  }).length;

  return (
    <div>
      {onlineCount > 0 && (
        <div style={{ display:'flex',alignItems:'center',gap:'6px',padding:'6px 10px',marginBottom:'4px' }}>
          <div style={{ width:'6px',height:'6px',borderRadius:'50%',background:'#10b981',boxShadow:'0 0 0 2px rgba(16,185,129,0.2)' }} />
          <span style={{ fontSize:'10px',letterSpacing:'0.12em',color:'rgba(229,231,235,0.4)',fontWeight:500 }}>{onlineCount} ONLINE NOW</span>
        </div>
      )}

      {sorted.map(m => {
        const mu       = m.userId || m;
        const memberId = String(mu?._id || mu || '');
        const isOnline = onlineIdSet.has(memberId);
        const isMe     = memberId === currentUserId;

        return (
          <div key={m._id || memberId}
            style={{ display:'flex',alignItems:'center',gap:'8px',padding:'7px 10px',borderRadius:'8px',transition:'background 0.15s',position:'relative' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}
          >
            <Avatar user={mu} size="sm" isOnline={isOnline} />
            <div style={{ minWidth:0,flex:1 }}>
              <div style={{ display:'flex',alignItems:'center',gap:'5px' }}>
                <p style={{ fontSize:'13px',color: isOnline?'#E5E7EB':'rgba(229,231,235,0.55)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight: isOnline?500:400 }}>
                  {mu?.name ?? 'Unknown'}
                </p>
                {isMe && <span style={{ fontSize:'9px',color:'#F59E0B',fontWeight:700,letterSpacing:'0.08em',flexShrink:0 }}>YOU</span>}
              </div>
              <p style={{ fontSize:'11px',color:'rgba(229,231,235,0.25)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                {mu?.email}
              </p>
            </div>

            <RoleBadge role={m.role} />

            {/* Issue E fix: per-member action menu — only shown if current user
                has any applicable permission over this member, and not on self */}
            {!isMe && (
              <MemberMenu
                currentRole={currentRole}
                targetRole={m.role}
                targetId={memberId}
                workspaceId={workspace?._id}
              />
            )}
          </div>
        );
      })}

      {members.length === 0 && (
        <p style={{ fontSize:'12px',color:'rgba(229,231,235,0.25)',textAlign:'center',padding:'32px 0' }}>No members yet</p>
      )}
    </div>
  );
}

// ─── Activity tab ─────────────────────────────────────────────────────────────

function ActivityTab({ activities }) {
  if (!activities?.length) {
    return (
      <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 0',gap:'8px' }}>
        <Activity style={{ width:24,height:24,color:'rgba(229,231,235,0.15)' }} />
        <p style={{ fontSize:'12px',color:'rgba(229,231,235,0.25)',margin:0 }}>No activity yet</p>
      </div>
    );
  }
  return (
    <div>
      {activities.map((a, i) => (
        <div key={a._id||i} style={{ display:'flex',alignItems:'flex-start',gap:'10px',padding:'9px 10px',borderRadius:'8px',transition:'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
          onMouseLeave={e => e.currentTarget.style.background='transparent'}
        >
          <div style={{ width:'26px',height:'26px',borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:700,color:'#0B0F14',background: a.userId?.color||'#F59E0B',marginTop:'1px' }}>
            {a.userId?.name?.[0]?.toUpperCase()?? '?'}
          </div>
          <div style={{ minWidth:0 }}>
            <p style={{ fontSize:'12px',color:'rgba(229,231,235,0.7)',margin:'0 0 3px',lineHeight:1.5 }}>
              <span style={{ color:'#E5E7EB',fontWeight:500 }}>{a.userId?.name??'Someone'}</span>{' '}{a.action}
            </p>
            <p style={{ fontSize:'11px',color:'rgba(229,231,235,0.25)',margin:0 }}>
              {formatDistanceToNow(new Date(a.createdAt), { addSuffix:true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
