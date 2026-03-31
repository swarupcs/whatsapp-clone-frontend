import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/store/chatStore';
import { useEditMessage } from '@/hooks/queries/useMessages';
import { useQueryClient } from '@tanstack/react-query';
import { messageKeys } from '@/hooks/queries/useMessages';
import type { PaginatedResponse, Message } from '@/types/index';

interface Props {
  conversationId: string;
}

export default function UndoToast({ conversationId }: Props) {
  const { undoDeleteStack, undoEditStack, popUndoDelete, popUndoEdit } =
    useChatStore();
  const queryClient = useQueryClient();
  const editMessage = useEditMessage(conversationId);

  // BUG FIX 8: Replace the bare useEffect (no deps = runs every render) with a
  // proper setInterval that checks expiry every second. The old code was running
  // on every render and calling Zustand setters unnecessarily, which is wasteful
  // even if it doesn't cause an infinite loop (popping already-gone entries is a no-op).
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      undoDeleteStack.forEach((entry) => {
        if (entry.expiresAt < now) popUndoDelete(entry.message.id);
      });

      undoEditStack.forEach((entry) => {
        if (entry.expiresAt < now) popUndoEdit(entry.messageId);
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undoDeleteStack, undoEditStack]); // re-subscribe when stacks change

  const handleUndoDelete = (messageId: string) => {
    const entry = popUndoDelete(messageId);
    if (!entry) return;
    // Restore the message in cache (server soft-deleted it; show it locally again)
    queryClient.setQueryData(messageKeys.list(conversationId), (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: PaginatedResponse<Message>) => ({
          ...page,
          data: page.data.map((m) =>
            m.id === messageId
              ? { ...m, isDeleted: false, deletedAt: undefined }
              : m,
          ),
        })),
      };
    });
  };

  const handleUndoEdit = async (messageId: string) => {
    const entry = popUndoEdit(messageId);
    if (!entry) return;
    await editMessage.mutateAsync({
      messageId,
      payload: { message: entry.originalMessage },
    });
  };

  const now = Date.now();
  const allToasts = [
    ...undoDeleteStack
      .filter((e) => e.expiresAt > now)
      .map((e) => ({
        id: `del-${e.message.id}`,
        type: 'delete' as const,
        messageId: e.message.id,
        label: 'Message deleted',
      })),
    ...undoEditStack
      .filter((e) => e.expiresAt > now)
      .map((e) => ({
        id: `edit-${e.messageId}`,
        type: 'edit' as const,
        messageId: e.messageId,
        label: 'Message edited',
      })),
  ];

  if (allToasts.length === 0) return null;

  return (
    <div className='fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2'>
      <AnimatePresence>
        {allToasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className='flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-lg shadow-lg backdrop-blur-sm'
          >
            <span className='text-sm text-foreground'>{toast.label}</span>
            <Button
              size='sm'
              variant='ghost'
              className='h-7 px-2 gap-1 text-primary hover:text-primary hover:bg-primary/10'
              onClick={() =>
                toast.type === 'delete'
                  ? handleUndoDelete(toast.messageId)
                  : handleUndoEdit(toast.messageId)
              }
            >
              <Undo2 className='h-3.5 w-3.5' /> Undo
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
