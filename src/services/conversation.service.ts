/**
 * conversation.service.ts
 */

import { http } from '../lib/http';
import type {
  Conversation,
  CreateDirectConversationPayload,
  CreateGroupPayload,
  AddGroupMemberPayload,
} from '../types';

export const conversationService = {
  list: (): Promise<Conversation[]> =>
    http.get<Conversation[]>('/conversations'),

  getById: (id: string): Promise<Conversation> =>
    http.get<Conversation>(`/conversations/${id}`),

  createDirect: (
    payload: CreateDirectConversationPayload,
  ): Promise<Conversation> =>
    http.post<Conversation>('/conversations', payload),

  createGroup: (payload: CreateGroupPayload): Promise<Conversation> =>
    http.post<Conversation>('/conversations/group', payload),

  updateGroup: (
    conversationId: string,
    payload: { name?: string; picture?: string },
  ): Promise<Conversation> =>
    http.patch<Conversation>(`/conversations/${conversationId}`, payload),

  markRead: (conversationId: string): Promise<null> =>
    http.post<null>(`/conversations/${conversationId}/read`, {}),

  addMember: (
    conversationId: string,
    payload: AddGroupMemberPayload,
  ): Promise<Conversation> =>
    http.post<Conversation>(
      `/conversations/${conversationId}/members`,
      payload,
    ),

  removeMember: (
    conversationId: string,
    userId: string,
  ): Promise<Conversation> =>
    http.delete<Conversation>(
      `/conversations/${conversationId}/members/${userId}`,
    ),

  /**
   * POST /conversations/:id/leave
   * Authenticated user leaves the group. Returns null (server sends 200 with null data).
   */
  leaveGroup: (conversationId: string): Promise<null> =>
    http.post<null>(`/conversations/${conversationId}/leave`, {}),
};
