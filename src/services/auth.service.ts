/**
 * auth.service.ts
 *
 * Endpoints: POST /auth/login, /auth/register, /auth/refresh, /auth/logout, GET /auth/me
 *
 * Backend response data shapes:
 *   login/register → { user: PublicUser, tokens: AuthTokens }
 *   refresh        → { accessToken, refreshToken }
 *   logout         → null
 *   me             → PublicUser
 */

import { http } from '../lib/http';
import type {
  AuthResult,
  AuthTokens,
  User,
  LoginPayload,
  RegisterPayload,
} from '../types';

export const authService = {
  /**
   * POST /auth/login
   * Returns user + token pair on success.
   */
  login: (payload: LoginPayload): Promise<AuthResult> =>
    http.post<AuthResult>('/auth/login', payload),

  /**
   * POST /auth/register
   * Creates account and returns user + token pair.
   */
  register: (payload: RegisterPayload): Promise<AuthResult> =>
    http.post<AuthResult>('/auth/register', payload),

  /**
   * POST /auth/refresh
   * Exchanges a refresh token for a new access pair via HTTP-only cookie.
   */
  refresh: (): Promise<AuthTokens> =>
    http.post<AuthTokens>('/auth/refresh', {}),

  /**
   * POST /auth/logout
   * Invalidates the refresh token server-side via HTTP-only cookie.
   */
  logout: (): Promise<null> =>
    http.post<null>('/auth/logout', {}),

  /**
   * GET /auth/me
   * Returns the authenticated user's public profile.
   */
  me: (): Promise<User> => http.get<User>('/auth/me'),
};
