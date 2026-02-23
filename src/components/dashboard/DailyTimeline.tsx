import { useMemo } from 'react';
import { addDays, differenceInMinutes, differenceInWeeks, format, parseISO } from 'date-fns';
import { DaySummary, OverlayType } from '@/types/baby-log';
import { cn } from '@/lib/utils';
import { NapBar } from './timeline/NapBar';
import { FeedingBar } from './timeline/FeedingBar';
import { WetDiaperIndicator } from './timeline/WetDiaperIndicator';
import { DirtyDiaperIndicator } from './timeline/DirtyDiaperIndicator';
import { CommentIndicator } from './timeline/CommentIndicator';

interface DailyTimelineProps {
  data: DaySummary[];
  birthDate: string | null;
  nightStartHour: number;
  nightEndHour: number;
  activeOverlays: OverlayType[];
}

const HOUR_HEIGHT = 24; // pixels per hour
const DAY_COLUMN_WIDTH = 60; // pixels per day column

function getDayBoundaries(date: string) {
  const dayStart = parseISO(`${date}T00:00:00`);
  const dayEnd = addDays(dayStart, 1);
  return { dayStart, dayEnd };
}

function getEventOffsets(date: string, start: string, end: string) {
  const { dayStart, dayEnd } = getDayBoundaries(date);
  const startDate = parseISO(start);
  let endDate = parseISO(end);
  if (endDate <= startDate) {
    endDate = addDays(endDate, 1);
  }

  if (startDate >= dayEnd || endDate <= dayStart) {
    return null;
  }

  const visibleStart = startDate < dayStart ? dayStart : startDate;
  const visibleEnd = endDate > dayEnd ? dayEnd : endDate;

  return {
    startOffset: differenceInMinutes(visibleStart, dayStart),
    endOffset: differenceInMinutes(visibleEnd, dayStart),
    shouldFadeTop: startDate < dayStart,
    shouldFadeBottom: endDate > dayEnd,
  };
}

function getOffsetWithinDay(date: string, timestamp: string) {
  const { dayStart, dayEnd } = getDayBoundaries(date);
  const time = parseISO(timestamp);
  if (time < dayStart || time >= dayEnd) return null;
  return differenceInMinutes(time, dayStart);
}

function formatTimestamp(timestamp: string) {
  return format(parseISO(timestamp), 'MMM d, HH:mm');
}

