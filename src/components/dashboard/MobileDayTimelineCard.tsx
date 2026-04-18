import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Baby, ChevronDown, CircleDot, Droplets, MessageCircle, Moon } from 'lucide-react';
import { DaySummary, OverlayType } from '@/types/baby-log';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { CommentIndicator } from './timeline/CommentIndicator';
import { DirtyDiaperIndicator } from './timeline/DirtyDiaperIndicator';
import { FeedingBar } from './timeline/FeedingBar';
import { NapBar } from './timeline/NapBar';
import { WetDiaperIndicator } from './timeline/WetDiaperIndicator';
import {
  MOBILE_HOUR_MARKERS,
  MobileTimelineEventType,
  TIMELINE_HOURS,
  buildMobileTimelineEvents,
  formatDuration,
  formatHourLabel,
  formatTimelineTimestamp,
  getEventOffsets,
  getOffsetWithinDay,
  isNightHour,
  positionFromOffsets,
} from './timeline/timeline-utils';

interface MobileDayTimelineCardProps {
  day: DaySummary;
  weekLabel?: string | null;
  nightStartHour: number;
  nightEndHour: number;
  activeOverlays: OverlayType[];
}

function getEventAccentClasses(type: MobileTimelineEventType) {
  switch (type) {
    case 'nap':
      return {
        container: 'border-baby-sleep/20 bg-baby-sleep/10',
        icon: 'text-baby-sleep-foreground bg-baby-sleep/80',
      };
    case 'feeding':
      return {
        container: 'border-baby-feeding/20 bg-baby-feeding/10',
        icon: 'text-baby-feeding-foreground bg-baby-feeding/80',
      };
    case 'wetDiaper':
      return {
        container: 'border-baby-wet/20 bg-baby-wet/10',
        icon: 'text-baby-wet-foreground bg-baby-wet/80',
      };
    case 'dirtyDiaper':
      return {
        container: 'border-baby-dirty/20 bg-baby-dirty/10',
        icon: 'text-baby-dirty-foreground bg-baby-dirty/80',
      };
    case 'comment':
      return {
        container: 'border-baby-mint/20 bg-baby-mint/10',
        icon: 'text-baby-mint-foreground bg-baby-mint/80',
      };
  }
}

function EventIcon({ type }: { type: MobileTimelineEventType }) {
  switch (type) {
    case 'nap':
      return <Moon className="h-3.5 w-3.5" />;
    case 'feeding':
      return <Baby className="h-3.5 w-3.5" />;
    case 'wetDiaper':
      return <Droplets className="h-3.5 w-3.5" />;
    case 'dirtyDiaper':
      return <CircleDot className="h-3.5 w-3.5" />;
    case 'comment':
      return <MessageCircle className="h-3.5 w-3.5" />;
  }
}

