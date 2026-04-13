import { useState, useRef, useEffect } from 'react';
import { Video, ChevronDown } from 'lucide-react';
import useAuthStore from "../store/authStore";
import useBoardStore from "../store/boardStore";
import { CallState } from "../hooks/useVideoCall";

export default function VideoCallButton({ members = [], callHook }) {
  const { user } = useAuthStore();
  const { onlineUsers } = useBoardStore();
  const { callState, startCall } = callHook;

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filter members: exclude self, include all workspace members
  const callableMembers = (members || []).filter(
    m => (m._id || m.id) !== user?.id
  );

  const isOnline = (memberId) =>
    onlineUsers.some(u => (u._id || u.id || u) === memberId);

  const handleCallMember = (member) => {
    setOpen(false);
    startCall({
      id:   member._id || member.id,
      name: member.name,
    });
  };

  const isDisabled = callState !== CallState.IDLE;

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      {/* Trigger button */}
      <button
        onClick={() => !isDisabled && setOpen(v => !v)}
        disabled={isDisabled}
        style={{
          display:     'flex',
          alignItems:  'center',
          gap:         '6px',
          padding:     '6px 12px',
          borderRadius: '8px',
          border:       '1px solid rgba(245,158,11,0.25)',
          background:   isDisabled
            ? 'rgba(245,158,11,0.05)'
            : open
            ? 'rgba(245,158,11,0.12)'
            : 'rgba(245,158,11,0.08)',
          color:       isDisabled
            ? 'rgba(245,158,11,0.35)'
            : '#F59E0B',
          cursor:      isDisabled ? 'not-allowed' : 'pointer',
          fontSize:    '11px',
          fontWeight:  600,
          letterSpacing: '0.08em',
          fontFamily:  "'DM Sans', sans-serif",
          transition:  'all 0.15s',
          whiteSpace:  'nowrap',
        }}
        title={isDisabled ? 'Call in progress' : 'Start video call'}
        aria-label="Start video call"
      >
        <Video style={{ width: 13, height: 13 }} />
        CALL
        {!isDisabled && (
          <ChevronDown style={{
            width:     10,
            height:    10,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
          }} />
        )}
      </button>

      {/* Member dropdown */}
      {open && (
        <div style={dropdownStyles.container}>
          <p style={dropdownStyles.label}>Call a member</p>

          {callableMembers.length === 0 ? (
            <p style={dropdownStyles.empty}>No other members</p>
          ) : (
            callableMembers.map(member => {
              const memberId = member._id || member.id;
              const online   = isOnline(memberId);
              return (
                <button
                  key={memberId}
                  onClick={() => handleCallMember(member)}
                  style={dropdownStyles.memberBtn}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(245,158,11,0.08)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    ...dropdownStyles.avatar,
                    background: member.color || '#F59E0B',
                  }}>
                    {member.name?.[0]?.toUpperCase()}
                  </div>

                  {/* Name + status */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={dropdownStyles.memberName}>{member.name}</p>
                    <p style={{
                      ...dropdownStyles.memberStatus,
                      color: online ? '#10b981' : 'rgba(229,231,235,0.3)',
                    }}>
                      {online ? '● Online' : '○ Offline'}
                    </p>
                  </div>

                  {/* Call icon */}
                  <Video style={{ width: 13, height: 13, color: 'rgba(245,158,11,0.5)', flexShrink: 0 }} />
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

const dropdownStyles = {
  container: {
    position:     'absolute',
    top:          'calc(100% + 8px)',
    right:        0,
    zIndex:       50,
    minWidth:     '220px',
    background:   '#111827',
    border:       '1px solid rgba(245,158,11,0.2)',
    borderRadius: '12px',
    padding:      '8px',
    boxShadow:    '0 16px 40px rgba(0,0,0,0.5)',
  },
  label: {
    fontSize:      '10px',
    color:         'rgba(229,231,235,0.35)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    margin:        '0 4px 6px',
    fontFamily:    "'DM Sans', sans-serif",
  },
  empty: {
    fontSize:   '12px',
    color:      'rgba(229,231,235,0.3)',
    padding:    '8px 4px',
    margin:     0,
    fontFamily: "'DM Sans', sans-serif",
  },
  memberBtn: {
    display:     'flex',
    alignItems:  'center',
    gap:         '10px',
    width:       '100%',
    padding:     '8px 8px',
    borderRadius: '8px',
    border:      'none',
    cursor:      'pointer',
    background:  'transparent',
    transition:  'background 0.15s',
    textAlign:   'left',
  },
  avatar: {
    width:          '30px',
    height:         '30px',
    borderRadius:   '50%',
    flexShrink:     0,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       '12px',
    fontWeight:     700,
    color:          '#0B0F14',
  },
  memberName: {
    fontSize:     '13px',
    fontWeight:   500,
    color:        '#E5E7EB',
    margin:       0,
    overflow:     'hidden',
    textOverflow: 'ellipsis',
    whiteSpace:   'nowrap',
    fontFamily:   "'DM Sans', sans-serif",
  },
  memberStatus: {
    fontSize:   '10px',
    margin:     '2px 0 0',
    fontFamily: "'DM Sans', sans-serif",
  },
};
