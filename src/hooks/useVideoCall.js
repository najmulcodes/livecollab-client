/**
 * useVideoCall.js — WebRTC 1-to-1 video call hook
 *
 * Manages:
 *   - getUserMedia (camera + mic)
 *   - RTCPeerConnection lifecycle
 *   - ICE candidate exchange via Socket.IO
 *   - Offer/Answer signaling
 *   - Screen sharing
 *   - Call cleanup
 *
 * Socket events used:
 *   OUTBOUND:  call-user, answer-call, ice-candidate, end-call
 *   INBOUND:   incoming-call, call-answered, ice-candidate, end-call
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { getSocket } from '../socket/socket';
import useAuthStore from '../store/authStore';

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

/**
 * CallState enum
 *   idle       → no call
 *   calling    → we initiated, waiting for answer
 *   incoming   → receiving call, not yet answered
 *   connected  → active call
 */
export const CallState = {
  IDLE:      'idle',
  CALLING:   'calling',
  INCOMING:  'incoming',
  CONNECTED: 'connected',
};

export function useVideoCall() {
  const { user } = useAuthStore();

  // ─── State ─────────────────────────────────────────────────────────────────
  const [callState,      setCallState]      = useState(CallState.IDLE);
  const [remoteUser,     setRemoteUser]     = useState(null);   // { id, name }
  const [isMuted,        setIsMuted]        = useState(false);
  const [isCameraOff,    setIsCameraOff]    = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callError,      setCallError]      = useState(null);

  // ─── Refs (not state — mutations must not trigger re-renders) ──────────────
  const pcRef            = useRef(null);   // RTCPeerConnection
  const localStreamRef   = useRef(null);   // camera + mic stream
  const screenStreamRef  = useRef(null);   // screen capture stream
  const localVideoRef    = useRef(null);   // <video> DOM ref (local)
  const remoteVideoRef   = useRef(null);   // <video> DOM ref (remote)
  const pendingCandidates = useRef([]);    // ICE candidates queued before remote desc is set
  const remoteDescSet    = useRef(false);  // guard for queueing ICE candidates

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /** Attach a stream to a video element ref safely */
  const attachStream = (videoRef, stream) => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  };

  /** Get camera+mic stream and cache it */
  const getLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStreamRef.current = stream;
    attachStream(localVideoRef, stream);
    return stream;
  }, []);

  /** Build a fresh RTCPeerConnection with ICE handlers */
  const createPeerConnection = useCallback((targetUserId) => {
    const socket = getSocket();
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Send ICE candidates to the other peer via socket
    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socket) {
        socket.emit('ice-candidate', {
          to:        targetUserId,
          candidate,
        });
      }
    };

    // When we receive remote tracks, attach to remote video element
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      attachStream(remoteVideoRef, remoteStream);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        cleanup();
      }
    };

    pcRef.current = pc;
    return pc;
  }, []);

  /** Full cleanup — call on end or error */
  const cleanup = useCallback(() => {
    // Stop local camera/mic
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;

    // Stop screen share if active
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;

    // Close peer connection
    if (pcRef.current) {
      pcRef.current.onicecandidate  = null;
      pcRef.current.ontrack         = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current)  localVideoRef.current.srcObject  = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    // Reset state
    pendingCandidates.current = [];
    remoteDescSet.current     = false;

    setCallState(CallState.IDLE);
    setRemoteUser(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    setCallError(null);
  }, []);

  /** Drain queued ICE candidates once remote description is set */
  const drainCandidates = useCallback(async () => {
    if (!pcRef.current) return;
    for (const candidate of pendingCandidates.current) {
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch { /* stale candidate — safe to ignore */ }
    }
    pendingCandidates.current = [];
  }, []);

  // ─── Outbound call ─────────────────────────────────────────────────────────

  /**
   * startCall — initiate a call to another workspace member
   * @param {{ id: string, name: string }} targetUser
   */
  const startCall = useCallback(async (targetUser) => {
    if (callState !== CallState.IDLE) return;
    const socket = getSocket();
    if (!socket) { setCallError('Socket not connected'); return; }

    try {
      setCallState(CallState.CALLING);
      setRemoteUser(targetUser);
      setCallError(null);

      const stream = await getLocalStream();
      const pc     = createPeerConnection(targetUser.id);

      // Add local tracks to the connection
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Create and set local offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call-user', {
        to:     targetUser.id,
        from:   { id: user.id, name: user.name },
        offer:  pc.localDescription,
      });
    } catch (err) {
      setCallError(err.message || 'Failed to start call');
      cleanup();
    }
  }, [callState, user, getLocalStream, createPeerConnection, cleanup]);

  // ─── Answer incoming call ──────────────────────────────────────────────────

  const answerCall = useCallback(async (payload) => {
    const socket = getSocket();
    if (!socket) return;

    try {
      setCallState(CallState.CONNECTED);
      setCallError(null);

      const stream = await getLocalStream();
      const pc     = createPeerConnection(payload.from.id);

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Set the remote offer
      await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
      remoteDescSet.current = true;
      await drainCandidates();

      // Create and send answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('answer-call', {
        to:     payload.from.id,
        answer: pc.localDescription,
      });
    } catch (err) {
      setCallError(err.message || 'Failed to answer call');
      cleanup();
    }
  }, [getLocalStream, createPeerConnection, drainCandidates, cleanup]);

  const rejectCall = useCallback(() => {
    const socket = getSocket();
    if (socket && remoteUser) {
      socket.emit('end-call', { to: remoteUser.id });
    }
    cleanup();
  }, [remoteUser, cleanup]);

  // ─── End active call ───────────────────────────────────────────────────────

  const endCall = useCallback(() => {
    const socket = getSocket();
    if (socket && remoteUser) {
      socket.emit('end-call', { to: remoteUser.id });
    }
    cleanup();
  }, [remoteUser, cleanup]);

  // ─── Media controls ────────────────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(prev => !prev);
  }, []);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCameraOff(prev => !prev);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;

    if (isScreenSharing) {
      // Revert to camera
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;

      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      if (cameraTrack) {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        sender?.replaceTrack(cameraTrack);
        attachStream(localVideoRef, localStreamRef.current);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
          // Show screen share in local preview
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
          }
        }

        // Auto-revert when user stops via browser UI
        screenTrack.onended = () => toggleScreenShare();
        setIsScreenSharing(true);
      } catch { /* User cancelled screen pick — safe to ignore */ }
    }
  }, [isScreenSharing]);

  // ─── Socket event listeners ────────────────────────────────────────────────

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onIncomingCall = (payload) => {
      if (callState !== CallState.IDLE) {
        // Already in a call — reject automatically
        socket.emit('end-call', { to: payload.from.id });
        return;
      }
      setCallState(CallState.INCOMING);
      setRemoteUser(payload.from);
      // Store payload on ref so answerCall can access it
      socket._incomingPayload = payload;
    };

    const onCallAnswered = async (payload) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
        remoteDescSet.current = true;
        await drainCandidates();
        setCallState(CallState.CONNECTED);
      } catch { /* ignore stale answer */ }
    };

    const onIceCandidate = async ({ candidate }) => {
      const pc = pcRef.current;
      if (!pc) return;
      if (!remoteDescSet.current) {
        pendingCandidates.current.push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch { /* stale */ }
    };

    const onEndCall = () => cleanup();

    socket.on('incoming-call',  onIncomingCall);
    socket.on('call-answered',  onCallAnswered);
    socket.on('ice-candidate',  onIceCandidate);
    socket.on('end-call',       onEndCall);

    return () => {
      socket.off('incoming-call',  onIncomingCall);
      socket.off('call-answered',  onCallAnswered);
      socket.off('ice-candidate',  onIceCandidate);
      socket.off('end-call',       onEndCall);
    };
  }, [callState, cleanup, drainCandidates]);

  // Cleanup on unmount
  useEffect(() => () => cleanup(), []);

  // ─── Public API ────────────────────────────────────────────────────────────

  return {
    // State
    callState,
    remoteUser,
    isMuted,
    isCameraOff,
    isScreenSharing,
    callError,

    // Video refs (attach to <video> elements)
    localVideoRef,
    remoteVideoRef,

    // Actions
    startCall,
    answerCall: () => {
      const socket = getSocket();
      if (socket?._incomingPayload) answerCall(socket._incomingPayload);
    },
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
  };
}
