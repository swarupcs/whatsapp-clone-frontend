import { motion } from 'framer-motion';
import { X, Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props { senderName: string; message: string; isOwn: boolean; onCancel: () => void; }

export default function ReplyPreview({ senderName, message, isOwn, onCancel }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: 10, height: 0 }} className='px-4 pt-3 pb-0'>
      <div className='flex items-start gap-2 p-3 rounded-lg bg-secondary/50 border-l-4 border-primary'>
        <Reply className='h-4 w-4 text-primary shrink-0 mt-0.5' />
        <div className='flex-1 min-w-0'>
          <p className={cn('text-xs font-medium', isOwn ? 'text-primary' : 'text-foreground')}>
            {isOwn ? 'You' : senderName}
          </p>
          <p className='text-sm text-muted-foreground truncate'>{message}</p>
        </div>
        <Button size='icon' variant='ghost' className='h-6 w-6 shrink-0' onClick={onCancel}>
          <X className='h-4 w-4' />
        </Button>
      </div>
    </motion.div>
  );
}
