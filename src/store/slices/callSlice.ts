import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User, CallType, CallStatus } from '../../types';

interface CallState {
  callStatus: CallStatus;
  callType: CallType | null;
  caller: User | null;
  receiver: User | null;
  conversationId: string | null;
  callDuration: number;
  isMuted: boolean;
  isVideoOn: boolean;
  callStartTime: number | null;
  isIncomingCall: boolean;
  remoteSignal: unknown | null;
}

const initialState: CallState = {
  callStatus: 'idle',
  callType: null,
  caller: null,
  receiver: null,
  conversationId: null,
  callDuration: 0,
  isMuted: false,
  isVideoOn: true,
  callStartTime: null,
  isIncomingCall: false,
  remoteSignal: null,
};

const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    setCallState: (state, action: PayloadAction<Partial<CallState>>) => {
      return { ...state, ...action.payload };
    },
    resetCall: () => initialState,
    initiateCall: (state, action: PayloadAction<{ receiver: User; type: CallType }>) => {
      state.callStatus = 'calling';
      state.callType = action.payload.type;
      state.receiver = action.payload.receiver;
      state.caller = null;
      state.isIncomingCall = false;
      state.isVideoOn = action.payload.type === 'video';
      state.isMuted = false;
      state.callDuration = 0;
      state.remoteSignal = null;
    },
  },
});

export const { setCallState, resetCall, initiateCall } = callSlice.actions;

export default callSlice.reducer;