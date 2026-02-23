import { CircleDot } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DirtyDiaperIndicatorProps {
  time: string;
  top: number;
  formatTimestamp: (timestamp: string) => string;
}

export function DirtyDiaperIndicator({ time, top, formatTimestamp }: DirtyDiaperIndicatorProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="absolute right-0.5 text-baby-dirty cursor-pointer bg-white/40 hover:bg-white/60 rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 border border-baby-dirty/50 -translate-y-1/2"
          style={{ top: `${top + 10}px` }}
          aria-label={`Dirty diaper at ${formatTimestamp(time)}`}
        >
          <CircleDot className="h-5 w-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-2 text-xs">
        <div className="font-medium text-sm">Dirty diaper</div>
        <div>Time: {formatTimestamp(time)}</div>
      </PopoverContent>
    </Popover>
  );
}
