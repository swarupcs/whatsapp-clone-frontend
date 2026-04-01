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
        data.pages.flatMap((p) => (Array.isArray(p.data) ? p.data : [])),
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
    }: {
      payload: SendMessagePayload;
      files?: File[];
    }) =>
      files && files.length > 0
        ? messageService.sendWithFiles(
            conversationId,
            payload.message,
            files,
            payload.replyTo,
          )
        : messageService.send(conversationId, payload),

    onMutate: async ({ payload, files }) => {
      await queryClient.cancelQueries({
        queryKey: messageKeys.list(conversationId),
      });

      const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

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
        // Guard: last.data may be undefined if the page hasn't resolved yet
        const prevData: Message[] = Array.isArray(last?.data) ? last.data : [];
        pages[pages.length - 1] = { ...last, data: [...prevData, optimistic] };
        return { ...old, pages };
      });

      // FIX: must return optimisticId so onSuccess/onError context is defined
      return { optimisticId };
    },

    onSuccess: (sent, _vars, context) => {
      queryClient.setQueryData(messageKeys.list(conversationId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: PaginatedData<Message>) => ({
            ...page,
            // FIX: guard page.data before mapping
            data: Array.isArray(page.data)
              ? page.data.map((m) =>
                  m.id === context?.optimisticId ? sent : m,
                )
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

    onError: (_err, _vars, context) => {
      if (context?.optimisticId) {
        queryClient.setQueryData(
          messageKeys.list(conversationId),
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page: PaginatedData<Message>) => ({
                ...page,
                // FIX: guard page.data before filtering
                data: Array.isArray(page.data)
                  ? page.data.filter((m) => m.id !== context.optimisticId)
                  : [],
              })),
            };
          },
        );
      }
      toast.error('Failed to send message');
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
    }) => messageService.edit(conversationId, messageId, payload),

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

    onError: (_err, _vars, context) => {
      if (context?.prev)
        queryClient.setQueryData(
          messageKeys.list(conversationId),
          context.prev,
        );
      toast.error('Failed to edit message');
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
          // FIX: guard last.data before spreading
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
      // FIX: guard page.data — may be undefined during optimistic updates
      data: Array.isArray(page.data)
        ? page.data.map((m) => (m.id === messageId ? updater(m) : m))
        : [],
    })),
  };
}
