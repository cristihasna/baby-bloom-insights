import { useMemo } from 'react';
import { format, differenceInWeeks, parseISO } from 'date-fns';
import { DaySummary, OverlayType } from '@/types/baby-log';
import { timeToMinutes } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Droplets, CircleDot } from 'lucide-react';

interface DailyTimelineProps {
  data: DaySummary[];
  birthDate: string | null;
  nightStartHour: number;
  nightEndHour: number;
  activeOverlays: OverlayType[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 24; // pixels per hour

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

  const isNightHour = (hour: number) => {
    if (nightStartHour > nightEndHour) {
      return hour >= nightStartHour || hour < nightEndHour;
    }
    return hour >= nightStartHour && hour < nightEndHour;
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
            {HOURS.map((hour) => (
              <div
                key={hour}
                className={cn(
                  'h-6 flex items-center justify-end pr-2 text-xs text-muted-foreground',
                  isNightHour(hour) && 'bg-baby-night/30'
                )}
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {data.map((day) => (
            <div
              key={day.date}
              className="flex-1 min-w-[80px] relative border-l border-border"
            >
              {/* Hour cells with night highlighting */}
              {HOURS.map((hour) => (
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
                day.naps.map((nap, idx) => {
                  const startMinutes = timeToMinutes(nap.startTime);
                  const top = (startMinutes / 60) * HOUR_HEIGHT;
                  const height = (nap.durationMinutes / 60) * HOUR_HEIGHT;

                  return (
                    <div
                      key={`nap-${idx}`}
                      className="absolute left-1 right-1 bg-baby-sleep/80 rounded-md border border-baby-sleep-foreground/20"
                      style={{
                        top: `${top}px`,
                        height: `${Math.max(height, 4)}px`,
                      }}
                      title={`Sleep: ${nap.startTime} - ${nap.endTime}`}
                    />
                  );
                })}

              {/* Feeding sessions */}
              {activeOverlays.includes('feedings') &&
                day.feedings.map((feeding, idx) => {
                  const startMinutes = timeToMinutes(feeding.startTime);
                  const top = (startMinutes / 60) * HOUR_HEIGHT;
                  const height = (feeding.durationMinutes / 60) * HOUR_HEIGHT;

                  return (
                    <div
                      key={`feeding-${idx}`}
                      className="absolute left-2 right-2 bg-baby-feeding/80 rounded-sm border border-baby-feeding-foreground/20"
                      style={{
                        top: `${top}px`,
                        height: `${Math.max(height, 3)}px`,
                      }}
                      title={`Feeding: ${feeding.startTime} - ${feeding.endTime}`}
                    />
                  );
                })}

              {/* Diaper markers - distributed throughout the day */}
              {activeOverlays.includes('wetDiapers') &&
                Array.from({ length: day.wetDiaperChanges }).map((_, idx) => {
                  const hour = 6 + Math.floor((idx * 14) / day.wetDiaperChanges);
                  const top = hour * HOUR_HEIGHT + 4;

                  return (
                    <div
                      key={`wet-${idx}`}
                      className="absolute left-0.5 text-baby-wet"
                      style={{ top: `${top}px` }}
                      title="Wet diaper"
                    >
                      <Droplets className="h-3 w-3" />
                    </div>
                  );
                })}

              {activeOverlays.includes('dirtyDiapers') &&
                Array.from({ length: day.dirtyDiaperChanges }).map((_, idx) => {
                  const hour = 7 + Math.floor((idx * 12) / Math.max(day.dirtyDiaperChanges, 1));
                  const top = hour * HOUR_HEIGHT + 12;

                  return (
                    <div
                      key={`dirty-${idx}`}
                      className="absolute right-0.5 text-baby-dirty"
                      style={{ top: `${top}px` }}
                      title="Dirty diaper"
                    >
                      <CircleDot className="h-3 w-3" />
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
