import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/store/chatStore';

export default function UndoToast() {
  const {
    deletedMessages,
    editedMessages,
    undoDeleteMessage,
    undoEditMessage,
  } = useChatStore();
  const [visibleToasts, setVisibleToasts] = useState<
    { id: string; type: 'delete' | 'edit'; messageId: string }[]
  >([]);

  useEffect(() => {
    const deleteToasts = deletedMessages.map((d) => ({
      id: `delete-${d.message.id}`,
      type: 'delete' as const,
      messageId: d.message.id,
    }));

    const editToasts = editedMessages.map((e) => ({
      id: `edit-${e.messageId}`,
      type: 'edit' as const,
      messageId: e.messageId,
    }));

    setVisibleToasts([...deleteToasts, ...editToasts]);
  }, [deletedMessages, editedMessages]);

  const handleUndo = (type: 'delete' | 'edit', messageId: string) => {
    if (type === 'delete') {
      undoDeleteMessage(messageId);
    } else {
      undoEditMessage(messageId);
    }
  };

  const handleDismiss = (id: string) => {
    setVisibleToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className='fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2'>
      <AnimatePresence>
        {visibleToasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className='flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-lg shadow-lg backdrop-blur-sm'
          >
            <span className='text-sm text-foreground'>
              {toast.type === 'delete' ? 'Message deleted' : 'Message edited'}
            </span>
            <Button
              size='sm'
              variant='ghost'
              className='h-7 px-2 gap-1 text-primary hover:text-primary hover:bg-primary/10'
              onClick={() => handleUndo(toast.type, toast.messageId)}
            >
              <Undo2 className='h-3.5 w-3.5' />
              Undo
            </Button>
            <Button
              size='icon'
              variant='ghost'
              className='h-6 w-6 text-muted-foreground hover:text-foreground'
              onClick={() => handleDismiss(toast.id)}
            >
              <X className='h-3.5 w-3.5' />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
