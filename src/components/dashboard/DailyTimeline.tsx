import { useMemo } from 'react';
import { addDays, differenceInWeeks, format, parseISO } from 'date-fns';
import { DaySummary, OverlayType } from '@/types/baby-log';
import { cn } from '@/lib/utils';
import { Droplets, CircleDot, MessageCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DailyTimelineProps {
  data: DaySummary[];
  birthDate: string | null;
  nightStartHour: number;
  nightEndHour: number;
  activeOverlays: OverlayType[];
}

const HOUR_HEIGHT = 24; // pixels per hour
const DAY_MINUTES = 24 * 60;

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map((value) => Number(value));
  return hours * 60 + minutes;
}

function getEventOffsets(startTime: string, endTime: string) {
  const startOffset = parseTimeToMinutes(startTime);
  let endOffset = parseTimeToMinutes(endTime);
  if (endOffset <= startOffset) {
    endOffset += DAY_MINUTES;
  }
  return { startOffset, endOffset };
}

function formatTimestamp(date: string, time: string, dayOffset = 0) {
  const base = parseISO(`${date}T00:00`);
  const dated = addDays(base, dayOffset);
  return `${format(dated, 'MMM d')}, ${time}`;
}

export function DailyTimeline({
  data,
  birthDate,
  nightStartHour,
  nightEndHour,
  activeOverlays,
}: DailyTimelineProps) {
  const getWeekLabel = useMemo(() => {
    return (dateStr: string) => {
      if (!birthDate) return null;
      const weeks = differenceInWeeks(parseISO(dateStr), parseISO(birthDate));
      return weeks >= 0 ? `Week ${weeks + 1}` : null;
    };
  }, [birthDate]);

  const extraHoursAfter = useMemo(() => {
    let maxAfterMinutes = 0;

    data.forEach((day) => {
      const events = [...day.naps, ...day.feedings];
      events.forEach((event) => {
        const { endOffset } = getEventOffsets(event.startTime, event.endTime);
        if (endOffset > DAY_MINUTES) {
          maxAfterMinutes = Math.max(maxAfterMinutes, endOffset - DAY_MINUTES);
        }
      });
    });

    return Math.max(2, Math.ceil(maxAfterMinutes / 60));
  }, [data]);

  const hours = useMemo(() => {
    const total = 24 + extraHoursAfter;
    return Array.from({ length: total }, (_, i) => i);
  }, [extraHoursAfter]);

  const isNightHour = (hour: number) => {
    const normalized = hour % 24;
    if (nightStartHour > nightEndHour) {
      return normalized >= nightStartHour || normalized < nightEndHour;
    }
    return normalized >= nightStartHour && normalized < nightEndHour;
  };

  const positionFromOffsets = (startOffset: number, endOffset?: number) => {
    const top = (startOffset / 60) * HOUR_HEIGHT;
    const height = endOffset !== undefined
      ? ((endOffset - startOffset) / 60) * HOUR_HEIGHT
      : undefined;

    return { top, height };
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        <div className="flex border-b border-border">
          <div className="w-16 shrink-0" />
          {data.map((day) => (
            <div
              key={day.date}
              className="flex-1 min-w-[80px] px-1 py-2 text-center border-l border-border"
            >
              <div className="text-sm font-medium">
                {format(parseISO(day.date), 'EEE')}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(parseISO(day.date), 'MMM d')}
              </div>
              {birthDate && (
                <div className="text-xs text-primary font-medium mt-1">
                  {getWeekLabel(day.date)}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex">
          <div className="w-16 shrink-0">
            {hours.map((hour) => (
              <div
                key={hour}
                className={cn(
                  'h-6 flex items-center justify-end pr-2 text-xs text-muted-foreground',
                  isNightHour(hour) && 'bg-baby-night/30'
                )}
              >
                {`${(hour % 24).toString().padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {data.map((day) => {
            const wetDiaperChanges = day.diaperChanges.filter(
              (change) => change.type === 'WET' || change.type === 'WET_AND_DIRTY'
            );
            const dirtyDiaperChanges = day.diaperChanges.filter(
              (change) => change.type === 'DIRTY' || change.type === 'WET_AND_DIRTY'
            );

            return (
              <div
                key={day.date}
                className="flex-1 min-w-[80px] relative border-l border-border"
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className={cn(
                      'h-6 border-b border-border/50',
                      isNightHour(hour) && 'bg-baby-night/30'
                    )}
                  />
                ))}

                {activeOverlays.includes('naps') &&
                  day.naps.map((nap, idx) => {
                    const { startOffset, endOffset } = getEventOffsets(
                      nap.startTime,
                      nap.endTime
                    );
                    const { top, height } = positionFromOffsets(startOffset, endOffset);
                    const dayOffset = endOffset > DAY_MINUTES ? 1 : 0;

                    return (
                      <Popover key={`nap-${day.date}-${idx}`}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="absolute left-1 right-1 bg-baby-sleep/80 rounded-md border border-baby-sleep-foreground/20 cursor-pointer p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                            style={{
                              top: `${top}px`,
                              height: `${Math.max(height ?? 0, 4)}px`,
                            }}
                            aria-label={`Sleep ${formatTimestamp(day.date, nap.startTime)} to ${formatTimestamp(day.date, nap.endTime, dayOffset)}`}
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2 text-xs">
                          <div className="font-medium text-sm">Sleep</div>
                          <div>Start: {formatTimestamp(day.date, nap.startTime)}</div>
                          <div>End: {formatTimestamp(day.date, nap.endTime, dayOffset)}</div>
                        </PopoverContent>
                      </Popover>
                    );
                  })}

                {activeOverlays.includes('feedings') &&
                  day.feedings.map((feeding, idx) => {
                    const { startOffset, endOffset } = getEventOffsets(
                      feeding.startTime,
                      feeding.endTime
                    );
                    const { top, height } = positionFromOffsets(startOffset, endOffset);
                    const dayOffset = endOffset > DAY_MINUTES ? 1 : 0;

                    return (
                      <Popover key={`feeding-${day.date}-${idx}`}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="absolute left-2 right-2 bg-baby-feeding/80 rounded-sm border border-baby-feeding-foreground/20 cursor-pointer p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                            style={{
                              top: `${top}px`,
                              height: `${Math.max(height ?? 0, 3)}px`,
                            }}
                            aria-label={`Feeding ${formatTimestamp(day.date, feeding.startTime)} to ${formatTimestamp(day.date, feeding.endTime, dayOffset)}`}
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2 text-xs">
                          <div className="font-medium text-sm">Feeding</div>
                          <div>Start: {formatTimestamp(day.date, feeding.startTime)}</div>
                          <div>End: {formatTimestamp(day.date, feeding.endTime, dayOffset)}</div>
                        </PopoverContent>
                      </Popover>
                    );
                  })}

                {activeOverlays.includes('wetDiapers') &&
                  wetDiaperChanges.map((change, idx) => {
                    const offsetMinutes = parseTimeToMinutes(change.time);
                    const { top } = positionFromOffsets(offsetMinutes);

                    return (
                      <Popover key={`wet-${day.date}-${idx}`}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="absolute left-0.5 text-baby-wet cursor-pointer bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                            style={{ top: `${top + 4}px` }}
                            aria-label={`Wet diaper at ${formatTimestamp(day.date, change.time)}`}
                          >
                            <Droplets className="h-3 w-3" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-44 p-2 text-xs">
                          <div className="font-medium text-sm">Wet diaper</div>
                          <div>Time: {formatTimestamp(day.date, change.time)}</div>
                        </PopoverContent>
                      </Popover>
                    );
                  })}

                {activeOverlays.includes('dirtyDiapers') &&
                  dirtyDiaperChanges.map((change, idx) => {
                    const offsetMinutes = parseTimeToMinutes(change.time);
                    const { top } = positionFromOffsets(offsetMinutes);

                    return (
                      <Popover key={`dirty-${day.date}-${idx}`}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="absolute right-0.5 text-baby-dirty cursor-pointer bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                            style={{ top: `${top + 12}px` }}
                            aria-label={`Dirty diaper at ${formatTimestamp(day.date, change.time)}`}
                          >
                            <CircleDot className="h-3 w-3" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-44 p-2 text-xs">
                          <div className="font-medium text-sm">Dirty diaper</div>
                          <div>Time: {formatTimestamp(day.date, change.time)}</div>
                        </PopoverContent>
                      </Popover>
                    );
                  })}

                {activeOverlays.includes('comments') &&
                  day.comments.map((comment, idx) => {
                    const offsetMinutes = parseTimeToMinutes(comment.time);
                    const { top } = positionFromOffsets(offsetMinutes);

                    return (
                      <Popover key={`comment-${day.date}-${idx}`}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="absolute left-1/2 -translate-x-1/2 text-baby-mint cursor-pointer bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                            style={{ top: `${top + 4}px` }}
                            aria-label={`Comment at ${formatTimestamp(day.date, comment.time)}`}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2 text-xs">
                          <div className="font-medium text-sm">Comment</div>
                          <div>Time: {formatTimestamp(day.date, comment.time)}</div>
                          <div className="mt-1 text-muted-foreground">
                            {comment.message}
                          </div>
                        </PopoverContent>
                      </Popover>
                    );
                  })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
