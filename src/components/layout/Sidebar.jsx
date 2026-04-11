import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Users, Activity, Hash, Copy, Check, LogOut } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import useAuthStore from '../../store/authStore';
import useBoardStore from '../../store/boardStore';
import { disconnectSocket } from '../../socket/socket';

function Avatar({ user, size = 'md', showOnline }) {
  const dim = size === 'sm' ? 28 : 34;
  return (
    <div style={{ position:'relative', flexShrink:0 }}>
      <div style={{
        width:`${dim}px`, height:`${dim}px`, borderRadius:'50%',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize: size === 'sm' ? '11px' : '13px', fontWeight:600, color:'#0b0b0c',
        background: user?.color || '#e8a24a',
        border:`1px solid ${(user?.color || '#e8a24a')}40`,
      }}>
        {user?.name?.[0]?.toUpperCase()}
      </div>
      {showOnline && (
        <div style={{
          position:'absolute', bottom:'-1px', right:'-1px',
          width:'8px', height:'8px', borderRadius:'50%',
          background:'#e8a24a', boxShadow:'0 0 6px rgba(232,162,74,0.5)',
          border:'1.5px solid #0b0b0c',
        }} />
      )}
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
    navigator.clipboard.writeText(workspace?.inviteCode || '');
    setCopied(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => { disconnectSocket(); logout(); navigate('/login'); };
  const onlineIds = onlineUsers.map(u => u._id?.toString());

  return (
    <div style={{
      width:'272px', display:'flex', flexDirection:'column',
      height:'100%', fontFamily:"'DM Sans',sans-serif",
      background:'rgba(11,11,12,0.95)',
      borderRight:'1px solid rgba(232,162,74,0.1)',
      backdropFilter:'blur(20px)',
    }}>

      {/* header */}
      <div style={{ padding:'20px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
          <a href="/" style={{
            fontFamily:"'Cormorant Garamond',serif",
            fontSize:'16px', fontWeight:600, letterSpacing:'0.12em',
            color:'#f0ede8', textDecoration:'none',
          }}>LIVECOLLAB</a>
          {onClose && (
            <button onClick={onClose} style={{
              background:'none', border:'none', cursor:'pointer',
              color:'rgba(240,237,232,0.35)', padding:'4px',
              display:'flex', alignItems:'center',
            }}>
              <X style={{ width:16, height:16 }} />
            </button>
          )}
        </div>

        {/* workspace info */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px' }}>
          <div style={{
            width:'40px', height:'40px', borderRadius:'2px', flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px',
            background: (workspace?.color || '#e8a24a') + '18',
            border:`1px solid ${(workspace?.color || '#e8a24a')}25`,
          }}>
            {workspace?.icon}
          </div>
          <div style={{ minWidth:0 }}>
            <p style={{
              fontSize:'14px', fontWeight:500, color:'#f0ede8', margin:'0 0 2px',
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            }}>{workspace?.name}</p>
            <p style={{ fontSize:'11px', color:'rgba(240,237,232,0.35)', margin:0, letterSpacing:'0.06em' }}>
              {workspace?.members?.length} MEMBERS
            </p>
          </div>
        </div>

        {/* invite code */}
        <button onClick={copyCode} style={{
          width:'100%', display:'flex', alignItems:'center', gap:'8px',
          padding:'10px 12px',
          background:'rgba(255,255,255,0.03)',
          border:'1px solid rgba(255,255,255,0.07)',
          borderRadius:'2px', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(232,162,74,0.06)'; e.currentTarget.style.borderColor='rgba(232,162,74,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; }}
        >
          <Hash style={{ width:13, height:13, color:'rgba(240,237,232,0.3)', flexShrink:0 }} />
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'13px', color:'rgba(240,237,232,0.5)', flex:1, textAlign:'left', letterSpacing:'0.15em' }}>
            {workspace?.inviteCode}
          </span>
          {copied
            ? <Check style={{ width:13, height:13, color:'#e8a24a', flexShrink:0 }} />
            : <Copy style={{ width:13, height:13, color:'rgba(240,237,232,0.2)', flexShrink:0 }} />
          }
        </button>
      </div>

      {/* tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        {[
          { id:'members', icon: Users,    label:'Members' },
          { id:'activity', icon: Activity, label:'Activity' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px',
            padding:'12px 8px', fontSize:'11px', fontWeight:500, letterSpacing:'0.08em',
            background:'none', border:'none', cursor:'pointer', fontFamily:'inherit',
            color: tab === t.id ? '#e8a24a' : 'rgba(240,237,232,0.35)',
            borderBottom: tab === t.id ? '2px solid #e8a24a' : '2px solid transparent',
            transition:'all 0.2s',
          }}>
            <t.icon style={{ width:13, height:13 }} />
            {t.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* content */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px' }}>
        {tab === 'members' ? (
          <div>
            {onlineUsers.length > 0 && (
              <div style={{ marginBottom:'16px' }}>
                <p style={{ fontSize:'10px', letterSpacing:'0.15em', color:'rgba(240,237,232,0.3)', margin:'0 0 8px 8px' }}>
                  ONLINE NOW
                </p>
                {onlineUsers.map(u => (
                  <div key={u._id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px', borderRadius:'2px' }}>
                    <Avatar user={u} size="sm" showOnline />
                    <span style={{ fontSize:'13px', color:'#f0ede8', flex:1 }}>{u.name}</span>
                    {u._id?.toString() === user?._id?.toString() && (
                      <span style={{ fontSize:'10px', color:'#e8a24a', letterSpacing:'0.08em' }}>YOU</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p style={{ fontSize:'10px', letterSpacing:'0.15em', color:'rgba(240,237,232,0.3)', margin:'0 0 8px 8px' }}>
              ALL MEMBERS
            </p>
            {workspace?.members?.map(m => {
              const isOnline = onlineIds.includes(m._id?.toString() || m.userId?.toString());
              const memberUser = m.userId || m;
              return (
                <div key={m._id} style={{
                  display:'flex', alignItems:'center', gap:'10px',
                  padding:'8px', borderRadius:'2px', transition:'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <Avatar user={memberUser} size="sm" showOnline={isOnline} />
                  <div style={{ minWidth:0, flex:1 }}>
                    <p style={{ fontSize:'13px', color:'#f0ede8', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {memberUser?.name}
                    </p>
                    <p style={{ fontSize:'11px', color:'rgba(240,237,232,0.3)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {memberUser?.email}
                    </p>
                  </div>
                  {(workspace?.ownerId?._id === m._id || workspace?.ownerId === m._id || m.role === 'owner') && (
                    <span style={{ fontSize:'10px', color:'rgba(232,162,74,0.7)', letterSpacing:'0.08em', flexShrink:0 }}>OWNER</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            {activities.length === 0 ? (
              <p style={{ fontSize:'13px', color:'rgba(240,237,232,0.25)', textAlign:'center', padding:'32px 0', fontWeight:300 }}>
                No activity yet
              </p>
            ) : activities.map((a, i) => (
              <div key={a._id || i} style={{
                display:'flex', alignItems:'flex-start', gap:'10px',
                padding:'10px 8px', borderRadius:'2px', transition:'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                <div style={{
                  width:'26px', height:'26px', borderRadius:'50%', flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'11px', fontWeight:600, color:'#0b0b0c',
                  background: a.userId?.color || '#e8a24a',
                  marginTop:'1px',
                }}>
                  {a.userId?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ minWidth:0 }}>
                  <p style={{ fontSize:'12px', color:'rgba(240,237,232,0.7)', margin:'0 0 3px', lineHeight:1.5 }}>
                    <span style={{ color:'#f0ede8', fontWeight:500 }}>{a.userId?.name || 'Someone'}</span>
                    {' '}{a.action}
                  </p>
                  <p style={{ fontSize:'11px', color:'rgba(240,237,232,0.25)', margin:0 }}>
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* footer */}
      <div style={{ padding:'12px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          display:'flex', alignItems:'center', gap:'10px',
          padding:'10px 12px', borderRadius:'2px', transition:'background 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
          onMouseLeave={e => e.currentTarget.style.background='transparent'}
        >
          <Avatar user={user} size="sm" />
          <div style={{ minWidth:0, flex:1 }}>
            <p style={{ fontSize:'13px', fontWeight:500, color:'#f0ede8', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.name}
            </p>
            <p style={{ fontSize:'11px', color:'rgba(240,237,232,0.3)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.email}
            </p>
          </div>
          <button onClick={handleLogout} style={{
            background:'none', border:'none', cursor:'pointer', padding:'4px',
            color:'rgba(240,237,232,0.25)', display:'flex', alignItems:'center', transition:'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color='rgba(240,237,232,0.25)'}
            title="Sign out"
          >
            <LogOut style={{ width:14, height:14 }} />
          </button>
        </div>
      </div>
    </div>
  );
}
