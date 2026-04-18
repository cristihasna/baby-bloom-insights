import { addDays, differenceInMinutes, differenceInWeeks, format, parseISO } from 'date-fns';
import { DaySummary, OverlayType } from '@/types/baby-log';

export const HOUR_COLUMN_MIN_WIDTH = 48;
export const DAY_ROW_HEIGHT = 48;
export const DAY_LABEL_WIDTH = 72;
export const WEEK_LABEL_WIDTH = 48;
export const TOTAL_DAY_MINUTES = 24 * 60;
export const TIMELINE_HOURS = Array.from({ length: 24 }, (_, i) => i);
export const MOBILE_HOUR_MARKERS = [0, 6, 12, 18, 24];

export interface TimelineEventOffsets {
  startOffset: number;
  endOffset: number;
  shouldFadeStart: boolean;
  shouldFadeEnd: boolean;
  visibleStart: Date;
  visibleEnd: Date;
}

export interface TimelineWeekGroup {
  weekLabel: string | null;
  startIndex: number;
  count: number;
  days: DaySummary[];
}

export type MobileTimelineEventType = 'nap' | 'feeding' | 'wetDiaper' | 'dirtyDiaper' | 'comment';

export interface MobileTimelineEvent {
  id: string;
  type: MobileTimelineEventType;
  sortTime: number;
  title: string;
  timeLabel: string;
  details?: string;
  note?: string;
}

export function getDayBoundaries(date: string) {
  const dayStart = parseISO(`${date}T00:00:00`);
  const dayEnd = addDays(dayStart, 1);
  return { dayStart, dayEnd };
}

export function getEventOffsets(date: string, start: string, end: string): TimelineEventOffsets | null {
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
    visibleStart,
    visibleEnd,
  };
}

export function getOffsetWithinDay(date: string, timestamp: string) {
  const { dayStart, dayEnd } = getDayBoundaries(date);
  const time = parseISO(timestamp);
  if (time < dayStart || time >= dayEnd) return null;
  return differenceInMinutes(time, dayStart);
}

export function formatTimelineTimestamp(timestamp: string) {
  return format(parseISO(timestamp), 'MMM d, HH:mm');
}

export function formatClockTime(value: Date | string) {
  return format(typeof value === 'string' ? parseISO(value) : value, 'HH:mm');
}

export function formatDuration(durationMinutes: number) {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatHourLabel(hour: number) {
  return `${hour.toString().padStart(2, '0')}:00`;
}

export function preprocessTimelineData(data: DaySummary[]) {
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
    day.diaperChanges.sort((a, b) => a.time.localeCompare(b.time));
    day.comments.sort((a, b) => a.time.localeCompare(b.time));
  });

  return clonedData;
}

export function getWeekLabel(dateStr: string, birthDate: string | null) {
  if (!birthDate) return null;
  const weeks = differenceInWeeks(parseISO(dateStr), parseISO(birthDate));
  return weeks >= 0 ? `Week ${weeks + 1}` : null;
}

export function getWeekGroups(processedData: DaySummary[], birthDate: string | null): TimelineWeekGroup[] {
  const groups: TimelineWeekGroup[] = [];
  let currentGroup: TimelineWeekGroup | null = null;

  processedData.forEach((day, index) => {
    const weekLabel = getWeekLabel(day.date, birthDate);

    if (!currentGroup || currentGroup.weekLabel !== weekLabel) {
      currentGroup = { weekLabel, startIndex: index, count: 1, days: [day] };
      groups.push(currentGroup);
    } else {
      currentGroup.count += 1;
      currentGroup.days.push(day);
    }
  });

  return groups;
}

export function isNightHour(hour: number, nightStartHour: number, nightEndHour: number) {
  const normalized = hour % 24;
  if (nightStartHour > nightEndHour) {
    return normalized >= nightStartHour || normalized < nightEndHour;
  }
  return normalized >= nightStartHour && normalized < nightEndHour;
}

