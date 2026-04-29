/**
 * user.service.ts
 *
 * Endpoints:
 *   GET  /users/search?q=
 *   GET  /users/online
 *   GET  /users/:userId
 *   PATCH /users/me/profile
 *   PATCH /users/me/status
 *   POST  /users/me/avatar  (multipart — field: "avatar")
 */

import { http } from '../lib/http';
import type { User, UpdateProfilePayload, UpdateStatusPayload } from '../types';

export const userService = {
  /**
   * GET /users/search?q=
   * Search users by name or email (excludes the requesting user).
   */
  search: (q: string): Promise<User[]> =>
    http.get<User[]>(`/users/search`, { params: { q } }),

  /**
   * GET /users/online
   * Returns array of currently-online user IDs.
   */
  getOnlineIds: (): Promise<string[]> => http.get<string[]>('/users/online'),

  /**
   * GET /users/:userId
   * Returns a single user's public profile.
   */
  getById: (userId: string): Promise<User> =>
    http.get<User>(`/users/${userId}`),

  /**
   * PATCH /users/me/profile
   * Updates authenticated user's name, about, or picture.
   */
  updateProfile: (payload: UpdateProfilePayload): Promise<User> =>
    http.patch<User>('/users/me/profile', payload),

  /**
   * POST /users/me/avatar
   * Upload a new profile picture to ImageKit CDN.
   * The returned user object includes the updated `picture` URL.
   */
  uploadAvatar: (file: File): Promise<User> => {
    const fd = new FormData();
    fd.append('avatar', file);
    return http.upload<User>('/users/me/avatar', fd);
  },

  /**
   * PATCH /users/me/status
   * Updates authenticated user's presence status.
   */
  updateStatus: (payload: UpdateStatusPayload): Promise<User> =>
    http.patch<User>('/users/me/status', payload),
};

