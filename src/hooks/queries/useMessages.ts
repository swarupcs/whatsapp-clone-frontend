import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { messageService } from '../../services';
import { conversationKeys } from './useConversations';
import { useAuthStore } from '../../store/authStore';
import type {
  Message,
  PaginatedData,
  SendMessagePayload,
  EditMessagePayload,
  AddReactionPayload,
  ForwardMessagePayload,
  Conversation,
} from '../../types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const messageKeys = {
  list: (convId: string) => ['messages', convId] as const,
  pinned: (convId: string) => ['messages', convId, 'pinned'] as const,
  search: (convId: string, q: string) =>
    ['messages', convId, 'search', q] as const,
  globalSearch: (q: string) => ['messages', 'global-search', q] as const,
} as const;

// ─── Send queue to prevent rapid-fire race conditions ────────────────────────
// A per-conversation promise chain ensures messages are sent sequentially
// even when the user fires them off faster than the server responds.
const sendQueues = new Map<string, Promise<Message>>();

function enqueueSend(
  conversationId: string,
  sendFn: () => Promise<Message>,
): Promise<Message> {
  const prev = sendQueues.get(conversationId) ?? Promise.resolve(null as any);
  const next = prev.then(
    () => sendFn(),
    () => sendFn(),
  ); // always run even if prev failed
  sendQueues.set(
    conversationId,
    next.catch(() => null as any),
  ); // don't block queue on error
  return next;
}

// ─── Offline detection helper ─────────────────────────────────────────────────

function isOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

// ─── useMessages (infinite scroll) ───────────────────────────────────────────

export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: messageKeys.list(conversationId),
    queryFn: ({ pageParam = 1 }) =>
      messageService.list(conversationId, pageParam as number, 30),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedData<Message>) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    enabled: !!conversationId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    select: (data) => ({
      ...data,
      messages: deduplicateMessages(
        data.pages.flatMap((p) => p.data ?? []),
      ).sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    }),
  });
}

function deduplicateMessages(messages: Message[]): Message[] {
  const seen = new Map<string, Message>();
  for (const msg of messages) seen.set(msg.id, msg);
  return Array.from(seen.values());
}

// ─── usePinnedMessages ────────────────────────────────────────────────────────

export function usePinnedMessages(conversationId: string) {
  return useQuery({
    queryKey: messageKeys.pinned(conversationId),
    queryFn: () => messageService.getPinned(conversationId),
    enabled: !!conversationId,
    staleTime: 30_000,
  });
}

// ─── useMessageSearch ─────────────────────────────────────────────────────────

export function useMessageSearch(conversationId: string, q: string) {
  return useQuery({
    queryKey: messageKeys.search(conversationId, q),
    queryFn: () => messageService.searchInConversation(conversationId, q),
    enabled: q.trim().length >= 2,
    staleTime: 30_000,
    placeholderData: [],
  });
}

// ─── useGlobalMessageSearch ───────────────────────────────────────────────────

export function useGlobalMessageSearch(q: string) {
  return useQuery({
    queryKey: messageKeys.globalSearch(q),
    queryFn: () => messageService.globalSearch(q),
    enabled: q.trim().length >= 2,
    staleTime: 30_000,
    placeholderData: [],
  });
}

