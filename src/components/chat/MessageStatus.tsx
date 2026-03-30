import { Check, CheckCheck, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MessageStatusType = 'sending' | 'sent' | 'delivered' | 'seen';

interface MessageStatusProps {
  status: MessageStatusType;
  className?: string;
}

export default function MessageStatus({
  status,
  className,
}: MessageStatusProps) {
  const baseClass = cn('h-3 w-3', className);

  switch (status) {
    case 'sending':
      return (
        <Clock
          className={cn(baseClass, 'text-muted-foreground animate-pulse')}
        />
      );
    case 'sent':
      return <Check className={cn(baseClass, 'text-muted-foreground')} />;
    case 'delivered':
      return <CheckCheck className={cn(baseClass, 'text-muted-foreground')} />;
    case 'seen':
      return <CheckCheck className={cn(baseClass, 'text-primary')} />;
    default:
      return null;
  }
}

// Helper to simulate message status progression
export function simulateStatusProgression(
  onStatusChange: (status: MessageStatusType) => void,
  isRecipientOnline: boolean = true,
) {
  // Start as sending
  onStatusChange('sending');

  // Sent after 300-500ms
  setTimeout(
    () => {
      onStatusChange('sent');

      // Delivered after 1-2s
      setTimeout(
        () => {
          onStatusChange('delivered');

          // Seen after 2-5s (only if recipient is "online")
          if (isRecipientOnline) {
            const seenDelay = 2000 + Math.random() * 3000;
            setTimeout(() => {
              onStatusChange('seen');
            }, seenDelay);
          }
        },
        1000 + Math.random() * 1000,
      );
    },
    300 + Math.random() * 200,
  );
}
