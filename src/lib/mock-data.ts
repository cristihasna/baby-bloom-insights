import { Comment, DaySummary, FeedingSession, NapSession } from '@/types/baby-log';
import {
  addDays,
  addMinutes,
  differenceInMinutes,
  differenceInWeeks,
  format,
  isSameDay,
  parseISO,
  startOfDay,
  subDays,
} from 'date-fns';

const DATE_TIME_FORMAT = "yyyy-MM-dd'T'HH:mm";

function formatLocalTimestamp(date: Date): string {
  return format(date, DATE_TIME_FORMAT);
}

function randomDateTime(baseDate: Date, startHour: number, endHour: number): Date {
  const hour = Math.floor(Math.random() * (endHour - startHour)) + startHour;
  const minute = Math.floor(Math.random() * 60);
  const value = new Date(baseDate);
  value.setHours(hour, minute, 0, 0);
  return value;
}

function addMinutesToTimestamp(timestamp: string, minutes: number): string {
  return formatLocalTimestamp(addMinutes(parseISO(timestamp), minutes));
}

function minutesBetween(start: string, end: string): number {
  return Math.max(0, differenceInMinutes(parseISO(end), parseISO(start)));
}

function crossesMidnight(start: string, end: string): boolean {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  const nextDay = addDays(startOfDay(startDate), 1);
  return endDate >= nextDay;
}

