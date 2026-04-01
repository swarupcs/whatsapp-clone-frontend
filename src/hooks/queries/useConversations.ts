import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { conversationService } from '../../services';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import type {
  Conversation,
  CreateGroupPayload,
  CreateDirectConversationPayload,
  AddGroupMemberPayload,
} from '../../types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const conversationKeys = {
  all: ['conversations'] as const,
  detail: (id: string) => ['conversations', id] as const,
} as const;

// ─── useConversations ─────────────────────────────────────────────────────────

export function useConversations() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: conversationKeys.all,
    queryFn: conversationService.list,
    enabled: !!token,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

// ─── useConversation ──────────────────────────────────────────────────────────

export function useConversation(id: string) {
  return useQuery({
    queryKey: conversationKeys.detail(id),
    queryFn: () => conversationService.getById(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

// ─── useCreateDirectConversation ──────────────────────────────────────────────

export function useCreateDirectConversation() {
  const queryClient = useQueryClient();
  const { setActiveConversation } = useChatStore();

  return useMutation({
    mutationFn: (userId: string) =>
      conversationService.createDirect({ userId }),
    onSuccess: (conversation) => {
      queryClient.setQueryData<Conversation[]>(
        conversationKeys.all,
        (old = []) =>
          old.some((c) => c.id === conversation.id)
            ? old
            : [conversation, ...old],
      );
      setActiveConversation(conversation);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'Failed to start conversation');
    },
  });
}

// ─── useCreateGroup ───────────────────────────────────────────────────────────

export function useCreateGroup() {
  const queryClient = useQueryClient();
  const { setActiveConversation } = useChatStore();

  return useMutation({
    mutationFn: (payload: CreateGroupPayload) =>
      conversationService.createGroup(payload),
    onSuccess: (conversation) => {
      queryClient.setQueryData<Conversation[]>(
        conversationKeys.all,
        (old = []) => [conversation, ...old],
      );
      setActiveConversation(conversation);
      toast.success('Group created!');
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'Failed to create group');
    },
  });
}

// ─── useMarkRead ──────────────────────────────────────────────────────────────

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      conversationService.markRead(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.setQueryData<Conversation[]>(
        conversationKeys.all,
        (old = []) =>
          old.map((c) =>
            c.id === conversationId ? { ...c, unreadCount: 0 } : c,
          ),
      );
    },
  });
}

// ─── useAddGroupMember ────────────────────────────────────────────────────────

export function useAddGroupMember(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      conversationService.addMember(conversationId, { userId }),
    onSuccess: (updated) => {
      queryClient.setQueryData(conversationKeys.detail(conversationId), updated);
      queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      toast.success('Member added');
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'Failed to add member');
    },
  });
}

// ─── useRemoveGroupMember ─────────────────────────────────────────────────────

export function useRemoveGroupMember(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      conversationService.removeMember(conversationId, userId),
    onSuccess: (updated) => {
      queryClient.setQueryData(conversationKeys.detail(conversationId), updated);
      queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      toast.success('Member removed');
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'Failed to remove member');
    },
  });
}
