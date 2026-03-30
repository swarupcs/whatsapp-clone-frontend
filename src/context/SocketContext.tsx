import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  connectSocket,
  disconnectSocket,
  socketEmit,
  SOCKET_EVENTS,
} from '../lib/socket';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useCallStore } from '../store/callStore';
import { messageKeys } from '../hooks/queries/useMessages';
import { conversationKeys } from '../hooks/queries/useConversations';
import type {
  Message,
  Conversation,
  NewMessagePayload,
  ReactionUpdatedPayload,
  MessageSeenPayload,
  PinPayload,
  IncomingCallPayload,
  TypingPayload,
  PaginatedResponse,
} from '../types/index';
import { notificationService } from '../lib/notifications';

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

export function SocketProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { activeConversation, setOnlineUsers, setUserOnline, setUserOffline, setTyping } =
    useChatStore();
  const { simulateIncomingCall, endCall } = useCallStore();
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      setConnected(false);
      return;
    }

    const socket = connectSocket();

    socket.on(SOCKET_EVENTS.CONNECT, () => setConnected(true));
    socket.on(SOCKET_EVENTS.DISCONNECT, () => setConnected(false));
    socket.on(SOCKET_EVENTS.CONNECT_ERROR, (err) =>
      console.error('[Socket]', err.message),
    );

    // ── Online presence ────────────────────────────────────────────────────

    socket.on(SOCKET_EVENTS.ONLINE_USERS, ({ userIds }: { userIds: string[] }) =>
      setOnlineUsers(userIds),
    );
    socket.on(SOCKET_EVENTS.USER_ONLINE, ({ userId }: { userId: string }) =>
      setUserOnline(userId),
    );
    socket.on(SOCKET_EVENTS.USER_OFFLINE, ({ userId }: { userId: string }) =>
      setUserOffline(userId),
    );

    // ── Typing ────────────────────────────────────────────────────────────

    socket.on(SOCKET_EVENTS.TYPING_START, (data: TypingPayload) =>
      setTyping(data.conversationId, data.userId, true),
    );
    socket.on(SOCKET_EVENTS.TYPING_STOP, (data: TypingPayload) =>
      setTyping(data.conversationId, data.userId, false),
    );

    // ── New message ────────────────────────────────────────────────────────

    socket.on(SOCKET_EVENTS.NEW_MESSAGE, ({ message, conversation }: NewMessagePayload) => {
      const isActive = activeConversation?.id === message.conversationId;

      // Append to query cache for the relevant conversation
      queryClient.setQueryData(
        messageKeys.list(message.conversationId),
        (old: any) => {
          if (!old) return old;
          // Deduplicate and remove matching optimistic messages
          const pages: PaginatedResponse<Message>[] = old.pages.map(
            (page: PaginatedResponse<Message>, idx: number) => {
              if (idx !== old.pages.length - 1) return page;
              const filtered = page.data.filter(
                (m) =>
                  !(
                    m.id.startsWith('optimistic-') &&
                    m.senderId === message.senderId &&
                    m.message === message.message
                  ) && m.id !== message.id,
              );
              return { ...page, data: [...filtered, message] };
            },
          );
          return { ...old, pages };
        },
      );

      // Update conversation list
      queryClient.setQueryData<Conversation[]>(
        conversationKeys.all,
        (old = []) =>
          old.map((c) =>
            c.id === message.conversationId
              ? {
                  ...c,
                  latestMessage: message,
                  updatedAt: message.updatedAt,
                  unreadCount: isActive ? 0 : (c.unreadCount ?? 0) + 1,
                }
              : c,
          ),
      );

      // Background notification
      if (!isActive && message.senderId !== user.id) {
        const conv = queryClient
          .getQueryData<Conversation[]>(conversationKeys.all)
          ?.find((c) => c.id === message.conversationId);
        const sender = conv?.users.find((u) => u.id === message.senderId);
        notificationService.showNotification(sender?.name ?? 'New message', {
          body: message.message.slice(0, 80),
          icon: sender?.picture,
          tag: `msg-${message.id}`,
        });
      }
    });

    // ── Edit / Delete ──────────────────────────────────────────────────────

    socket.on(SOCKET_EVENTS.MESSAGE_EDITED, ({ message }: { message: Message }) => {
      patchCachedMessage(queryClient, message.conversationId, message.id, () => message);
    });

    socket.on(
      SOCKET_EVENTS.MESSAGE_DELETED,
      ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
        patchCachedMessage(queryClient, conversationId, messageId, (m) => ({
          ...m,
          isDeleted: true,
          message: '',
        }));
      },
    );

    // ── Reactions ──────────────────────────────────────────────────────────

    socket.on(SOCKET_EVENTS.REACTION_UPDATED, (data: ReactionUpdatedPayload) => {
      patchCachedMessage(queryClient, data.conversationId, data.messageId, (m) => ({
        ...m,
        reactions: data.reactions,
      }));
    });

    // ── Read receipts ──────────────────────────────────────────────────────

    socket.on(SOCKET_EVENTS.MESSAGE_SEEN, (data: MessageSeenPayload) => {
      patchCachedMessage(queryClient, data.conversationId, data.messageId, (m) => ({
        ...m,
        seenBy: data.seenBy,
      }));
    });

    // ── Pin / Unpin ────────────────────────────────────────────────────────

    socket.on(SOCKET_EVENTS.MESSAGE_PINNED, (data: PinPayload) => {
      patchCachedMessage(
        queryClient,
        data.conversationId,
        data.message.id,
        () => data.message,
      );
      queryClient.invalidateQueries({
        queryKey: messageKeys.pinned(data.conversationId),
      });
    });

    socket.on(SOCKET_EVENTS.MESSAGE_UNPINNED, (data: PinPayload) => {
      patchCachedMessage(
        queryClient,
        data.conversationId,
        data.message.id,
        () => data.message,
      );
      queryClient.invalidateQueries({
        queryKey: messageKeys.pinned(data.conversationId),
      });
    });

    // ── Calls ──────────────────────────────────────────────────────────────

    socket.on(SOCKET_EVENTS.INCOMING_CALL, (data: IncomingCallPayload) => {
      simulateIncomingCall(data.caller, data.callType);
    });

    socket.on(SOCKET_EVENTS.CALL_REJECTED, () => {
      toast.info('Call was declined');
      endCall();
    });

    socket.on(SOCKET_EVENTS.CALL_ENDED, () => {
      toast.info('Call ended');
      endCall();
    });

    return () => {
      socket.removeAllListeners();
      disconnectSocket();
      setConnected(false);
    };
  }, [user?.id]);

  // ── Typing emitter with debounce ─────────────────────────────────────────

  function emitTyping(conversationId: string, isTyping: boolean) {
    if (!user) return;
    const payload: TypingPayload = {
      conversationId,
      userId: user.id,
      userName: user.name,
    };
    if (isTyping) {
      socketEmit.typing(payload);
      clearTimeout(typingTimers.current[conversationId]);
      typingTimers.current[conversationId] = setTimeout(() => {
        socketEmit.stopTyping(payload);
      }, 3000);
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

// ─── Helper: patch a message in the infinite query cache ──────────────────────

function patchCachedMessage(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
  messageId: string,
  updater: (m: Message) => Message,
) {
  queryClient.setQueryData(
    messageKeys.list(conversationId),
    (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: PaginatedResponse<Message>) => ({
          ...page,
          data: page.data.map((m) => (m.id === messageId ? updater(m) : m)),
        })),
      };
    },
  );
}
