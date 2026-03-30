import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCheck, Eye } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { User } from '@/types/index';

interface Props {
  seenBy: User[];
  totalUsers: number;
  isOwn: boolean;
}

export default function ReadReceipts({ seenBy, totalUsers, isOwn }: Props) {
  const [showList, setShowList] = useState(false);
  if (seenBy.length === 0) return null;

  const displayUsers = seenBy.slice(0, 3);
  const remaining = seenBy.length - 3;

  return (
    <div className={cn('mt-1', isOwn ? 'flex justify-end' : 'flex justify-start')}>
      <TooltipProvider delayDuration={200}>
        <Tooltip open={showList} onOpenChange={setShowList}>
          <TooltipTrigger asChild>
            <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className='flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-muted/50 hover:bg-muted text-muted-foreground transition-colors'>
              <Eye className='h-3 w-3' />
              <span>Seen by {seenBy.length}</span>
              <div className='flex -space-x-1.5 ml-1'>
                {displayUsers.map((u) => (
                  <Avatar key={u.id} className='h-4 w-4 border border-background'>
                    <AvatarImage src={u.picture} />
                    <AvatarFallback className='text-[8px]'>{u.name[0]}</AvatarFallback>
                  </Avatar>
                ))}
                {remaining > 0 && (
                  <div className='h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-medium border border-background'>
                    +{remaining}
                  </div>
                )}
              </div>
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side={isOwn ? 'left' : 'right'} className='p-0 overflow-hidden'>
            <div className='min-w-[160px] max-h-[200px] overflow-y-auto'>
              <div className='px-3 py-2 border-b border-border bg-muted/50'>
                <div className='flex items-center gap-1.5 text-xs font-medium'>
                  <CheckCheck className='h-3.5 w-3.5 text-primary' />
                  <span>Seen by {seenBy.length} of {totalUsers}</span>
                </div>
              </div>
              <div className='py-1'>
                {seenBy.map((u) => (
                  <div key={u.id} className='flex items-center gap-2 px-3 py-1.5'>
                    <Avatar className='h-6 w-6'>
                      <AvatarImage src={u.picture} />
                      <AvatarFallback className='text-[10px]'>{u.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className='text-xs font-medium'>{u.name}</p>
                      <p className='text-[10px] text-muted-foreground capitalize'>{u.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
