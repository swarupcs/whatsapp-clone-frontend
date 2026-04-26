import { store } from '@/store';
import { setAuth, clearAuth } from '@/store/slices/authSlice';
import { useAppSelector, useAppDispatch } from '@/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authService } from '../../services';
import { tokenStorage } from '../../lib';

import type { LoginPayload, RegisterPayload } from '../../types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const authKeys = {
  me: ['auth', 'me'] as const,
} as const;

// ─── useMe ────────────────────────────────────────────────────────────────────

export function useMe() {
  const dispatch = useAppDispatch();

  const token = useAppSelector((state) => state.auth.token);
  return useQuery({
    queryKey: authKeys.me,
    queryFn: authService.me,
    enabled: !!token,
    staleTime: 5 * 60_000,
  });
}

// ─── useLogin ─────────────────────────────────────────────────────────────────

export function useLogin() {
  const queryClient = useQueryClient();
  

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (result) => {
      tokenStorage.setAccess(result.tokens.accessToken);
      store.dispatch(setAuth({ user: result.user, token: result.tokens.accessToken }));
      queryClient.setQueryData(authKeys.me, result.user);
      toast.success(`Welcome back, ${result.user.name}!`);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'Login failed. Please try again.');
    },
  });
}
// ─── useRegister ──────────────────────────────────────────────────────────────

export function useRegister() {
  const queryClient = useQueryClient();
  

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onSuccess: (result) => {
      tokenStorage.setAccess(result.tokens.accessToken);
      store.dispatch(setAuth({ user: result.user, token: result.tokens.accessToken }));
      queryClient.setQueryData(authKeys.me, result.user);
      toast.success('Account created successfully!');
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'Registration failed. Please try again.');
    },
  });
}

// ─── useLogout ────────────────────────────────────────────────────────────────

export function useLogout() {
  const queryClient = useQueryClient();
  

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      tokenStorage.clearTokens();
      store.dispatch(clearAuth());
      queryClient.clear();
    },
  });
}
