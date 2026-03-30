import { create } from 'zustand';
import type { User, CallType, CallStatus } from '../types/index';

interface CallState {
  callStatus: CallStatus;
  callType: CallType | null;
  caller: User | null;
  receiver: User | null;
  callDuration: number;
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  callStartTime: number | null;
  isIncomingCall: boolean;

  initiateCall: (receiver: User, type: CallType) => void;
  receiveCall: (caller: User, type: CallType) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  simulateIncomingCall: (caller: User, type: CallType) => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  callStatus: 'idle',
  callType: null,
  caller: null,
  receiver: null,
  callDuration: 0,
  isMuted: false,
  isVideoOn: true,
  isScreenSharing: false,
  callStartTime: null,
  isIncomingCall: false,

  initiateCall: (receiver, type) => {
    set({
      callStatus: 'calling',
      callType: type,
      receiver,
      caller: null,
      isIncomingCall: false,
      isVideoOn: type === 'video',
      isMuted: false,
      callDuration: 0,
    });
    const delay = 2000 + Math.random() * 2000;
    setTimeout(() => {
      if (get().callStatus === 'calling') {
        set({ callStatus: 'connected', callStartTime: Date.now() });
      }
    }, delay);
  },

  receiveCall: (caller, type) =>
    set({
      callStatus: 'ringing',
      callType: type,
      caller,
      receiver: null,
      isIncomingCall: true,
      isVideoOn: type === 'video',
      isMuted: false,
      callDuration: 0,
    }),

  acceptCall: () => {
    set({ callStatus: 'connecting' });
    setTimeout(
      () => set({ callStatus: 'connected', callStartTime: Date.now() }),
      1000,
    );
  },

  rejectCall: () =>
    set({
      callStatus: 'idle',
      callType: null,
      caller: null,
      receiver: null,
      callDuration: 0,
      isIncomingCall: false,
      callStartTime: null,
    }),

  endCall: () => {
    set({ callStatus: 'ended' });
    setTimeout(
      () =>
        set({
          callStatus: 'idle',
          callType: null,
          caller: null,
          receiver: null,
          callDuration: 0,
          isIncomingCall: false,
          callStartTime: null,
          isMuted: false,
          isVideoOn: true,
          isScreenSharing: false,
        }),
      1500,
    );
  },

  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleVideo: () => set((s) => ({ isVideoOn: !s.isVideoOn })),
  toggleScreenShare: () =>
    set((s) => ({ isScreenSharing: !s.isScreenSharing })),

  simulateIncomingCall: (caller, type) => {
    if (get().callStatus === 'idle') get().receiveCall(caller, type);
  },
}));
