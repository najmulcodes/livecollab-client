import { useEffect, useRef, useCallback, useState } from 'react';
import { getSocket } from "../socket/socket";
import useAuthStore from '../store/authStore';

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

export const CallState = {
  IDLE:      'idle',
  CALLING:   'calling',
  INCOMING:  'incoming',
  CONNECTED: 'connected',
};

export function useVideoCall() {
  const { user } = useAuthStore();

  // ─── State ─────────────────────────────────────────────────────────────────
  const [callState,        setCallState]        = useState(CallState.IDLE);
  const [remoteUser,       setRemoteUser]       = useState(null);   // { id, name }
  const [isMuted,          setIsMuted]          = useState(false);
  const [isCameraOff,      setIsCameraOff]      = useState(false);
  const [isScreenSharing,  setIsScreenSharing]  = useState(false);
  const [callError,        setCallError]        = useState(null);

  // ─── Refs ──────────────────────────────────────────────────────────────────
  const pcRef              = useRef(null);   // RTCPeerConnection
  const localStreamRef     = useRef(null);   // camera + mic stream
  const screenStreamRef    = useRef(null);   // screen capture stream
  const localVideoRef      = useRef(null);   // <video> DOM ref (local)
  const remoteVideoRef     = useRef(null);   // <video> DOM ref (remote)
  const pendingCandidates  = useRef([]);     // ICE candidates queued before remote desc is set
  const remoteDescSet      = useRef(false);  // guard for queueing ICE candidates
  // FIX: store incoming call payload in a ref — NOT on the socket object
  const incomingPayloadRef = useRef(null);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const attachStream = (videoRef, stream) => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  };

  const getLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    attachStream(localVideoRef, stream);
    return stream;
  }, []);

  const createPeerConnection = useCallback((targetUserId) => {
    const socket = getSocket();
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socket) {
        socket.emit('ice-candidate', { to: targetUserId, candidate });
      }
    };

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

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;

    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;

    if (pcRef.current) {
      pcRef.current.onicecandidate         = null;
      pcRef.current.ontrack                = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    if (localVideoRef.current)  localVideoRef.current.srcObject  = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    pendingCandidates.current    = [];
    remoteDescSet.current        = false;
    incomingPayloadRef.current   = null; // clear stored payload on cleanup

    setCallState(CallState.IDLE);
    setRemoteUser(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    setCallError(null);
  }, []);

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

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log(`[startCall] emitting call-user → to=${targetUser.id}`);
      socket.emit('call-user', {
        to:   targetUser.id,
        from: { id: user.id, name: user.name },
        offer: pc.localDescription,
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

      await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
      remoteDescSet.current = true;
      await drainCandidates();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.log(`[answerCall] emitting answer-call → to=${payload.from.id}`);
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
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
          }
        }

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
      console.log('[incoming-call] received from', payload?.from);
      if (callState !== CallState.IDLE) {
        // Already in a call — auto-reject
        socket.emit('end-call', { to: payload.from.id });
        return;
      }
      // FIX: store payload in ref, NOT on the socket object
      incomingPayloadRef.current = payload;
      setCallState(CallState.INCOMING);
      setRemoteUser(payload.from);
    };

    const onCallAnswered = async (payload) => {
      console.log('[call-answered] received', !!payload?.answer);
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

    const onEndCall = () => {
      console.log('[end-call] received — cleaning up');
      cleanup();
    };

    socket.on('incoming-call', onIncomingCall);
    socket.on('call-answered', onCallAnswered);
    socket.on('ice-candidate', onIceCandidate);
    socket.on('end-call',      onEndCall);

    return () => {
      socket.off('incoming-call', onIncomingCall);
      socket.off('call-answered', onCallAnswered);
      socket.off('ice-candidate', onIceCandidate);
      socket.off('end-call',      onEndCall);
    };
  }, [callState, cleanup, drainCandidates]);

  // Cleanup on unmount
  useEffect(() => () => cleanup(), []);

  // ─── Public API ────────────────────────────────────────────────────────────

  return {
    callState,
    remoteUser,
    isMuted,
    isCameraOff,
    isScreenSharing,
    callError,

    localVideoRef,
    remoteVideoRef,

    startCall,
    // FIX: reads from incomingPayloadRef (stable ref) instead of socket._incomingPayload
    answerCall: () => {
      if (incomingPayloadRef.current) {
        answerCall(incomingPayloadRef.current);
      }
    },
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
  };
}