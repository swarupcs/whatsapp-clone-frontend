import type { User } from '@/store/chatStore';
import { create } from 'zustand';


export type CallStatus =
  | 'idle'
  | 'ringing'
  | 'calling'
  | 'connecting'
  | 'connected'
  | 'ended';
export type CallType = 'video' | 'audio';

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

  // Actions
  initiateCall: (receiver: User, type: CallType) => void;
  receiveCall: (caller: User, type: CallType) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  updateDuration: () => void;
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

  initiateCall: (receiver: User, type: CallType) => {
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

    // Simulate connection after 2-4 seconds
    const delay = 2000 + Math.random() * 2000;
    setTimeout(() => {
      const state = get();
      if (state.callStatus === 'calling') {
        set({
          callStatus: 'connected',
          callStartTime: Date.now(),
        });
      }
    }, delay);
  },

  receiveCall: (caller: User, type: CallType) => {
    set({
      callStatus: 'ringing',
      callType: type,
      caller,
      receiver: null,
      isIncomingCall: true,
      isVideoOn: type === 'video',
      isMuted: false,
      callDuration: 0,
    });
  },

  acceptCall: () => {
    const state = get();
    if (state.callStatus === 'ringing') {
      set({
        callStatus: 'connecting',
      });

      // Simulate connection after brief delay
      setTimeout(() => {
        set({
          callStatus: 'connected',
          callStartTime: Date.now(),
        });
      }, 1000);
    }
  },

  rejectCall: () => {
    set({
      callStatus: 'idle',
      callType: null,
      caller: null,
      receiver: null,
      callDuration: 0,
      isIncomingCall: false,
      callStartTime: null,
    });
  },

  endCall: () => {
    set({
      callStatus: 'ended',
    });

    // Reset after brief delay
    setTimeout(() => {
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
      });
    }, 1500);
  },

  toggleMute: () => {
    set((state) => ({ isMuted: !state.isMuted }));
  },

  toggleVideo: () => {
    set((state) => ({ isVideoOn: !state.isVideoOn }));
  },

  toggleScreenShare: () => {
    set((state) => ({ isScreenSharing: !state.isScreenSharing }));
  },

  updateDuration: () => {
    const state = get();
    if (state.callStartTime && state.callStatus === 'connected') {
      set({
        callDuration: Math.floor((Date.now() - state.callStartTime) / 1000),
      });
    }
  },

  simulateIncomingCall: (caller: User, type: CallType) => {
    const state = get();
    if (state.callStatus === 'idle') {
      get().receiveCall(caller, type);
    }
  },
}));
