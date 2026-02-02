import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { DateRange } from '@/types/baby-log';

interface DateRangeSelectorProps {
  dateRange: DateRange;
  presetOptions: { value: DateRange['preset']; label: string }[];
  onPresetChange: (preset: DateRange['preset']) => void;
  onCustomRangeChange: (startDate: Date, endDate: Date) => void;
}

export function DateRangeSelector({
  dateRange,
  presetOptions,
  onPresetChange,
  onCustomRangeChange,
}: DateRangeSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {presetOptions.map((option) => (
        <Button
          key={option.value}
          variant={dateRange.preset === option.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPresetChange(option.value)}
          className="rounded-full"
        >
          {option.label}
        </Button>
      ))}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={dateRange.preset === 'custom' ? 'default' : 'outline'}
            size="sm"
            className={cn('rounded-full gap-2', dateRange.preset === 'custom' && 'pl-3')}
          >
            <CalendarIcon className="h-4 w-4" />
            {dateRange.preset === 'custom' ? (
              <span>
                {format(dateRange.startDate, 'MMM d')} - {format(dateRange.endDate, 'MMM d')}
              </span>
            ) : (
              'Custom'
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{
              from: dateRange.startDate,
              to: dateRange.endDate,
            }}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                onCustomRangeChange(range.from, range.to);
              }
            }}
            numberOfMonths={2}
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
