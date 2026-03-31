/**
 * chatStore.ts
 *
 * Lean store for UI-only state that doesn't belong in React Query cache:
 *  - Which conversation is active
 *  - Typing indicators (ephemeral socket state)
 *  - Online user list (ephemeral socket state)
 *  - Undo stacks for delete/edit (client-side only)
 *
 * All server data (messages, conversations, users) lives in React Query cache.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Conversation, Message } from '../types/index';

// ─── Undo entry ───────────────────────────────────────────────────────────────

export interface UndoDeleteEntry {
  message: Message;
  expiresAt: number;
}

export interface UndoEditEntry {
  messageId: string;
  originalMessage: string;
  expiresAt: number;
}

// ─── State shape ──────────────────────────────────────────────────────────────

interface ChatState {
  // Token proxy for ProtectedRoute compatibility
  token: string | null;

  // Active conversation
  activeConversation: Conversation | null;

  // Typing: conversationId → array of typing userIds
  typingUsers: Record<string, string[]>;

  // Online presence (driven by socket events)
  onlineUsers: string[];

  // Undo stacks
  undoDeleteStack: UndoDeleteEntry[];
  undoEditStack: UndoEditEntry[];

  // Actions
  setToken: (token: string | null) => void;
  setActiveConversation: (conv: Conversation | null) => void;
  setTyping: (
    conversationId: string,
    userId: string,
    isTyping: boolean,
  ) => void;
  setOnlineUsers: (ids: string[]) => void;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  pushUndoDelete: (entry: UndoDeleteEntry) => void;
  popUndoDelete: (messageId: string) => UndoDeleteEntry | undefined;
  pushUndoEdit: (entry: UndoEditEntry) => void;
  popUndoEdit: (messageId: string) => UndoEditEntry | undefined;
}

export const useChatStore = create<ChatState>()(
  // subscribeWithSelector lets SocketContext do:
  //   useChatStore.subscribe(s => s.activeConversation, cb)
  // so the socket handler always reads the freshest conversation
  // without the handler itself needing to be recreated.
  subscribeWithSelector((set, get) => ({
    token: null,
    activeConversation: null,
    typingUsers: {},
    onlineUsers: [],
    undoDeleteStack: [],
    undoEditStack: [],

    setToken: (token) => set({ token }),

    setActiveConversation: (conv) => set({ activeConversation: conv }),

    setTyping: (conversationId, userId, isTyping) =>
      set((s) => {
        const current = s.typingUsers[conversationId] ?? [];
        const updated = isTyping
          ? current.includes(userId)
            ? current
            : [...current, userId]
          : current.filter((id) => id !== userId);
        return { typingUsers: { ...s.typingUsers, [conversationId]: updated } };
      }),

    setOnlineUsers: (ids) => set({ onlineUsers: ids }),

    setUserOnline: (userId) =>
      set((s) => ({
        onlineUsers: s.onlineUsers.includes(userId)
          ? s.onlineUsers
          : [...s.onlineUsers, userId],
      })),

    setUserOffline: (userId) =>
      set((s) => ({
        onlineUsers: s.onlineUsers.filter((id) => id !== userId),
      })),

    pushUndoDelete: (entry) =>
      set((s) => ({ undoDeleteStack: [...s.undoDeleteStack, entry] })),

    popUndoDelete: (messageId) => {
      const entry = get().undoDeleteStack.find(
        (e) => e.message.id === messageId,
      );
      set((s) => ({
        undoDeleteStack: s.undoDeleteStack.filter(
          (e) => e.message.id !== messageId,
        ),
      }));
      return entry;
    },

    pushUndoEdit: (entry) =>
      set((s) => ({ undoEditStack: [...s.undoEditStack, entry] })),

    popUndoEdit: (messageId) => {
      const entry = get().undoEditStack.find((e) => e.messageId === messageId);
      set((s) => ({
        undoEditStack: s.undoEditStack.filter((e) => e.messageId !== messageId),
      }));
      return entry;
    },
  })),
);
