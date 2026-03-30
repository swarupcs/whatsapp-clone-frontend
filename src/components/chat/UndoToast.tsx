import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, X } from 'lucide-react';
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
  const { undoDeleteStack, undoEditStack, popUndoDelete, popUndoEdit } = useChatStore();
  const queryClient = useQueryClient();
  const editMessage = useEditMessage(conversationId);

  // Auto-expire entries after 10s
  useEffect(() => {
    const now = Date.now();
    undoDeleteStack.forEach((entry) => {
      if (entry.expiresAt < now) popUndoDelete(entry.message.id);
    });
    undoEditStack.forEach((entry) => {
      if (entry.expiresAt < now) popUndoEdit(entry.messageId);
    });
  });

  const handleUndoDelete = (messageId: string) => {
    const entry = popUndoDelete(messageId);
    if (!entry) return;
    // Restore message in cache (server already soft-deleted; we just re-show it locally)
    queryClient.setQueryData(messageKeys.list(conversationId), (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: PaginatedResponse<Message>) => ({
          ...page,
          data: page.data.map((m) =>
            m.id === messageId ? { ...m, isDeleted: false, deletedAt: undefined } : m,
          ),
        })),
      };
    });
  };

  const handleUndoEdit = async (messageId: string) => {
    const entry = popUndoEdit(messageId);
    if (!entry) return;
    // Restore original via API
    await editMessage.mutateAsync({ messageId, payload: { message: entry.originalMessage } });
  };

  const allToasts = [
    ...undoDeleteStack
      .filter((e) => e.expiresAt > Date.now())
      .map((e) => ({ id: `del-${e.message.id}`, type: 'delete' as const, messageId: e.message.id, label: 'Message deleted' })),
    ...undoEditStack
      .filter((e) => e.expiresAt > Date.now())
      .map((e) => ({ id: `edit-${e.messageId}`, type: 'edit' as const, messageId: e.messageId, label: 'Message edited' })),
  ];

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
              size='sm' variant='ghost'
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
