import { http } from '../lib/http';
import type { Conversation, CreateGroupPayload } from '../types/index';

export const conversationService = {
  list: (): Promise<Conversation[]> =>
    http.get<Conversation[]>('/conversations'),

  getById: (id: string): Promise<Conversation> =>
    http.get<Conversation>(`/conversations/${id}`),

  createDirect: (userId: string): Promise<Conversation> =>
    http.post<Conversation>('/conversations', { userId }),

  createGroup: (payload: CreateGroupPayload): Promise<Conversation> =>
    http.post<Conversation>('/conversations/group', payload),

  markRead: (conversationId: string): Promise<null> =>
    http.post<null>(`/conversations/${conversationId}/read`),

  addMember: (conversationId: string, userId: string): Promise<Conversation> =>
    http.post<Conversation>(`/conversations/${conversationId}/members`, { userId }),

  removeMember: (conversationId: string, userId: string): Promise<Conversation> =>
    http.delete<Conversation>(`/conversations/${conversationId}/members/${userId}`),
};
