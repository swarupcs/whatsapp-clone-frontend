import { motion } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { User } from '@/store/chatStore';


interface TypingIndicatorProps {
  typingUsers: User[];
  showAvatars?: boolean;
}

export default function TypingIndicator({
  typingUsers,
  showAvatars = true,
}: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name.split(' ')[0]} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].name.split(' ')[0]} and ${typingUsers[1].name.split(' ')[0]} are typing`;
    } else {
      return `${typingUsers.length} people are typing`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className='flex items-end gap-2'
    >
      {/* Avatar stack for group typing */}
      {showAvatars && (
        <div className='flex -space-x-2'>
          {typingUsers.slice(0, 3).map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Avatar className='h-8 w-8 border-2 border-background'>
                <AvatarImage src={user.picture} />
                <AvatarFallback className='text-xs'>
                  {user.name[0]}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          ))}
        </div>
      )}

      {/* Typing bubble with animated dots */}
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className='flex flex-col gap-1'
      >
        <div className='typing-indicator relative'>
          <div className='flex gap-1 items-center'>
            <motion.span
              className='typing-dot'
              animate={{
                y: [0, -6, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.span
              className='typing-dot'
              animate={{
                y: [0, -6, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: 0.15,
                ease: 'easeInOut',
              }}
            />
            <motion.span
              className='typing-dot'
              animate={{
                y: [0, -6, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: 0.3,
                ease: 'easeInOut',
              }}
            />
          </div>
        </div>

        {/* Typing text label */}
        <span className='text-xs text-muted-foreground pl-1'>
          {getTypingText()}
        </span>
      </motion.div>
    </motion.div>
  );
}
