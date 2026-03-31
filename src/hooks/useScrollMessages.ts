import { useEffect, useRef, useCallback } from 'react';
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

  // BUG FIX 1: Stabilise emitSeen with useRef so it never changes identity
  // and doesn't trigger the mark-seen useEffect on every render.
  // Without this, emitSeen (a new function reference each render) caused the
  // effect to fire constantly, spamming the server with mark_seen events.
  const emitSeenRef = useRef(emitSeen);
  useEffect(() => {
    emitSeenRef.current = emitSeen;
  });

  // Stable wrapper that always calls the latest emitSeen
  const stableEmitSeen = useCallback(
    (cId: string, mId: string) => emitSeenRef.current(cId, mId),
    [], // empty deps — intentionally stable
  );

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

  // Intersection observer for infinite scroll (load older messages)
  useEffect(() => {
    if (!topSentinelRef.current || !hasNextPage) return;
    const container = topSentinelRef.current.parentElement;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          const prevScrollHeight = container?.scrollHeight ?? 0;
          fetchNextPage();
          requestAnimationFrame(() => {
            if (container) {
              container.scrollTop = container.scrollHeight - prevScrollHeight;
            }
          });
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(topSentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // BUG FIX 1 (continued): Mark ALL unread visible messages as seen, not just the last one.
  // Previously only the last unread was emitted, leaving 49/50 messages with stale seenBy.
  // Now we emit for every unread message from others in the current view.
  // We track which message IDs we've already emitted to avoid re-emitting on re-render.
  const emittedSeenIds = useRef(new Set<string>());

  // Reset the emitted set when conversation changes
  useEffect(() => {
    emittedSeenIds.current = new Set();
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !user || messages.length === 0) return;

    const unreadMessages = messages.filter(
      (m) =>
        !m.isDeleted &&
        m.senderId !== user.id &&
        !(m.seenBy ?? []).includes(user.id) &&
        !emittedSeenIds.current.has(m.id),
    );

    if (unreadMessages.length === 0) return;

    // Mark each unread message as seen. Emit the LAST one immediately
    // (server's mark_seen will propagate via socket). For bulk unread situations,
    // we stagger slightly to avoid overwhelming the socket, but emit all of them.
    unreadMessages.forEach((m, idx) => {
      emittedSeenIds.current.add(m.id);
      // Small stagger for bulk unread — last one is most important for UI
      setTimeout(() => {
        stableEmitSeen(conversationId, m.id);
      }, idx * 50);
    });
  }, [messages, conversationId, user?.id, stableEmitSeen]);

  return { topSentinelRef, bottomRef };
}