// ─── useSendMessage ───────────────────────────────────────────────────────────

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({
      payload,
      files,
      optimisticId,
    }: {
      payload: SendMessagePayload;
      files?: File[];
      optimisticId: string; // passed in so onSuccess can match it
    }) => {
      // FIX 1: Reject immediately if no conversation ID to avoid confusing errors.
      if (!conversationId || conversationId.trim() === '') {
        return Promise.reject(new Error('No active conversation selected.'));
      }

      // FIX 3: Reject immediately if offline so the optimistic message stays
      // visible in a "pending" state instead of silently vanishing.
      if (!isOnline()) {
        return Promise.reject(
          new Error('You are offline. Message will not be sent.'),
        );
      }

      const sendFn = () =>
        files && files.length > 0
          ? messageService.sendWithFiles(
              conversationId,
              payload.message,
              files,
              payload.replyTo,
            )
          : messageService.send(conversationId, payload);

      // FIX 2: Enqueue the actual HTTP call so concurrent sends are serialised
      // per conversation — no parallel requests that land out of order.
      return enqueueSend(conversationId, sendFn);
    },

    onMutate: async ({ payload, files, optimisticId }) => {
      // Skip cache manipulation when there is no valid conversation.
      if (!conversationId) return { optimisticId: null };

      await queryClient.cancelQueries({
        queryKey: messageKeys.list(conversationId),
      });

      const optimistic: Message = {
        id: optimisticId,
        conversationId,
        senderId: user?.id ?? '',
        message: payload.message,
        files: files?.map((f, i) => ({
          id: `tmp-${i}`,
          name: f.name,
          type: f.type,
          url: URL.createObjectURL(f),
          size: f.size,
        })),
        replyTo: payload.replyTo,
        reactions: [],
        seenBy: [user?.id ?? ''],
        isEdited: false,
        isDeleted: false,
        isPinned: false,
        // FIX 2: Tag offline-queued messages so the UI can style them.
        _pending: !isOnline(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Message;

      queryClient.setQueryData(messageKeys.list(conversationId), (old: any) => {
        if (!old) {
          return {
            pages: [
              {
                data: [optimistic],
                total: 1,
                page: 1,
                limit: 30,
                hasMore: false,
              },
            ],
            pageParams: [1],
          };
        }

        const pages = [...old.pages];
        const last = pages[pages.length - 1];
        const prevData: Message[] = Array.isArray(last?.data) ? last.data : [];
        pages[pages.length - 1] = { ...last, data: [...prevData, optimistic] };
        return { ...old, pages };
      });

      return { optimisticId };
    },

    onSuccess: (sent, _vars, context) => {
      if (!context?.optimisticId) return;

      queryClient.setQueryData(messageKeys.list(conversationId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: PaginatedData<Message>) => ({
            ...page,
            data: Array.isArray(page.data)
              ? page.data.map((m) => (m.id === context.optimisticId ? sent : m))
              : [],
          })),
        };
      });

      queryClient.setQueryData<Conversation[]>(
        conversationKeys.all,
        (old = []) =>
          old.map((c) =>
            c.id === conversationId
              ? { ...c, latestMessage: sent, updatedAt: sent.updatedAt }
              : c,
          ),
      );
    },

    onError: (err: any, vars, context) => {
      const errorMessage: string = err?.message ?? 'Failed to send message';

      if (context?.optimisticId) {
        if (!isOnline()) {
          // FIX 3: Mark the optimistic message as failed-offline so UI can
          // surface a retry affordance rather than just removing it.
          queryClient.setQueryData(
            messageKeys.list(conversationId),
            (old: any) => {
              if (!old) return old;
              return {
                ...old,
                pages: old.pages.map((page: PaginatedData<Message>) => ({
                  ...page,
                  data: Array.isArray(page.data)
                    ? page.data.map((m) =>
                        m.id === context.optimisticId
                          ? { ...m, _failed: true, _failedReason: 'offline' }
                          : m,
                      )
                    : [],
                })),
              };
            },
          );
        } else {
          // Remove the optimistic message for non-offline errors.
          queryClient.setQueryData(
            messageKeys.list(conversationId),
            (old: any) => {
              if (!old) return old;
              return {
                ...old,
                pages: old.pages.map((page: PaginatedData<Message>) => ({
                  ...page,
                  data: Array.isArray(page.data)
                    ? page.data.filter((m) => m.id !== context.optimisticId)
                    : [],
                })),
              };
            },
          );
        }
      }

      toast.error(errorMessage);
    },
  });
}

// ─── useEditMessage ───────────────────────────────────────────────────────────

export function useEditMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      payload,
    }: {
      messageId: string;
      payload: EditMessagePayload;
    }) => {
      // FIX 4: Editing an optimistic (unsent) message makes no sense — the
      // real message ID doesn't exist yet. Guard against it explicitly.
      if (messageId.startsWith('optimistic-')) {
        return Promise.reject(
          new Error('Cannot edit a message that has not been sent yet.'),
        );
      }
      return messageService.edit(conversationId, messageId, payload);
    },

    onMutate: async ({ messageId, payload }) => {
      await queryClient.cancelQueries({
        queryKey: messageKeys.list(conversationId),
      });
      const prev = queryClient.getQueryData(messageKeys.list(conversationId));

      queryClient.setQueryData(messageKeys.list(conversationId), (old: any) =>
        patchMessage(old, messageId, (m) => ({
          ...m,
          message: payload.message,
          isEdited: true,
        })),
      );

      return { prev };
    },

    onSuccess: (updated) => {
      queryClient.setQueryData(messageKeys.list(conversationId), (old: any) =>
        patchMessage(old, updated.id, () => updated),
      );
    },

    onError: (err: any, vars, context) => {
      if (context?.prev)
        queryClient.setQueryData(
          messageKeys.list(conversationId),
          context.prev,
        );
      const msg = err?.message ?? 'Failed to edit message';
      toast.error(msg);
    },
  });
}

