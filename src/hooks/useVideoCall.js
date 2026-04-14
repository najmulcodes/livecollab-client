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
  const pcRef              = useRef(null);
  const localStreamRef     = useRef(null);
  const screenStreamRef    = useRef(null);
  const localVideoRef      = useRef(null);
  const remoteVideoRef     = useRef(null);
  const pendingCandidates  = useRef([]);
  const remoteDescSet      = useRef(false);
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
        // FIX: field name is `to` (matches server handler)
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
      pcRef.current.onicecandidate          = null;
      pcRef.current.ontrack                 = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    if (localVideoRef.current)  localVideoRef.current.srcObject  = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    pendingCandidates.current  = [];
    remoteDescSet.current      = false;
    incomingPayloadRef.current = null;

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

    // IMPORTANT: targetUser._id must be the MongoDB ObjectId string.
    // This must match exactly what the server uses as the room key.
    // Never use targetUser.email or targetUser.name here.
    const targetId = targetUser._id?.toString() ?? targetUser.id?.toString();
    if (!targetId) {
      setCallError('Target user has no valid _id');
      return;
    }

    try {
      setCallState(CallState.CALLING);
      setRemoteUser({ id: targetId, name: targetUser.name });
      setCallError(null);

      const stream = await getLocalStream();
      const pc     = createPeerConnection(targetId);

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // FIX: emit field is `to` (server reads `to`, not `toUserId`)
      // Also send `from` so the server can relay it — prevents the server
      // from needing to reconstruct it from socket.user, keeping relay pure.
      console.log(`[startCall] emitting call-user → to=${targetId}`);
      socket.emit('call-user', {
        to:   targetId,
        from: { id: user._id?.toString() ?? user.id, name: user.name },
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

      // FIX: emit field is `to` (server reads `to`)
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
      // FIX: field is `to`
      socket.emit('end-call', { to: remoteUser.id });
    }
    cleanup();
  }, [remoteUser, cleanup]);

  // ─── End active call ───────────────────────────────────────────────────────

  const endCall = useCallback(() => {
    const socket = getSocket();
    if (socket && remoteUser) {
      // FIX: field is `to`
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
      } catch { /* user cancelled screen pick */ }
    }
  }, [isScreenSharing]);

  // ─── Socket event listeners ────────────────────────────────────────────────

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onIncomingCall = (payload) => {
      console.log('[incoming-call] ✅ RECEIVED from', payload?.from);
      if (callState !== CallState.IDLE) {
        socket.emit('end-call', { to: payload.from.id });
        return;
      }
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
      } catch { /* stale */ }
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