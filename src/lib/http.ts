/**
 * http.ts
 *
 * Thin, typed wrappers over axiosInstance.
 * Each method returns the unwrapped data payload (T) directly.
 * For paginated endpoints, use httpWithMeta to also get ApiMeta.
 */

import axiosInstance from './axiosInstance';
import type { ApiMeta } from '../types';

type RequestConfig = {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

// ─── Core helpers ─────────────────────────────────────────────────────────────

export const http = {
  get: <T>(path: string, config?: RequestConfig): Promise<T> =>
    axiosInstance.get<T>(path, config).then((res) => res.data),

  post: <T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> =>
    axiosInstance.post<T>(path, body, config).then((res) => res.data),

  patch: <T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> =>
    axiosInstance.patch<T>(path, body, config).then((res) => res.data),

  put: <T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> =>
    axiosInstance.put<T>(path, body, config).then((res) => res.data),

  delete: <T>(path: string, config?: RequestConfig): Promise<T> =>
    axiosInstance.delete<T>(path, config).then((res) => res.data),

  /**
   * Upload files via multipart/form-data.
   * axios automatically sets Content-Type with the correct boundary.
   */
  upload: <T>(path: string, formData: FormData, config?: RequestConfig): Promise<T> =>
  axiosInstance
    .post<T>(path, formData, {
      ...config,
    })
    .then((res) => res.data),
  };
/**
 * httpWithMeta — for paginated endpoints that need the `meta` alongside data.
 * Returns { data: T, meta: ApiMeta | undefined }
 */
export async function httpWithMeta<T>(
  path: string,
  config?: RequestConfig,
): Promise<{ data: T; meta?: ApiMeta }> {
  const response = await axiosInstance.get<T>(path, config);
  return {
    data: response.data,
    meta: (response as any).meta as ApiMeta | undefined,
  };
}
