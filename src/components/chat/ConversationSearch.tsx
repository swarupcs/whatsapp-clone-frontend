import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Message } from '@/types/index';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onNavigateToMessage: (messageId: string) => void;
  currentUserId: string;
}

export default function ConversationSearch({ isOpen, onClose, messages, onNavigateToMessage }: Props) {
  const [query, setQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = query.trim()
    ? messages.filter((m) => m.message?.toLowerCase().includes(query.toLowerCase().trim()))
    : [];
  const total = matches.length;

  useEffect(() => {
    if (isOpen) { inputRef.current?.focus(); setQuery(''); setCurrentIndex(0); }
  }, [isOpen]);

  useEffect(() => {
    if (matches.length > 0 && currentIndex < matches.length) {
      onNavigateToMessage(matches[currentIndex]!.id);
    }
  }, [currentIndex, matches.length]);

  const prev = () => { if (total > 0) setCurrentIndex((p) => (p - 1 + total) % total); };
  const next = () => { if (total > 0) setCurrentIndex((p) => (p + 1) % total); };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? prev() : next(); }
    else if (e.key === 'Escape') onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
          className='absolute top-16 left-0 right-0 z-20 px-4 py-2 bg-card/95 backdrop-blur-sm border-b border-border shadow-lg'>
          <div className='flex items-center gap-2'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input ref={inputRef} value={query}
                onChange={(e) => { setQuery(e.target.value); setCurrentIndex(0); }}
                onKeyDown={handleKey} placeholder='Search in conversation...'
                className='pl-10 pr-4 h-9 bg-secondary border-0 rounded-lg' />
            </div>
            {query && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className='flex items-center gap-1'>
                <span className='text-xs text-muted-foreground min-w-[60px] text-center'>
                  {total > 0 ? `${currentIndex + 1} of ${total}` : 'No results'}
                </span>
                <Button variant='ghost' size='icon' className='h-7 w-7' onClick={prev} disabled={total === 0}>
                  <ChevronUp className='h-4 w-4' />
                </Button>
                <Button variant='ghost' size='icon' className='h-7 w-7' onClick={next} disabled={total === 0}>
                  <ChevronDown className='h-4 w-4' />
                </Button>
              </motion.div>
            )}
            <Button variant='ghost' size='icon' className='h-7 w-7'
              onClick={() => { setQuery(''); setCurrentIndex(0); onClose(); }}>
              <X className='h-4 w-4' />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
