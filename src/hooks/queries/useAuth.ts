import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authService } from '../../services';
import { tokenStorage } from '../../lib';
import { useAuthStore } from '../../store/authStore';
import type { LoginPayload, RegisterPayload } from '../../types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const authKeys = {
  me: ['auth', 'me'] as const,
} as const;

// ─── useMe ────────────────────────────────────────────────────────────────────

export function useMe() {
  const token = useAuthStore((s) => s.token);
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
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (result) => {
      tokenStorage.setAccess(result.tokens.accessToken);
      setAuth(result.user, result.tokens.accessToken);
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
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onSuccess: (result) => {
      tokenStorage.setAccess(result.tokens.accessToken);
      setAuth(result.user, result.tokens.accessToken);
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
  const { clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      tokenStorage.clearTokens();
      clearAuth();
      queryClient.clear();
    },
  });
}
