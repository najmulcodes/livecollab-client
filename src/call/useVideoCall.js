/**
 * useVideoCall.js — WebRTC 1-to-1 video call hook
 *
 * FIXES:
 *   - Incoming payload stored in useRef (not on socket object — that was a race condition)
 *   - answerCall() reads from the ref, not socket._incomingPayload
 *   - toggleScreenShare dependency array fixed (was missing isScreenSharing)
 *   - Cleanup runs on unmount via useEffect return
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { getSocket } from '../socket/socket';
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

  const [callState,       setCallState]       = useState(CallState.IDLE);
  const [remoteUser,      setRemoteUser]       = useState(null);
  const [isMuted,         setIsMuted]          = useState(false);
  const [isCameraOff,     setIsCameraOff]      = useState(false);
  const [isScreenSharing, setIsScreenSharing]  = useState(false);
  const [callError,       setCallError]        = useState(null);

  const pcRef              = useRef(null);
  const localStreamRef     = useRef(null);
  const screenStreamRef    = useRef(null);
  const localVideoRef      = useRef(null);
  const remoteVideoRef     = useRef(null);
  const pendingCandidates  = useRef([]);
  const remoteDescSet      = useRef(false);

  // ✅ FIX: store incoming payload in a ref — NOT on the socket object
  const incomingPayloadRef = useRef(null);

  // Keep callState accessible inside socket callbacks without stale closure
  const callStateRef = useRef(callState);
  useEffect(() => { callStateRef.current = callState; }, [callState]);

  const attachStream = (videoRef, stream) => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
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
      if (['disconnected', 'failed'].includes(pc.connectionState)) cleanup();
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
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    if (localVideoRef.current)  localVideoRef.current.srcObject  = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    pendingCandidates.current = [];
    remoteDescSet.current     = false;
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
      try { await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)); }
      catch { /* stale — safe to ignore */ }
    }
    pendingCandidates.current = [];
  }, []);

  // ── Outbound call ──────────────────────────────────────────────────────────

  const startCall = useCallback(async (targetUser) => {
    if (callStateRef.current !== CallState.IDLE) return;
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

      // ✅ Emit call-user with correct userId (not socket.id)
      socket.emit('call-user', {
        to:   targetUser.id,
        from: { id: user?.id || user?._id, name: user?.name },
        offer: pc.localDescription,
      });
    } catch (err) {
      setCallError(err.message || 'Failed to start call');
      cleanup();
    }
  }, [user, getLocalStream, createPeerConnection, cleanup]);

  // ── Answer call ────────────────────────────────────────────────────────────

  const answerCall = useCallback(async () => {
    // ✅ FIX: read from ref, not from socket object
    const payload = incomingPayloadRef.current;
    if (!payload) return;

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
    const payload = incomingPayloadRef.current;
    if (socket && payload) socket.emit('end-call', { to: payload.from.id });
    cleanup();
  }, [cleanup]);

  const endCall = useCallback(() => {
    const socket = getSocket();
    if (socket && remoteUser) socket.emit('end-call', { to: remoteUser.id });
    cleanup();
  }, [remoteUser, cleanup]);

  // ── Media controls ─────────────────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(prev => !prev);
  }, []);

  const toggleCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
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
          if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        }
        screenTrack.onended = () => toggleScreenShare();
        setIsScreenSharing(true);
      } catch { /* user cancelled */ }
    }
  }, [isScreenSharing]); // ✅ FIX: was missing isScreenSharing in deps

  // ── Socket event listeners ─────────────────────────────────────────────────

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onIncomingCall = (payload) => {
      if (callStateRef.current !== CallState.IDLE) {
        // Already in call — auto-reject
        socket.emit('end-call', { to: payload.from.id });
        return;
      }
      // ✅ FIX: store in ref, not on socket object
      incomingPayloadRef.current = payload;
      setCallState(CallState.INCOMING);
      setRemoteUser(payload.from);
    };

    const onCallAnswered = async (payload) => {
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
      try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
      catch { /* stale */ }
    };

    const onEndCall = () => cleanup();

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
  }, [cleanup, drainCandidates]);

  // Cleanup on unmount
  useEffect(() => () => cleanup(), []);

  return {
    callState, remoteUser, isMuted, isCameraOff, isScreenSharing, callError,
    localVideoRef, remoteVideoRef,
    startCall, answerCall, rejectCall, endCall,
    toggleMute, toggleCamera, toggleScreenShare,
  };
}
