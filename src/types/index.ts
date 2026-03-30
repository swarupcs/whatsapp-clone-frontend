// ─── Primitives ───────────────────────────────────────────────────────────────

export type UserStatus = 'online' | 'offline' | 'away';
export type CallType = 'audio' | 'video';

// ─── User ────────────────────────────────────────────────────────────────────

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

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

// ─── Message ─────────────────────────────────────────────────────────────────

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

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  message: string;
  files?: FileAttachment[];
  reactions?: Reaction[];
  replyTo?: ReplyTo;
  seenBy?: string[];
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

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface SendMessagePayload {
  message: string;
  replyTo?: ReplyTo;
}

export interface EditMessagePayload {
  message: string;
}

export interface CreateGroupPayload {
  name: string;
  userIds: string[];
  picture?: string;
}

export interface UpdateProfilePayload {
  name?: string;
  about?: string;
  picture?: string;
}

export interface UpdateStatusPayload {
  status: UserStatus;
}

export interface ForwardMessagePayload {
  toConversationId: string;
}

export interface AddReactionPayload {
  emoji: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}

// ─── API Response envelope ────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiErrorResponse;

// ─── Socket payloads ──────────────────────────────────────────────────────────

export interface TypingPayload {
  conversationId: string;
  userId: string;
  userName: string;
}

export interface NewMessagePayload {
  message: Message;
  conversation: Conversation;
}

export interface ReactionUpdatedPayload {
  conversationId: string;
  messageId: string;
  reactions: Reaction[];
}

export interface MessageSeenPayload {
  conversationId: string;
  messageId: string;
  userId: string;
  seenBy: string[];
}

export interface PinPayload {
  conversationId: string;
  message: Message;
}

export interface IncomingCallPayload {
  callerId: string;
  caller: User;
  conversationId: string;
  callType: CallType;
}

// ─── Call store ───────────────────────────────────────────────────────────────

export type CallStatus =
  | 'idle'
  | 'ringing'
  | 'calling'
  | 'connecting'
  | 'connected'
  | 'ended';

// ─── Search ───────────────────────────────────────────────────────────────────

export interface MessageSearchResult {
  message: Message;
  conversation: Conversation;
  sender: User | undefined;
}
