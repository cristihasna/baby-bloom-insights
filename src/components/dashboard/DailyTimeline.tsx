import { useMemo } from 'react';
import { differenceInMinutes, differenceInWeeks, format, parseISO } from 'date-fns';
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

  const { extraHoursBefore, extraHoursAfter } = useMemo(() => {
    let maxBefore = 0;
    let maxAfter = 0;

    data.forEach((day) => {
      const dayStart = parseISO(`${day.date}T00:00`);
      const events = [...day.naps, ...day.feedings];

      events.forEach((event) => {
        const start = parseISO(event.startTime);
        const end = parseISO(event.endTime);
        const startOffset = differenceInMinutes(start, dayStart);
        const endOffset = differenceInMinutes(end, dayStart);

        if (endOffset > DAY_MINUTES) {
          const minutesBefore = DAY_MINUTES - startOffset;
          const minutesAfter = endOffset - DAY_MINUTES;
          maxBefore = Math.max(maxBefore, Math.max(0, minutesBefore));
          maxAfter = Math.max(maxAfter, Math.max(0, minutesAfter));
        }
      });
    });

    return {
      extraHoursBefore: Math.max(2, Math.ceil(maxBefore / 60)),
      extraHoursAfter: Math.max(2, Math.ceil(maxAfter / 60)),
    };
  }, [data]);

  const hours = useMemo(() => {
    const total = 24 + extraHoursBefore + extraHoursAfter;
    return Array.from({ length: total }, (_, i) => i - extraHoursBefore);
  }, [extraHoursBefore, extraHoursAfter]);

  const normalizeHour = (hour: number) => ((hour % 24) + 24) % 24;

  const isNightHour = (hour: number) => {
    const normalized = normalizeHour(hour);
    if (nightStartHour > nightEndHour) {
      return normalized >= nightStartHour || normalized < nightEndHour;
    }
    return normalized >= nightStartHour && normalized < nightEndHour;
  };

  const formatTimestamp = (timestamp: string) =>
    format(parseISO(timestamp), 'MMM d, HH:mm');

  const positionFromOffsets = (startOffset: number, endOffset?: number) => {
    const top = ((startOffset + extraHoursBefore * 60) / 60) * HOUR_HEIGHT;
    const height = endOffset !== undefined
      ? ((endOffset - startOffset) / 60) * HOUR_HEIGHT
      : undefined;

    return { top, height };
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header with dates */}
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

        {/* Timeline grid */}
        <div className="flex">
          {/* Hour labels */}
          <div className="w-16 shrink-0">
            {hours.map((hour) => {
              const showLabel = hour >= 0 && hour <= 23;
              const labelHour = normalizeHour(hour);
              return (
                <div
                  key={hour}
                  className={cn(
                    'h-6 flex items-center justify-end pr-2 text-xs text-muted-foreground',
                    isNightHour(hour) && 'bg-baby-night/30'
                  )}
                >
                  {showLabel ? `${labelHour.toString().padStart(2, '0')}:00` : ''}
                </div>
              );
            })}
          </div>

          {/* Day columns */}
          {data.map((day, dayIndex) => {
            const dayStart = parseISO(`${day.date}T00:00`);
            const previousDay = dayIndex > 0 ? data[dayIndex - 1] : null;

            const spilloverNaps = previousDay
              ? previousDay.naps.filter(
                  (nap) => parseISO(nap.endTime) > dayStart
                )
              : [];

            const spilloverFeedings = previousDay
              ? previousDay.feedings.filter(
                  (feeding) => parseISO(feeding.endTime) > dayStart
                )
              : [];

            const napsToRender = [...day.naps, ...spilloverNaps];
            const feedingsToRender = [...day.feedings, ...spilloverFeedings];

            return (
              <div
                key={day.date}
                className="flex-1 min-w-[80px] relative border-l border-border"
              >
                {/* Hour cells with night highlighting */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className={cn(
                      'h-6 border-b border-border/50',
                      isNightHour(hour) && 'bg-baby-night/30'
                    )}
                  />
                ))}

                {/* Nap/Sleep sessions */}
                {activeOverlays.includes('naps') &&
                  napsToRender.map((nap, idx) => {
                    const startOffset = differenceInMinutes(
                      parseISO(nap.startTime),
                      dayStart
                    );
                    const endOffset = differenceInMinutes(
                      parseISO(nap.endTime),
                      dayStart
                    );
                    const { top, height } = positionFromOffsets(startOffset, endOffset);

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
                            aria-label={`Sleep ${formatTimestamp(nap.startTime)} to ${formatTimestamp(
                              nap.endTime
                            )}`}
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2 text-xs">
                          <div className="font-medium text-sm">Sleep</div>
                          <div>Start: {formatTimestamp(nap.startTime)}</div>
                          <div>End: {formatTimestamp(nap.endTime)}</div>
                        </PopoverContent>
                      </Popover>
                    );
                  })}

                {/* Feeding sessions */}
                {activeOverlays.includes('feedings') &&
                  feedingsToRender.map((feeding, idx) => {
                    const startOffset = differenceInMinutes(
                      parseISO(feeding.startTime),
                      dayStart
                    );
                    const endOffset = differenceInMinutes(
                      parseISO(feeding.endTime),
                      dayStart
                    );
                    const { top, height } = positionFromOffsets(startOffset, endOffset);

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
                            aria-label={`Feeding ${formatTimestamp(
                              feeding.startTime
                            )} to ${formatTimestamp(feeding.endTime)}`}
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2 text-xs">
                          <div className="font-medium text-sm">Feeding</div>
                          <div>Start: {formatTimestamp(feeding.startTime)}</div>
                          <div>End: {formatTimestamp(feeding.endTime)}</div>
                        </PopoverContent>
                      </Popover>
                    );
                  })}

                {/* Diaper markers */}
                {activeOverlays.includes('wetDiapers') &&
                  day.wetDiapers.map((timestamp, idx) => {
                    const offsetMinutes = differenceInMinutes(
                      parseISO(timestamp),
                      dayStart
                    );
                    const { top } = positionFromOffsets(offsetMinutes);

                    return (
                      <Popover key={`wet-${day.date}-${idx}`}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="absolute left-0.5 text-baby-wet cursor-pointer bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                            style={{ top: `${top + 4}px` }}
                            aria-label={`Wet diaper at ${formatTimestamp(timestamp)}`}
                          >
                            <Droplets className="h-3 w-3" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-44 p-2 text-xs">
                          <div className="font-medium text-sm">Wet diaper</div>
                          <div>Time: {formatTimestamp(timestamp)}</div>
                        </PopoverContent>
                      </Popover>
                    );
                  })}

                {activeOverlays.includes('dirtyDiapers') &&
                  day.dirtyDiapers.map((timestamp, idx) => {
                    const offsetMinutes = differenceInMinutes(
                      parseISO(timestamp),
                      dayStart
                    );
                    const { top } = positionFromOffsets(offsetMinutes);

                    return (
                      <Popover key={`dirty-${day.date}-${idx}`}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="absolute right-0.5 text-baby-dirty cursor-pointer bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                            style={{ top: `${top + 12}px` }}
                            aria-label={`Dirty diaper at ${formatTimestamp(timestamp)}`}
                          >
                            <CircleDot className="h-3 w-3" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-44 p-2 text-xs">
                          <div className="font-medium text-sm">Dirty diaper</div>
                          <div>Time: {formatTimestamp(timestamp)}</div>
                        </PopoverContent>
                      </Popover>
                    );
                  })}

                {/* Comment markers */}
                {activeOverlays.includes('comments') &&
                  day.comments.map((comment, idx) => {
                    const offsetMinutes = differenceInMinutes(
                      parseISO(comment.time),
                      dayStart
                    );
                    const { top } = positionFromOffsets(offsetMinutes);

                    return (
                      <Popover key={`comment-${day.date}-${idx}`}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="absolute left-1/2 -translate-x-1/2 text-baby-mint cursor-pointer bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                            style={{ top: `${top + 4}px` }}
                            aria-label={`Comment at ${formatTimestamp(comment.time)}`}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2 text-xs">
                          <div className="font-medium text-sm">Comment</div>
                          <div>Time: {formatTimestamp(comment.time)}</div>
                          <div className="mt-1 text-muted-foreground">
                            {comment.text}
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
