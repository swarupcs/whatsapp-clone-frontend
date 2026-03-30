import { http } from '../lib/http';
import type { User, UpdateProfilePayload, UpdateStatusPayload } from '../types/index';

export const userService = {
  search: (q: string): Promise<User[]> =>
    http.get<User[]>(`/users/search?q=${encodeURIComponent(q)}`),

  getOnlineIds: (): Promise<string[]> =>
    http.get<string[]>('/users/online'),

  getById: (userId: string): Promise<User> =>
    http.get<User>(`/users/${userId}`),

  updateProfile: (payload: UpdateProfilePayload): Promise<User> =>
    http.patch<User>('/users/me/profile', payload),

  updateStatus: (payload: UpdateStatusPayload): Promise<User> =>
    http.patch<User>('/users/me/status', payload),
};
