import { useMemo } from 'react';
import { addDays, differenceInWeeks, format, parseISO } from 'date-fns';
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
const DAY_MINUTES = 24 * 60;
const DAY_COLUMN_WIDTH = 60; // pixels per day column

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map((value) => Number(value));
  return hours * 60 + minutes;
}

function getEventOffsets(startTime: string, endTime: string, isFirstEvent: boolean = false) {
  let startOffset = parseTimeToMinutes(startTime);
  let endOffset = parseTimeToMinutes(endTime);
  const isOverlappingMidnight = endOffset <= startOffset;
  // cap endOffset to 24 hours to prevent excessively long bars when events span multiple days
  if (isOverlappingMidnight && !isFirstEvent) {
    endOffset = DAY_MINUTES;
  } else if (isOverlappingMidnight && isFirstEvent) {
    startOffset = 0;
  }
  return { startOffset, endOffset, isOverlappingMidnight };
}

function formatTimestamp(date: string, time: string, dayOffset = 0) {
  const base = parseISO(`${date}T00:00`);
  const dated = addDays(base, dayOffset);
  return `${format(dated, 'MMM d')}, ${time}`;
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

    // Process naps and feedings to split midnight-spanning events
    for (let i = 0; i < clonedData.length - 1; i++) {
      const day = clonedData[i];
      const nextDay = clonedData[i + 1];

      // Process naps
      day.naps.forEach((nap, idx) => {
        const isFirstNap = idx === 0;
        const { isOverlappingMidnight } = getEventOffsets(nap.startTime, nap.endTime, isFirstNap);

        if (isOverlappingMidnight && !isFirstNap) {
          // Add to next day's naps at the beginning
          nextDay.naps.unshift(nap);
        }
      });

      // Process feedings
      day.feedings.forEach((feeding, idx) => {
        const isFirstFeeding = idx === 0;
        const { isOverlappingMidnight } = getEventOffsets(feeding.startTime, feeding.endTime, isFirstFeeding);

        if (isOverlappingMidnight && !isFirstFeeding) {
          // Add to next day's feedings at the beginning
          nextDay.feedings.unshift(feeding);
        }
      });
    }

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

  return (
    <div className="overflow-x-auto">
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
                  isNightHour(hour) && 'bg-baby-night/30',
                )}
              >
                {`${(hour % 24).toString().padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {processedData.map((day, dayIndex) => {
            const wetDiaperChanges = day.diaperChanges.filter(
              (change) => change.type === 'WET' || change.type === 'WET_AND_DIRTY',
            );
            const dirtyDiaperChanges = day.diaperChanges.filter(
              (change) => change.type === 'DIRTY' || change.type === 'WET_AND_DIRTY',
            );

            return (
              <div
                key={day.date}
                className="flex-1 relative border-l border-border"
                style={{ minWidth: `${DAY_COLUMN_WIDTH}px` }}
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className={cn('h-6 border-b border-border/50', isNightHour(hour) && 'bg-baby-night/30')}
                  />
                ))}

                {activeOverlays.includes('naps') &&
                  day.naps.map((nap, idx) => {
                    const isFirstNap = idx === 0;
                    const { startOffset, endOffset, isOverlappingMidnight } = getEventOffsets(
                      nap.startTime,
                      nap.endTime,
                      isFirstNap,
                    );
                    const { top, height } = positionFromOffsets(startOffset, endOffset);
                    const startDateOffset = isOverlappingMidnight && isFirstNap ? -1 : 0;
                    const endDayOffset = isOverlappingMidnight && !isFirstNap ? 1 : 0;

                    // Determine fade effects for continuity
                    const shouldFadeBottom = isOverlappingMidnight && !isFirstNap;
                    const shouldFadeTop = isFirstNap && isOverlappingMidnight;

                    return (
                      <NapBar
                        key={`nap-${day.date}-${idx}`}
                        nap={nap}
                        date={day.date}
                        top={top}
                        height={height ?? 0}
                        shouldFadeBottom={shouldFadeBottom}
                        shouldFadeTop={shouldFadeTop}
                        startDateOffset={startDateOffset}
                        endDayOffset={endDayOffset}
                        formatTimestamp={formatTimestamp}
                      />
                    );
                  })}

                {activeOverlays.includes('feedings') &&
                  day.feedings.map((feeding, idx) => {
                    const isFirstFeeding = idx === 0;
                    const { startOffset, endOffset, isOverlappingMidnight } = getEventOffsets(
                      feeding.startTime,
                      feeding.endTime,
                      isFirstFeeding,
                    );
                    const { top, height } = positionFromOffsets(startOffset, endOffset);
                    const dayOffset = endOffset > DAY_MINUTES ? 1 : 0;

                    // Determine fade effects for continuity
                    const shouldFadeBottom = isOverlappingMidnight && !isFirstFeeding;
                    const shouldFadeTop = isFirstFeeding && isOverlappingMidnight;

                    return (
                      <FeedingBar
                        key={`feeding-${day.date}-${idx}`}
                        feeding={feeding}
                        date={day.date}
                        top={top}
                        height={height ?? 0}
                        shouldFadeBottom={shouldFadeBottom}
                        shouldFadeTop={shouldFadeTop}
                        dayOffset={dayOffset}
                        formatTimestamp={formatTimestamp}
                      />
                    );
                  })}

                {activeOverlays.includes('wetDiapers') &&
                  wetDiaperChanges.map((change, idx) => {
                    const offsetMinutes = parseTimeToMinutes(change.time);
                    const { top } = positionFromOffsets(offsetMinutes);

                    return (
                      <WetDiaperIndicator
                        key={`wet-${day.date}-${idx}`}
                        time={change.time}
                        date={day.date}
                        top={top}
                        formatTimestamp={formatTimestamp}
                      />
                    );
                  })}

                {activeOverlays.includes('dirtyDiapers') &&
                  dirtyDiaperChanges.map((change, idx) => {
                    const offsetMinutes = parseTimeToMinutes(change.time);
                    const { top } = positionFromOffsets(offsetMinutes);

                    return (
                      <DirtyDiaperIndicator
                        key={`dirty-${day.date}-${idx}`}
                        time={change.time}
                        date={day.date}
                        top={top}
                        formatTimestamp={formatTimestamp}
                      />
                    );
                  })}

                {activeOverlays.includes('comments') &&
                  day.comments.map((comment, idx) => {
                    const offsetMinutes = parseTimeToMinutes(comment.time);
                    const { top } = positionFromOffsets(offsetMinutes);

                    return (
                      <CommentIndicator
                        key={`comment-${day.date}-${idx}`}
                        comment={comment}
                        date={day.date}
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
