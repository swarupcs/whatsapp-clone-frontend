import { store } from '@/store';
import { setActiveConversation } from '@/store/slices/chatSlice';
import { useAppSelector, useAppDispatch } from '@/store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { conversationService } from '../../services';


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
  const dispatch = useAppDispatch();

  const token = useAppSelector((state) => state.auth.token);
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
      store.dispatch(setActiveConversation(null));
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'Failed to start conversation');
    },
  });
}

// ─── useCreateGroup ───────────────────────────────────────────────────────────

export function useCreateGroup() {
  const queryClient = useQueryClient();
  

  return useMutation({
    mutationFn: (payload: CreateGroupPayload) =>
      conversationService.createGroup(payload),
    onSuccess: (conversation) => {
      queryClient.setQueryData<Conversation[]>(
        conversationKeys.all,
        (old = []) => [conversation, ...old],
      );
      store.dispatch(setActiveConversation(null));
      toast.success('Group created!');
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'Failed to create group');
    },
  });
}

// ─── useUpdateGroup ───────────────────────────────────────────────────────────

export function useUpdateGroup(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name?: string; picture?: string }) =>
      conversationService.updateGroup(conversationId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        conversationKeys.detail(conversationId),
        updated,
      );
      queryClient.setQueryData<Conversation[]>(
        conversationKeys.all,
        (old = []) => old.map((c) => (c.id === conversationId ? updated : c)),
      );
      store.dispatch(setActiveConversation(updated));
      toast.success('Group updated!');
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'Failed to update group');
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
      queryClient.setQueryData(
        conversationKeys.detail(conversationId),
        updated,
      );
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
      queryClient.setQueryData(
        conversationKeys.detail(conversationId),
        updated,
      );
      queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      toast.success('Member removed');
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'Failed to remove member');
    },
  });
}

// ─── useLeaveGroup ────────────────────────────────────────────────────────────

export function useLeaveGroup() {
  const queryClient = useQueryClient();
  const activeConversation = useAppSelector((state) => state.chat.activeConversation);

  return useMutation({
    mutationFn: (conversationId: string) =>
      conversationService.leaveGroup(conversationId),
    onSuccess: (_, conversationId) => {
      // Remove the conversation from the sidebar list
      queryClient.setQueryData<Conversation[]>(
        conversationKeys.all,
        (old = []) => old.filter((c) => c.id !== conversationId),
      );
      // Clear active conversation if it was the one we left
      if (activeConversation?.id === conversationId) {
        store.dispatch(setActiveConversation(null));
      }
      toast.success('You left the group');
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'Failed to leave group');
    },
  });
}
