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

const HOUR_COLUMN_MIN_WIDTH = 48; // minimum pixels per hour column
const DAY_ROW_HEIGHT = 48; // pixels per day row
const DAY_LABEL_WIDTH = 72; // pixels for the sticky day label column
const WEEK_LABEL_WIDTH = 48; // pixels for the sticky week label column
const TOTAL_DAY_MINUTES = 24 * 60;

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
    shouldFadeStart: startDate < dayStart,
    shouldFadeEnd: endDate > dayEnd,
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
    const groups: { weekLabel: string | null; startIndex: number; count: number; days: DaySummary[] }[] = [];
    let currentGroup: { weekLabel: string | null; startIndex: number; count: number; days: DaySummary[] } | null = null;

    processedData.forEach((day, index) => {
      const weekLabel = birthDate ? getWeekLabel(day.date) : null;

      if (!currentGroup || currentGroup.weekLabel !== weekLabel) {
        currentGroup = { weekLabel, startIndex: index, count: 1, days: [day] };
        groups.push(currentGroup);
      } else {
        currentGroup.count++;
        currentGroup.days.push(day);
      }
    });

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
    const left = `${(startOffset / TOTAL_DAY_MINUTES) * 100}%`;
    const width = endOffset !== undefined ? `${((endOffset - startOffset) / TOTAL_DAY_MINUTES) * 100}%` : undefined;

    return { left, width };
  };

  const showNightIndication = activeOverlays.includes('nightIndicator');
  const hourColumnPercent = 100 / hours.length;
  const timelineMinWidth = hours.length * HOUR_COLUMN_MIN_WIDTH;

  return (
    <div className="max-h-[36rem] overflow-auto">
      <div className="min-w-max">
        <div className="sticky top-0 z-30 flex border-b border-border bg-background">
          <div
            className="sticky left-0 z-40 shrink-0 border-r border-border bg-background"
            style={{ width: `${DAY_LABEL_WIDTH}px`, minWidth: `${DAY_LABEL_WIDTH}px` }}
          />
          <div className="flex flex-1 min-w-0" style={{ minWidth: `${timelineMinWidth}px` }}>
            {hours.map((hour) => (
              <div
                key={hour}
                className={cn(
                  'flex h-12 items-center justify-center border-l border-border text-xs text-muted-foreground',
                  showNightIndication && isNightHour(hour) && 'bg-baby-night/30',
                )}
                style={{ width: `${hourColumnPercent}%`, minWidth: `${HOUR_COLUMN_MIN_WIDTH}px` }}
              >
                {`${(hour % 24).toString().padStart(2, '0')}:00`}
              </div>
            ))}
          </div>
          <div
            className="sticky right-0 z-40 shrink-0 border-l border-border bg-background"
            style={{ width: `${WEEK_LABEL_WIDTH}px`, minWidth: `${WEEK_LABEL_WIDTH}px` }}
          />
        </div>

        <div>
          {weekGroups.map((group) => {
            return (
              <div key={`${group.weekLabel ?? 'no-week'}-${group.startIndex}`} className="flex border-b border-border">
                <div className="flex-1 min-w-0">
                  {group.days.map((day, dayIndex) => {
                    const wetDiaperChanges = day.diaperChanges.filter(
                      (change) => change.type === 'WET' || change.type === 'WET_AND_DIRTY',
                    );
                    const dirtyDiaperChanges = day.diaperChanges.filter(
                      (change) => change.type === 'DIRTY' || change.type === 'WET_AND_DIRTY',
                    );

                    return (
                      <div
                        key={day.date}
                        className={cn('flex min-w-0', dayIndex < group.days.length - 1 && 'border-b border-border')}
                      >
                        <div
                          className="sticky left-0 z-10 flex shrink-0 flex-col justify-center border-r border-border bg-background px-3"
                          style={{
                            width: `${DAY_LABEL_WIDTH}px`,
                            minWidth: `${DAY_LABEL_WIDTH}px`,
                            height: `${DAY_ROW_HEIGHT}px`,
                          }}
                        >
                          <div className="text-sm font-medium">{format(parseISO(day.date), 'EEE')}</div>
                          <div className="text-xs text-muted-foreground">{format(parseISO(day.date), 'MMM d')}</div>
                        </div>

                        <div
                          className="relative flex-1"
                          style={{ minWidth: `${timelineMinWidth}px`, height: `${DAY_ROW_HEIGHT}px` }}
                        >
                          {hours.map((hour) => (
                            <div
                              key={hour}
                              className={cn(
                                'absolute top-0 bottom-0 border-l border-border/50',
                                showNightIndication && isNightHour(hour) && 'bg-baby-night/30',
                              )}
                              style={{
                                left: `${hour * hourColumnPercent}%`,
                                width: `${hourColumnPercent}%`,
                              }}
                            />
                          ))}

                          {activeOverlays.includes('naps') &&
                            day.naps.map((nap, idx) => {
                              const offsets = getEventOffsets(day.date, nap.start, nap.end);
                              if (!offsets) return null;
                              const { startOffset, endOffset, shouldFadeStart, shouldFadeEnd } = offsets;
                              const { left, width } = positionFromOffsets(startOffset, endOffset);

                              return (
                                <NapBar
                                  key={`nap-${day.date}-${idx}`}
                                  nightIndicator={showNightIndication}
                                  nap={nap}
                                  left={left}
                                  width={width ?? '0%'}
                                  shouldFadeEnd={shouldFadeEnd}
                                  shouldFadeStart={shouldFadeStart}
                                  formatTimestamp={formatTimestamp}
                                />
                              );
                            })}

                          {activeOverlays.includes('feedings') &&
                            day.feedings.map((feeding, idx) => {
                              const offsets = getEventOffsets(day.date, feeding.start, feeding.end);
                              if (!offsets) return null;
                              const { startOffset, endOffset, shouldFadeStart, shouldFadeEnd } = offsets;
                              const { left, width } = positionFromOffsets(startOffset, endOffset);

                              return (
                                <FeedingBar
                                  key={`feeding-${day.date}-${idx}`}
                                  feeding={feeding}
                                  left={left}
                                  width={width ?? '0%'}
                                  shouldFadeEnd={shouldFadeEnd}
                                  shouldFadeStart={shouldFadeStart}
                                  formatTimestamp={formatTimestamp}
                                />
                              );
                            })}

                          {activeOverlays.includes('wetDiapers') &&
                            wetDiaperChanges.map((change, idx) => {
                              const offsetMinutes = getOffsetWithinDay(day.date, change.time);
                              if (offsetMinutes === null) return null;
                              const { left } = positionFromOffsets(offsetMinutes);

                              return (
                                <WetDiaperIndicator
                                  key={`wet-${day.date}-${idx}`}
                                  time={change.time}
                                  left={left}
                                  formatTimestamp={formatTimestamp}
                                />
                              );
                            })}

                          {activeOverlays.includes('dirtyDiapers') &&
                            dirtyDiaperChanges.map((change, idx) => {
                              const offsetMinutes = getOffsetWithinDay(day.date, change.time);
                              if (offsetMinutes === null) return null;
                              const { left } = positionFromOffsets(offsetMinutes);

                              return (
                                <DirtyDiaperIndicator
                                  key={`dirty-${day.date}-${idx}`}
                                  time={change.time}
                                  left={left}
                                  formatTimestamp={formatTimestamp}
                                />
                              );
                            })}

                          {activeOverlays.includes('comments') &&
                            day.comments.map((comment, idx) => {
                              const offsetMinutes = getOffsetWithinDay(day.date, comment.time);
                              if (offsetMinutes === null) return null;
                              const { left } = positionFromOffsets(offsetMinutes);

                              return (
                                <CommentIndicator
                                  key={`comment-${day.date}-${idx}`}
                                  comment={comment}
                                  left={left}
                                  formatTimestamp={formatTimestamp}
                                />
                              );
                            })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div
                  className={cn(
                    'sticky right-0 z-20 flex shrink-0 items-center justify-center border-l border-border bg-background',
                    group.weekLabel && 'bg-primary/10',
                  )}
                  style={{ width: `${WEEK_LABEL_WIDTH}px`, minWidth: `${WEEK_LABEL_WIDTH}px` }}
                >
                  {group.weekLabel ? (
                    <div className="[writing-mode:vertical-rl] rotate-180 text-xs font-medium uppercase tracking-[0.2em] text-primary">
                      {group.weekLabel}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
