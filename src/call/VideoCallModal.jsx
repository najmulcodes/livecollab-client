
import { useEffect, useRef } from 'react';
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  Phone, PhoneOff, PhoneIncoming,
} from 'lucide-react';

import useVideoCall, { CallState } from "../hooks/useVideoCall";
export default function VideoCallModal({ callHook }) {
  const {
    callState, remoteUser, isMuted, isCameraOff, isScreenSharing, callError,
    localVideoRef, remoteVideoRef,
    answerCall, rejectCall, endCall,
    toggleMute, toggleCamera, toggleScreenShare,
  } = callHook;

  const isVisible = callState !== CallState.IDLE;
  if (!isVisible) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>

        {/* ── Calling state ─────────────────────────────────────────────── */}
        {callState === CallState.CALLING && (
          <CallingScreen remoteUser={remoteUser} onCancel={endCall} />
        )}

        {/* ── Incoming call state ───────────────────────────────────────── */}
        {callState === CallState.INCOMING && (
          <IncomingScreen remoteUser={remoteUser} onAnswer={answerCall} onReject={rejectCall} />
        )}

        {/* ── Connected state ────────────────────────────────────────────── */}
        {callState === CallState.CONNECTED && (
          <>
            {/* Remote video (full background) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={styles.remoteVideo}
            />

            {/* Remote video placeholder when stream not yet received */}
            <div style={styles.remotePlaceholder}>
              <div style={styles.avatarRing}>
                <span style={styles.avatarInitial}>
                  {remoteUser?.name?.[0]?.toUpperCase() ?? '?'}
                </span>
              </div>
              <span style={styles.connectingText}>Connecting…</span>
            </div>

            {/* Remote user name badge */}
            <div style={styles.remoteNameBadge}>
              {remoteUser?.name ?? 'Remote'}
            </div>

            {/* Local video (PiP) */}
            <div style={styles.localWrapper}>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                style={{
                  ...styles.localVideo,
                  opacity: isCameraOff ? 0 : 1,
                }}
              />
              {isCameraOff && (
                <div style={styles.cameraOffOverlay}>
                  <VideoOff style={{ width: 16, height: 16, color: 'rgba(229,231,235,0.5)' }} />
                </div>
              )}
            </div>

            {/* Error toast */}
            {callError && (
              <div style={styles.errorToast}>{callError}</div>
            )}

            {/* Control bar */}
            <div style={styles.controls}>
              <ControlBtn
                onClick={toggleMute}
                active={isMuted}
                activeColor="#ef4444"
                label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff style={icnStyle} /> : <Mic style={icnStyle} />}
              </ControlBtn>

              <ControlBtn
                onClick={toggleCamera}
                active={isCameraOff}
                activeColor="#ef4444"
                label={isCameraOff ? 'Camera On' : 'Camera Off'}
              >
                {isCameraOff
                  ? <VideoOff style={icnStyle} />
                  : <Video style={icnStyle} />}
              </ControlBtn>

              <ControlBtn
                onClick={toggleScreenShare}
                active={isScreenSharing}
                activeColor="#3b82f6"
                label={isScreenSharing ? 'Stop Share' : 'Share Screen'}
              >
                {isScreenSharing
                  ? <MonitorOff style={icnStyle} />
                  : <Monitor style={icnStyle} />}
              </ControlBtn>

              {/* End call — separate styling */}
              <button
                onClick={endCall}
                style={styles.endBtn}
                title="End call"
                aria-label="End call"
              >
                <PhoneOff style={{ width: 20, height: 20 }} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Sub-screens ──────────────────────────────────────────────────────────────

function CallingScreen({ remoteUser, onCancel }) {
  return (
    <div style={styles.centeredScreen}>
      <div style={styles.pulseRing}>
        <div style={styles.avatarRing}>
          <span style={styles.avatarInitial}>
            {remoteUser?.name?.[0]?.toUpperCase() ?? '?'}
          </span>
        </div>
      </div>
      <p style={styles.callingLabel}>Calling</p>
      <p style={styles.callingName}>{remoteUser?.name ?? 'Unknown'}</p>
      <button onClick={onCancel} style={styles.endBtn} aria-label="Cancel call">
        <PhoneOff style={{ width: 20, height: 20 }} />
      </button>
    </div>
  );
}

function IncomingScreen({ remoteUser, onAnswer, onReject }) {
  return (
    <div style={styles.centeredScreen}>
      <div style={styles.pulseRing}>
        <div style={styles.avatarRing}>
          <span style={styles.avatarInitial}>
            {remoteUser?.name?.[0]?.toUpperCase() ?? '?'}
          </span>
        </div>
      </div>
      <p style={styles.callingLabel}>Incoming call from</p>
      <p style={styles.callingName}>{remoteUser?.name ?? 'Unknown'}</p>

      <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
        {/* Reject */}
        <button onClick={onReject} style={styles.endBtn} aria-label="Reject call">
          <PhoneOff style={{ width: 20, height: 20 }} />
        </button>
        {/* Answer */}
        <button onClick={onAnswer} style={styles.answerBtn} aria-label="Answer call">
          <Phone style={{ width: 20, height: 20 }} />
        </button>
      </div>
    </div>
  );
}

// ─── Control button ───────────────────────────────────────────────────────────

function ControlBtn({ children, onClick, active, activeColor = '#F59E0B', label }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      style={{
        width:          '44px',
        height:         '44px',
        borderRadius:   '50%',
        border:         'none',
        cursor:         'pointer',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        background:     active ? `${activeColor}22` : 'rgba(255,255,255,0.1)',
        color:          active ? activeColor : 'rgba(229,231,235,0.85)',
        transition:     'all 0.18s',
        backdropFilter: 'blur(8px)',
      }}
    >
      {children}
    </button>
  );
}

const icnStyle = { width: 18, height: 18 };

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  overlay: {
    position:       'fixed',
    inset:          0,
    zIndex:         100,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    background:     'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(6px)',
  },
  modal: {
    position:     'relative',
    width:        'min(720px, 95vw)',
    height:       'min(480px, 85vh)',
    borderRadius: '16px',
    background:   '#0d1117',
    border:       '1px solid rgba(245,158,11,0.15)',
    overflow:     'hidden',
    boxShadow:    '0 32px 80px rgba(0,0,0,0.7)',
    display:      'flex',
    alignItems:   'center',
    justifyContent: 'center',
  },
  remoteVideo: {
    position:   'absolute',
    inset:      0,
    width:      '100%',
    height:     '100%',
    objectFit:  'cover',
    zIndex:     1,
  },
  remotePlaceholder: {
    position:       'absolute',
    inset:          0,
    zIndex:         0,
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '12px',
    background:     'linear-gradient(160deg, #0d1117 0%, #111827 100%)',
  },
  remoteNameBadge: {
    position:       'absolute',
    top:            '16px',
    left:           '50%',
    transform:      'translateX(-50%)',
    zIndex:         10,
    background:     'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(8px)',
    border:         '1px solid rgba(255,255,255,0.08)',
    borderRadius:   '20px',
    padding:        '4px 14px',
    fontSize:       '12px',
    color:          'rgba(229,231,235,0.7)',
    letterSpacing:  '0.04em',
    fontFamily:     "'DM Sans', sans-serif",
  },
  localWrapper: {
    position:     'absolute',
    bottom:       '72px',
    right:        '16px',
    width:        '140px',
    height:       '100px',
    borderRadius: '10px',
    overflow:     'hidden',
    zIndex:       10,
    border:       '1.5px solid rgba(245,158,11,0.25)',
    boxShadow:    '0 4px 20px rgba(0,0,0,0.5)',
    background:   '#0d1117',
  },
  localVideo: {
    width:     '100%',
    height:    '100%',
    objectFit: 'cover',
    transform: 'scaleX(-1)', // mirror local
    transition: 'opacity 0.2s',
  },
  cameraOffOverlay: {
    position:       'absolute',
    inset:          0,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    background:     '#0d1117',
  },
  controls: {
    position:       'absolute',
    bottom:         '16px',
    left:           '50%',
    transform:      'translateX(-50%)',
    zIndex:         10,
    display:        'flex',
    alignItems:     'center',
    gap:            '12px',
    padding:        '10px 20px',
    background:     'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(12px)',
    borderRadius:   '40px',
    border:         '1px solid rgba(255,255,255,0.07)',
  },
  endBtn: {
    width:          '48px',
    height:         '48px',
    borderRadius:   '50%',
    border:         'none',
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    background:     '#ef4444',
    color:          '#fff',
    transition:     'all 0.15s',
    flexShrink:     0,
  },
  answerBtn: {
    width:          '48px',
    height:         '48px',
    borderRadius:   '50%',
    border:         'none',
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    background:     '#10b981',
    color:          '#fff',
    transition:     'all 0.15s',
    flexShrink:     0,
  },
  centeredScreen: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '12px',
    width:          '100%',
    height:         '100%',
    background:     'linear-gradient(160deg, #0d1117 0%, #111827 100%)',
  },
  pulseRing: {
    // CSS pulse animation via inline style on mount
    animation: 'vcPulse 2s ease-in-out infinite',
  },
  avatarRing: {
    width:          '72px',
    height:         '72px',
    borderRadius:   '50%',
    background:     'rgba(245,158,11,0.12)',
    border:         '2px solid rgba(245,158,11,0.3)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize:   '26px',
    fontWeight: 700,
    color:      '#F59E0B',
    fontFamily: "'DM Sans', sans-serif",
  },
  callingLabel: {
    fontSize:      '11px',
    color:         'rgba(229,231,235,0.4)',
    letterSpacing: '0.12em',
    margin:        0,
    fontFamily:    "'DM Sans', sans-serif",
    textTransform: 'uppercase',
  },
  callingName: {
    fontSize:   '18px',
    fontWeight: 600,
    color:      '#E5E7EB',
    margin:     0,
    fontFamily: "'DM Sans', sans-serif",
  },
  connectingText: {
    fontSize:   '12px',
    color:      'rgba(229,231,235,0.3)',
    fontFamily: "'DM Sans', sans-serif",
  },
  errorToast: {
    position:    'absolute',
    top:         '16px',
    left:        '50%',
    transform:   'translateX(-50%)',
    zIndex:      20,
    background:  'rgba(239,68,68,0.15)',
    border:      '1px solid rgba(239,68,68,0.3)',
    borderRadius: '8px',
    padding:     '8px 16px',
    fontSize:    '12px',
    color:       '#ef4444',
    whiteSpace:  'nowrap',
    fontFamily:  "'DM Sans', sans-serif",
  },
};
