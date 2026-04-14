/**
 * useVideoCall.js — WebRTC 1-to-1 video call hook
 *
 * FIXES vs previous version:
 *   - All socket emits use `toUserId` (matches backend index.js handler signatures)
 *   - Incoming payload stored in useRef (not on socket object)
 *   - callStateRef prevents stale closure in socket callbacks
 *   - toggleScreenShare dep array fixed
 *
 * BUG FIX (root cause — socket routing failure):
 *   - targetUser coming from Redux store / presence list is a PLAIN object.
 *     Plain objects have no Mongoose virtual `.id` getter — only `._id`.
 *     So targetUser.id === undefined → socket.emit('call-user', { toUserId: undefined })
 *     → io.to(undefined) on server → no room match → receiver never gets incoming-call.
 *   - Fix: normalize to string via (targetUser._id || targetUser.id).toString()
 *     and store the normalized id on remoteUser so endCall also works correctly.
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

  const [callState,       setCallState]      = useState(CallState.IDLE);
  const [remoteUser,      setRemoteUser]      = useState(null);
  const [isMuted,         setIsMuted]         = useState(false);
  const [isCameraOff,     setIsCameraOff]     = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callError,       setCallError]       = useState(null);

  const pcRef             = useRef(null);
  const localStreamRef    = useRef(null);
  const screenStreamRef   = useRef(null);
  const localVideoRef     = useRef(null);
  const remoteVideoRef    = useRef(null);
  const pendingCandidates = useRef([]);
  const remoteDescSet     = useRef(false);
  const incomingRef       = useRef(null);   // stores incoming call payload
  const callStateRef      = useRef(callState);

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

  const createPC = useCallback((targetUserId) => {
    const socket = getSocket();
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socket) {
        socket.emit('ice-candidate', { toUserId: targetUserId, candidate });
      }
    };

    pc.ontrack = (e) => attachStream(remoteVideoRef, e.streams[0]);

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
    incomingRef.current       = null;

    setCallState(CallState.IDLE);
    setRemoteUser(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    setCallError(null);
  }, []);

  const drainCandidates = useCallback(async () => {
    if (!pcRef.current) return;
    for (const c of pendingCandidates.current) {
      try { await pcRef.current.addIceCandidate(new RTCIceCandidate(c)); }
      catch { /* stale */ }
    }
    pendingCandidates.current = [];
  }, []);

  // ── startCall ──────────────────────────────────────────────────────────────
  const startCall = useCallback(async (targetUser) => {
    if (callStateRef.current !== CallState.IDLE) return;
    const socket = getSocket();
    if (!socket?.connected) { setCallError('Not connected'); return; }

    // FIX: targetUser is a plain object from the store — it has ._id not .id
    // (._id may be an ObjectId or already a string depending on serialization)
    // Always resolve to a plain string before using as a socket room address.
    const targetId = (targetUser._id || targetUser.id)?.toString();
    if (!targetId) {
      console.error('[VideoCall] startCall — could not resolve targetUser id', targetUser);
      setCallError('Invalid user');
      return;
    }

    console.log('[VideoCall] startCall → targetId:', targetId);

    try {
      setCallState(CallState.CALLING);
      // Store normalized remoteUser so endCall() can reliably read .id
      setRemoteUser({ ...targetUser, id: targetId });
      setCallError(null);

      const stream = await getLocalStream();
      // FIX: pass targetId (string) not targetUser.id (was undefined)
      const pc     = createPC(targetId);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // FIX: toUserId is now targetId (string), not undefined
      socket.emit('call-user', {
        toUserId: targetId,
        offer:    pc.localDescription,
      });
    } catch (err) {
      setCallError(err.message || 'Failed to start call');
      cleanup();
    }
  }, [getLocalStream, createPC, cleanup]);

  // ── answerCall ─────────────────────────────────────────────────────────────
  const answerCall = useCallback(async () => {
    const payload = incomingRef.current;
    if (!payload) return;
    const socket = getSocket();
    if (!socket) return;

    // payload.from.id is constructed by the server from userId (_id.toString()) — safe
    const callerId = payload.from.id;
    console.log('[VideoCall] answerCall → callerId:', callerId);

    try {
      setCallState(CallState.CONNECTED);
      setCallError(null);

      const stream = await getLocalStream();
      const pc     = createPC(callerId);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
      remoteDescSet.current = true;
      await drainCandidates();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('answer-call', {
        toUserId: callerId,
        answer:   pc.localDescription,
      });
    } catch (err) {
      setCallError(err.message || 'Failed to answer');
      cleanup();
    }
  }, [getLocalStream, createPC, drainCandidates, cleanup]);

  // ── rejectCall / endCall ───────────────────────────────────────────────────
  const rejectCall = useCallback(() => {
    const socket  = getSocket();
    const payload = incomingRef.current;
    // payload.from.id is server-set string — safe
    if (socket && payload?.from?.id) {
      console.log('[VideoCall] rejectCall → toUserId:', payload.from.id);
      socket.emit('end-call', { toUserId: payload.from.id });
    }
    cleanup();
  }, [cleanup]);

  const endCall = useCallback(() => {
    const socket = getSocket();
    // remoteUser.id was normalized to string in startCall (or set from server payload in answerCall)
    const targetId = remoteUser?.id;
    if (socket && targetId) {
      console.log('[VideoCall] endCall → toUserId:', targetId);
      socket.emit('end-call', { toUserId: targetId });
    }
    cleanup();
  }, [remoteUser, cleanup]);

  // ── Media controls ─────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(p => !p);
  }, []);

  const toggleCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCameraOff(p => !p);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;

    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      const cam = localStreamRef.current?.getVideoTracks()[0];
      if (cam) {
        pc.getSenders().find(s => s.track?.kind === 'video')?.replaceTrack(cam);
        attachStream(localVideoRef, localStreamRef.current);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const ss = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = ss;
        const st = ss.getVideoTracks()[0];
        pc.getSenders().find(s => s.track?.kind === 'video')?.replaceTrack(st);
        if (localVideoRef.current) localVideoRef.current.srcObject = ss;
        st.onended = () => toggleScreenShare();
        setIsScreenSharing(true);
      } catch { /* cancelled */ }
    }
  }, [isScreenSharing]);

  // ── Socket listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onIncoming = (payload) => {
      if (callStateRef.current !== CallState.IDLE) {
        socket.emit('end-call', { toUserId: payload.from.id });
        return;
      }
      incomingRef.current = payload;
      setCallState(CallState.INCOMING);
      setRemoteUser(payload.from);
    };

    const onAnswered = async ({ answer }) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        remoteDescSet.current = true;
        await drainCandidates();
        setCallState(CallState.CONNECTED);
      } catch { /* stale */ }
    };

    const onIce = async ({ candidate }) => {
      const pc = pcRef.current;
      if (!pc) return;
      if (!remoteDescSet.current) { pendingCandidates.current.push(candidate); return; }
      try { await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)); }
      catch { /* stale */ }
    };

    socket.on('incoming-call', onIncoming);
    socket.on('call-answered', onAnswered);
    socket.on('ice-candidate', onIce);
    socket.on('end-call',      cleanup);

    return () => {
      socket.off('incoming-call', onIncoming);
      socket.off('call-answered', onAnswered);
      socket.off('ice-candidate', onIce);
      socket.off('end-call',      cleanup);
    };
  }, [cleanup, drainCandidates]);

  useEffect(() => () => cleanup(), []);

  return {
    callState, remoteUser, isMuted, isCameraOff, isScreenSharing, callError,
    localVideoRef, remoteVideoRef,
    startCall, answerCall, rejectCall, endCall,
    toggleMute, toggleCamera, toggleScreenShare,
  };
}