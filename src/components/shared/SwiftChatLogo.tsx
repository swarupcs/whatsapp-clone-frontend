import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwiftChatLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const iconSizes = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-12 w-12',
};

const zapSizes = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4.5 w-4.5',
  lg: 'h-6 w-6',
};

const textSizes = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-2xl',
};

export default function SwiftChatLogo({ size = 'md', showText = true, className }: SwiftChatLogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-xl gradient-primary flex items-center justify-center shrink-0',
          iconSizes[size],
        )}
      >
        <Zap className={cn('text-white fill-white', zapSizes[size])} />
      </div>
      {showText && (
        <span className={cn('font-display font-bold tracking-tight gradient-text', textSizes[size])}>
          SwiftChat
        </span>
      )}
    </div>
  );
}
