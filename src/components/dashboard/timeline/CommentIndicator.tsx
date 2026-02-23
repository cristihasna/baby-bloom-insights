import { MessageCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface CommentIndicatorProps {
  comment: {
    time: string;
    message: string;
  };
  top: number;
  formatTimestamp: (timestamp: string) => string;
}

export function CommentIndicator({ comment, top, formatTimestamp }: CommentIndicatorProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="absolute left-1/2 -translate-x-1/2 text-black/40 cursor-pointer bg-white/40 hover:bg-white/60 rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 border border-baby-mint/50 -translate-y-1/2"
          style={{ top: `${top + 2}px` }}
          aria-label={`Comment at ${formatTimestamp(comment.time)}`}
        >
          <MessageCircle className="h-5 w-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2 text-xs">
        <div className="font-medium text-sm">Comment</div>
        <div>Time: {formatTimestamp(comment.time)}</div>
        <div className="mt-1 text-muted-foreground">{comment.message}</div>
      </PopoverContent>
    </Popover>
  );
}
