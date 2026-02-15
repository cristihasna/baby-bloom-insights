import { Droplets } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface WetDiaperIndicatorProps {
  time: string;
  date: string;
  top: number;
  formatTimestamp: (date: string, time: string, dayOffset?: number) => string;
}

export function WetDiaperIndicator({ time, date, top, formatTimestamp }: WetDiaperIndicatorProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="absolute left-0.5 text-baby-wet cursor-pointer bg-white/40 hover:bg-white/60 rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 border border-baby-wet/50"
          style={{ top: `${top + 2}px` }}
          aria-label={`Wet diaper at ${formatTimestamp(date, time)}`}
        >
          <Droplets className="h-5 w-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-2 text-xs">
        <div className="font-medium text-sm">Wet diaper</div>
        <div>Time: {formatTimestamp(date, time)}</div>
      </PopoverContent>
    </Popover>
  );
}
