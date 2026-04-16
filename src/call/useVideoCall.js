/**
 * useVideoCall.js — WebRTC 1-to-1 video call hook
 * FIX: Updated payload keys to match backend 'to' property.
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
  const incomingRef       = useRef(null);
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
        // FIX: Changed toUserId to 'to'
        socket.emit('ice-candidate', { to: targetUserId, candidate });
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

  const startCall = useCallback(async (targetUser) => {
    if (callStateRef.current !== CallState.IDLE) {
      console.warn('[startCall] ⚠️  Already in call state:', callStateRef.current);
      return;
    }
    const socket = getSocket();
    if (!socket?.connected) { 
      console.error('[startCall] ❌ Socket not connected');
      setCallError('Not connected'); 
      return; 
    }

    const targetId = (targetUser._id || targetUser.id)?.toString();
    if (!targetId) {
      console.error('[startCall] ❌ Invalid target user:', targetUser);
      setCallError('Invalid user');
      return;
    }

    console.log('[startCall] 📞 Initiating call to:', targetId, '(', targetUser.name, ')');

    try {
      setCallState(CallState.CALLING);
      setRemoteUser({ ...targetUser, id: targetId });
      setCallError(null);

      console.log('[startCall] 🎥 Getting local stream...');
      const stream = await getLocalStream();
      console.log('[startCall] ✅ Local stream acquired');
      
      console.log('[startCall] 🔗 Creating peer connection...');
      const pc     = createPC(targetId);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      console.log('[startCall] ✅ Tracks added to peer connection');

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('[startCall] ✅ Offer created and set as local description');

      const payload = {
        to: targetId,
        from: { id: user._id || user.id, name: user.name },
        offer: pc.localDescription,
      };
      console.log('[startCall] 📤 Emitting call-user event:', { to: payload.to, from: payload.from, offerType: payload.offer.type });
      socket.emit('call-user', payload);
      console.log('[startCall] ✅ call-user event emitted successfully');
    } catch (err) {
      console.error('[startCall] ❌ Error:', err);
      setCallError(err.message || 'Failed to start call');
      cleanup();
    }
  }, [getLocalStream, createPC, cleanup, user]);

  const answerCall = useCallback(async () => {
    const payload = incomingRef.current;
    if (!payload) {
      console.error('[answerCall] ❌ No incoming call payload');
      return;
    }
    const socket = getSocket();
    if (!socket) {
      console.error('[answerCall] ❌ Socket not available');
      return;
    }

    const callerId = payload.from.id;
    console.log('[answerCall] 📞 Answering call from:', callerId, '(', payload.from.name, ')');

    try {
      setCallState(CallState.CONNECTED);
      setCallError(null);

      console.log('[answerCall] 🎥 Getting local stream...');
      const stream = await getLocalStream();
      console.log('[answerCall] ✅ Local stream acquired');
      
      console.log('[answerCall] 🔗 Creating peer connection...');
      const pc     = createPC(callerId);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      console.log('[answerCall] ✅ Tracks added to peer connection');

      console.log('[answerCall] 🔗 Setting remote description (offer)...');
      await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
      remoteDescSet.current = true;
      console.log('[answerCall] ✅ Remote description set');
      
      await drainCandidates();
      console.log('[answerCall] ✅ Pending ICE candidates drained');

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('[answerCall] ✅ Answer created and set as local description');

      const answerPayload = {
        to: callerId,
        answer: pc.localDescription,
      };
      console.log('[answerCall] 📤 Emitting answer-call event to:', answerPayload.to);
      socket.emit('answer-call', answerPayload);
      console.log('[answerCall] ✅ answer-call event emitted successfully');
    } catch (err) {
      console.error('[answerCall] ❌ Error:', err);
      setCallError(err.message || 'Failed to answer');
      cleanup();
    }
  }, [getLocalStream, createPC, drainCandidates, cleanup]);

  const rejectCall = useCallback(() => {
    const socket  = getSocket();
    const payload = incomingRef.current;
    // FIX: Changed toUserId to 'to'
    if (socket && payload?.from?.id) {
      socket.emit('end-call', { to: payload.from.id });
    }
    cleanup();
  }, [cleanup]);

  const endCall = useCallback(() => {
    const socket   = getSocket();
    const targetId = remoteUser?.id;
    // FIX: Changed toUserId to 'to'
    if (socket && targetId) {
      socket.emit('end-call', { to: targetId });
    }
    cleanup();
  }, [remoteUser, cleanup]);

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

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onIncoming = (payload) => {
      console.log('[incoming-call] ✅ RECEIVED | from:', payload?.from, '| offer:', !!payload?.offer);
      if (callStateRef.current !== CallState.IDLE) {
        console.log('[incoming-call] ⚠️  REJECTED - already in call state:', callStateRef.current);
        socket.emit('end-call', { to: payload.from.id });
        return;
      }
      console.log('[incoming-call] ✅ ACCEPTED - setting state to INCOMING');
      incomingRef.current = payload;
      setCallState(CallState.INCOMING);
      setRemoteUser(payload.from);
    };

    const onAnswered = async ({ answer }) => {
      console.log('[call-answered] ✅ RECEIVED | answer:', !!answer);
      const pc = pcRef.current;
      if (!pc) {
        console.warn('[call-answered] ⚠️  No peer connection');
        return;
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        remoteDescSet.current = true;
        await drainCandidates();
        setCallState(CallState.CONNECTED);
        console.log('[call-answered] ✅ Connection established');
      } catch (err) {
        console.error('[call-answered] ❌ Error:', err);
      }
    };

    const onIce = async ({ candidate }) => {
      const pc = pcRef.current;
      if (!pc) return;
      if (!remoteDescSet.current) { 
        pendingCandidates.current.push(candidate);
        console.log('[ice-candidate] 📦 Queued (remote desc not set yet)');
        return; 
      }
      try { 
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)); 
        console.log('[ice-candidate] ✅ Added');
      }
      catch (err) { 
        console.warn('[ice-candidate] ⚠️  Failed:', err.message);
      }
    };

    const onEndCall = () => {
      console.log('[end-call] ✅ RECEIVED - cleaning up');
      cleanup();
    };

    console.log('[useVideoCall] 🔌 Registering socket listeners');
    socket.on('incoming-call', onIncoming);
    socket.on('call-answered', onAnswered);
    socket.on('ice-candidate', onIce);
    socket.on('end-call',      onEndCall);

    return () => {
      console.log('[useVideoCall] 🔌 Unregistering socket listeners');
      socket.off('incoming-call', onIncoming);
      socket.off('call-answered', onAnswered);
      socket.off('ice-candidate', onIce);
      socket.off('end-call',      onEndCall);
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