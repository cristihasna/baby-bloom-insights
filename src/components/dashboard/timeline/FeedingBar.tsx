import React from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FeedingSession } from '@/types/baby-log';

interface FeedingBarProps {
  feeding: FeedingSession;
  top: number;
  height: number;
  shouldFadeBottom: boolean;
  shouldFadeTop: boolean;
  formatTimestamp: (timestamp: string) => string;
}

export function FeedingBar({
  feeding,
  top,
  height,
  shouldFadeBottom,
  shouldFadeTop,
  formatTimestamp,
}: FeedingBarProps) {
  const backgroundStyle: React.CSSProperties = {};
  if (shouldFadeBottom) {
    backgroundStyle.background =
      'linear-gradient(to bottom, hsl(var(--baby-feeding) / 0.8) 0%, hsl(var(--baby-feeding) / 0.8) 70%, hsl(var(--baby-feeding) / 0) 100%)';
  } else if (shouldFadeTop) {
    backgroundStyle.background =
      'linear-gradient(to bottom, hsl(var(--baby-feeding) / 0) 0%, hsl(var(--baby-feeding) / 0.8) 30%, hsl(var(--baby-feeding) / 0.8) 100%)';
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'absolute left-2 right-2 rounded-sm border border-baby-feeding-foreground/20 cursor-pointer p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            !shouldFadeBottom && !shouldFadeTop && 'bg-baby-feeding/80',
          )}
          style={{
            top: `${top}px`,
            height: `${Math.max(height, 3)}px`,
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
