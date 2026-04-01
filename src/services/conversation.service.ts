/**
 * conversation.service.ts
 *
 * Endpoints:
 *   GET    /conversations
 *   POST   /conversations
 *   POST   /conversations/group
 *   GET    /conversations/:id
 *   POST   /conversations/:id/read
 *   POST   /conversations/:id/members
 *   DELETE /conversations/:id/members/:userId
 */

import { http } from '../lib/http';
import type {
  Conversation,
  CreateDirectConversationPayload,
  CreateGroupPayload,
  AddGroupMemberPayload,
} from '../types';

export const conversationService = {
  /**
   * GET /conversations
   * Returns all conversations for the authenticated user, sorted by activity.
   */
  list: (): Promise<Conversation[]> =>
    http.get<Conversation[]>('/conversations'),

  /**
   * GET /conversations/:id
   * Returns a single conversation (must be a member).
   */
  getById: (id: string): Promise<Conversation> =>
    http.get<Conversation>(`/conversations/${id}`),

  /**
   * POST /conversations
   * Finds or creates a 1-on-1 DM with the given userId.
   */
  createDirect: (payload: CreateDirectConversationPayload): Promise<Conversation> =>
    http.post<Conversation>('/conversations', payload),

  /**
   * POST /conversations/group
   * Creates a new group conversation.
   */
  createGroup: (payload: CreateGroupPayload): Promise<Conversation> =>
    http.post<Conversation>('/conversations/group', payload),

  /**
   * POST /conversations/:id/read
   * Marks all messages in the conversation as read for the authenticated user.
   */
  markRead: (conversationId: string): Promise<null> =>
    http.post<null>(`/conversations/${conversationId}/read`, {}),

  /**
   * POST /conversations/:id/members
   * Adds a user to a group (admin only).
   */
  addMember: (
    conversationId: string,
    payload: AddGroupMemberPayload,
  ): Promise<Conversation> =>
    http.post<Conversation>(`/conversations/${conversationId}/members`, payload),

  /**
   * DELETE /conversations/:id/members/:userId
   * Removes a user from a group (admin only, or self-leave).
   */
  removeMember: (
    conversationId: string,
    userId: string,
  ): Promise<Conversation> =>
    http.delete<Conversation>(
      `/conversations/${conversationId}/members/${userId}`,
    ),
};
