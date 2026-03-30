import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

import { cn } from '@/lib/utils';
import type { Message, User } from '@/store/chatStore';

interface PinnedMessagesBarProps {
  pinnedMessages: Message[];
  users: User[];
  currentUserId: string;
  onUnpin: (messageId: string) => void;
  onScrollToMessage: (messageId: string) => void;
}

export default function PinnedMessagesBar({
  pinnedMessages,
  users,
  currentUserId,
  onUnpin,
  onScrollToMessage,
}: PinnedMessagesBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (pinnedMessages.length === 0) return null;

  const currentMessage = pinnedMessages[currentIndex];
  const sender = users.find((u) => u.id === currentMessage?.senderId);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % pinnedMessages.length);
  };

  const handlePrev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + pinnedMessages.length) % pinnedMessages.length,
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className='border-b border-border bg-card/80 backdrop-blur-sm'
    >
      {/* Collapsed view - single pinned message */}
      <AnimatePresence mode='wait'>
        {!isExpanded ? (
          <motion.div
            key='collapsed'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='px-4 py-2 flex items-center gap-3'
          >
            <div className='flex items-center gap-1 text-primary'>
              <Pin className='h-4 w-4' />
              {pinnedMessages.length > 1 && (
                <span className='text-xs font-medium'>
                  {currentIndex + 1}/{pinnedMessages.length}
                </span>
              )}
            </div>

            <button
              onClick={() => onScrollToMessage(currentMessage.id)}
              className='flex-1 min-w-0 text-left hover:bg-muted/50 rounded px-2 py-1 transition-colors'
            >
              <div className='flex items-center gap-2'>
                <Avatar className='h-5 w-5'>
                  <AvatarImage src={sender?.picture} />
                  <AvatarFallback className='text-[10px]'>
                    {sender?.name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className='text-xs font-medium text-foreground truncate'>
                  {sender?.id === currentUserId ? 'You' : sender?.name}
                </span>
              </div>
              <p className='text-xs text-muted-foreground truncate mt-0.5'>
                {currentMessage.message ||
                  (currentMessage.files?.length
                    ? `${currentMessage.files.length} attachment(s)`
                    : '')}
              </p>
            </button>

            <div className='flex items-center gap-1'>
              {pinnedMessages.length > 1 && (
                <>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-6 w-6'
                    onClick={handlePrev}
                  >
                    <ChevronUp className='h-3 w-3' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-6 w-6'
                    onClick={handleNext}
                  >
                    <ChevronDown className='h-3 w-3' />
                  </Button>
                </>
              )}
              <Button
                variant='ghost'
                size='icon'
                className='h-6 w-6'
                onClick={() => setIsExpanded(true)}
              >
                <ChevronDown className='h-3 w-3' />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key='expanded'
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='overflow-hidden'
          >
            <div className='px-4 py-2 flex items-center justify-between border-b border-border/50'>
              <div className='flex items-center gap-2 text-primary'>
                <Pin className='h-4 w-4' />
                <span className='text-sm font-medium'>
                  Pinned Messages ({pinnedMessages.length})
                </span>
              </div>
              <Button
                variant='ghost'
                size='icon'
                className='h-6 w-6'
                onClick={() => setIsExpanded(false)}
              >
                <ChevronUp className='h-3 w-3' />
              </Button>
            </div>

            <div className='max-h-48 overflow-y-auto scrollbar-thin'>
              {pinnedMessages.map((msg) => {
                const msgSender = users.find((u) => u.id === msg.senderId);
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className='px-4 py-2 flex items-start gap-3 hover:bg-muted/50 transition-colors group'
                  >
                    <Avatar className='h-8 w-8 shrink-0'>
                      <AvatarImage src={msgSender?.picture} />
                      <AvatarFallback>{msgSender?.name?.[0]}</AvatarFallback>
                    </Avatar>

                    <button
                      onClick={() => {
                        onScrollToMessage(msg.id);
                        setIsExpanded(false);
                      }}
                      className='flex-1 min-w-0 text-left'
                    >
                      <span className='text-xs font-medium text-foreground'>
                        {msgSender?.id === currentUserId
                          ? 'You'
                          : msgSender?.name}
                      </span>
                      <p className='text-sm text-muted-foreground line-clamp-2'>
                        {msg.message ||
                          (msg.files?.length
                            ? `${msg.files.length} attachment(s)`
                            : '')}
                      </p>
                    </button>

                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0'
                      onClick={() => onUnpin(msg.id)}
                    >
                      <X className='h-3 w-3' />
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
