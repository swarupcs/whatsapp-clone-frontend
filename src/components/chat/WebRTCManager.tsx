import { store, useAppDispatch } from '@/store';
import { useAppSelector } from '@/store';
import { useEffect, useRef } from 'react';
import { setCallState, resetCall } from '@/store/slices/callSlice';

import { getSocket, socketEmit, SOCKET_EVENTS } from '@/lib/socket';

export default function WebRTCManager() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const callState = useAppSelector((state) => state.call);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const rtcConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  };

  const cleanupCall = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    (window as any).localStream?.getTracks().forEach((t: any) => t.stop());
    (window as any).remoteStream?.getTracks().forEach((t: any) => t.stop());
  };

  useEffect(() => {
    const { callStatus, isIncomingCall, conversationId, callType, receiver, caller, remoteSignal } = callState;

    const setupCaller = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video',
        });
        (window as any).localStream = stream;

        const pc = new RTCPeerConnection(rtcConfig);
        pcRef.current = pc;

        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        pc.ontrack = (event) => {
          (window as any).remoteStream = event.streams[0];
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
        dispatch(resetCall());
      }
    };

    const setupReceiver = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video',
        });
        (window as any).localStream = stream;

        const pc = new RTCPeerConnection(rtcConfig);
        pcRef.current = pc;

        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        pc.ontrack = (event) => {
          (window as any).remoteStream = event.streams[0];
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
          dispatch(setCallState({ callStatus: 'connected', callStartTime: Date.now() }));
        }
      } catch (err) {
        console.error('Receiver setup failed:', err);
        dispatch(resetCall());
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
  }, [callState.callStatus, dispatch]);

  useEffect(() => {
    let iv: any;
    if (callState.callStatus === 'connected') {
      iv = setInterval(() => {
        store.dispatch(setCallState({ callDuration: store.getState().call.callDuration + 1 }));
      }, 1000);
    }
    return () => clearInterval(iv);
  }, [callState.callStatus, dispatch]);

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
        store.dispatch(setCallState({ callStatus: 'connected', callStartTime: Date.now() }));
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