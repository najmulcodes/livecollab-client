/**
 * Sidebar.jsx — workspace sidebar (members, activity, actions)
 *
 * FIXES applied:
 *   Issue 5:  All ID comparisons now use user._id (authStore normalizes both
 *             .id and ._id, but we use ._id as canonical). All member ID
 *             comparisons use String() for safe comparison.
 *   Issue 10: Current user is always considered online by adding their _id
 *             to the effective online set, regardless of socket presence.
 *             (Socket presenceUpdate may not include the current user.)
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Users, Activity, Hash, Copy, Check,
  LogOut, Trash2, LogIn, Crown, Shield,
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
  const dim  = size === 'sm' ? 28 : 34;
  const fs   = size === 'sm' ? '11px' : '13px';
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width:          `${dim}px`,
        height:         `${dim}px`,
        borderRadius:   '50%',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       fs,
        fontWeight:     700,
        color:          '#0B0F14',
        background:     user?.color || '#F59E0B',
        border:         `1.5px solid ${(user?.color || '#F59E0B')}40`,
      }}>
        {user?.name?.[0]?.toUpperCase() ?? '?'}
      </div>
      {isOnline && (
        <div style={{
          position:     'absolute',
          bottom:       '-1px',
          right:        '-1px',
          width:        '9px',
          height:       '9px',
          borderRadius: '50%',
          background:   '#10b981',
          boxShadow:    '0 0 0 2px rgba(16,185,129,0.25)',
          border:       '1.5px solid #0B0F14',
        }} />
      )}
    </div>
  );
}

function RoleBadge({ role }) {
  if (role === 'owner') {
    return (
      <span style={{ display:'inline-flex',alignItems:'center',gap:'3px',fontSize:'9px',color:'#F59E0B',fontWeight:700,letterSpacing:'0.08em',padding:'2px 6px',borderRadius:'10px',background:'rgba(245,158,11,0.12)',border:'1px solid rgba(245,158,11,0.2)',flexShrink:0 }}>
        <Crown style={{ width:8,height:8 }} /> OWNER
      </span>
    );
  }
  if (role === 'admin') {
    return (
      <span style={{ display:'inline-flex',alignItems:'center',gap:'3px',fontSize:'9px',color:'#8b5cf6',fontWeight:700,letterSpacing:'0.08em',padding:'2px 6px',borderRadius:'10px',background:'rgba(139,92,246,0.1)',border:'1px solid rgba(139,92,246,0.2)',flexShrink:0 }}>
        <Shield style={{ width:8,height:8 }} /> ADMIN
      </span>
    );
  }
  return null;
}

function DangerRow({ icon: Icon, label, color, onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        width:'100%',display:'flex',alignItems:'center',gap:'8px',
        padding:'9px 12px',fontSize:'12px',letterSpacing:'0.06em',fontWeight:500,
        color: loading ? `${color}60` : color,
        background:'transparent',border:'1px solid transparent',
        borderRadius:'8px',cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily:'inherit',transition:'all 0.2s',textAlign:'left',
      }}
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
        <button onClick={onCancel} style={{ flex:1,padding:'7px',fontSize:'11px',fontWeight:500,letterSpacing:'0.06em',color:'rgba(229,231,235,0.5)',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'7px',cursor:'pointer',fontFamily:'inherit' }}>
          CANCEL
        </button>
        <button onClick={onConfirm} disabled={loading} style={{ flex:1,padding:'7px',fontSize:'11px',fontWeight:700,letterSpacing:'0.06em',color: confirmColor==='#ef4444' ? '#fff' : '#0B0F14',background: loading ? `${confirmColor}50` : confirmColor,border:'none',borderRadius:'7px',cursor: loading?'not-allowed':'pointer',fontFamily:'inherit' }}>
          {loading ? '…' : confirmLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export default function Sidebar({ workspace, onClose }) {
  const { user, logout } = useAuthStore();
  const { onlineUsers, activities } = useBoardStore();
  const [tab,     setTab]     = useState('members');
  const [copied,  setCopied]  = useState(false);
  const [confirm, setConfirm] = useState(null); // 'leave' | 'delete' | null
  const navigate = useNavigate();
  const qc       = useQueryClient();

  /**
   * FIX Issue 5: use user._id (canonical after authStore normalization).
   * authStore.setAuth ensures ._id and .id are both the same string.
   */
  const currentUserId = String(user?._id || user?.id || '');

  /**
   * FIX Issue 10: Always treat the current user as online.
   * Build the effective online set = socket presence + current user.
   * This prevents the current user from always appearing offline in
   * their own workspace (socket presenceUpdate may not include them).
   */
  const onlineIdSet = new Set([
    ...onlineUsers.map(u => String(u._id || u.id || '')),
    currentUserId, // ← always online (it's you)
  ]);

  const currentMember = workspace?.members?.find(m => {
    const mid = String(m.userId?._id || m.userId || '');
    return mid === currentUserId;
  });
  const currentRole     = currentMember?.role ?? 'member';
  const isOwner         = currentRole === 'owner';
  const isOwnerOrAdmin  = isOwner || currentRole === 'admin';

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

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.root}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <Logo size={14} />
          {onClose && (
            <button onClick={onClose} style={styles.closeBtn}>
              <X style={{ width:16,height:16 }} />
            </button>
          )}
        </div>

        {workspace && (
          <>
            <div style={styles.wsRow}>
              <div style={{
                ...styles.wsIconBox,
                background: (workspace.color || '#F59E0B') + '18',
                border:     `1px solid ${(workspace.color || '#F59E0B')}25`,
              }}>
                {workspace.icon}
              </div>
              <div style={{ minWidth:0 }}>
                <p style={styles.wsName}>{workspace.name}</p>
                <p style={styles.wsMeta}>
                  {workspace.members?.length ?? 0} MEMBER{workspace.members?.length !== 1 ? 'S' : ''}
                </p>
              </div>
            </div>

            {workspace.inviteCode && (
              <button onClick={copyCode} style={styles.inviteBtn}>
                <Hash style={{ width:12,height:12,color:'rgba(229,231,235,0.3)',flexShrink:0 }} />
                <span style={styles.inviteCode}>{workspace.inviteCode}</span>
                {copied
                  ? <Check style={{ width:12,height:12,color:'#10b981',flexShrink:0 }} />
                  : <Copy  style={{ width:12,height:12,color:'rgba(229,231,235,0.2)',flexShrink:0 }} />
                }
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div style={styles.tabs}>
        {[
          { id: 'members',  icon: Users,    label: 'Members' },
          { id: 'activity', icon: Activity, label: 'Activity' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              ...styles.tabBtn,
              color:        tab === t.id ? '#F59E0B' : 'rgba(229,231,235,0.35)',
              borderBottom: tab === t.id ? '2px solid #F59E0B' : '2px solid transparent',
            }}
          >
            <t.icon style={{ width:12,height:12 }} />
            {t.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div style={styles.content}>
        {tab === 'members'
          ? <MembersTab
              workspace={workspace}
              onlineIdSet={onlineIdSet}
              currentUserId={currentUserId}
            />
          : <ActivityTab activities={activities} />
        }
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div style={styles.footer}>
        {workspace && (
          <div style={styles.dangerZone}>
            {confirm === 'leave' ? (
              <ConfirmBox
                message={`Leave "${workspace.name}"?`}
                confirmLabel="LEAVE"
                confirmColor="#F59E0B"
                onCancel={() => setConfirm(null)}
                onConfirm={() => leaveMutation.mutate()}
                loading={leaveMutation.isPending}
              />
            ) : confirm === 'delete' ? (
              <ConfirmBox
                message={`Delete "${workspace.name}"? Cannot be undone.`}
                confirmLabel="DELETE"
                confirmColor="#ef4444"
                onCancel={() => setConfirm(null)}
                onConfirm={() => deleteMutation.mutate()}
                loading={deleteMutation.isPending}
              />
            ) : (
              <>
                {!isOwner && (
                  <DangerRow icon={LogIn}  label="Leave Workspace"  color="#F59E0B" onClick={() => setConfirm('leave')} />
                )}
                {isOwnerOrAdmin && (
                  <DangerRow icon={Trash2} label="Delete Workspace" color="#ef4444" onClick={() => setConfirm('delete')} />
                )}
              </>
            )}
          </div>
        )}

        {/* Current user row */}
        <div style={styles.userRow}>
          <Avatar user={user} size="sm" isOnline />
          <div style={{ minWidth:0,flex:1 }}>
            <p style={styles.userName}>{user?.name}</p>
            <p style={styles.userEmail}>{user?.email}</p>
          </div>
          <button onClick={handleLogout} title="Sign out" style={styles.logoutBtn}
            onMouseEnter={e => { e.currentTarget.style.color='#ef4444'; e.currentTarget.style.background='rgba(239,68,68,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color='rgba(229,231,235,0.25)'; e.currentTarget.style.background='none'; }}
          >
            <LogOut style={{ width:14,height:14 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Members tab ──────────────────────────────────────────────────────────────

function MembersTab({ workspace, onlineIdSet, currentUserId }) {
  const members = workspace?.members ?? [];

  // Sort: online first, then by role weight
  const roleWeight = { owner: 0, admin: 1, member: 2 };
  const sorted = [...members].sort((a, b) => {
    const aId = String(a.userId?._id || a.userId || '');
    const bId = String(b.userId?._id || b.userId || '');
    const aOn = onlineIdSet.has(aId) ? 0 : 1;
    const bOn = onlineIdSet.has(bId) ? 0 : 1;
    if (aOn !== bOn) return aOn - bOn;
    return (roleWeight[a.role] ?? 2) - (roleWeight[b.role] ?? 2);
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
          <span style={{ fontSize:'10px',letterSpacing:'0.12em',color:'rgba(229,231,235,0.4)',fontWeight:500 }}>
            {onlineCount} ONLINE NOW
          </span>
        </div>
      )}

      {sorted.map(m => {
        const mu       = m.userId || m;
        const memberId = String(mu?._id || mu || '');
        const isOnline = onlineIdSet.has(memberId);
        const isMe     = memberId === currentUserId;

        return (
          <div key={m._id || memberId} style={styles.memberRow}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}
          >
            <Avatar user={mu} size="sm" isOnline={isOnline} />
            <div style={{ minWidth:0,flex:1 }}>
              <div style={{ display:'flex',alignItems:'center',gap:'5px' }}>
                <p style={{ fontSize:'13px',color: isOnline ? '#E5E7EB' : 'rgba(229,231,235,0.55)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight: isOnline ? 500 : 400 }}>
                  {mu?.name ?? 'Unknown'}
                </p>
                {isMe && (
                  <span style={{ fontSize:'9px',color:'#F59E0B',fontWeight:700,letterSpacing:'0.08em',flexShrink:0 }}>YOU</span>
                )}
              </div>
              <p style={{ fontSize:'11px',color:'rgba(229,231,235,0.25)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                {mu?.email}
              </p>
            </div>
            <RoleBadge role={m.role} />
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
        <div key={a._id || i} style={styles.activityRow}
          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
          onMouseLeave={e => e.currentTarget.style.background='transparent'}
        >
          <div style={{ width:'26px',height:'26px',borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:700,color:'#0B0F14',background: a.userId?.color || '#F59E0B',marginTop:'1px' }}>
            {a.userId?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div style={{ minWidth:0 }}>
            <p style={{ fontSize:'12px',color:'rgba(229,231,235,0.7)',margin:'0 0 3px',lineHeight:1.5 }}>
              <span style={{ color:'#E5E7EB',fontWeight:500 }}>{a.userId?.name ?? 'Someone'}</span>
              {' '}{a.action}
            </p>
            <p style={{ fontSize:'11px',color:'rgba(229,231,235,0.25)',margin:0 }}>
              {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  root: {
    width:         '264px',
    flexShrink:    0,
    display:       'flex',
    flexDirection: 'column',
    height:        '100%',
    fontFamily:    "'DM Sans', sans-serif",
    background:    '#0D1117',
    borderRight:   '1px solid rgba(245,158,11,0.08)',
    overflowY:     'hidden', // footer stays pinned
  },

  // Header
  header: {
    padding:      '16px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    flexShrink:   0,
  },
  headerTop: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   '16px',
  },
  closeBtn: {
    background:   'none',
    border:       'none',
    cursor:       'pointer',
    color:        'rgba(229,231,235,0.35)',
    padding:      '5px',
    display:      'flex',
    alignItems:   'center',
    borderRadius: '6px',
    transition:   'all 0.2s',
  },
  wsRow: {
    display:     'flex',
    alignItems:  'center',
    gap:         '10px',
    marginBottom:'12px',
  },
  wsIconBox: {
    width:          '38px',
    height:         '38px',
    borderRadius:   '10px',
    flexShrink:     0,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       '18px',
  },
  wsName: {
    fontSize:     '14px',
    fontWeight:   600,
    color:        '#E5E7EB',
    margin:       '0 0 3px',
    overflow:     'hidden',
    textOverflow: 'ellipsis',
    whiteSpace:   'nowrap',
  },
  wsMeta: {
    fontSize:      '11px',
    color:         'rgba(229,231,235,0.35)',
    margin:        0,
    letterSpacing: '0.06em',
  },
  inviteBtn: {
    width:        '100%',
    display:      'flex',
    alignItems:   'center',
    gap:          '8px',
    padding:      '9px 12px',
    background:   'rgba(255,255,255,0.03)',
    border:       '1px solid rgba(255,255,255,0.07)',
    borderRadius: '8px',
    cursor:       'pointer',
    fontFamily:   'inherit',
    transition:   'all 0.2s',
  },
  inviteCode: {
    fontFamily:    "'DM Mono', monospace",
    fontSize:      '12px',
    color:         'rgba(229,231,235,0.5)',
    flex:          1,
    textAlign:     'left',
    letterSpacing: '0.2em',
  },

  // Tabs
  tabs: {
    display:      'flex',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    flexShrink:   0,
  },
  tabBtn: {
    flex:          1,
    display:       'flex',
    alignItems:    'center',
    justifyContent:'center',
    gap:           '6px',
    padding:       '11px 8px',
    fontSize:      '11px',
    fontWeight:    600,
    letterSpacing: '0.08em',
    background:    'none',
    border:        'none',
    cursor:        'pointer',
    fontFamily:    'inherit',
    transition:    'all 0.2s',
    marginBottom:  '-1px',
  },

  // Content
  content: {
    flex:          1,
    overflowY:     'auto',
    padding:       '6px',
    scrollbarWidth:'thin',
  },

  // Member row
  memberRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
    padding:    '8px 10px',
    borderRadius:'8px',
    transition: 'background 0.15s',
    cursor:     'default',
  },

  // Activity row
  activityRow: {
    display:    'flex',
    alignItems: 'flex-start',
    gap:        '10px',
    padding:    '9px 10px',
    borderRadius:'8px',
    transition: 'background 0.15s',
  },

  // Footer
  footer: {
    borderTop: '1px solid rgba(255,255,255,0.05)',
    flexShrink: 0,
  },
  dangerZone: {
    padding:      '6px 8px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  userRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
    padding:    '10px 12px',
    borderRadius:'8px',
    margin:     '6px',
    transition: 'background 0.15s',
    cursor:     'default',
  },
  userName: {
    fontSize:     '13px',
    fontWeight:   600,
    color:        '#E5E7EB',
    margin:       0,
    overflow:     'hidden',
    textOverflow: 'ellipsis',
    whiteSpace:   'nowrap',
  },
  userEmail: {
    fontSize:     '11px',
    color:        'rgba(229,231,235,0.3)',
    margin:       0,
    overflow:     'hidden',
    textOverflow: 'ellipsis',
    whiteSpace:   'nowrap',
  },
  logoutBtn: {
    background:   'none',
    border:       'none',
    cursor:       'pointer',
    padding:      '5px',
    color:        'rgba(229,231,235,0.25)',
    display:      'flex',
    alignItems:   'center',
    borderRadius: '6px',
    transition:   'all 0.2s',
    flexShrink:   0,
  },
};
