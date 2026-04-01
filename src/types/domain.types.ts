/**
 * domain.types.ts
 * Frontend domain types that mirror the backend's public DTOs.
 */

// ─── User ─────────────────────────────────────────────────────────────────────

export type UserStatus = 'online' | 'offline' | 'away';

export interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
  status: UserStatus;
  about: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
}

// ─── Message sub-types ────────────────────────────────────────────────────────

export interface Reaction {
  emoji: string;
  userId: string;
  createdAt: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

export interface ReplyTo {
  messageId: string;
  senderId: string;
  senderName: string;
  message: string;
}

// ─── Message ─────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  message: string;
  files?: FileAttachment[];
  reactions: Reaction[];
  replyTo?: ReplyTo;
  seenBy: string[];
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  isPinned: boolean;
  pinnedAt?: string;
  pinnedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Conversation ─────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  name: string;
  picture: string;
  isGroup: boolean;
  users: User[];
  adminId?: string;
  latestMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Call ─────────────────────────────────────────────────────────────────────

export type CallType = 'audio' | 'video';
export type CallStatus =
  | 'idle'
  | 'ringing'
  | 'calling'
  | 'connecting'
  | 'connected'
  | 'ended';
