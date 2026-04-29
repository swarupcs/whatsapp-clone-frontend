import { cn } from '@/lib/utils';
import type { UserStatus } from '@/types';

interface StatusDotProps {
  status: UserStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  pulse?: boolean;
}

const sizeMap = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
};

const colorMap: Record<UserStatus, string> = {
  online: 'bg-status-online',
  away: 'bg-status-away',
  offline: 'bg-status-offline',
};

export default function StatusDot({ status, size = 'md', className, pulse = false }: StatusDotProps) {
  return (
    <span
      className={cn(
        'rounded-full border-2 border-card block',
        sizeMap[size],
        colorMap[status],
        pulse && status === 'online' && 'animate-pulse',
        className,
      )}
      aria-label={`Status: ${status}`}
    />
  );
}
