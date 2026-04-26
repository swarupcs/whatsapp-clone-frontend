import { motion, AnimatePresence } from 'framer-motion';
import { Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/store/chatStore';
import { messageKeys, patchMessage } from '@/hooks/queries/useMessages';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  conversationId: string;
}

export default function UndoToast({ conversationId }: Props) {
  const { undoDeleteStack, undoEditStack, popUndoDelete, popUndoEdit } = useChatStore();
  const queryClient = useQueryClient();

  const handleUndoDelete = (messageId: string) => {
    const entry = popUndoDelete(messageId);
    if (!entry) return;

    // Restore the message in the cache; the API call is now cancelled because
    // popUndoDelete removed the entry before the setTimeout executed it.
    queryClient.setQueryData(messageKeys.list(conversationId), (old: any) => {
      return patchMessage(old, messageId, () => entry.message);
    });
  };

  const handleUndoEdit = (messageId: string) => {
    const entry = popUndoEdit(messageId);
    if (!entry) return;

    // Revert the message text in the cache; the API call is cancelled.
    queryClient.setQueryData(messageKeys.list(conversationId), (old: any) => {
      return patchMessage(old, messageId, (m) => ({
        ...m,
        message: entry.originalMessage,
        isEdited: false, // If it wasn't edited before, we'd need to know. 
        // For simplicity, we just restore the message text.
      }));
    });
  };

  const now = Date.now();

  // Only show toasts for the *current* conversation
  const allToasts = [
    ...undoDeleteStack
      .filter((e) => e.conversationId === conversationId && e.expiresAt > now)
      .map((e) => ({
        id: `del-${e.message.id}`,
        type: 'delete' as const,
        messageId: e.message.id,
        label: 'Message deleted',
      })),
    ...undoEditStack
      .filter((e) => e.conversationId === conversationId && e.expiresAt > now)
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
