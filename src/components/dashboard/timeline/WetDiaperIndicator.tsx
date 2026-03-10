import { Droplets } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface WetDiaperIndicatorProps {
  time: string;
  left: string;
  formatTimestamp: (timestamp: string) => string;
}

export function WetDiaperIndicator({ time, left, formatTimestamp }: WetDiaperIndicatorProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="absolute top-0 z-20 text-baby-wet cursor-pointer bg-white/40 hover:bg-white/60 rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 border border-baby-wet/50 -translate-x-1/2"
          style={{ left: `calc(${left} + 2px)` }}
          aria-label={`Wet diaper at ${formatTimestamp(time)}`}
        >
          <Droplets className="h-5 w-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-2 text-xs">
        <div className="font-medium text-sm">Wet diaper</div>
        <div>Time: {formatTimestamp(time)}</div>
      </PopoverContent>
    </Popover>
  );
}
