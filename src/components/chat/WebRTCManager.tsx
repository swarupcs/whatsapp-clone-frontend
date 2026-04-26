import { useEffect, useRef } from 'react';
import { useCallStore } from '@/store/callStore';
import { useAuthStore } from '@/store/authStore';
import { getSocket, socketEmit, SOCKET_EVENTS } from '@/lib/socket';

export default function WebRTCManager() {
  const { user } = useAuthStore();
  const callStore = useCallStore();
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const rtcConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  };

  const cleanupCall = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    const state = useCallStore.getState();
    state.localStream?.getTracks().forEach((t) => t.stop());
    state.remoteStream?.getTracks().forEach((t) => t.stop());
  };

  useEffect(() => {
    const { callStatus, isIncomingCall, conversationId, callType, receiver, caller, remoteSignal } = callStore;

    const setupCaller = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video',
        });
        callStore.setCallState({ localStream: stream });

        const pc = new RTCPeerConnection(rtcConfig);
        pcRef.current = pc;

        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        pc.ontrack = (event) => {
          callStore.setCallState({ remoteStream: event.streams[0] });
        };

        pc.onicecandidate = (event) => {
          if (event.candidate && receiver) {
            socketEmit.callSignal(receiver.id, event.candidate);
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        if (conversationId && receiver && user) {
          socketEmit.initiateCall(conversationId, callType!, user, offer);
        }
      } catch (err) {
        console.error('Caller setup failed:', err);
        callStore.resetCall();
      }
    };

    const setupReceiver = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video',
        });
        callStore.setCallState({ localStream: stream });

        const pc = new RTCPeerConnection(rtcConfig);
        pcRef.current = pc;

        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        pc.ontrack = (event) => {
          callStore.setCallState({ remoteStream: event.streams[0] });
        };

        pc.onicecandidate = (event) => {
          if (event.candidate && caller) {
            socketEmit.callSignal(caller.id, event.candidate);
          }
        };

        if (remoteSignal) {
          await pc.setRemoteDescription(new RTCSessionDescription(remoteSignal as any));
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (conversationId && caller) {
          socketEmit.acceptCall(caller.id, conversationId, answer);
          callStore.setCallState({ callStatus: 'connected', callStartTime: Date.now() });
        }
      } catch (err) {
        console.error('Receiver setup failed:', err);
        callStore.resetCall();
      }
    };

    if (callStatus === 'calling' && !isIncomingCall && !pcRef.current) {
      setupCaller();
    }

    if (callStatus === 'connecting' && isIncomingCall && !pcRef.current) {
      setupReceiver();
    }

    if (callStatus === 'idle') {
      cleanupCall();
    }
  }, [callStore.callStatus]);

  useEffect(() => {
    let iv: any;
    if (callStore.callStatus === 'connected') {
      iv = setInterval(() => {
        useCallStore.setState((s) => ({ callDuration: s.callDuration + 1 }));
      }, 1000);
    }
    return () => clearInterval(iv);
  }, [callStore.callStatus]);

  useEffect(() => {
    let socket;
    try {
      socket = getSocket();
    } catch {
      return; // Socket not initialized yet
    }

    if (!socket) return;

    const handleCallAccepted = async (data: { acceptorId: string; conversationId: string; signal?: unknown }) => {
      if (pcRef.current && data.signal) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.signal as any));
        useCallStore.getState().setCallState({ callStatus: 'connected', callStartTime: Date.now() });
      }
    };

    const handleCallSignal = async (data: { fromUserId: string; signal: unknown }) => {
      if (pcRef.current && data.signal) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(data.signal as any));
        } catch (e) {
          console.error('Error adding ICE candidate', e);
        }
      }
    };

    socket.on(SOCKET_EVENTS.CALL_ACCEPTED, handleCallAccepted);
    socket.on(SOCKET_EVENTS.CALL_SIGNAL, handleCallSignal);

    return () => {
      socket.off(SOCKET_EVENTS.CALL_ACCEPTED, handleCallAccepted);
      socket.off(SOCKET_EVENTS.CALL_SIGNAL, handleCallSignal);
    };
  }, []);

  return null;
}
