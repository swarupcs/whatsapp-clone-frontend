import { create } from 'zustand';
import type { User, CallType, CallStatus } from '../types';

interface CallState {
  callStatus: CallStatus;
  callType: CallType | null;
  caller: User | null;
  receiver: User | null;
  conversationId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callDuration: number;
  isMuted: boolean;
  isVideoOn: boolean;
  callStartTime: number | null;
  isIncomingCall: boolean;
  remoteSignal: unknown | null;

  setCallState: (state: Partial<CallState>) => void;
  resetCall: () => void;
  initiateCall: (receiver: User, type: CallType) => void;
}

export const useCallStore = create<CallState>((set) => ({
  callStatus: 'idle',
  callType: null,
  caller: null,
  receiver: null,
  conversationId: null,
  localStream: null,
  remoteStream: null,
  callDuration: 0,
  isMuted: false,
  isVideoOn: true,
  callStartTime: null,
  isIncomingCall: false,
  remoteSignal: null,

  setCallState: (state) => set((prev) => ({ ...prev, ...state })),
  resetCall: () => set({
    callStatus: 'idle',
    callType: null,
    caller: null,
    receiver: null,
    conversationId: null,
    localStream: null,
    remoteStream: null,
    callDuration: 0,
    isMuted: false,
    isVideoOn: true,
    callStartTime: null,
    isIncomingCall: false,
    remoteSignal: null,
  }),
  initiateCall: (receiver: User, type: CallType) => set({
    callStatus: 'calling',
    callType: type,
    receiver,
    caller: null,
    isIncomingCall: false,
    isVideoOn: type === 'video',
    isMuted: false,
    callDuration: 0,
    remoteSignal: null,
  }),
}));
