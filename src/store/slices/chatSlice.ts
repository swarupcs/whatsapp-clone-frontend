import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Conversation, Message } from '../../types';

export interface UndoDeleteEntry {
  conversationId: string;
  message: Message;
  expiresAt: number;
}

export interface UndoEditEntry {
  conversationId: string;
  messageId: string;
  originalMessage: string;
  newMessage: string;
  expiresAt: number;
}

interface ChatState {
  token: string | null;
  activeConversation: Conversation | null;
  typingUsers: Record<string, string[]>;
  onlineUsers: string[];
  undoDeleteStack: UndoDeleteEntry[];
  undoEditStack: UndoEditEntry[];
}

const initialState: ChatState = {
  token: null,
  activeConversation: null,
  typingUsers: {},
  onlineUsers: [],
  undoDeleteStack: [],
  undoEditStack: [],
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
    },
    setActiveConversation: (state, action: PayloadAction<Conversation | null>) => {
      state.activeConversation = action.payload;
    },
    setTyping: (
      state,
      action: PayloadAction<{ conversationId: string; userId: string; isTyping: boolean }>
    ) => {
      const { conversationId, userId, isTyping } = action.payload;
      const current = state.typingUsers[conversationId] ?? [];
      const updated = isTyping
        ? current.includes(userId) ? current : [...current, userId]
        : current.filter((id) => id !== userId);
      state.typingUsers[conversationId] = updated;
    },
    setOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUsers = action.payload;
    },
    setUserOnline: (state, action: PayloadAction<string>) => {
      if (!state.onlineUsers.includes(action.payload)) {
        state.onlineUsers.push(action.payload);
      }
    },
    setUserOffline: (state, action: PayloadAction<string>) => {
      state.onlineUsers = state.onlineUsers.filter((id) => id !== action.payload);
    },
    pushUndoDelete: (state, action: PayloadAction<UndoDeleteEntry>) => {
      state.undoDeleteStack.push(action.payload);
    },
    popUndoDelete: (state, action: PayloadAction<string>) => {
      state.undoDeleteStack = state.undoDeleteStack.filter(
        (e) => e.message.id !== action.payload
      );
    },
    pushUndoEdit: (state, action: PayloadAction<UndoEditEntry>) => {
      state.undoEditStack.push(action.payload);
    },
    popUndoEdit: (state, action: PayloadAction<string>) => {
      state.undoEditStack = state.undoEditStack.filter(
        (e) => e.messageId !== action.payload
      );
    },
  },
});

export const {
  setToken,
  setActiveConversation,
  setTyping,
  setOnlineUsers,
  setUserOnline,
  setUserOffline,
  pushUndoDelete,
  popUndoDelete,
  pushUndoEdit,
  popUndoEdit,
} = chatSlice.actions;

export default chatSlice.reducer;