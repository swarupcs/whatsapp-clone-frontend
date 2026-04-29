import { useAppSelector, useAppDispatch } from '@/store';
import {
  createContext, useContext, useEffect, useRef, useState, type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { connectSocket, disconnectSocket, socketEmit, SOCKET_EVENTS } from '../lib/socket';
import { notificationService } from '../lib/notifications';
import { messageKeys } from '../hooks/queries/useMessages';
import { conversationKeys } from '../hooks/queries/useConversations';
import { useOnlineUsers } from '../hooks/queries/useUsers';
import { setActiveConversation, setOnlineUsers, setUserOnline, setUserOffline, setTyping } from '@/store/slices/chatSlice';
import { setCallState, resetCall } from '@/store/slices/callSlice';
import { store } from '@/store';
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
    if (!old) {
      return {
        pages: [
          {
            data: [message],
            total: 1,
            page: 1,
            limit: 30,
            hasMore: false,
          },
        ],
        pageParams: [1],
      };
    }

    // Standard newest-first structure: new messages go to the start of the first page.
    const pages = [...old.pages];
    if (pages.length > 0) {
      const firstPage = pages[0];
      const existing = firstPage.data || [];

      if (existing.some((m: any) => m.id === message.id)) return old;

      const optimisticIdx = existing.findIndex(
        (m: any) =>
          m.id.startsWith('optimistic-') &&
          m.senderId === message.senderId &&
          m.message === message.message,
      );

      if (optimisticIdx !== -1) {
        const newData = [...existing];
        newData[optimisticIdx] = message;
        pages[0] = { ...firstPage, data: newData };
      } else {
        pages[0] = { ...firstPage, data: [message, ...existing] };
      }
    } else {
      pages.push({
        data: [message],
        total: 1,
        page: 1,
        limit: 30,
        hasMore: false,
      });
    }

    return { ...old, pages };
  });
}

function sortConversations(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();

  const [connected, setConnected] = useState(false);
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const onlineUsers = useAppSelector((state) => state.chat.onlineUsers);

  const userIdRef = useRef<string | undefined>(user?.id);
  useEffect(() => { userIdRef.current = user?.id; });

  // FIX: Utilize the HTTP polling hook to supplement socket presence
  const { data: httpOnlineUserIds } = useOnlineUsers();
  useEffect(() => {
    if (httpOnlineUserIds && httpOnlineUserIds.length > 0) {
      const merged = Array.from(new Set([...onlineUsers, ...httpOnlineUserIds]));
      if (merged.length !== onlineUsers.length) {
        dispatch(setOnlineUsers(merged));
      }
    }
  }, [httpOnlineUserIds, onlineUsers, dispatch]);

  useEffect(() => {
    if (!token || !user) { disconnectSocket(); setConnected(false); return; }

    const socket = connectSocket();

    socket.on(SOCKET_EVENTS.CONNECT, () => {
      setConnected(true);

      // If we just reconnected, we might have missed messages while offline.
      // Invalidate caches to silently fetch the latest data from the REST API.
      queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      const activeConv = store.getState().chat.activeConversation;
      if (activeConv?.id) {
        queryClient.invalidateQueries({
          queryKey: messageKeys.list(activeConv.id),
        });
      }
    });

    // Explicitly handle reconnection events from the manager to ensure cache invalidation
    socket.io.on('reconnect', () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      const activeConv = store.getState().chat.activeConversation;
      if (activeConv?.id) {
        queryClient.invalidateQueries({
          queryKey: messageKeys.list(activeConv.id),
        });
      }
    });
    socket.on(SOCKET_EVENTS.DISCONNECT, () => setConnected(false));
    socket.on(SOCKET_EVENTS.CONNECT_ERROR, () => setConnected(false));

    socket.on(SOCKET_EVENTS.ONLINE_USERS, ({ userIds }: { userIds: string[] }) => dispatch(setOnlineUsers(userIds)));
    socket.on(SOCKET_EVENTS.USER_ONLINE, ({ userId }: { userId: string }) => dispatch(setUserOnline(userId)));
    socket.on(SOCKET_EVENTS.USER_OFFLINE, ({ userId }: { userId: string }) => dispatch(setUserOffline(userId)));

    socket.on(SOCKET_EVENTS.TYPING_START, (data: TypingPayload) =>
      dispatch(setTyping({ conversationId: data.conversationId, userId: data.userId, isTyping: true })));
    socket.on(SOCKET_EVENTS.TYPING_STOP, (data: TypingPayload) =>
      dispatch(setTyping({ conversationId: data.conversationId, userId: data.userId, isTyping: false })));

    socket.on(SOCKET_EVENTS.NEW_MESSAGE, ({ message, conversation }: NewMessagePayload) => {
      const currentUserId = userIdRef.current;
      const activeConv = store.getState().chat.activeConversation;
      const isActiveConv = activeConv?.id === message.conversationId;

      upsertMessageInCache(queryClient, message.conversationId, message);

      queryClient.setQueryData<Conversation[]>(conversationKeys.all, (old = []) => {
        const exists = old.some((c) => c.id === message.conversationId);
        
        if (!exists && conversation) {
          // If the conversation doesn't exist in our list, add it (likely a new chat)
          const newConv = {
            ...conversation,
            latestMessage: message,
            updatedAt: message.updatedAt,
            unreadCount: message.senderId === currentUserId ? 0 : 1,
          };
          return sortConversations([newConv, ...old]);
        }

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
        const conv = convList?.find((c) => c.id === message.conversationId) || conversation;
        const sender = conv?.users?.find((u: any) => u.id === message.senderId);
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
      if (store.getState().chat.activeConversation?.id === conversationId)
        dispatch(setActiveConversation(conversation));
    });

    socket.on('member_removed', ({ conversationId, conversation }: { conversationId: string; conversation: Conversation }) => {
      queryClient.setQueryData<Conversation[]>(conversationKeys.all, (old = []) =>
        old.map((c) => (c.id === conversationId ? conversation : c)));
      if (store.getState().chat.activeConversation?.id === conversationId)
        dispatch(setActiveConversation(conversation));
    });

    socket.on('group_updated', ({ conversationId, conversation }: { conversationId: string; conversation: Conversation }) => {
      queryClient.setQueryData<Conversation[]>(conversationKeys.all, (old = []) =>
        old.map((c) => (c.id === conversationId ? conversation : c)));
      queryClient.setQueryData(conversationKeys.detail(conversationId), conversation);
      if (store.getState().chat.activeConversation?.id === conversationId)
        dispatch(setActiveConversation(conversation));
    });

    socket.on('removed_from_group', ({ conversationId }: { conversationId: string }) => {
      toast.info('You were removed from a group');
      queryClient.setQueryData<Conversation[]>(conversationKeys.all, (old = []) =>
        old.filter((c) => c.id !== conversationId));
      if (store.getState().chat.activeConversation?.id === conversationId)
        dispatch(setActiveConversation(null));
    });

    socket.on(SOCKET_EVENTS.INCOMING_CALL, (data: IncomingCallPayload & { signal?: unknown }) => {
      if (store.getState().call.callStatus !== 'idle') return;
      dispatch(setCallState({
        callStatus: 'ringing',
        callType: data.callType,
        caller: data.caller,
        conversationId: data.conversationId,
        isIncomingCall: true,
        remoteSignal: data.signal,
      }));
    });

    socket.on(SOCKET_EVENTS.CALL_REJECTED, () => {
      toast.info('Call was declined');
      dispatch(resetCall());
    });

    socket.on(SOCKET_EVENTS.CALL_ENDED, () => {
      toast.info('Call ended');
      dispatch(resetCall());
    });

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
