/**
 * message.service.ts
 *
 * Endpoints:
 *   GET    /conversations/:cid/messages
 *   GET    /conversations/:cid/messages/search?q=
 *   GET    /conversations/:cid/messages/pinned
 *   POST   /conversations/:cid/messages
 *   PATCH  /conversations/:cid/messages/:mid
 *   DELETE /conversations/:cid/messages/:mid
 *   POST   /conversations/:cid/messages/:mid/reactions
 *   POST   /conversations/:cid/messages/:mid/pin
 *   DELETE /conversations/:cid/messages/:mid/pin
 *   POST   /conversations/:cid/messages/:mid/forward
 *   POST   /conversations/:cid/messages/:mid/seen
 *   GET    /messages/search?q=
 */

import { http } from '../lib/http';
import type {
  Message,
  PaginatedData,
  SendMessagePayload,
  EditMessagePayload,
  AddReactionPayload,
  ForwardMessagePayload,
  ReplyTo,
} from '../types';

const base = (conversationId: string) =>
  `/conversations/${conversationId}/messages`;

export const messageService = {
  /**
   * GET /conversations/:cid/messages?page=&limit=
   * Returns paginated messages (oldest-first within a page).
   * The backend returns data inside the standard success envelope;
   * pagination info is in the meta field.
   */
  list: (
    conversationId: string,
    page = 1,
    limit = 30,
  ): Promise<PaginatedData<Message>> =>
    http.get<PaginatedData<Message>>(base(conversationId), {
      params: { page, limit },
    }),

  /**
   * GET /conversations/:cid/messages/search?q=
   * Full-text search within a single conversation.
   */
  searchInConversation: (
    conversationId: string,
    q: string,
  ): Promise<Message[]> =>
    http.get<Message[]>(`${base(conversationId)}/search`, { params: { q } }),

  /**
   * GET /messages/search?q=
   * Cross-conversation full-text search (user's conversations only).
   */
  globalSearch: (q: string): Promise<Message[]> =>
    http.get<Message[]>('/messages/search', { params: { q } }),

  /**
   * GET /conversations/:cid/messages/pinned
   * Returns all pinned, non-deleted messages in the conversation.
   */
  getPinned: (conversationId: string): Promise<Message[]> =>
    http.get<Message[]>(`${base(conversationId)}/pinned`),

  /**
   * POST /conversations/:cid/messages
   * Send a text message (JSON body).
   */
  send: (
    conversationId: string,
    payload: SendMessagePayload,
  ): Promise<Message> => http.post<Message>(base(conversationId), payload),

  /**
   * POST /conversations/:cid/messages (multipart/form-data)
   * Send a message with file attachments.
   * The `message` field and optional `replyTo` are serialised into the FormData.
   */
  sendWithFiles: (
    conversationId: string,
    message: string,
    files: File[],
    replyTo?: ReplyTo,
  ): Promise<Message> => {
    const fd = new FormData();
    fd.append('message', message);
    if (replyTo) fd.append('replyTo', JSON.stringify(replyTo));
    files.forEach((file) => fd.append('files', file));
    return http.upload<Message>(base(conversationId), fd);
  },

  /**
   * PATCH /conversations/:cid/messages/:mid
   * Edit the text content of a message (sender only).
   */
  edit: (
    conversationId: string,
    messageId: string,
    payload: EditMessagePayload,
  ): Promise<Message> =>
    http.patch<Message>(`${base(conversationId)}/${messageId}`, payload),

  /**
   * DELETE /conversations/:cid/messages/:mid
   * Soft-delete a message (sender only).
   */
  delete: (conversationId: string, messageId: string): Promise<Message> =>
    http.delete<Message>(`${base(conversationId)}/${messageId}`),

  /**
   * POST /conversations/:cid/messages/:mid/reactions
   * Toggle an emoji reaction on a message.
   */
  toggleReaction: (
    conversationId: string,
    messageId: string,
    payload: AddReactionPayload,
  ): Promise<Message> =>
    http.post<Message>(
      `${base(conversationId)}/${messageId}/reactions`,
      payload,
    ),

  /**
   * POST /conversations/:cid/messages/:mid/pin
   * Pin a message in the conversation.
   */
  pin: (conversationId: string, messageId: string): Promise<Message> =>
    http.post<Message>(`${base(conversationId)}/${messageId}/pin`),

  /**
   * DELETE /conversations/:cid/messages/:mid/pin
   * Unpin a message.
   */
  unpin: (conversationId: string, messageId: string): Promise<Message> =>
    http.delete<Message>(`${base(conversationId)}/${messageId}/pin`),

  /**
   * POST /conversations/:cid/messages/:mid/forward
   * Forward a message to another conversation.
   */
  forward: (
    conversationId: string,
    messageId: string,
    payload: ForwardMessagePayload,
  ): Promise<Message> =>
    http.post<Message>(
      `${base(conversationId)}/${messageId}/forward`,
      payload,
    ),

  /**
   * POST /conversations/:cid/messages/:mid/seen
   * Mark a specific message as seen by the authenticated user.
   */
  markSeen: (conversationId: string, messageId: string): Promise<Message> =>
    http.post<Message>(`${base(conversationId)}/${messageId}/seen`),
};
