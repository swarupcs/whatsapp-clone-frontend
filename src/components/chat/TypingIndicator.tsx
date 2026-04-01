import { motion } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { User } from '@/types';
interface Props { typingUsers: User[]; showAvatars?: boolean; }
export default function TypingIndicator({ typingUsers, showAvatars = true }: Props) {
  if (typingUsers.length === 0) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className='flex items-end gap-2'>
      {showAvatars && (
        <div className='flex -space-x-2'>
          {typingUsers.slice(0, 3).map((user, i) => (
            <motion.div key={user.id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.1 }}>
              <Avatar className='h-8 w-8 border-2 border-background'><AvatarImage src={user.picture} /><AvatarFallback className='text-xs'>{user.name[0]}</AvatarFallback></Avatar>
            </motion.div>
          ))}
        </div>
      )}
      <div className='flex flex-col gap-1'>
        <div className='typing-indicator'>
          <div className='flex gap-1 items-center'>
            {[0, 1, 2].map((i) => (
              <motion.span key={i} className='typing-dot'
                animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }} />
            ))}
          </div>
        </div>
        <span className='text-xs text-muted-foreground pl-1'>
          {typingUsers.length === 1 ? `${typingUsers[0]!.name.split(' ')[0]} is typing`
            : typingUsers.length === 2 ? `${typingUsers[0]!.name.split(' ')[0]} and ${typingUsers[1]!.name.split(' ')[0]} are typing`
            : `${typingUsers.length} people are typing`}
        </span>
      </div>
    </motion.div>
  );
}
