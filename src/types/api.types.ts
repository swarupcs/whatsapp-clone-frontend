/**
 * api.types.ts
 *
 * Mirrors the exact response envelope the backend sends.
 *
 * Backend success shape:
 * {
 *   success: true,
 *   statusCode: 200,
 *   message?: string,
 *   data: T,
 *   meta?: ApiMeta
 * }
 *
 * Backend error shape:
 * {
 *   success: false,
 *   statusCode: 400,
 *   code: string,
 *   message: string,
 *   details?: unknown,
 *   requestId?: string
 * }
 */

// ─── Envelope ─────────────────────────────────────────────────────────────────

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
  nextCursor?: string;
  [key: string]: unknown;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  statusCode: number;
  message?: string;
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ─── Error Codes (mirrors backend AppError codes) ─────────────────────────────

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'INVALID_ID'
  | 'UNAUTHORIZED'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_NOT_ACTIVE'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'CONFLICT'
  | 'DUPLICATE_KEY'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'UNPROCESSABLE_ENTITY'
  | 'TOO_MANY_REQUESTS'
  | 'TOO_MANY_AUTH_ATTEMPTS'
  | 'INTERNAL_SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'UPLOAD_ERROR'
  | 'INVALID_JSON';

// ─── Pagination (mirrors backend PaginatedResponse<T>) ────────────────────────

export interface PaginatedData<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}
