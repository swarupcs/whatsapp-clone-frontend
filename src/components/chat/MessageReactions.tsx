import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import type { Reaction } from '@/store/chatStore';

interface ReactionGroup {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface MessageReactionsProps {
  reactions: Reaction[];
  currentUserId: string;
  onReactionClick: (emoji: string) => void;
  isOwn: boolean;
}

export default function MessageReactions({
  reactions,
  currentUserId,
  onReactionClick,
  isOwn,
}: MessageReactionsProps) {
  if (!reactions || reactions.length === 0) return null;

  // Group reactions by emoji
  const groupedReactions: ReactionGroup[] = [];
  reactions.forEach((reaction) => {
    const existing = groupedReactions.find((g) => g.emoji === reaction.emoji);
    if (existing) {
      existing.count++;
      if (reaction.userId === currentUserId) {
        existing.hasReacted = true;
      }
    } else {
      groupedReactions.push({
        emoji: reaction.emoji,
        count: 1,
        hasReacted: reaction.userId === currentUserId,
      });
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-wrap gap-1 mt-1',
        isOwn ? 'justify-end' : 'justify-start',
      )}
    >
      {groupedReactions.map((group) => (
        <motion.button
          key={group.emoji}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onReactionClick(group.emoji)}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors',
            group.hasReacted
              ? 'bg-primary/20 border border-primary/40 text-primary'
              : 'bg-muted border border-transparent hover:border-border',
          )}
        >
          <span className='text-sm'>{group.emoji}</span>
          {group.count > 1 && (
            <span className='text-[10px] font-medium'>{group.count}</span>
          )}
        </motion.button>
      ))}
    </motion.div>
  );
}
