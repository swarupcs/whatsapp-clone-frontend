import { http } from '../lib/http';
import type { AuthResult, LoginPayload, RegisterPayload, AuthTokens } from '../types/index';

export const authService = {
  login: (payload: LoginPayload): Promise<AuthResult> =>
    http.post<AuthResult>('/auth/login', payload),

  register: (payload: RegisterPayload): Promise<AuthResult> =>
    http.post<AuthResult>('/auth/register', payload),

  refresh: (refreshToken: string): Promise<AuthTokens> =>
    http.post<AuthTokens>('/auth/refresh', { refreshToken }),

  logout: (refreshToken: string): Promise<null> =>
    http.post<null>('/auth/logout', { refreshToken }),

  me: () => http.get<import('../types/index').User>('/auth/me'),
};
