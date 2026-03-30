import { useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

export function useTyping(conversationId: string | undefined) {
  const { emitTyping } = useSocket();
  const isTypingRef = useRef(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleInputChange = useCallback(() => {
    if (!conversationId) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emitTyping(conversationId, true);
    }
    clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => {
      isTypingRef.current = false;
      emitTyping(conversationId, false);
    }, 2500);
  }, [conversationId, emitTyping]);

  const stopTyping = useCallback(() => {
    if (!conversationId || !isTypingRef.current) return;
    clearTimeout(stopTimer.current);
    isTypingRef.current = false;
    emitTyping(conversationId, false);
  }, [conversationId, emitTyping]);

  return { handleInputChange, stopTyping };
}
