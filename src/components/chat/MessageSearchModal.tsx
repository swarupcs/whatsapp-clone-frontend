import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MessageCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

import { cn } from '@/lib/utils';
import { useChatStore, type Conversation, type Message, type User } from '@/store/chatStore';

interface MessageSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  message: Message;
  conversation: Conversation;
  sender: User | undefined;
}

// Highlight matching text in message
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const parts = text.split(
    new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
  );

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={index}
            className='bg-primary/30 text-foreground rounded px-0.5'
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

export default function MessageSearchModal({
  open,
  onOpenChange,
}: MessageSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { conversations, user, setActiveConversation } = useChatStore();

  // Generate all messages from all conversations for search
  const allMessagesWithContext = useMemo(() => {
    const results: SearchResult[] = [];

    conversations.forEach((conv) => {
      // Generate mock messages for each conversation to search through
      const otherUserIds = conv.users
        .filter((u) => u.id !== user?.id)
        .map((u) => u.id);
      const otherUserId = otherUserIds[0] || '';

      // Create sample messages for each conversation (matching the mock data structure)
      const sampleMessages: Message[] = [
        {
          id: `${conv.id}-search-0`,
          conversationId: conv.id,
          senderId: otherUserId,
          message: "Hey! How's it going? 👋",
          createdAt: new Date(Date.now() - 3600000 * 2),
          read: true,
        },
        {
          id: `${conv.id}-search-1`,
          conversationId: conv.id,
          senderId: user?.id || '',
          message:
            "Hey! I'm doing great, thanks for asking! Just finished working on that new project we discussed.",
          createdAt: new Date(Date.now() - 3600000 * 1.9),
          read: true,
        },
        {
          id: `${conv.id}-search-2`,
          conversationId: conv.id,
          senderId: otherUserId,
          message:
            "That's awesome! Can't wait to see what you've built. Is it the chat app you were telling me about?",
          createdAt: new Date(Date.now() - 3600000 * 1.8),
          read: true,
        },
        {
          id: `${conv.id}-search-3`,
          conversationId: conv.id,
          senderId: user?.id || '',
          message:
            'Yes! It has real-time messaging, emoji reactions, file sharing, and group chats. Pretty proud of how it turned out! 🚀',
          createdAt: new Date(Date.now() - 3600000 * 1.7),
          read: true,
        },
        {
          id: `${conv.id}-search-4`,
          conversationId: conv.id,
          senderId: otherUserId,
          message:
            'That sounds incredible! The emoji reactions feature is so useful. I love how apps like Slack and Discord have that.',
          createdAt: new Date(Date.now() - 3600000 * 1.5),
          read: true,
        },
        {
          id: `${conv.id}-search-5`,
          conversationId: conv.id,
          senderId: user?.id || '',
          message:
            "Exactly what I was going for! Here's a sneak peek of the design docs:",
          createdAt: new Date(Date.now() - 3600000 * 1.3),
          read: true,
        },
        {
          id: `${conv.id}-search-6`,
          conversationId: conv.id,
          senderId: otherUserId,
          message:
            'These look amazing! The dark theme is really sleek. Did you use any specific design system?',
          createdAt: new Date(Date.now() - 3600000),
          read: true,
        },
        {
          id: `${conv.id}-search-7`,
          conversationId: conv.id,
          senderId: user?.id || '',
          message:
            'Thanks! I built a custom design system with Tailwind CSS. Used glass morphism effects and subtle gradients for that modern look ✨',
          createdAt: new Date(Date.now() - 2700000),
          read: true,
        },
        {
          id: `${conv.id}-search-8`,
          conversationId: conv.id,
          senderId: otherUserId,
          message:
            'The attention to detail is impressive. Are you planning to add voice messages too?',
          createdAt: new Date(Date.now() - 1800000),
          read: true,
        },
        {
          id: `${conv.id}-search-9`,
          conversationId: conv.id,
          senderId: user?.id || '',
          message:
            "That's on the roadmap! Along with video calls and screen sharing. Want to test it out when it's ready?",
          createdAt: new Date(Date.now() - 900000),
          read: true,
        },
        {
          id: `${conv.id}-search-10`,
          conversationId: conv.id,
          senderId: otherUserId,
          message: 'Absolutely! Count me in. This is going to be great! 🎉',
          createdAt: new Date(Date.now() - 300000),
          read: true,
        },
      ];

      sampleMessages.forEach((msg) => {
        const sender = conv.users.find((u) => u.id === msg.senderId);
        results.push({
          message: msg,
          conversation: conv,
          sender,
        });
      });
    });

    return results;
  }, [conversations, user?.id]);

  // Filter messages based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];

    return allMessagesWithContext
      .filter((item) =>
        item.message.message.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort(
        (a, b) =>
          new Date(b.message.createdAt).getTime() -
          new Date(a.message.createdAt).getTime(),
      )
      .slice(0, 50); // Limit results
  }, [searchQuery, allMessagesWithContext]);

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      setActiveConversation(result.conversation);
      onOpenChange(false);
      setSearchQuery('');
    },
    [setActiveConversation, onOpenChange],
  );

  const handleClose = () => {
    onOpenChange(false);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-lg p-0 gap-0 bg-card border-border overflow-hidden'>
        <DialogHeader className='p-4 pb-0'>
          <DialogTitle className='text-lg font-semibold'>
            Search Messages
          </DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className='p-4'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search across all conversations...'
              className='pl-10 pr-10 h-11 bg-secondary border-0'
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
              >
                <X className='h-4 w-4' />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <ScrollArea className='max-h-[400px]'>
          <div className='px-4 pb-4'>
            {searchQuery.length < 2 ? (
              <div className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
                <Search className='h-12 w-12 mb-3 opacity-50' />
                <p className='text-sm'>Type at least 2 characters to search</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
                <MessageCircle className='h-12 w-12 mb-3 opacity-50' />
                <p className='text-sm'>No messages found</p>
                <p className='text-xs mt-1'>Try a different search term</p>
              </div>
            ) : (
              <div className='space-y-1'>
                <p className='text-xs text-muted-foreground mb-3'>
                  {searchResults.length} result
                  {searchResults.length !== 1 && 's'} found
                </p>
                <AnimatePresence mode='popLayout'>
                  {searchResults.map((result, index) => (
                    <motion.button
                      key={result.message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => handleResultClick(result)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg',
                        'hover:bg-secondary/80 transition-colors',
                        'group focus:outline-none focus:ring-2 focus:ring-primary',
                      )}
                    >
                      <div className='flex items-start gap-3'>
                        <Avatar className='h-10 w-10 shrink-0'>
                          <AvatarImage src={result.sender?.picture} />
                          <AvatarFallback>
                            {result.sender?.name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>

                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center justify-between gap-2 mb-1'>
                            <span className='font-medium text-sm truncate'>
                              {result.sender?.name || 'Unknown'}
                            </span>
                            <span className='text-xs text-muted-foreground shrink-0'>
                              {format(
                                new Date(result.message.createdAt),
                                'MMM d, HH:mm',
                              )}
                            </span>
                          </div>

                          <p className='text-sm text-muted-foreground line-clamp-2'>
                            <HighlightedText
                              text={result.message.message}
                              query={searchQuery}
                            />
                          </p>

                          <div className='flex items-center gap-1.5 mt-2'>
                            <span className='text-xs text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full truncate max-w-[150px]'>
                              {result.conversation.name}
                            </span>
                            <ArrowRight className='h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity' />
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
