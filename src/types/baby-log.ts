export interface FeedingSession {
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  durationMinutes: number;
}

export interface NapSession {
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  durationMinutes: number;
}

export interface DaySummary {
  date: string; // YYYY-MM-DD format
  totalSleepTime: number; // minutes
  totalFeedingTime: number; // minutes
  wetDiaperChanges: number;
  dirtyDiaperChanges: number;
  totalNightSleepTime: number; // minutes (19:00-07:00)
  totalDaySleepTime: number; // minutes (07:00-19:00)
  napSessions: number;
  averageDaySleepDuration: number; // minutes per nap during day
  averageNightSleepDuration: number; // minutes per sleep segment during night
  feedingSessions: number;
  totalNightWakeUps: number; // wake-ups between 19:00-07:00
  feedings: FeedingSession[];
  naps: NapSession[];
  comments: string[]; // any comments or notes for the day
  weight?: number; // grams (if mentioned during the day)
}

export interface Settings {
  birthDate: string | null; // YYYY-MM-DD format
  nightStartHour: number; // 0-23
  nightEndHour: number; // 0-23
  dataEndpoint: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
  preset: 'week' | '2weeks' | 'month' | 'all' | 'custom';
}

export type OverlayType = 'naps' | 'feedings' | 'wetDiapers' | 'dirtyDiapers';
