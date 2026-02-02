import { DaySummary, FeedingSession, NapSession } from '@/types/baby-log';
import { format, subDays, differenceInWeeks } from 'date-fns';

// Helper to generate random time in HH:MM format
function randomTime(startHour: number, endHour: number): string {
  const hour = Math.floor(Math.random() * (endHour - startHour)) + startHour;
  const minute = Math.floor(Math.random() * 60);
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

// Helper to add minutes to a time string
function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newHour = Math.floor(totalMinutes / 60) % 24;
  const newMinute = totalMinutes % 60;
  return `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
}

// Parse time to minutes from midnight
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// Generate nap sessions for a day
function generateNaps(ageWeeks: number): NapSession[] {
  const naps: NapSession[] = [];
  
  // Younger babies nap more frequently
  const napCount = ageWeeks < 8 ? 4 + Math.floor(Math.random() * 2) : 
                   ageWeeks < 16 ? 3 + Math.floor(Math.random() * 2) : 
                   2 + Math.floor(Math.random() * 2);
  
  // Generate day naps (7:00 - 19:00)
  const dayNapStarts = [8, 11, 14, 17].slice(0, napCount);
  
  dayNapStarts.forEach((startHour) => {
    const duration = 30 + Math.floor(Math.random() * 90); // 30-120 min
    const startTime = `${startHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 30).toString().padStart(2, '0')}`;
    naps.push({
      startTime,
      endTime: addMinutesToTime(startTime, duration),
      durationMinutes: duration,
    });
  });
  
  // Generate night sleep segments (19:00 - 07:00)
  const nightWakeUps = ageWeeks < 8 ? 3 + Math.floor(Math.random() * 2) :
                       ageWeeks < 16 ? 2 + Math.floor(Math.random() * 2) :
                       1 + Math.floor(Math.random() * 2);
  
  let currentTime = 19;
  for (let i = 0; i <= nightWakeUps; i++) {
    const sleepDuration = i === 0 ? 120 + Math.floor(Math.random() * 120) : // First stretch longer
                          60 + Math.floor(Math.random() * 180);
    
    const startHour = currentTime % 24;
    const startTime = `${startHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 30).toString().padStart(2, '0')}`;
    const endTime = addMinutesToTime(startTime, sleepDuration);
    
    naps.push({
      startTime,
      endTime,
      durationMinutes: sleepDuration,
    });
    
    currentTime = (currentTime + Math.floor(sleepDuration / 60) + 1) % 24;
    if (currentTime >= 7 && currentTime < 19) break;
  }
  
  return naps;
}

// Generate feeding sessions for a day
function generateFeedings(ageWeeks: number): FeedingSession[] {
  const feedings: FeedingSession[] = [];
  
  // Younger babies feed more frequently
  const feedingCount = ageWeeks < 4 ? 10 + Math.floor(Math.random() * 3) :
                       ageWeeks < 12 ? 8 + Math.floor(Math.random() * 3) :
                       6 + Math.floor(Math.random() * 3);
  
  const intervalHours = 24 / feedingCount;
  let currentHour = 6;
  
  for (let i = 0; i < feedingCount; i++) {
    const startHour = Math.floor(currentHour) % 24;
    const duration = 15 + Math.floor(Math.random() * 30); // 15-45 min
    const startTime = `${startHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 30).toString().padStart(2, '0')}`;
    
    feedings.push({
      startTime,
      endTime: addMinutesToTime(startTime, duration),
      durationMinutes: duration,
    });
    
    currentHour += intervalHours + (Math.random() - 0.5);
  }
  
  return feedings;
}

// Calculate if a session is during night time
function isNightTime(startTime: string, nightStart: number, nightEnd: number): boolean {
  const hour = parseInt(startTime.split(':')[0]);
  if (nightStart > nightEnd) {
    return hour >= nightStart || hour < nightEnd;
  }
  return hour >= nightStart && hour < nightEnd;
}

// Generate a single day's data
function generateDaySummary(date: Date, birthDate: Date, nightStart: number = 19, nightEnd: number = 7): DaySummary {
  const ageWeeks = Math.max(0, differenceInWeeks(date, birthDate));
  
  const naps = generateNaps(ageWeeks);
  const feedings = generateFeedings(ageWeeks);
  
  // Calculate totals
  const dayNaps = naps.filter(n => !isNightTime(n.startTime, nightStart, nightEnd));
  const nightNaps = naps.filter(n => isNightTime(n.startTime, nightStart, nightEnd));
  
  const totalDaySleepTime = dayNaps.reduce((sum, n) => sum + n.durationMinutes, 0);
  const totalNightSleepTime = nightNaps.reduce((sum, n) => sum + n.durationMinutes, 0);
  
  // Generate weight (slowly increasing over time)
  const baseWeight = 3500; // grams at birth
  const weightGain = ageWeeks * 200 + Math.floor(Math.random() * 100); // ~200g per week
  const hasWeight = Math.random() > 0.7; // 30% chance of weight measurement
  
  return {
    date: format(date, 'yyyy-MM-dd'),
    totalSleepTime: totalDaySleepTime + totalNightSleepTime,
    totalFeedingTime: feedings.reduce((sum, f) => sum + f.durationMinutes, 0),
    wetDiaperChanges: 6 + Math.floor(Math.random() * 5),
    dirtyDiaperChanges: 2 + Math.floor(Math.random() * 4),
    totalNightSleepTime,
    totalDaySleepTime,
    napSessions: dayNaps.length,
    averageDaySleepDuration: dayNaps.length > 0 ? Math.round(totalDaySleepTime / dayNaps.length) : 0,
    averageNightSleepDuration: nightNaps.length > 0 ? Math.round(totalNightSleepTime / nightNaps.length) : 0,
    feedingSessions: feedings.length,
    totalNightWakeUps: Math.max(0, nightNaps.length - 1),
    feedings,
    naps,
    comments: Math.random() > 0.8 ? ['Had a great day!', 'A bit fussy in the afternoon'][Math.floor(Math.random() * 2)] ? ['Had a great day!'] : [] : [],
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
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
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
