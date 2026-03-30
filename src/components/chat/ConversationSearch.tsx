import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ConversationSearchProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Array<{ id: string; message: string; senderId: string }>;
  onNavigateToMessage: (messageId: string) => void;
  currentUserId: string;
}

export default function ConversationSearch({
  isOpen,
  onClose,
  messages,
  onNavigateToMessage,
  currentUserId,
}: ConversationSearchProps) {
  const [query, setQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const matchingMessages = query.trim()
    ? messages.filter(
        (msg) =>
          msg.message &&
          msg.message.toLowerCase().includes(query.toLowerCase().trim())
      )
    : [];

  const totalMatches = matchingMessages.length;

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setCurrentIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (matchingMessages.length > 0 && currentIndex < matchingMessages.length) {
      onNavigateToMessage(matchingMessages[currentIndex].id);
    }
  }, [currentIndex, matchingMessages, onNavigateToMessage]);

  const handlePrev = () => {
    if (totalMatches > 0) {
      setCurrentIndex((prev) => (prev - 1 + totalMatches) % totalMatches);
    }
  };

  const handleNext = () => {
    if (totalMatches > 0) {
      setCurrentIndex((prev) => (prev + 1) % totalMatches);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleClose = () => {
    setQuery('');
    setCurrentIndex(0);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute top-16 left-0 right-0 z-20 px-4 py-2 bg-card/95 backdrop-blur-sm border-b border-border shadow-lg"
        >
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCurrentIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search in conversation..."
                className="pl-10 pr-4 h-9 bg-secondary border-0 rounded-lg"
              />
            </div>

            {query && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1"
              >
                <span className="text-xs text-muted-foreground whitespace-nowrap min-w-[60px] text-center">
                  {totalMatches > 0
                    ? `${currentIndex + 1} of ${totalMatches}`
                    : 'No results'}
                </span>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handlePrev}
                  disabled={totalMatches === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleNext}
                  disabled={totalMatches === 0}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </motion.div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Helper component for highlighting search terms in messages
export function HighlightedText({
  text,
  highlight,
  className,
}: {
  text: string;
  highlight: string;
  className?: string;
}) {
  if (!highlight.trim()) {
    return <span className={className}>{text}</span>;
  }

  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-primary/30 text-foreground rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}