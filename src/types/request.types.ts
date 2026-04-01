/**
 * request.types.ts
 * Request payload types for all API endpoints.
 */

import type { UserStatus, CallType, ReplyTo } from './domain.types';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UpdateProfilePayload {
  name?: string;
  about?: string;
  picture?: string;
}

export interface UpdateStatusPayload {
  status: UserStatus;
}

// ─── Conversation ─────────────────────────────────────────────────────────────

export interface CreateDirectConversationPayload {
  userId: string;
}

export interface CreateGroupPayload {
  name: string;
  userIds: string[];
  picture?: string;
}

export interface AddGroupMemberPayload {
  userId: string;
}

// ─── Message ─────────────────────────────────────────────────────────────────

export interface SendMessagePayload {
  message: string;
  replyTo?: ReplyTo;
}

export interface EditMessagePayload {
  message: string;
}

export interface AddReactionPayload {
  emoji: string;
}

export interface ForwardMessagePayload {
  toConversationId: string;
}

// ─── Socket payloads ─────────────────────────────────────────────────────────

export interface TypingPayload {
  conversationId: string;
  userId: string;
  userName: string;
}

export interface NewMessagePayload {
  message: import('./domain.types').Message;
  conversation: import('./domain.types').Conversation;
}

export interface ReactionUpdatedPayload {
  conversationId: string;
  messageId: string;
  reactions: import('./domain.types').Reaction[];
}

export interface MessageSeenPayload {
  conversationId: string;
  messageId: string;
  userId: string;
  seenBy: string[];
}

export interface PinPayload {
  conversationId: string;
  message: import('./domain.types').Message;
}

export interface IncomingCallPayload {
  callerId: string;
  caller: import('./domain.types').User;
  conversationId: string;
  callType: CallType;
}
