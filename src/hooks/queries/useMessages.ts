import { store } from '@/store';
import { pushUndoEdit, popUndoEdit, pushUndoDelete, popUndoDelete } from '@/store/slices/chatSlice';
import { useAppSelector, useAppDispatch } from '@/store';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { messageService } from '../../services';
import { conversationKeys } from './useConversations';


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
const sendQueues = new Map<string, Promise<Message>>();

function enqueueSend(
  conversationId: string,
  sendFn: () => Promise<Message>,
): Promise<Message> {
  const prev = sendQueues.get(conversationId) ?? Promise.resolve(null as any);
  const next = prev.then(
    () => sendFn(),
    () => sendFn(),
  );
  sendQueues.set(
    conversationId,
    next.catch(() => null as any),
  );
  return next;
}

// ─── Offline detection helper ─────────────────────────────────────────────────

function isOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

// ─── useMessages (infinite scroll) ───────────────────────────────────────────

export function useMessages(conversationId: string) {
  const dispatch = useAppDispatch();

  return useInfiniteQuery({
    queryKey: messageKeys.list(conversationId),
    queryFn: ({ pageParam = 1 }) =>
      messageService.list(conversationId, pageParam as number, 30),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedData<Message>) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    enabled: !!conversationId && !conversationId.startsWith('virtual_'),
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
  const user = useAppSelector((state) => state.auth.user);

  return useMutation({
    mutationFn: ({
      payload,
      files,
      optimisticId,
      targetConvId,
    }: {
      payload: SendMessagePayload;
      files?: File[];
      optimisticId: string;
      targetConvId?: string;
    }) => {
      const cid = targetConvId || conversationId;
      if (!cid || cid.trim() === '') {
        return Promise.reject(new Error('No active conversation selected.'));
      }

      if (!isOnline()) {
        return Promise.reject(
          new Error('You are offline. Message will not be sent.'),
        );
      }

      const sendFn = () =>
        files && files.length > 0
          ? messageService.sendWithFiles(
              cid,
              payload.message,
              files,
              payload.replyTo,
            )
          : messageService.send(cid, payload);

      return enqueueSend(cid, sendFn);
    },

    onMutate: async ({ payload, files, optimisticId, targetConvId }) => {
      const cid = targetConvId || conversationId;
      if (!cid) return { optimisticId: null, cid };

      await queryClient.cancelQueries({
        queryKey: messageKeys.list(cid),
      });

      const optimistic: Message = {
        id: optimisticId,
        conversationId: cid,
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
        _pending: !isOnline(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Message;

      queryClient.setQueryData(messageKeys.list(cid), (old: any) => {
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

      return { optimisticId, cid };
    },

    onSuccess: (sent, _vars, context) => {
      if (!context?.optimisticId || !context.cid) return;

      queryClient.setQueryData(messageKeys.list(context.cid), (old: any) => {
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
            c.id === context.cid
              ? { ...c, latestMessage: sent, updatedAt: sent.updatedAt }
              : c,
          ),
      );
    },

    onError: (err: any, vars, context) => {
      const errorMessage: string = err?.message ?? 'Failed to send message';

      if (context?.optimisticId && context.cid) {
        if (!isOnline()) {
          queryClient.setQueryData(
            messageKeys.list(context.cid),
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
          queryClient.setQueryData(
            messageKeys.list(context.cid),
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
  

  return {
    mutate: ({ messageId, payload }: { messageId: string; payload: EditMessagePayload }) => {
      if (messageId.startsWith('optimistic-')) {
        toast.error('Cannot edit a message that has not been sent yet.');
        return;
      }

      let originalMessage = '';
      queryClient.setQueryData(messageKeys.list(conversationId), (old: any) => {
        if (!old) return old;
        for (const page of old.pages as PaginatedData<Message>[]) {
          const found = page.data.find((m) => m.id === messageId);
          if (found) { originalMessage = found.message; break; }
        }
        return patchMessage(old, messageId, (m) => ({
          ...m,
          message: payload.message,
          isEdited: true,
        }));
      });

      if (originalMessage) {
        store.dispatch(pushUndoEdit({
          conversationId,
          messageId,
          originalMessage,
          newMessage: payload.message,
          expiresAt: Date.now() + 5000,
        }));

        setTimeout(() => {
          const entry = store.getState().chat.undoEditStack.find((e) => e.messageId === messageId);
          if (entry) {
            store.dispatch(popUndoEdit(messageId));
            messageService.edit(conversationId, messageId, payload).catch((err) => {
              toast.error(err?.message ?? 'Failed to edit message');
              queryClient.setQueryData(messageKeys.list(conversationId), (old: any) =>
                patchMessage(old, messageId, (m) => ({ ...m, message: originalMessage }))
              );
            });
          }
        }, 5000);
      }
    },
  };
}

// ─── useDeleteMessage — FIX: push to undoDeleteStack ─────────────────────────

export function useDeleteMessage(conversationId: string) {
  const queryClient = useQueryClient();
  

  return {
    mutate: (messageId: string) => {
      let capturedMessage: Message | undefined;

      queryClient.setQueryData(messageKeys.list(conversationId), (old: any) => {
        if (!old) return old;
        for (const page of old.pages as PaginatedData<Message>[]) {
          const found = page.data.find((m) => m.id === messageId);
          if (found) { capturedMessage = found; break; }
        }
        return patchMessage(old, messageId, (m) => ({
          ...m,
          isDeleted: true,
          message: '',
        }));
      });

      if (capturedMessage) {
        store.dispatch(pushUndoDelete({
          conversationId,
          message: capturedMessage,
          expiresAt: Date.now() + 5000,
        }));

        setTimeout(() => {
          const entry = store.getState().chat.undoDeleteStack.find(e => e.message.id === messageId);
          if (entry) {
            store.dispatch(popUndoDelete(messageId));
            messageService.delete(conversationId, messageId).catch(() => {
              toast.error('Failed to delete message');
              queryClient.setQueryData(messageKeys.list(conversationId), (old: any) =>
                patchMessage(old, messageId, () => entry.message)
              );
            });
          }
        }, 5000);
      }
    },
  };
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

// ─── useForwardMessage — FIX: not tied to a specific source conversation ──────

export function useForwardMessage(sourceConversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      toConversationId,
    }: {
      messageId: string;
      toConversationId: string;
    }) =>
      // FIX: use sourceConversationId (the conversation the message lives in)
      messageService.forward(sourceConversationId, messageId, {
        toConversationId,
      }),

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
export function patchMessage(old: any, messageId: string, updater: (m: Message) => Message): any { if (!old) return old; return { ...old, pages: old.pages.map((page: PaginatedData<Message>) => ({ ...page, data: Array.isArray(page.data) ? page.data.map((m) => (m.id === messageId ? updater(m) : m)) : [], })), }; }