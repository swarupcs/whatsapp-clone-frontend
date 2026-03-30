import { http } from '../lib/http';
import type {
  Message,
  PaginatedResponse,
  SendMessagePayload,
  EditMessagePayload,
  AddReactionPayload,
  ForwardMessagePayload,
  ReplyTo,
} from '../types/index';

const base = (conversationId: string) =>
  `/conversations/${conversationId}/messages`;

export const messageService = {
  list: (
    conversationId: string,
    page = 1,
    limit = 30,
  ): Promise<PaginatedResponse<Message>> =>
    http.get<PaginatedResponse<Message>>(
      `${base(conversationId)}?page=${page}&limit=${limit}`,
    ),

  searchInConversation: (
    conversationId: string,
    q: string,
  ): Promise<Message[]> =>
    http.get<Message[]>(
      `${base(conversationId)}/search?q=${encodeURIComponent(q)}`,
    ),

  globalSearch: (q: string): Promise<Message[]> =>
    http.get<Message[]>(`/messages/search?q=${encodeURIComponent(q)}`),

  getPinned: (conversationId: string): Promise<Message[]> =>
    http.get<Message[]>(`${base(conversationId)}/pinned`),

  send: (
    conversationId: string,
    payload: SendMessagePayload,
  ): Promise<Message> =>
    http.post<Message>(base(conversationId), payload),

  sendWithFiles: (
    conversationId: string,
    message: string,
    files: File[],
    replyTo?: ReplyTo,
  ): Promise<Message> => {
    const fd = new FormData();
    fd.append('message', message);
    if (replyTo) fd.append('replyTo', JSON.stringify(replyTo));
    files.forEach((f) => fd.append('files', f));
    return http.upload<Message>(base(conversationId), fd);
  },

  edit: (
    conversationId: string,
    messageId: string,
    payload: EditMessagePayload,
  ): Promise<Message> =>
    http.patch<Message>(`${base(conversationId)}/${messageId}`, payload),

  delete: (conversationId: string, messageId: string): Promise<Message> =>
    http.delete<Message>(`${base(conversationId)}/${messageId}`),

  toggleReaction: (
    conversationId: string,
    messageId: string,
    payload: AddReactionPayload,
  ): Promise<Message> =>
    http.post<Message>(
      `${base(conversationId)}/${messageId}/reactions`,
      payload,
    ),

  pin: (conversationId: string, messageId: string): Promise<Message> =>
    http.post<Message>(`${base(conversationId)}/${messageId}/pin`),

  unpin: (conversationId: string, messageId: string): Promise<Message> =>
    http.delete<Message>(`${base(conversationId)}/${messageId}/pin`),

  forward: (
    conversationId: string,
    messageId: string,
    payload: ForwardMessagePayload,
  ): Promise<Message> =>
    http.post<Message>(
      `${base(conversationId)}/${messageId}/forward`,
      payload,
    ),

  markSeen: (conversationId: string, messageId: string): Promise<Message> =>
    http.post<Message>(`${base(conversationId)}/${messageId}/seen`),
};
