import type { ApiResponse } from '../types/index';

export const BASE_URL =
  (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000/api';

// ─── Token helpers ────────────────────────────────────────────────────────────

export const tokenStorage = {
  getAccess: (): string | null => localStorage.getItem('whatsup_access_token'),
  getRefresh: (): string | null =>
    localStorage.getItem('whatsup_refresh_token'),
  setTokens: (access: string, refresh: string): void => {
    localStorage.setItem('whatsup_access_token', access);
    localStorage.setItem('whatsup_refresh_token', refresh);
  },
  clearTokens: (): void => {
    localStorage.removeItem('whatsup_access_token');
    localStorage.removeItem('whatsup_refresh_token');
  },
};

// ─── Custom error class ───────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly error: string,
    public readonly details?: unknown,
  ) {
    super(error);
    this.name = 'ApiError';
  }
}

// ─── Refresh state ────────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshWaiters: Array<(token: string | null) => void> = [];

async function attemptRefresh(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      tokenStorage.clearTokens();
      return null;
    }

    const data = (await res.json()) as ApiResponse<{
      accessToken: string;
      refreshToken: string;
    }>;

    if (!data.success) {
      tokenStorage.clearTokens();
      return null;
    }

    tokenStorage.setTokens(data.data.accessToken, data.data.refreshToken);
    return data.data.accessToken;
  } catch {
    // Network error during refresh — don't clear tokens, just return null
    return null;
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

export async function httpClient<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const accessToken = tokenStorage.getAccess();

  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Silent token refresh on 401
  if (res.status === 401 && !isRetry) {
    if (isRefreshing) {
      // Queue this request until refresh completes
      return new Promise<T>((resolve, reject) => {
        refreshWaiters.push(async (newToken) => {
          if (!newToken) {
            reject(new ApiError(401, 'Session expired'));
            return;
          }
          try {
            resolve(
              await httpClient<T>(
                path,
                {
                  ...options,
                  headers: {
                    ...(headers as Record<string, string>),
                    Authorization: `Bearer ${newToken}`,
                  },
                },
                true,
              ),
            );
          } catch (e) {
            reject(e);
          }
        });
      });
    }

    // BUG FIX 13: Use try/finally so isRefreshing and refreshWaiters are ALWAYS
    // reset, even if attemptRefresh() throws due to a network error.
    // Previously a thrown error would permanently lock isRefreshing=true,
    // causing all future 401s to queue up and never resolve.
    isRefreshing = true;
    let newToken: string | null = null;
    try {
      newToken = await attemptRefresh();
    } finally {
      isRefreshing = false;
      // Notify all queued requests regardless of success/failure
      const waiters = refreshWaiters;
      refreshWaiters = [];
      waiters.forEach((cb) => cb(newToken));
    }

    if (!newToken) {
      window.dispatchEvent(new Event('auth:expired'));
      throw new ApiError(401, 'Session expired');
    }

    return httpClient<T>(path, options, true);
  }

  const data = (await res.json()) as ApiResponse<T>;

  if (!data.success) {
    throw new ApiError(res.status, data.error, data.details);
  }

  return data.data;
}

// ─── Method helpers ───────────────────────────────────────────────────────────

export const http = {
  get: <T>(path: string) => httpClient<T>(path, { method: 'GET' }),

  post: <T>(path: string, body?: unknown) =>
    httpClient<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    httpClient<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string, body?: unknown) =>
    httpClient<T>(path, {
      method: 'DELETE',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  upload: <T>(path: string, formData: FormData) =>
    httpClient<T>(path, { method: 'POST', body: formData }),
};