export function DailyTimeline({ data, birthDate, nightStartHour, nightEndHour, activeOverlays }: DailyTimelineProps) {
  // Preprocess data to handle midnight-spanning events
  const processedData = useMemo(() => {
    // Deep clone the data to avoid mutations
    const clonedData: DaySummary[] = data.map((day) => ({
      ...day,
      naps: [...day.naps],
      feedings: [...day.feedings],
      diaperChanges: [...day.diaperChanges],
      comments: [...day.comments],
    }));

    clonedData.forEach((day) => {
      day.naps.sort((a, b) => a.start.localeCompare(b.start));
      day.feedings.sort((a, b) => a.start.localeCompare(b.start));
    });

    return clonedData;
  }, [data]);

  const getWeekLabel = useMemo(() => {
    return (dateStr: string) => {
      if (!birthDate) return null;
      const weeks = differenceInWeeks(parseISO(dateStr), parseISO(birthDate));
      return weeks >= 0 ? `Week ${weeks + 1}` : null;
    };
  }, [birthDate]);

  // Group consecutive days by week
  const weekGroups = useMemo(() => {
    if (!birthDate) return [];

    const groups: { weekLabel: string; startIndex: number; count: number }[] = [];
    let currentWeek: string | null = null;
    let currentGroup: { weekLabel: string; startIndex: number; count: number } | null = null;

    processedData.forEach((day, index) => {
      const weekLabel = getWeekLabel(day.date);

      if (weekLabel !== currentWeek) {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentWeek = weekLabel;
        currentGroup = weekLabel ? { weekLabel, startIndex: index, count: 1 } : null;
      } else if (currentGroup) {
        currentGroup.count++;
      }
    });

    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups;
  }, [birthDate, processedData, getWeekLabel]);

  const hours = useMemo(() => {
    const total = 24;
    return Array.from({ length: total }, (_, i) => i);
  }, []);

  const isNightHour = (hour: number) => {
    const normalized = hour % 24;
    if (nightStartHour > nightEndHour) {
      return normalized >= nightStartHour || normalized < nightEndHour;
    }
    return normalized >= nightStartHour && normalized < nightEndHour;
  };

  const positionFromOffsets = (startOffset: number, endOffset?: number) => {
    const top = (startOffset / 60) * HOUR_HEIGHT;
    const height = endOffset !== undefined ? ((endOffset - startOffset) / 60) * HOUR_HEIGHT : undefined;

    return { top, height };
  };

  const showNightIndication = activeOverlays.includes('nightIndicator');

  return (
    <div className="overflow-x-auto overflow-y-hidden">
      <div className="min-w-[800px]">
        {/* Week header row */}
        {birthDate && weekGroups.length > 0 && (
          <div className="flex border-b border-border">
            <div className="sticky left-0 z-30 w-16 shrink-0 border-r border-border bg-background" />
            {weekGroups.map((group, idx) => (
              <div
                key={`week-${group.startIndex}-${idx}`}
                className="flex items-center justify-center py-1 px-1 text-center border-l border-border bg-primary/5"
                style={{
                  flex: `${group.count} 1 0`,
                  minWidth: `${group.count * DAY_COLUMN_WIDTH}px`,
                  // simulate padding of multiple columns by increasing left/right padding based on group size
                  paddingLeft: `${group.count * 0.25}rem`,
                  paddingRight: `${group.count * 0.25}rem`,
                }}
              >
                <div className="text-xs font-medium text-primary">{group.weekLabel}</div>
              </div>
            ))}
          </div>
        )}

        {/* Day header row */}
        <div className="flex border-b border-border">
          <div className="sticky left-0 z-30 w-16 shrink-0 border-r border-border bg-background" />
          {processedData.map((day) => (
            <div
              key={day.date}
              className="flex-1 px-1 py-2 text-center border-l border-border"
              style={{ minWidth: `${DAY_COLUMN_WIDTH}px` }}
            >
              <div className="text-sm font-medium">{format(parseISO(day.date), 'EEE')}</div>
              <div className="text-xs text-muted-foreground">{format(parseISO(day.date), 'MMM d')}</div>
            </div>
          ))}
        </div>

        <div className="flex">
          <div className="sticky left-0 z-20 w-16 shrink-0 border-r border-border bg-background">
            {hours.map((hour) => (
              <div
                key={hour}
                className={cn(
                  'h-6 flex items-center justify-end pr-2 text-xs text-muted-foreground',
                  isNightHour(hour) && showNightIndication && 'bg-baby-night/30',
                )}
              >
                {`${(hour % 24).toString().padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {processedData.map((day) => {
            const wetDiaperChanges = day.diaperChanges.filter(
              (change) => change.type === 'WET' || change.type === 'WET_AND_DIRTY',
            );
            const dirtyDiaperChanges = day.diaperChanges.filter(
              (change) => change.type === 'DIRTY' || change.type === 'WET_AND_DIRTY',
            );

            return (
              <div
                key={day.date}
                className="relative border-l border-border"
                style={{
                  flex: `1 0 ${DAY_COLUMN_WIDTH}px`,
                  minWidth: `${DAY_COLUMN_WIDTH}px`,
                }}
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className={cn(
                      'h-6 border-b border-border/50',
                      showNightIndication && isNightHour(hour) && 'bg-baby-night/30',
                    )}
                  />
                ))}

                {activeOverlays.includes('naps') &&
                  day.naps.map((nap, idx) => {
                    const offsets = getEventOffsets(day.date, nap.start, nap.end);
                    if (!offsets) return null;
                    const { startOffset, endOffset, shouldFadeTop, shouldFadeBottom } = offsets;
                    const { top, height } = positionFromOffsets(startOffset, endOffset);

                    return (
                      <NapBar
                        key={`nap-${day.date}-${idx}`}
                        nightIndicator={showNightIndication}
                        nap={nap}
                        top={top}
                        height={height ?? 0}
                        shouldFadeBottom={shouldFadeBottom}
                        shouldFadeTop={shouldFadeTop}
                        formatTimestamp={formatTimestamp}
                      />
                    );
                  })}

                {activeOverlays.includes('feedings') &&
                  day.feedings.map((feeding, idx) => {
                    const offsets = getEventOffsets(day.date, feeding.start, feeding.end);
                    if (!offsets) return null;
                    const { startOffset, endOffset, shouldFadeTop, shouldFadeBottom } = offsets;
                    const { top, height } = positionFromOffsets(startOffset, endOffset);

                    return (
                      <FeedingBar
                        key={`feeding-${day.date}-${idx}`}
                        feeding={feeding}
                        top={top}
                        height={height ?? 0}
                        shouldFadeBottom={shouldFadeBottom}
                        shouldFadeTop={shouldFadeTop}
                        formatTimestamp={formatTimestamp}
                      />
                    );
                  })}

                {activeOverlays.includes('wetDiapers') &&
                  wetDiaperChanges.map((change, idx) => {
                    const offsetMinutes = getOffsetWithinDay(day.date, change.time);
                    if (offsetMinutes === null) return null;
                    const { top } = positionFromOffsets(offsetMinutes);

                    return (
                      <WetDiaperIndicator
                        key={`wet-${day.date}-${idx}`}
                        time={change.time}
                        top={top}
                        formatTimestamp={formatTimestamp}
                      />
                    );
                  })}

                {activeOverlays.includes('dirtyDiapers') &&
                  dirtyDiaperChanges.map((change, idx) => {
                    const offsetMinutes = getOffsetWithinDay(day.date, change.time);
                    if (offsetMinutes === null) return null;
                    const { top } = positionFromOffsets(offsetMinutes);

                    return (
                      <DirtyDiaperIndicator
                        key={`dirty-${day.date}-${idx}`}
                        time={change.time}
                        top={top}
                        formatTimestamp={formatTimestamp}
                      />
                    );
                  })}

                {activeOverlays.includes('comments') &&
                  day.comments.map((comment, idx) => {
                    const offsetMinutes = getOffsetWithinDay(day.date, comment.time);
                    if (offsetMinutes === null) return null;
                    const { top } = positionFromOffsets(offsetMinutes);

                    return (
                      <CommentIndicator
                        key={`comment-${day.date}-${idx}`}
                        comment={comment}
                        top={top}
                        formatTimestamp={formatTimestamp}
                      />
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
