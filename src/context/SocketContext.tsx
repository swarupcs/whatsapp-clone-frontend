import {
  createContext, useContext, useEffect, useRef, useState, type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { connectSocket, disconnectSocket, socketEmit, SOCKET_EVENTS } from '../lib/socket';
import { notificationService } from '../lib/notifications';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useCallStore } from '../store/callStore';
import { messageKeys } from '../hooks/queries/useMessages';
import { conversationKeys } from '../hooks/queries/useConversations';
import { useOnlineUsers } from '../hooks/queries/useUsers';
import type {
  Message, Conversation, NewMessagePayload, ReactionUpdatedPayload,
  MessageSeenPayload, PinPayload, IncomingCallPayload, TypingPayload, PaginatedData,
} from '../types';

interface SocketContextType {
  connected: boolean;
  emitTyping: (conversationId: string, isTyping: boolean) => void;
  emitSeen: (conversationId: string, messageId: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function useSocket(): SocketContextType {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be inside SocketProvider');
  return ctx;
}

function patchCachedMessage(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
  messageId: string,
  updater: (m: Message) => Message,
) {
  queryClient.setQueryData(messageKeys.list(conversationId), (old: any) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((page: PaginatedData<Message>) => ({
        ...page,
        data: page.data.map((m) => (m.id === messageId ? updater(m) : m)),
      })),
    };
  });
}

function upsertMessageInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
  message: Message,
) {
  queryClient.setQueryData(messageKeys.list(conversationId), (old: any) => {
    if (!old)
      return { pages: [{ data: [message], total: 1, page: 1, limit: 30, hasMore: false }], pageParams: [1] };

    const pages: PaginatedData<Message>[] = old.pages.map(
      (page: PaginatedData<Message>, idx: number) => {
        if (idx !== old.pages.length - 1) return page;
        const existing = page.data;
        if (existing.some((m) => m.id === message.id)) return page;
        const optimisticIdx = existing.findIndex(
          (m) => m.id.startsWith('optimistic-') && m.senderId === message.senderId && m.message === message.message,
        );
        if (optimisticIdx !== -1) {
          const newData = [...existing];
          newData[optimisticIdx] = message;
          return { ...page, data: newData };
        }
        return { ...page, data: [...existing, message] };
      },
    );
    return { ...old, pages };
  });
}