// Generate nap sessions for a day
function generateNaps(date: Date, ageWeeks: number): NapSession[] {
  const naps: NapSession[] = [];

  // Younger babies nap more frequently
  const napCount =
    ageWeeks < 8
      ? 4 + Math.floor(Math.random() * 2)
      : ageWeeks < 16
        ? 3 + Math.floor(Math.random() * 2)
        : 2 + Math.floor(Math.random() * 2);

  // Generate day naps (7:00 - 19:00)
  const dayNapStarts = [8, 11, 14, 17].slice(0, napCount);

  dayNapStarts.forEach((startHour) => {
    const duration = 30 + Math.floor(Math.random() * 90); // 30-120 min
    const startTime = formatLocalTimestamp(
      randomDateTime(date, startHour, startHour + 1)
    );
    naps.push({
      startTime,
      endTime: addMinutesToTimestamp(startTime, duration),
    });
  });

  // Generate night sleep segments starting on this date (19:00 - 23:59)
  const nightSegments =
    ageWeeks < 8
      ? 2 + Math.floor(Math.random() * 2)
      : ageWeeks < 16
        ? 1 + Math.floor(Math.random() * 2)
        : 1 + Math.floor(Math.random() * 1);

  let currentStart = new Date(date);
  currentStart.setHours(19, Math.floor(Math.random() * 30), 0, 0);

  for (let i = 0; i < nightSegments; i++) {
    if (!isSameDay(currentStart, date)) break;

    const sleepDuration =
      i === 0
        ? 120 + Math.floor(Math.random() * 120) // First stretch longer
        : 60 + Math.floor(Math.random() * 180);

    const startTime = formatLocalTimestamp(currentStart);
    naps.push({
      startTime,
      endTime: addMinutesToTimestamp(startTime, sleepDuration),
    });

    const wakeMinutes = 30 + Math.floor(Math.random() * 60);
    currentStart = addMinutes(currentStart, sleepDuration + wakeMinutes);
  }

  if (!naps.some((nap) => crossesMidnight(nap.startTime, nap.endTime))) {
    const duration = 90 + Math.floor(Math.random() * 60); // 90-150 min
    const startTime = formatLocalTimestamp(randomDateTime(date, 22, 24));
    naps.push({
      startTime,
      endTime: addMinutesToTimestamp(startTime, duration),
    });
  }

  return naps.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

// Generate feeding sessions for a day
function generateFeedings(date: Date, ageWeeks: number): FeedingSession[] {
  const feedings: FeedingSession[] = [];

  // Younger babies feed more frequently
  const feedingCount =
    ageWeeks < 4
      ? 10 + Math.floor(Math.random() * 3)
      : ageWeeks < 12
        ? 8 + Math.floor(Math.random() * 3)
        : 6 + Math.floor(Math.random() * 3);

  const intervalHours = 24 / feedingCount;
  let currentHour = 6;

  for (let i = 0; i < feedingCount; i++) {
    const startHour = Math.floor(currentHour) % 24;
    const duration = 15 + Math.floor(Math.random() * 30); // 15-45 min
    const startTime = formatLocalTimestamp(
      randomDateTime(date, startHour, startHour + 1)
    );

    feedings.push({
      startTime,
      endTime: addMinutesToTimestamp(startTime, duration),
    });

    currentHour += intervalHours + (Math.random() - 0.5);
  }

  if (
    !feedings.some((feeding) =>
      crossesMidnight(feeding.startTime, feeding.endTime)
    ) &&
    Math.random() > 0.65
  ) {
    const duration = 20 + Math.floor(Math.random() * 25); // 20-45 min
    const startTime = formatLocalTimestamp(randomDateTime(date, 23, 24));
    feedings.push({
      startTime,
      endTime: addMinutesToTimestamp(startTime, duration),
    });
  }

  return feedings.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

const COMMENT_TEMPLATES = [
  'Calm during tummy time.',
  'Extra cuddly this morning.',
  'Fussy before the nap.',
  'Great burp after feeding.',
  'Smiled at the mobile.',
  'Short walk outside.',
];

function generateComments(date: Date): Comment[] {
  const chance = Math.random();
  const count = chance > 0.7 ? 1 + Math.floor(Math.random() * 2) : 0;
  const comments: Comment[] = [];

  for (let i = 0; i < count; i++) {
    const time = formatLocalTimestamp(randomDateTime(date, 7, 21));
    const text = COMMENT_TEMPLATES[Math.floor(Math.random() * COMMENT_TEMPLATES.length)];
    comments.push({ time, text });
  }

  return comments.sort((a, b) => a.time.localeCompare(b.time));
}

function generateDiapers(date: Date): { wet: string[]; dirty: string[] } {
  const wetCount = 6 + Math.floor(Math.random() * 5);
  const dirtyCount = 2 + Math.floor(Math.random() * 4);
  const wet: string[] = [];
  const dirty: string[] = [];

  for (let i = 0; i < wetCount; i++) {
    wet.push(formatLocalTimestamp(randomDateTime(date, 6, 20)));
  }

  for (let i = 0; i < dirtyCount; i++) {
    dirty.push(formatLocalTimestamp(randomDateTime(date, 7, 19)));
  }

  wet.sort();
  dirty.sort();

  return { wet, dirty };
}

// Calculate if a session is during night time
function isNightTime(startTime: string, nightStart: number, nightEnd: number): boolean {
  const hour = parseISO(startTime).getHours();
  if (nightStart > nightEnd) {
    return hour >= nightStart || hour < nightEnd;
  }
  return hour >= nightStart && hour < nightEnd;
}

// Generate a single day's data
function generateDaySummary(
  date: Date,
  birthDate: Date,
  nightStart: number = 19,
  nightEnd: number = 7
): DaySummary {
  const ageWeeks = Math.max(0, differenceInWeeks(date, birthDate));

  const naps = generateNaps(date, ageWeeks);
  const feedings = generateFeedings(date, ageWeeks);
  const diapers = generateDiapers(date);

  // Calculate totals
  const dayNaps = naps.filter((n) => !isNightTime(n.startTime, nightStart, nightEnd));
  const nightNaps = naps.filter((n) => isNightTime(n.startTime, nightStart, nightEnd));

  const totalDaySleepTime = dayNaps.reduce(
    (sum, n) => sum + minutesBetween(n.startTime, n.endTime),
    0
  );
  const totalNightSleepTime = nightNaps.reduce(
    (sum, n) => sum + minutesBetween(n.startTime, n.endTime),
    0
  );

  const totalFeedingTime = feedings.reduce(
    (sum, f) => sum + minutesBetween(f.startTime, f.endTime),
    0
  );

  // Generate weight (slowly increasing over time)
  const baseWeight = 3500; // grams at birth
  const weightGain = ageWeeks * 200 + Math.floor(Math.random() * 100); // ~200g per week
  const hasWeight = Math.random() > 0.7; // 30% chance of weight measurement

  return {
    date: format(date, 'yyyy-MM-dd'),
    totalSleepTime: totalDaySleepTime + totalNightSleepTime,
    totalFeedingTime,
    wetDiapers: diapers.wet,
    dirtyDiapers: diapers.dirty,
    totalNightSleepTime,
    totalDaySleepTime,
    napSessions: dayNaps.length,
    averageDaySleepDuration:
      dayNaps.length > 0 ? Math.round(totalDaySleepTime / dayNaps.length) : 0,
    averageNightSleepDuration:
      nightNaps.length > 0 ? Math.round(totalNightSleepTime / nightNaps.length) : 0,
    feedingSessions: feedings.length,
    totalNightWakeUps: Math.max(0, nightNaps.length - 1),
    feedings,
    naps,
    comments: generateComments(date),
    weight: hasWeight ? baseWeight + weightGain : undefined,
  };
}

// Generate mock data for a date range
export function generateMockData(
  startDate: Date,
  endDate: Date,
  birthDate: Date,
  nightStart: number = 19,
  nightEnd: number = 7
): DaySummary[] {
  const data: DaySummary[] = [];
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  for (let i = 0; i <= daysDiff; i++) {
    const date = subDays(endDate, daysDiff - i);
    if (date >= birthDate) {
      data.push(generateDaySummary(date, birthDate, nightStart, nightEnd));
    }
  }

  return data;
}

// Get default mock data (last 30 days)
export function getDefaultMockData(birthDate: Date): DaySummary[] {
  const endDate = new Date();
  const startDate = subDays(endDate, 30);
  return generateMockData(startDate, endDate, birthDate);
}
