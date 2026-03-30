// QuotedMessage
import { Reply } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuotedMessageProps {
  senderName: string;
  message: string;
  isOwn: boolean;
  isOwnReply: boolean;
  onClick?: () => void;
}

export function QuotedMessage({ senderName, message, isOwn, isOwnReply, onClick }: QuotedMessageProps) {
  return (
    <div onClick={onClick}
      className={cn('flex items-start gap-2 p-2 rounded-lg mb-2 cursor-pointer transition-colors border-l-2',
        isOwn ? 'bg-white/10 hover:bg-white/15' : 'bg-black/5 hover:bg-black/10',
        isOwnReply ? 'border-primary' : 'border-muted-foreground/50')}>
      <Reply className={cn('h-3 w-3 shrink-0 mt-0.5', isOwnReply ? 'text-primary' : 'text-muted-foreground')} />
      <div className='min-w-0 flex-1'>
        <p className={cn('text-[10px] font-medium', isOwnReply ? 'text-primary' : 'opacity-70')}>
          {isOwnReply ? 'You' : senderName}
        </p>
        <p className='text-xs opacity-80 line-clamp-2'>{message}</p>
      </div>
    </div>
  );
}
