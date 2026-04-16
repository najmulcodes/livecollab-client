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
  
  // ─── Timeout + Audio refs ──────────────────────────────────────────────────
  const callTimeoutRef    = useRef(null);
  const outgoingAudioRef  = useRef(null);
  const incomingAudioRef  = useRef(null);

  useEffect(() => { callStateRef.current = callState; }, [callState]);

  // ─── Initialize audio on mount ─────────────────────────────────────────────
  useEffect(() => {
    // Create audio instances (lazy load)
    outgoingAudioRef.current = new Audio('/sounds/calling.mp3');
    outgoingAudioRef.current.loop = true;
    
    incomingAudioRef.current = new Audio('/sounds/ringtone.mp3');
    incomingAudioRef.current.loop = true;

    return () => {
      // Cleanup audio on unmount
      if (outgoingAudioRef.current) {
        outgoingAudioRef.current.pause();
        outgoingAudioRef.current = null;
      }
      if (incomingAudioRef.current) {
        incomingAudioRef.current.pause();
        incomingAudioRef.current = null;
      }
    };
  }, []);

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
        socket.emit('ice-candidate', { to: targetUserId, candidate });
      }
    };

    pc.ontrack = (e) => attachStream(remoteVideoRef, e.streams[0]);

    pc.onconnectionstatechange = () => {
      console.log('[peer] Connection state:', pc.connectionState);
      // FIX: Check callState before cleanup to prevent race condition
      if (['disconnected', 'failed'].includes(pc.connectionState)) {
        const currentState = callStateRef.current;
        console.warn('[peer] ⚠️  Connection', pc.connectionState, '| callState:', currentState);
        // Only cleanup if we're actually in a call (not during normal end)
        if (currentState !== CallState.IDLE) {
          console.log('[peer] 🧹 Calling cleanup due to peer failure');
          // Use ref to avoid dependency
          if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
          if (outgoingAudioRef.current) {
            outgoingAudioRef.current.pause();
            outgoingAudioRef.current.currentTime = 0;
          }
          if (incomingAudioRef.current) {
            incomingAudioRef.current.pause();
            incomingAudioRef.current.currentTime = 0;
          }
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
          if (localVideoRef.current) localVideoRef.current.srcObject = null;
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
          pendingCandidates.current = [];
          remoteDescSet.current = false;
          incomingRef.current = null;
          setCallState(CallState.IDLE);
          setRemoteUser(null);
          setIsMuted(false);
          setIsCameraOff(false);
          setIsScreenSharing(false);
          setCallError('Connection lost');
        }
      }
    };

    pcRef.current = pc;
    return pc;
  }, []); // FIX: Empty deps - no cleanup dependency

  const cleanup = useCallback(() => {
    console.log('[cleanup] 🧹 Starting cleanup | callState:', callStateRef.current);
    
    // ─── Clear timeout ─────────────────────────────────────────────────────────
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
      console.log('[cleanup] ⏱️  Timeout cleared');
    }

    // ─── Stop audio ────────────────────────────────────────────────────────────
    if (outgoingAudioRef.current) {
      outgoingAudioRef.current.pause();
      outgoingAudioRef.current.currentTime = 0;
      console.log('[cleanup] 🔇 Outgoing audio stopped');
    }
    if (incomingAudioRef.current) {
      incomingAudioRef.current.pause();
      incomingAudioRef.current.currentTime = 0;
      console.log('[cleanup] 🔇 Incoming audio stopped');
    }

    // ─── Stop media tracks ─────────────────────────────────────────────────────
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;

    // ─── Close peer connection ─────────────────────────────────────────────────
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
      console.log('[cleanup] 🔌 Peer connection closed');
    }

    // ─── Clear video elements ──────────────────────────────────────────────────
    if (localVideoRef.current)  localVideoRef.current.srcObject  = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    // ─── Reset refs ────────────────────────────────────────────────────────────
    pendingCandidates.current = [];
    remoteDescSet.current     = false;
    incomingRef.current       = null;

    // ─── Reset state ───────────────────────────────────────────────────────────
    setCallState(CallState.IDLE);
    setRemoteUser(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    setCallError(null);
    
    console.log('[cleanup] ✅ Cleanup complete');
  }, []); // Empty deps - cleanup should be stable

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

      // ─── Start outgoing audio ──────────────────────────────────────────────
      if (outgoingAudioRef.current) {
        outgoingAudioRef.current.play().catch(err => {
          console.warn('[startCall] ⚠️  Outgoing audio autoplay blocked:', err.message);
        });
        console.log('[startCall] 🔊 Outgoing audio started');
      }

      // ─── Start 30s timeout ─────────────────────────────────────────────────
      callTimeoutRef.current = setTimeout(() => {
        // FIX: Guard with callState to prevent race condition
        if (callStateRef.current === CallState.CALLING) {
          console.log('[timeout] ⏱️  Call not answered within 30s | callState:', callStateRef.current);
          setCallError('Call timed out');
          socket.emit('end-call', { to: targetId });
          cleanup();
        } else {
          console.log('[timeout] ⏱️  Timeout fired but call already answered/ended | callState:', callStateRef.current);
        }
      }, 30000);
      console.log('[startCall] ⏱️  30s timeout started');
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

      // ─── Stop incoming ringtone ────────────────────────────────────────────
      if (incomingAudioRef.current) {
        incomingAudioRef.current.pause();
        incomingAudioRef.current.currentTime = 0;
        console.log('[answerCall] 🔇 Ringtone stopped');
      }

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
    if (!socket) {
      console.error('[useVideoCall] ❌ Socket not available - cannot register listeners');
      return;
    }

    console.log('[useVideoCall] 🔌 Socket available, registering listeners | socketId:', socket.id, '| connected:', socket.connected);

    const onIncoming = (payload) => {
      console.log('[incoming-call] 🔔 EVENT RECEIVED');
      console.log('[incoming-call] 📦 Payload:', JSON.stringify(payload, null, 2));
      console.log('[incoming-call] 📊 Current callState:', callStateRef.current);
      console.log('[incoming-call] 👤 From:', payload?.from);
      console.log('[incoming-call] 📞 Offer present:', !!payload?.offer);
      
      if (!payload || !payload.from || !payload.offer) {
        console.error('[incoming-call] ❌ Invalid payload - missing required fields');
        return;
      }
      
      if (callStateRef.current !== CallState.IDLE) {
        console.log('[incoming-call] ⚠️  REJECTED - already in call state:', callStateRef.current);
        socket.emit('end-call', { to: payload.from.id });
        return;
      }
      
      console.log('[incoming-call] ✅ ACCEPTED - updating state to INCOMING');
      incomingRef.current = payload;
      
      console.log('[incoming-call] 🔄 Setting state atomically...');
      // FIX: Atomic state update to prevent render between updates
      setCallState(CallState.INCOMING);
      setRemoteUser(payload.from);
      console.log('[incoming-call] ✅ State updated successfully');

      // ─── Start incoming ringtone ───────────────────────────────────────────
      if (incomingAudioRef.current) {
        // FIX: Use setTimeout to ensure state update completes first
        setTimeout(() => {
          if (incomingAudioRef.current && callStateRef.current === CallState.INCOMING) {
            incomingAudioRef.current.play().catch(err => {
              console.warn('[incoming-call] ⚠️  Ringtone autoplay blocked:', err.message);
            });
            console.log('[incoming-call] 🔔 Ringtone started');
          }
        }, 0);
      }
    };

    const onAnswered = async ({ answer }) => {
      console.log('[call-answered] ✅ RECEIVED | answer:', !!answer, '| callState:', callStateRef.current);
      
      // FIX: Clear timeout IMMEDIATELY before any async operations
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
        console.log('[call-answered] ⏱️  Timeout cleared');
      }
      if (outgoingAudioRef.current) {
        outgoingAudioRef.current.pause();
        outgoingAudioRef.current.currentTime = 0;
        console.log('[call-answered] 🔇 Outgoing audio stopped');
      }

      const pc = pcRef.current;
      if (!pc) {
        console.warn('[call-answered] ⚠️  No peer connection');
        return;
      }
      
      // FIX: Guard against processing if already connected or idle
      if (callStateRef.current !== CallState.CALLING) {
        console.warn('[call-answered] ⚠️  Ignoring - not in CALLING state:', callStateRef.current);
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

    console.log('[useVideoCall] 🔌 Registering socket listeners...');
    console.log('[useVideoCall] 📋 Listener: incoming-call');
    socket.on('incoming-call', onIncoming);
    console.log('[useVideoCall] 📋 Listener: call-answered');
    socket.on('call-answered', onAnswered);
    console.log('[useVideoCall] 📋 Listener: ice-candidate');
    socket.on('ice-candidate', onIce);
    console.log('[useVideoCall] 📋 Listener: end-call');
    socket.on('end-call',      onEndCall);
    console.log('[useVideoCall] ✅ All socket listeners registered successfully');

    // Test if listener is actually registered
    const listenerCount = socket.listeners('incoming-call').length;
    console.log('[useVideoCall] 🔍 incoming-call listener count:', listenerCount);
    if (listenerCount === 0) {
      console.error('[useVideoCall] ❌ WARNING: incoming-call listener not registered!');
    }

    return () => {
      console.log('[useVideoCall] 🔌 Unregistering socket listeners...');
      const beforeCount = socket.listeners('incoming-call').length;
      console.log('[useVideoCall] 📊 incoming-call listeners before cleanup:', beforeCount);
      
      socket.off('incoming-call', onIncoming);
      socket.off('call-answered', onAnswered);
      socket.off('ice-candidate', onIce);
      socket.off('end-call',      onEndCall);
      
      const afterCount = socket.listeners('incoming-call').length;
      console.log('[useVideoCall] 📊 incoming-call listeners after cleanup:', afterCount);
      console.log('[useVideoCall] ✅ Socket listeners unregistered');
    };
  }, [cleanup, drainCandidates]);

  useEffect(() => {
    // Cleanup only on unmount, NOT on cleanup function changes
    return () => {
      console.log('[useVideoCall] 🧹 Component unmounting - cleaning up');
      // Call cleanup directly without dependency
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
      if (outgoingAudioRef.current) {
        outgoingAudioRef.current.pause();
        outgoingAudioRef.current = null;
      }
      if (incomingAudioRef.current) {
        incomingAudioRef.current.pause();
        incomingAudioRef.current = null;
      }
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, []); // Empty deps - only run on mount/unmount

  return {
    callState, remoteUser, isMuted, isCameraOff, isScreenSharing, callError,
    localVideoRef, remoteVideoRef,
    startCall, answerCall, rejectCall, endCall,
    toggleMute, toggleCamera, toggleScreenShare,
  };
}