export function MobileDayTimelineCard({
  day,
  weekLabel,
  nightStartHour,
  nightEndHour,
  activeOverlays,
}: MobileDayTimelineCardProps) {
  const showNightIndication = activeOverlays.includes('nightIndicator');
  const hourColumnPercent = 100 / TIMELINE_HOURS.length;

  const wetDiaperChanges = useMemo(
    () => day.diaperChanges.filter((change) => change.type === 'WET' || change.type === 'WET_AND_DIRTY'),
    [day.diaperChanges],
  );
  const dirtyDiaperChanges = useMemo(
    () => day.diaperChanges.filter((change) => change.type === 'DIRTY' || change.type === 'WET_AND_DIRTY'),
    [day.diaperChanges],
  );
  const mobileEvents = useMemo(() => buildMobileTimelineEvents(day, activeOverlays), [day, activeOverlays]);

  const summaryItems = [
    { label: 'Sleep', value: formatDuration(day.totalSleepTime24h) },
    { label: 'Feedings', value: `${day.feedingSessions}` },
    { label: 'Diapers', value: `${day.totalDiaperChanges}` },
    ...(showNightIndication ? [{ label: 'Night sleep', value: formatDuration(day.totalNightSleepTime24h) }] : []),
  ];

  return (
    <Card className="rounded-2xl border-border/70 shadow-none" data-testid="timeline-mobile-card">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold">{format(parseISO(day.date), 'EEE')}</div>
            <div className="text-sm text-muted-foreground">{format(parseISO(day.date), 'MMM d')}</div>
          </div>
          {weekLabel ? (
            <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
              {weekLabel}
            </Badge>
          ) : null}
        </div>

        <div className={cn('grid gap-2', summaryItems.length > 3 ? 'grid-cols-2' : 'grid-cols-3')}>
          {summaryItems.map((item) => (
            <div key={item.label} className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{item.label}</div>
              <div className="mt-1 text-sm font-semibold">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div
            className="relative h-24 overflow-hidden rounded-xl border border-border/70 bg-background/60"
            aria-label={`Timeline for ${format(parseISO(day.date), 'MMMM d')}`}
          >
            {TIMELINE_HOURS.map((hour) => (
              <div
                key={hour}
                className={cn(
                  'absolute inset-y-0 border-l border-border/40',
                  showNightIndication && isNightHour(hour, nightStartHour, nightEndHour) && 'bg-baby-night/20',
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
                const { left, width } = positionFromOffsets(offsets.startOffset, offsets.endOffset);

                return (
                  <NapBar
                    key={`nap-${day.date}-${idx}`}
                    nap={nap}
                    nightIndicator={showNightIndication}
                    left={left}
                    width={width ?? '0%'}
                    shouldFadeEnd={offsets.shouldFadeEnd}
                    shouldFadeStart={offsets.shouldFadeStart}
                    formatTimestamp={formatTimelineTimestamp}
                  />
                );
              })}

            {activeOverlays.includes('feedings') &&
              day.feedings.map((feeding, idx) => {
                const offsets = getEventOffsets(day.date, feeding.start, feeding.end);
                if (!offsets) return null;
                const { left, width } = positionFromOffsets(offsets.startOffset, offsets.endOffset);

                return (
                  <FeedingBar
                    key={`feeding-${day.date}-${idx}`}
                    feeding={feeding}
                    left={left}
                    width={width ?? '0%'}
                    shouldFadeEnd={offsets.shouldFadeEnd}
                    shouldFadeStart={offsets.shouldFadeStart}
                    formatTimestamp={formatTimelineTimestamp}
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
                    formatTimestamp={formatTimelineTimestamp}
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
                    formatTimestamp={formatTimelineTimestamp}
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
                    formatTimestamp={formatTimelineTimestamp}
                  />
                );
              })}
          </div>

          <div className="relative h-4 text-[10px] text-muted-foreground" aria-hidden="true">
            {MOBILE_HOUR_MARKERS.map((hour) => (
              <span
                key={hour}
                className={cn(
                  'absolute top-0',
                  hour > 0 && hour < 24 && '-translate-x-1/2',
                  hour === 24 && '-translate-x-full',
                )}
                style={{ left: `${(hour / 24) * 100}%` }}
              >
                {formatHourLabel(hour)}
              </span>
            ))}
          </div>
        </div>

        <Collapsible className="space-y-2" defaultOpen={false}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="group flex w-full items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-left"
              aria-label={`Toggle events for ${format(parseISO(day.date), 'MMM d')}`}
            >
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Events</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {mobileEvents.length === 0
                    ? 'No visible events'
                    : `${mobileEvents.length} visible ${mobileEvents.length === 1 ? 'event' : 'events'}`}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1.5">
            {mobileEvents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-3 py-3 text-sm text-muted-foreground">
                No events are visible for the selected overlays.
              </div>
            ) : (
              <div className="space-y-1.5">
                {mobileEvents.map((event) => {
                  const accent = getEventAccentClasses(event.type);

                  return (
                    <div
                      key={event.id}
                      data-testid="mobile-event-row"
                      className={cn('flex gap-2.5 rounded-lg border px-2.5 py-2', accent.container)}
                    >
                      <div className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full', accent.icon)}>
                        <EventIcon type={event.type} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs font-medium">{event.title}</div>
                          <div className="shrink-0 text-[11px] font-medium text-muted-foreground">{event.timeLabel}</div>
                        </div>
                        {event.details ? <div className="mt-0.5 text-[11px] text-foreground/80">{event.details}</div> : null}
                        {event.note ? <div className="mt-0.5 text-[11px] text-muted-foreground">{event.note}</div> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
