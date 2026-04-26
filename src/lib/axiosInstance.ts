/**
 * axiosInstance.ts
 *
 * Configured axios instance that:
 *  1. Attaches Bearer token to every request
 *  2. Unwraps the backend's success envelope → returns data directly
 *  3. Normalizes backend error envelope → throws ApiError
 *  4. Handles 401 → silent token refresh → retry once
 *  5. Queues concurrent 401s during refresh (no parallel refresh storms)
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { ApiError } from './ApiError';
import { tokenStorage } from './tokenStorage';
import type { ApiSuccessResponse, ApiErrorResponse, ApiResponse } from '../types';

export const BASE_URL =
  (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000/api';

// ─── Refresh state ────────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function flushQueue(token: string | null): void {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

async function attemptTokenRefresh(): Promise<string | null> {
  try {
    // Use a raw axios call (not the intercepted instance) to avoid loops.
    // withCredentials: true ensures the browser automatically attaches the HttpOnly refreshToken cookie.
    const res = await axios.post<ApiResponse<{ accessToken: string }>>(
      `${BASE_URL}/auth/refresh`,
      {},
      { 
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true 
      },
    );

    const data = res.data;
    if (!data.success) {
      tokenStorage.clearTokens();
      return null;
    }

    tokenStorage.setAccess(data.data.accessToken);
    return data.data.accessToken;
  } catch {
    tokenStorage.clearTokens();
    return null;
  }
}

// ─── Create instance ──────────────────────────────────────────────────────────

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  withCredentials: true, // Crucial: Send cookies on every cross-origin request
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor: attach auth token ───────────────────────────────────

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccess();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor: unwrap envelope + handle 401 ──────────────────────

axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const data = response.data;

    // Backend returned success: false despite 2xx (shouldn't happen, but guard)
    if (!data.success) {
      const err = data as ApiErrorResponse;
      throw new ApiError(err.message, err.statusCode, err.code, err.details, err.requestId);
    }

    // Unwrap: return only the `data` field so callers get the payload directly.
    // Attach meta to response.data so callers that need pagination can access it.
    const success = data as ApiSuccessResponse;
    response.data = success.data as any;
    (response as any).meta = success.meta;
    return response;
  },

  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Normalize non-axios errors
    if (!error.response) {
      throw new ApiError('Network error. Please check your connection.', 0, 'NETWORK_ERROR');
    }

    const { status, data } = error.response as AxiosResponse<ApiErrorResponse>;

    // For non-401 errors, convert to ApiError immediately
    if (status !== 401) {
      throw new ApiError(
        data?.message ?? 'An unexpected error occurred',
        status,
        data?.code ?? 'UNKNOWN_ERROR',
        data?.details,
        data?.requestId,
      );
    }

    // ── 401 handling: try token refresh ──────────────────────────────────────

    if (originalRequest._retry) {
      // Already retried — give up, dispatch session-expired event
      tokenStorage.clearTokens();
      window.dispatchEvent(new Event('auth:expired'));
      throw new ApiError(
        data?.message ?? 'Session expired. Please log in again.',
        401,
        data?.code ?? 'UNAUTHORIZED',
        data?.details,
        data?.requestId,
      );
    }

    if (isRefreshing) {
      // Queue this request until the in-flight refresh finishes
      return new Promise((resolve, reject) => {
        refreshQueue.push((newToken) => {
          if (!newToken) {
            reject(
              new ApiError('Session expired', 401, 'UNAUTHORIZED'),
            );
            return;
          }
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(axiosInstance(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    let newToken: string | null = null;
    try {
      newToken = await attemptTokenRefresh();
    } finally {
      isRefreshing = false;
      flushQueue(newToken);
    }

    if (!newToken) {
      window.dispatchEvent(new Event('auth:expired'));
      throw new ApiError('Session expired. Please log in again.', 401, 'UNAUTHORIZED');
    }

    // Retry the original request with the new token
    originalRequest.headers = originalRequest.headers ?? {};
    originalRequest.headers.Authorization = `Bearer ${newToken}`;
    return axiosInstance(originalRequest);
  },
);

export default axiosInstance;
