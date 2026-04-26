import { useAppSelector } from '@/store';
import { useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

import type { Message } from '../types';

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
  const user = useAppSelector((state) => state.auth.user);
  const { emitSeen } = useSocket();
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);
  const emittedSeenIds = useRef(new Set<string>());

  const emitSeenRef = useRef(emitSeen);
  useEffect(() => { emitSeenRef.current = emitSeen; });

  const stableEmitSeen = useCallback(
    (cId: string, mId: string) => emitSeenRef.current(cId, mId),
    [],
  );

  useEffect(() => {
    const prev = prevLengthRef.current;
    prevLengthRef.current = messages.length;
    if (messages.length > prev)
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [conversationId]);

  // Reset emitted set on conversation change
  useEffect(() => { emittedSeenIds.current = new Set(); }, [conversationId]);

  useEffect(() => {
    if (!topSentinelRef.current || !hasNextPage) return;
    const container = topSentinelRef.current.parentElement;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          const prevScrollHeight = container?.scrollHeight ?? 0;
          fetchNextPage();
          requestAnimationFrame(() => {
            if (container) container.scrollTop = container.scrollHeight - prevScrollHeight;
          });
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(topSentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (!conversationId || !user || messages.length === 0) return;
    const unread = messages.filter(
      (m) =>
        !m.isDeleted &&
        m.senderId !== user.id &&
        !(m.seenBy ?? []).includes(user.id) &&
        !emittedSeenIds.current.has(m.id),
    );
    if (unread.length === 0) return;
    unread.forEach((m, idx) => {
      emittedSeenIds.current.add(m.id);
      setTimeout(() => stableEmitSeen(conversationId, m.id), idx * 50);
    });
  }, [messages, conversationId, user?.id, stableEmitSeen]);

  return { topSentinelRef, bottomRef };
}