function sortConversations(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const queryClient = useQueryClient();
  const { user, token } = useAuthStore();
  const { setOnlineUsers, setUserOnline, setUserOffline, setTyping } = useChatStore();
  const { simulateIncomingCall, endCall } = useCallStore();
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const activeConversationRef = useRef<Conversation | null>(null);
  useEffect(() => {
    const unsub = useChatStore.subscribe(
      (state) => state.activeConversation,
      (conv) => { activeConversationRef.current = conv; },
    );
    activeConversationRef.current = useChatStore.getState().activeConversation;
    return unsub;
  }, []);

  const userIdRef = useRef<string | undefined>(user?.id);
  useEffect(() => { userIdRef.current = user?.id; });

  // FIX: Utilize the HTTP polling hook to supplement socket presence
  const { data: httpOnlineUserIds } = useOnlineUsers();
  useEffect(() => {
    if (httpOnlineUserIds && httpOnlineUserIds.length > 0) {
      // Merge HTTP polling data with whatever socket data we already have
      const currentOnline = useChatStore.getState().onlineUsers;
      const merged = Array.from(new Set([...currentOnline, ...httpOnlineUserIds]));
      if (merged.length !== currentOnline.length) {
        setOnlineUsers(merged);
      }
    }
  }, [httpOnlineUserIds, setOnlineUsers]);

  useEffect(() => {
    if (!token || !user) { disconnectSocket(); setConnected(false); return; }

    const socket = connectSocket();

    socket.on(SOCKET_EVENTS.CONNECT, () => setConnected(true));
    socket.on(SOCKET_EVENTS.DISCONNECT, () => setConnected(false));
    socket.on(SOCKET_EVENTS.CONNECT_ERROR, () => setConnected(false));

    socket.on(SOCKET_EVENTS.ONLINE_USERS, ({ userIds }: { userIds: string[] }) => setOnlineUsers(userIds));
    socket.on(SOCKET_EVENTS.USER_ONLINE, ({ userId }: { userId: string }) => setUserOnline(userId));
    socket.on(SOCKET_EVENTS.USER_OFFLINE, ({ userId }: { userId: string }) => setUserOffline(userId));

    socket.on(SOCKET_EVENTS.TYPING_START, (data: TypingPayload) =>
      setTyping(data.conversationId, data.userId, true));
    socket.on(SOCKET_EVENTS.TYPING_STOP, (data: TypingPayload) =>
      setTyping(data.conversationId, data.userId, false));

    socket.on(SOCKET_EVENTS.NEW_MESSAGE, ({ message }: NewMessagePayload) => {
      const currentUserId = userIdRef.current;
      const isActiveConv = activeConversationRef.current?.id === message.conversationId;

      upsertMessageInCache(queryClient, message.conversationId, message);

      queryClient.setQueryData<Conversation[]>(conversationKeys.all, (old = []) => {
        const updated = old.map((c) =>
          c.id === message.conversationId
            ? {
                ...c,
                latestMessage: message,
                updatedAt: message.updatedAt,
                unreadCount:
                  message.senderId === currentUserId ? 0
                  : isActiveConv ? 0
                  : (c.unreadCount ?? 0) + 1,
              }
            : c,
        );
        return sortConversations(updated);
      });

      if (!isActiveConv && message.senderId !== currentUserId) {
        const convList = queryClient.getQueryData<Conversation[]>(conversationKeys.all);
        const conv = convList?.find((c) => c.id === message.conversationId);
        const sender = conv?.users.find((u) => u.id === message.senderId);
        const title = conv?.isGroup
          ? `${conv.name}: ${sender?.name ?? 'Someone'}`
          : (sender?.name ?? 'New message');
        notificationService.showNotification(title, {
          body: message.message.slice(0, 80) || '📎 Attachment',
          icon: conv?.isGroup ? conv.picture : sender?.picture,
          tag: `msg-${message.id}`,
        });
      }
    });

    socket.on(SOCKET_EVENTS.MESSAGE_EDITED, ({ message }: { message: Message }) => {
      patchCachedMessage(queryClient, message.conversationId, message.id, () => message);
    });

    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      patchCachedMessage(queryClient, conversationId, messageId, (m) => ({ ...m, isDeleted: true, message: '' }));
    });

    socket.on(SOCKET_EVENTS.REACTION_UPDATED, (data: ReactionUpdatedPayload) => {
      patchCachedMessage(queryClient, data.conversationId, data.messageId, (m) => ({ ...m, reactions: data.reactions }));
    });

    socket.on(SOCKET_EVENTS.MESSAGE_SEEN, (data: MessageSeenPayload) => {
      patchCachedMessage(queryClient, data.conversationId, data.messageId, (m) => ({ ...m, seenBy: data.seenBy }));
    });

    socket.on(SOCKET_EVENTS.MESSAGE_PINNED, (data: PinPayload) => {
      patchCachedMessage(queryClient, data.conversationId, data.message.id, () => data.message);
      queryClient.invalidateQueries({ queryKey: messageKeys.pinned(data.conversationId) });
    });

    socket.on(SOCKET_EVENTS.MESSAGE_UNPINNED, (data: PinPayload) => {
      patchCachedMessage(queryClient, data.conversationId, data.message.id, () => data.message);
      queryClient.invalidateQueries({ queryKey: messageKeys.pinned(data.conversationId) });
    });

    socket.on('member_added', ({ conversationId, conversation }: { conversationId: string; conversation: Conversation }) => {
      queryClient.setQueryData<Conversation[]>(conversationKeys.all, (old = []) =>
        old.map((c) => (c.id === conversationId ? conversation : c)));
      if (activeConversationRef.current?.id === conversationId)
        useChatStore.getState().setActiveConversation(conversation);
    });

    socket.on('member_removed', ({ conversationId, conversation }: { conversationId: string; conversation: Conversation }) => {
      queryClient.setQueryData<Conversation[]>(conversationKeys.all, (old = []) =>
        old.map((c) => (c.id === conversationId ? conversation : c)));
      if (activeConversationRef.current?.id === conversationId)
        useChatStore.getState().setActiveConversation(conversation);
    });

    socket.on('removed_from_group', ({ conversationId }: { conversationId: string }) => {
      toast.info('You were removed from a group');
      queryClient.setQueryData<Conversation[]>(conversationKeys.all, (old = []) =>
        old.filter((c) => c.id !== conversationId));
      if (activeConversationRef.current?.id === conversationId)
        useChatStore.getState().setActiveConversation(null);
    });

    socket.on(SOCKET_EVENTS.INCOMING_CALL, (data: IncomingCallPayload) => {
      simulateIncomingCall(data.caller, data.callType);
    });
    socket.on(SOCKET_EVENTS.CALL_REJECTED, () => { toast.info('Call was declined'); endCall(); });
    socket.on(SOCKET_EVENTS.CALL_ENDED, () => { toast.info('Call ended'); endCall(); });

    return () => { socket.removeAllListeners(); disconnectSocket(); setConnected(false); };
  }, [token]);

  function emitTyping(conversationId: string, isTyping: boolean) {
    if (!user) return;
    const payload: TypingPayload = { conversationId, userId: user.id, userName: user.name };
    if (isTyping) {
      socketEmit.typing(payload);
      clearTimeout(typingTimers.current[conversationId]);
      typingTimers.current[conversationId] = setTimeout(() => socketEmit.stopTyping(payload), 3000);
    } else {
      clearTimeout(typingTimers.current[conversationId]);
      socketEmit.stopTyping(payload);
    }
  }

  function emitSeen(conversationId: string, messageId: string) {
    socketEmit.markSeen(conversationId, messageId);
  }

  return (
    <SocketContext.Provider value={{ connected, emitTyping, emitSeen }}>
      {children}
    </SocketContext.Provider>
  );
}
