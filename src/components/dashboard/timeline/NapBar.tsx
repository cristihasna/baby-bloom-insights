import React from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface NapBarProps {
  nap: {
    startTime: string;
    endTime: string;
    rawMessages: string[];
    isNightSleep: boolean;
  };
  date: string;
  top: number;
  height: number;
  shouldFadeBottom: boolean;
  shouldFadeTop: boolean;
  startDateOffset: number;
  endDayOffset: number;
  formatTimestamp: (date: string, time: string, dayOffset?: number) => string;
}

export function NapBar({
  nap,
  date,
  top,
  height,
  shouldFadeBottom,
  shouldFadeTop,
  startDateOffset,
  endDayOffset,
  formatTimestamp,
}: NapBarProps) {
  // Use different colors for night vs day sleep
  const sleepColor = nap.isNightSleep ? '--baby-night' : '--baby-sleep';
  
  const backgroundStyle: React.CSSProperties = {};
  if (shouldFadeBottom) {
    backgroundStyle.background =
      `linear-gradient(to bottom, hsl(var(${sleepColor}) / 0.8) 0%, hsl(var(${sleepColor}) / 0.8) 70%, hsl(var(${sleepColor}) / 0) 100%)`;
    backgroundStyle.borderBottom = 'none';
  } else if (shouldFadeTop) {
    backgroundStyle.background =
      `linear-gradient(to bottom, hsl(var(${sleepColor}) / 0) 0%, hsl(var(${sleepColor}) / 0.8) 30%, hsl(var(${sleepColor}) / 0.8) 100%)`;
    backgroundStyle.borderTop = 'none';
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'absolute left-1 right-1 rounded-md border cursor-pointer p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            nap.isNightSleep ? 'border-baby-night-foreground/20' : 'border-baby-sleep-foreground/20',
            !shouldFadeBottom && !shouldFadeTop && (nap.isNightSleep ? 'bg-baby-night/80' : 'bg-baby-sleep/80'),
          )}
          style={{
            top: `${top}px`,
            height: `${Math.max(height, 4)}px`,
            ...backgroundStyle,
          }}
          aria-label={`${nap.isNightSleep ? 'Night' : 'Day'} Sleep ${formatTimestamp(date, nap.startTime, startDateOffset)} to ${formatTimestamp(date, nap.endTime, endDayOffset)}`}
        />
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2 text-xs">
        <div className="font-medium text-sm">{nap.isNightSleep ? 'Night Sleep' : 'Day Sleep'}</div>
        <div>Start: {formatTimestamp(date, nap.startTime, startDateOffset)}</div>
        <div>End: {formatTimestamp(date, nap.endTime, endDayOffset)}</div>
        <div className={cn('mt-5')} dangerouslySetInnerHTML={{ __html: nap.rawMessages.join('<br />') }} />
      </PopoverContent>
    </Popover>
  );
}