export function positionFromOffsets(startOffset: number, endOffset?: number) {
  const left = `${(startOffset / TOTAL_DAY_MINUTES) * 100}%`;
  const width = endOffset !== undefined ? `${((endOffset - startOffset) / TOTAL_DAY_MINUTES) * 100}%` : undefined;

  return { left, width };
}

function getContinuationNote(shouldFadeStart: boolean, shouldFadeEnd: boolean) {
  if (shouldFadeStart && shouldFadeEnd) return 'Continues outside this day';
  if (shouldFadeStart) return 'Started before midnight';
  if (shouldFadeEnd) return 'Continues after midnight';
  return undefined;
}

export function buildMobileTimelineEvents(day: DaySummary, activeOverlays: OverlayType[]): MobileTimelineEvent[] {
  const events: MobileTimelineEvent[] = [];

  if (activeOverlays.includes('naps')) {
    day.naps.forEach((nap, idx) => {
      const offsets = getEventOffsets(day.date, nap.start, nap.end);
      if (!offsets) return;

      events.push({
        id: `nap-${day.date}-${idx}`,
        type: 'nap',
        sortTime: offsets.visibleStart.getTime(),
        title: nap.isNightSleep ? 'Night sleep' : 'Day sleep',
        timeLabel: `${formatClockTime(offsets.visibleStart)}-${formatClockTime(offsets.visibleEnd)}`,
        details: formatDuration(offsets.endOffset - offsets.startOffset),
        note: getContinuationNote(offsets.shouldFadeStart, offsets.shouldFadeEnd),
      });
    });
  }

  if (activeOverlays.includes('feedings')) {
    day.feedings.forEach((feeding, idx) => {
      const offsets = getEventOffsets(day.date, feeding.start, feeding.end);
      if (!offsets) return;

      events.push({
        id: `feeding-${day.date}-${idx}`,
        type: 'feeding',
        sortTime: offsets.visibleStart.getTime(),
        title: 'Feeding',
        timeLabel: `${formatClockTime(offsets.visibleStart)}-${formatClockTime(offsets.visibleEnd)}`,
        details: formatDuration(offsets.endOffset - offsets.startOffset),
        note: getContinuationNote(offsets.shouldFadeStart, offsets.shouldFadeEnd),
      });
    });
  }

  if (activeOverlays.includes('wetDiapers')) {
    day.diaperChanges.forEach((change, idx) => {
      if (getOffsetWithinDay(day.date, change.time) === null) return;

      events.push({
        id: `wet-${day.date}-${idx}`,
        type: 'wetDiaper',
        sortTime: parseISO(change.time).getTime(),
        title: 'Wet diaper',
        timeLabel: formatClockTime(change.time),
        details: change.type === 'WET_AND_DIRTY' ? 'Mixed change' : undefined,
      });
    });
  }

  if (activeOverlays.includes('dirtyDiapers')) {
    day.diaperChanges.forEach((change, idx) => {
      if (getOffsetWithinDay(day.date, change.time) === null) return;

      events.push({
        id: `dirty-${day.date}-${idx}`,
        type: 'dirtyDiaper',
        sortTime: parseISO(change.time).getTime(),
        title: 'Dirty diaper',
        timeLabel: formatClockTime(change.time),
        details: change.type === 'WET_AND_DIRTY' ? 'Mixed change' : undefined,
      });
    });
  }

  if (activeOverlays.includes('comments')) {
    day.comments.forEach((comment, idx) => {
      if (getOffsetWithinDay(day.date, comment.time) === null) return;

      events.push({
        id: `comment-${day.date}-${idx}`,
        type: 'comment',
        sortTime: parseISO(comment.time).getTime(),
        title: 'Comment',
        timeLabel: formatClockTime(comment.time),
        details: comment.message,
      });
    });
  }

  return events.sort((a, b) => a.sortTime - b.sortTime || a.title.localeCompare(b.title));
}
