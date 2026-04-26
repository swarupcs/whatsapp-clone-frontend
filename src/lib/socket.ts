import { io, type Socket } from 'socket.io-client';
import { tokenStorage } from './tokenStorage';
import type { TypingPayload, User, CallType } from '../types';

export const SOCKET_URL =
  (import.meta as any).env?.VITE_SOCKET_URL ?? 'http://localhost:5000';

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  TYPING_START: 'typing',
  TYPING_STOP: 'stop_typing',
  NEW_MESSAGE: 'new_message',
  MESSAGE_EDITED: 'message_edited',
  MESSAGE_DELETED: 'message_deleted',
  REACTION_UPDATED: 'reaction_updated',
  MARK_SEEN: 'mark_seen',
  MESSAGE_SEEN: 'message_seen',
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  ONLINE_USERS: 'online_users',
  PIN_MESSAGE: 'pin_message',
  UNPIN_MESSAGE: 'unpin_message',
  MESSAGE_PINNED: 'message_pinned',
  MESSAGE_UNPINNED: 'message_unpinned',
  INITIATE_CALL: 'initiate_call',
  INCOMING_CALL: 'incoming_call',
  CALL_ACCEPTED: 'call_accepted',
  CALL_REJECTED: 'call_rejected',
  CALL_ENDED: 'call_ended',
  CALL_SIGNAL: 'call_signal',
} as const;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) throw new Error('Socket not initialised');
  return socket;
}

export function connectSocket(): Socket {
  if (socket?.connected) socket.disconnect();
  const token = tokenStorage.getAccess();
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export const socketEmit = {
  typing: (payload: TypingPayload) =>
    socket?.emit(SOCKET_EVENTS.TYPING_START, payload),

  stopTyping: (payload: TypingPayload) =>
    socket?.emit(SOCKET_EVENTS.TYPING_STOP, payload),

  markSeen: (conversationId: string, messageId: string) =>
    socket?.emit(SOCKET_EVENTS.MARK_SEEN, { conversationId, messageId }),

  pinMessage: (conversationId: string, messageId: string) =>
    socket?.emit(SOCKET_EVENTS.PIN_MESSAGE, { conversationId, messageId }),

  unpinMessage: (conversationId: string, messageId: string) =>
    socket?.emit(SOCKET_EVENTS.UNPIN_MESSAGE, { conversationId, messageId }),

  initiateCall: (conversationId: string, callType: CallType, caller: User, signal?: unknown) =>
    socket?.emit(SOCKET_EVENTS.INITIATE_CALL, { conversationId, callType, callerId: caller.id, caller, signal }),

  acceptCall: (callerId: string, conversationId: string, signal?: unknown) =>
    socket?.emit(SOCKET_EVENTS.CALL_ACCEPTED, { callerId, conversationId, signal }),

  rejectCall: (callerId: string, conversationId: string) =>
    socket?.emit(SOCKET_EVENTS.CALL_REJECTED, { callerId, conversationId }),

  endCall: (conversationId: string, otherUserId: string) =>
    socket?.emit(SOCKET_EVENTS.CALL_ENDED, { conversationId, otherUserId }),

  callSignal: (toUserId: string, signal: unknown) =>
    socket?.emit(SOCKET_EVENTS.CALL_SIGNAL, { toUserId, signal }),
};
