import { store } from '@/store';
import { setAuth } from '@/store/slices/authSlice';
import { useAppSelector, useAppDispatch } from '@/store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { userService } from '../../services';

import type { UpdateProfilePayload, UpdateStatusPayload } from '../../types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const userKeys = {
  all: ['users'] as const,
  search: (q: string) => ['users', 'search', q] as const,
  online: ['users', 'online'] as const,
  detail: (id: string) => ['users', id] as const,
} as const;

// ─── useUserSearch ────────────────────────────────────────────────────────────

export function useUserSearch(q: string) {
  const dispatch = useAppDispatch();

  return useQuery({
    queryKey: userKeys.search(q),
    queryFn: () => userService.search(q),
    enabled: q.trim().length >= 1,
    staleTime: 30_000,
    placeholderData: [],
  });
}

// ─── useOnlineUsers ───────────────────────────────────────────────────────────

export function useOnlineUsers() {
  return useQuery({
    queryKey: userKeys.online,
    queryFn: userService.getOnlineIds,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}

// ─── useUser ──────────────────────────────────────────────────────────────────

export function useUser(userId: string) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => userService.getById(userId),
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}

// ─── useUpdateProfile ─────────────────────────────────────────────────────────

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      userService.updateProfile(payload),
    onSuccess: (updated) => {
      if (token) store.dispatch(setAuth({ user: updated, token }));
      queryClient.setQueryData(['auth', 'me'], updated);
      queryClient.setQueryData(userKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Profile updated successfully');
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'Failed to update profile');
    },
  });
}

// ─── useUpdateStatus ──────────────────────────────────────────────────────────

export function useUpdateStatus() {
  const queryClient = useQueryClient();
  const token = useAppSelector((state) => state.auth.token);

  return useMutation({
    mutationFn: (payload: UpdateStatusPayload) =>
      userService.updateStatus(payload),
    onSuccess: (updated) => {
      if (token) store.dispatch(setAuth({ user: updated, token }));
      queryClient.setQueryData(['auth', 'me'], updated);
      toast.success(`Status set to ${updated.status}`);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'Failed to update status');
    },
  });
}
