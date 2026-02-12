import {
  Comment,
  DaySummary,
  DiaperChange,
  DiaperChangeType,
  FeedingSession,
  NapSession,
} from '@/types/baby-log';
import { addDays, differenceInWeeks, format, subDays } from 'date-fns';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function minutesToClock(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hh = Math.floor(normalized / 60);
  const mm = normalized % 60;
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
}

function durationBetween(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const start = startHour * 60 + startMinute;
  let end = endHour * 60 + endMinute;
  if (end <= start) end += 1440;
  return end - start;
}

function isNightMinute(minute: number, nightStart: number, nightEnd: number): boolean {
  const hour = Math.floor((((minute % 1440) + 1440) % 1440) / 60);
  if (nightStart > nightEnd) {
    return hour >= nightStart || hour < nightEnd;
  }
  return hour >= nightStart && hour < nightEnd;
}

function generateNaps(
  ageWeeks: number,
  nightStart: number,
  nightEnd: number
): NapSession[] {
  const napCount =
    ageWeeks < 8
      ? randomInt(4, 5)
      : ageWeeks < 16
        ? randomInt(3, 4)
        : randomInt(2, 3);

  const starts = [8 * 60, 11 * 60, 14 * 60, 17 * 60].slice(0, napCount);
  const naps: NapSession[] = starts.map((baseStart, idx) => {
    const startMinute = baseStart + randomInt(0, 30);
    const durationMinutes = randomInt(30, 120);
    const endMinute = startMinute + durationMinutes;
    const startTime = minutesToClock(startMinute);
    const endTime = minutesToClock(endMinute);
    const isNightSleep = isNightMinute(startMinute, nightStart, nightEnd);

    return {
      startTime,
      endTime,
      durationMinutes,
      isNightSleep,
      rawMessages: [`Nap started (${idx + 1})`, `Nap ended (${idx + 1})`],
    };
  });

  // Add one night sleep segment that may cross midnight.
  const nightStartMinute = 21 * 60 + randomInt(0, 90);
  const nightDuration = randomInt(120, 240);
  const nightEndMinute = nightStartMinute + nightDuration;
  naps.push({
    startTime: minutesToClock(nightStartMinute),
    endTime: minutesToClock(nightEndMinute),
    durationMinutes: nightDuration,
    isNightSleep: true,
    rawMessages: ['Night sleep started', 'Night sleep ended'],
  });

  return naps.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

function generateFeedings(ageWeeks: number): FeedingSession[] {
  const feedingCount =
    ageWeeks < 4
      ? randomInt(9, 11)
      : ageWeeks < 12
        ? randomInt(7, 9)
        : randomInt(6, 8);

  const interval = Math.floor(24 * 60 / feedingCount);
  let cursor = 6 * 60 + randomInt(0, 30);

  const feedings: FeedingSession[] = [];
  for (let i = 0; i < feedingCount; i++) {
    const startMinute = cursor + randomInt(-20, 20);
    const durationMinutes = randomInt(15, 45);
    const endMinute = startMinute + durationMinutes;

    feedings.push({
      startTime: minutesToClock(startMinute),
      endTime: minutesToClock(endMinute),
      durationMinutes,
      rawMessages: [`Feeding started (${i + 1})`, `Feeding stopped (${i + 1})`],
    });

    cursor += interval;
  }

  return feedings.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

function generateDiaperChanges(): DiaperChange[] {
  const count = randomInt(8, 13);
  const types: DiaperChangeType[] = ['WET', 'DIRTY', 'WET_AND_DIRTY'];
  const changes: DiaperChange[] = [];

  for (let i = 0; i < count; i++) {
    const minute = randomInt(6 * 60, 22 * 60 + 30);
    const type =
      Math.random() < 0.55 ? types[0] : Math.random() < 0.85 ? types[1] : types[2];
    changes.push({
      time: minutesToClock(minute),
      type,
      rawMessage: `Diaper changed (${type})`,
    });
  }

  return changes.sort((a, b) => a.time.localeCompare(b.time));
}

const COMMENT_TEMPLATES = [
  'Calm during tummy time.',
  'Extra cuddly this morning.',
  'Fussy before the nap.',
  'Great burp after feeding.',
  'Smiled at the mobile.',
  'Short walk outside.',
];

function generateComments(): Comment[] {
  const count = Math.random() > 0.7 ? randomInt(1, 2) : 0;
  const comments: Comment[] = [];

  for (let i = 0; i < count; i++) {
    comments.push({
      time: minutesToClock(randomInt(7 * 60, 21 * 60)),
      message: COMMENT_TEMPLATES[randomInt(0, COMMENT_TEMPLATES.length - 1)],
    });
  }

  return comments.sort((a, b) => a.time.localeCompare(b.time));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function averageGapBetweenSessions(
  sessions: { startTime: string; endTime: string; isNightSleep?: boolean }[],
  mode: 'all' | 'day' | 'night'
): number {
  if (sessions.length < 2) return 0;

  const sorted = [...sessions].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const gaps: number[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const previous = sorted[i - 1];
    const current = sorted[i];

    let prevEnd = timeToMinutes(previous.endTime);
    const currStart = timeToMinutes(current.startTime);
    if (prevEnd > currStart) prevEnd -= 1440;
    const gap = Math.max(0, currStart - prevEnd);

    if (mode === 'all') {
      gaps.push(gap);
      continue;
    }

    const isNightGap = Boolean(previous.isNightSleep);
    if (mode === 'night' && isNightGap) gaps.push(gap);
    if (mode === 'day' && !isNightGap) gaps.push(gap);
  }

  return average(gaps);
}

function generateDaySummary(
  date: Date,
  birthDate: Date,
  nightStartHour = 19,
  nightEndHour = 7
): DaySummary {
  const ageWeeks = Math.max(0, differenceInWeeks(date, birthDate));
  const naps = generateNaps(ageWeeks, nightStartHour, nightEndHour);
  const feedings = generateFeedings(ageWeeks);
  const diaperChanges = generateDiaperChanges();
  const comments = generateComments();

  const dayNaps = naps.filter((nap) => !nap.isNightSleep);
  const nightNaps = naps.filter((nap) => nap.isNightSleep);
  const totalDaySleepTime = dayNaps.reduce((sum, nap) => sum + nap.durationMinutes, 0);
  const totalNightSleepTime = nightNaps.reduce(
    (sum, nap) => sum + nap.durationMinutes,
    0
  );
  const totalFeedingTime = feedings.reduce(
    (sum, feeding) => sum + feeding.durationMinutes,
    0
  );

  const wetDiaperChanges = diaperChanges.filter((change) => change.type === 'WET').length;
  const dirtyDiaperChanges = diaperChanges.filter(
    (change) => change.type === 'DIRTY'
  ).length;
  const mixedDiaperChanges = diaperChanges.filter(
    (change) => change.type === 'WET_AND_DIRTY'
  ).length;

  const hasWeight = Math.random() > 0.7;
  const baseWeight = 3500;
  const weightGain = ageWeeks * 200 + randomInt(0, 100);

  return {
    date: format(date, 'yyyy-MM-dd'),
    totalSleepTime: totalDaySleepTime + totalNightSleepTime,
    totalFeedingTime,
    wetDiaperChanges,
    dirtyDiaperChanges,
    mixedDiaperChanges,
    totalDiaperChanges: diaperChanges.length,
    totalNightSleepTime,
    totalDaySleepTime,
    napSessions: naps.length,
    averageDaySleepDuration: average(dayNaps.map((nap) => nap.durationMinutes)),
    averageDayWakeDuration: averageGapBetweenSessions(naps, 'day'),
    averageNightWakeDuration: averageGapBetweenSessions(naps, 'night'),
    averageNightSleepDuration: average(nightNaps.map((nap) => nap.durationMinutes)),
    averageInBetweenFeedsDuration: averageGapBetweenSessions(feedings, 'all'),
    feedingSessions: feedings.length,
    totalNightWakeUps: Math.max(0, nightNaps.length - 1),
    feedings,
    naps,
    comments,
    diaperChanges,
    weight: hasWeight ? baseWeight + weightGain : undefined,
  };
}

export function generateMockData(
  startDate: Date,
  endDate: Date,
  birthDate: Date,
  nightStart = 19,
  nightEnd = 7
): DaySummary[] {
  const data: DaySummary[] = [];

  for (
    let current = new Date(startDate);
    current <= endDate;
    current = addDays(current, 1)
  ) {
    if (current >= birthDate) {
      data.push(generateDaySummary(current, birthDate, nightStart, nightEnd));
    }
  }

  return data;
}

export function getDefaultMockData(birthDate: Date): DaySummary[] {
  const endDate = new Date();
  const startDate = subDays(endDate, 30);
  return generateMockData(startDate, endDate, birthDate);
}
