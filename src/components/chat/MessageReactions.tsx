// MessageReactions.tsx
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Reaction } from '@/types/index';

interface MessageReactionsProps {
  reactions: Reaction[];
  currentUserId: string;
  onReactionClick: (emoji: string) => void;
  isOwn: boolean;
}

export function MessageReactions({ reactions, currentUserId, onReactionClick, isOwn }: MessageReactionsProps) {
  if (!reactions || reactions.length === 0) return null;
  const grouped: { emoji: string; count: number; hasReacted: boolean }[] = [];
  reactions.forEach((r) => {
    const ex = grouped.find((g) => g.emoji === r.emoji);
    if (ex) { ex.count++; if (r.userId === currentUserId) ex.hasReacted = true; }
    else grouped.push({ emoji: r.emoji, count: 1, hasReacted: r.userId === currentUserId });
  });
  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-wrap gap-1 mt-1', isOwn ? 'justify-end' : 'justify-start')}>
      {grouped.map((g) => (
        <motion.button key={g.emoji} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
          onClick={() => onReactionClick(g.emoji)}
          className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors',
            g.hasReacted ? 'bg-primary/20 border border-primary/40 text-primary' : 'bg-muted border border-transparent hover:border-border')}>
          <span className='text-sm'>{g.emoji}</span>
          {g.count > 1 && <span className='text-[10px] font-medium'>{g.count}</span>}
        </motion.button>
      ))}
    </motion.div>
  );
}
