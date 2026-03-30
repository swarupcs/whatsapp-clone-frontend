import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCheck, Eye } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { User } from '@/store/chatStore';

interface ReadReceiptsProps {
  seenBy: User[];
  totalUsers: number;
  isOwn: boolean;
}

export default function ReadReceipts({
  seenBy,
  totalUsers,
  isOwn,
}: ReadReceiptsProps) {
  const [showList, setShowList] = useState(false);

  if (seenBy.length === 0) return null;

  const displayUsers = seenBy.slice(0, 3);
  const remainingCount = seenBy.length - 3;

  return (
    <div
      className={cn('mt-1', isOwn ? 'flex justify-end' : 'flex justify-start')}
    >
      <TooltipProvider delayDuration={200}>
        <Tooltip open={showList} onOpenChange={setShowList}>
          <TooltipTrigger asChild>
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] transition-colors',
                'bg-muted/50 hover:bg-muted text-muted-foreground',
              )}
            >
              <Eye className='h-3 w-3' />
              <span>Seen by {seenBy.length}</span>
              <div className='flex -space-x-1.5 ml-1'>
                {displayUsers.map((user) => (
                  <Avatar
                    key={user.id}
                    className='h-4 w-4 border border-background'
                  >
                    <AvatarImage src={user.picture} />
                    <AvatarFallback className='text-[8px]'>
                      {user.name[0]}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {remainingCount > 0 && (
                  <div className='h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-medium border border-background'>
                    +{remainingCount}
                  </div>
                )}
              </div>
            </motion.button>
          </TooltipTrigger>
          <TooltipContent
            side={isOwn ? 'left' : 'right'}
            className='p-0 overflow-hidden'
          >
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className='min-w-[160px] max-h-[200px] overflow-y-auto'
              >
                <div className='px-3 py-2 border-b border-border bg-muted/50'>
                  <div className='flex items-center gap-1.5 text-xs font-medium'>
                    <CheckCheck className='h-3.5 w-3.5 text-primary' />
                    <span>
                      Seen by {seenBy.length} of {totalUsers}
                    </span>
                  </div>
                </div>
                <div className='py-1'>
                  {seenBy.map((user) => (
                    <div
                      key={user.id}
                      className='flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50'
                    >
                      <Avatar className='h-6 w-6'>
                        <AvatarImage src={user.picture} />
                        <AvatarFallback className='text-[10px]'>
                          {user.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className='flex-1 min-w-0'>
                        <p className='text-xs font-medium truncate'>
                          {user.name}
                        </p>
                        <p className='text-[10px] text-muted-foreground flex items-center gap-1'>
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              user.status === 'online'
                                ? 'bg-status-online'
                                : user.status === 'away'
                                  ? 'bg-status-away'
                                  : 'bg-status-offline',
                            )}
                          />
                          {user.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
