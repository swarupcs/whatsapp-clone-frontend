import { setActiveConversation } from '@/store/slices/chatSlice';
import { useAppSelector, useAppDispatch } from '@/store';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MessageCircle, ArrowRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';


import { useGlobalMessageSearch } from '@/hooks/queries/useMessages';
import { useConversations, useMarkRead } from '@/hooks/queries/useConversations';
import type { Message } from '@/types';

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return <>{parts.map((part, i) => part.toLowerCase() === query.toLowerCase()
    ? <mark key={i} className='bg-primary/30 text-foreground rounded px-0.5'>{part}</mark>
    : <span key={i}>{part}</span>)}</>;
}

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

export default function MessageSearchModal({ open, onOpenChange }: Props) {
  const dispatch = useAppDispatch();

  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const user = useAppSelector((state) => state.auth.user);
  
  const { data: conversations = [] } = useConversations();
  const markRead = useMarkRead();
  const { data: messages = [], isFetching } = useGlobalMessageSearch(debouncedQuery);

  const handleQueryChange = (q: string) => {
    setInputValue(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(q), 350);
  };

  const results = (messages as Message[]).map((msg) => {
    const conversation = conversations.find((c) => c.id === msg.conversationId);
    if (!conversation) return null;
    const sender = conversation.users.find((u) => u.id === msg.senderId);
    return { message: msg, conversation, sender };
  }).filter(Boolean) as any[];

  const handleResultClick = (convId: string, messageId: string) => {
    const conv = conversations.find((c) => c.id === convId);
    if (!conv) return;
    dispatch(setActiveConversation(conv));
    markRead.mutate(convId);
    onOpenChange(false);
    setInputValue(''); setDebouncedQuery('');
    setTimeout(() => {
      const el = document.getElementById(`message-${messageId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.classList.add('ring-2', 'ring-primary');
      setTimeout(() => el?.classList.remove('ring-2', 'ring-primary'), 2000);
    }, 300);
  };

  const handleClose = () => { onOpenChange(false); setInputValue(''); setDebouncedQuery(''); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-lg p-0 gap-0 bg-card border-border overflow-hidden'>
        <DialogHeader className='p-4 pb-0'><DialogTitle className='text-lg font-semibold'>Search Messages</DialogTitle></DialogHeader>
        <div className='p-4'>
          <div className='relative'>
            {isFetching ? <Loader2 className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin' />
              : <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />}
            <Input value={inputValue} onChange={(e) => handleQueryChange(e.target.value)}
              placeholder='Search across all conversations...' className='pl-10 pr-10 h-11 bg-secondary border-0' autoFocus />
            {inputValue && (
              <button onClick={() => handleQueryChange('')} className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'>
                <X className='h-4 w-4' />
              </button>
            )}
          </div>
        </div>
        <ScrollArea className='max-h-[400px]'>
          <div className='px-4 pb-4'>
            {debouncedQuery.length < 2 ? (
              <div className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
                <Search className='h-12 w-12 mb-3 opacity-50' /><p className='text-sm'>Type at least 2 characters to search</p>
              </div>
            ) : results.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
                <MessageCircle className='h-12 w-12 mb-3 opacity-50' /><p className='text-sm'>No messages found</p>
              </div>
            ) : (
              <div className='space-y-1'>
                <p className='text-xs text-muted-foreground mb-3'>{results.length} result{results.length !== 1 && 's'} found</p>
                <AnimatePresence mode='popLayout'>
                  {results.map((result: any, index: number) => (
                    <motion.button key={result.message.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => handleResultClick(result.conversation.id, result.message.id)}
                      className={cn('w-full text-left p-3 rounded-lg hover:bg-secondary/80 transition-colors group focus:outline-none focus:ring-2 focus:ring-primary')}>
                      <div className='flex items-start gap-3'>
                        <Avatar className='h-10 w-10 shrink-0'><AvatarImage src={result.sender?.picture} /><AvatarFallback>{result.sender?.name?.[0] ?? '?'}</AvatarFallback></Avatar>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center justify-between gap-2 mb-1'>
                            <span className='font-medium text-sm truncate'>{result.sender?.id === user?.id ? 'You' : result.sender?.name ?? 'Unknown'}</span>
                            <span className='text-xs text-muted-foreground shrink-0'>{format(new Date(result.message.createdAt), 'MMM d, HH:mm')}</span>
                          </div>
                          <p className='text-sm text-muted-foreground line-clamp-2'>
                            <HighlightedText text={result.message.message} query={debouncedQuery} />
                          </p>
                          <div className='flex items-center gap-1.5 mt-2'>
                            <span className='text-xs text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full truncate max-w-[150px]'>{result.conversation.name}</span>
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