// ─── useDeleteMessage ─────────────────────────────────────────────────────────

export function useDeleteMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) =>
      messageService.delete(conversationId, messageId),

    onMutate: async (messageId) => {
      await queryClient.cancelQueries({
        queryKey: messageKeys.list(conversationId),
      });
      const prev = queryClient.getQueryData(messageKeys.list(conversationId));

      queryClient.setQueryData(messageKeys.list(conversationId), (old: any) =>
        patchMessage(old, messageId, (m) => ({
          ...m,
          isDeleted: true,
          message: '',
        })),
      );

      return { prev };
    },

    onError: (_err, _vars, context) => {
      if (context?.prev)
        queryClient.setQueryData(
          messageKeys.list(conversationId),
          context.prev,
        );
      toast.error('Failed to delete message');
    },
  });
}

// ─── useToggleReaction ────────────────────────────────────────────────────────

export function useToggleReaction(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      payload,
    }: {
      messageId: string;
      payload: AddReactionPayload;
    }) => messageService.toggleReaction(conversationId, messageId, payload),

    onSuccess: (updated) => {
      queryClient.setQueryData(messageKeys.list(conversationId), (old: any) =>
        patchMessage(old, updated.id, () => updated),
      );
    },

    onError: (err: any) => {
      toast.error(err?.message ?? 'Failed to add reaction');
    },
  });
}

// ─── usePinMessage ────────────────────────────────────────────────────────────

export function usePinMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, pin }: { messageId: string; pin: boolean }) =>
      pin
        ? messageService.pin(conversationId, messageId)
        : messageService.unpin(conversationId, messageId),

    onSuccess: (updated) => {
      queryClient.setQueryData(messageKeys.list(conversationId), (old: any) =>
        patchMessage(old, updated.id, () => updated),
      );
      queryClient.invalidateQueries({
        queryKey: messageKeys.pinned(conversationId),
      });
    },

    onError: (err: any) => {
      toast.error(err?.message ?? 'Failed to pin/unpin message');
    },
  });
}

// ─── useForwardMessage ────────────────────────────────────────────────────────

export function useForwardMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      toConversationId,
    }: {
      messageId: string;
      toConversationId: string;
    }) =>
      messageService.forward(conversationId, messageId, { toConversationId }),

    onSuccess: (forwarded) => {
      queryClient.setQueryData(
        messageKeys.list(forwarded.conversationId),
        (old: any) => {
          if (!old) return old;
          const pages = [...old.pages];
          const last = pages[pages.length - 1];
          const prevData: Message[] = Array.isArray(last?.data)
            ? last.data
            : [];
          pages[pages.length - 1] = {
            ...last,
            data: [...prevData, forwarded],
          };
          return { ...old, pages };
        },
      );
      toast.success('Message forwarded');
    },

    onError: (err: any) => {
      toast.error(err?.message ?? 'Failed to forward message');
    },
  });
}

// ─── useMarkSeen ─────────────────────────────────────────────────────────────

export function useMarkSeen(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) =>
      messageService.markSeen(conversationId, messageId),

    onSuccess: (updated) => {
      queryClient.setQueryData(messageKeys.list(conversationId), (old: any) =>
        patchMessage(old, updated.id, () => updated),
      );
    },
  });
}

// ─── Private helper ───────────────────────────────────────────────────────────

function patchMessage(
  old: any,
  messageId: string,
  updater: (m: Message) => Message,
): any {
  if (!old) return old;
  return {
    ...old,
    pages: old.pages.map((page: PaginatedData<Message>) => ({
      ...page,
      data: Array.isArray(page.data)
        ? page.data.map((m) => (m.id === messageId ? updater(m) : m))
        : [],
    })),
  };
}
