import type { ApiErrorCode } from '../types';

/**
 * ApiError — thrown by the axios instance whenever the backend returns
 * a non-2xx response OR whenever the response envelope has success: false.
 *
 * Mirrors the backend's ErrorPayload shape so callers can inspect:
 *   err.statusCode  — HTTP status
 *   err.code        — machine-readable code (e.g. 'VALIDATION_ERROR')
 *   err.message     — human-readable message
 *   err.details     — field-level validation errors, etc.
 *   err.requestId   — correlation ID for log tracing
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ApiErrorCode | string;
  public readonly details?: unknown;
  public readonly requestId?: string;

  constructor(
    message: string,
    statusCode: number,
    code: ApiErrorCode | string,
    details?: unknown,
    requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.requestId = requestId;

    // Restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /** True for 401 Unauthorized */
  get isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  /** True for 403 Forbidden */
  get isForbidden(): boolean {
    return this.statusCode === 403;
  }

  /** True for 404 Not Found */
  get isNotFound(): boolean {
    return this.statusCode === 404;
  }

  /** True for 422 / 400 validation errors */
  get isValidation(): boolean {
    return (
      this.code === 'VALIDATION_ERROR' || this.statusCode === 422
    );
  }

  /** True for 429 rate-limit errors */
  get isRateLimit(): boolean {
    return this.statusCode === 429;
  }
}
