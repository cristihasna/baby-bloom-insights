import React from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FeedingSession } from '@/types/baby-log';

interface FeedingBarProps {
  feeding: FeedingSession;
  left: string;
  width: string;
  shouldFadeEnd: boolean;
  shouldFadeStart: boolean;
  formatTimestamp: (timestamp: string) => string;
}

export function FeedingBar({
  feeding,
  left,
  width,
  shouldFadeEnd,
  shouldFadeStart,
  formatTimestamp,
}: FeedingBarProps) {
  const backgroundStyle: React.CSSProperties = {};
  if (shouldFadeEnd) {
    backgroundStyle.background =
      'linear-gradient(to right, hsl(var(--baby-feeding) / 0.8) 0%, hsl(var(--baby-feeding) / 0.8) 70%, hsl(var(--baby-feeding) / 0) 100%)';
    backgroundStyle.borderRight = 'none';
    backgroundStyle.borderTopRightRadius = '0';
    backgroundStyle.borderBottomRightRadius = '0';
  } else if (shouldFadeStart) {
    backgroundStyle.background =
      'linear-gradient(to right, hsl(var(--baby-feeding) / 0) 0%, hsl(var(--baby-feeding) / 0.8) 30%, hsl(var(--baby-feeding) / 0.8) 100%)';
    backgroundStyle.borderLeft = 'none';
    backgroundStyle.borderTopLeftRadius = '0';
    backgroundStyle.borderBottomLeftRadius = '0';
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'absolute top-2 bottom-2 z-10 rounded-sm border border-baby-feeding-foreground/20 cursor-pointer p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            !shouldFadeEnd && !shouldFadeStart && 'bg-baby-feeding/80',
          )}
          style={{
            left,
            width: `max(${width}, 4px)`,
            ...backgroundStyle,
          }}
          aria-label={`Feeding ${formatTimestamp(feeding.start)} to ${formatTimestamp(feeding.end)}`}
        />
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2 text-xs">
        <div className="font-medium text-sm">Feeding</div>
        <div>Start: {formatTimestamp(feeding.start)}</div>
        <div>End: {formatTimestamp(feeding.end)}</div>
      </PopoverContent>
    </Popover>
  );
}
