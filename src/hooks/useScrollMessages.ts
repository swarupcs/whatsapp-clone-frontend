import { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuthStore } from '../store/authStore';
import type { Message } from '../types/index';

interface Options {
  messages: Message[];
  conversationId: string | undefined;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export function useScrollMessages({
  messages,
  conversationId,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: Options) {
  const { user } = useAuthStore();
  const { emitSeen } = useSocket();
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  // Scroll to bottom only when new messages arrive (not on load-more)
  useEffect(() => {
    const prev = prevLengthRef.current;
    prevLengthRef.current = messages.length;
    if (messages.length > prev) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Scroll to bottom when conversation changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [conversationId]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!topSentinelRef.current || !hasNextPage) return;
    const container = topSentinelRef.current.parentElement;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          const prevScrollHeight = container?.scrollHeight ?? 0;
          fetchNextPage();
          // Restore scroll position after new pages prepend
          requestAnimationFrame(() => {
            if (container) {
              container.scrollTop =
                container.scrollHeight - prevScrollHeight;
            }
          });
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(topSentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Mark last unread message as seen
  useEffect(() => {
    if (!conversationId || !user || messages.length === 0) return;
    const lastUnread = [...messages]
      .reverse()
      .find(
        (m) =>
          !m.isDeleted &&
          m.senderId !== user.id &&
          !(m.seenBy ?? []).includes(user.id),
      );
    if (lastUnread) emitSeen(conversationId, lastUnread.id);
  }, [messages, conversationId, user?.id, emitSeen]);

  return { topSentinelRef, bottomRef };
}
