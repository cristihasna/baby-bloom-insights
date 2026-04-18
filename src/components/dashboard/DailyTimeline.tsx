import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DaySummary, OverlayType } from '@/types/baby-log';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type CarouselApi, Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { MobileDayTimelineCard } from './MobileDayTimelineCard';
import { CommentIndicator } from './timeline/CommentIndicator';
import { DirtyDiaperIndicator } from './timeline/DirtyDiaperIndicator';
import { FeedingBar } from './timeline/FeedingBar';
import { NapBar } from './timeline/NapBar';
import { WetDiaperIndicator } from './timeline/WetDiaperIndicator';
import {
  DAY_LABEL_WIDTH,
  DAY_ROW_HEIGHT,
  HOUR_COLUMN_MIN_WIDTH,
  TIMELINE_HOURS,
  WEEK_LABEL_WIDTH,
  formatHourLabel,
  formatTimelineTimestamp,
  getEventOffsets,
  getOffsetWithinDay,
  getWeekGroups,
  isNightHour,
  positionFromOffsets,
  preprocessTimelineData,
} from './timeline/timeline-utils';

interface DailyTimelineProps {
  data: DaySummary[];
  birthDate: string | null;
  nightStartHour: number;
  nightEndHour: number;
  activeOverlays: OverlayType[];
}

export function DailyTimeline({ data, birthDate, nightStartHour, nightEndHour, activeOverlays }: DailyTimelineProps) {
  const isMobile = useIsMobile();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentMobileSlide, setCurrentMobileSlide] = useState(0);

  const processedData = useMemo(() => preprocessTimelineData(data), [data]);
  const weekGroups = useMemo(() => getWeekGroups(processedData, birthDate), [birthDate, processedData]);
  const mobileDays = useMemo(
    () =>
      weekGroups.flatMap((group) =>
        group.days.map((day, dayIndex) => ({
          day,
          weekLabel: group.weekLabel,
        })),
      ).reverse(),
    [weekGroups],
  );
  const initialMobileSlide = 0;
  const currentMobileDay = mobileDays[currentMobileSlide];

  useEffect(() => {
    setCurrentMobileSlide(initialMobileSlide);
  }, [initialMobileSlide]);

  useEffect(() => {
    if (!carouselApi) return;

    const updateSelected = () => {
      setCurrentMobileSlide(carouselApi.selectedScrollSnap());
    };

    updateSelected();
    carouselApi.on('select', updateSelected);
    carouselApi.on('reInit', updateSelected);

    return () => {
      carouselApi.off('select', updateSelected);
      carouselApi.off('reInit', updateSelected);
    };
  }, [carouselApi]);

  const showNightIndication = activeOverlays.includes('nightIndicator');
  const hourColumnPercent = 100 / TIMELINE_HOURS.length;
  const timelineMinWidth = TIMELINE_HOURS.length * HOUR_COLUMN_MIN_WIDTH;

  if (isMobile) {
    return (
      <div className="space-y-3" data-testid="timeline-mobile-carousel">
        {currentMobileDay ? (
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
            <div>
              <div className="flex items-center gap-2">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Swipe days</div>
                {currentMobileDay.weekLabel ? (
                  <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
                    {currentMobileDay.weekLabel}
                  </Badge>
                ) : null}
              </div>
              <div className="text-xs text-muted-foreground">
                {mobileDays.length - currentMobileSlide} of {mobileDays.length}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground">
                {format(parseISO(currentMobileDay.day.date), 'EEE, MMM d')}
              </span>
              {mobileDays.length > 1 ? (
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full border-border/70 bg-background/90"
                    aria-label="Previous day"
                    disabled={currentMobileSlide === 0}
                    onClick={() => carouselApi?.scrollPrev()}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full border-border/70 bg-background/90"
                    aria-label="Next day"
                    disabled={currentMobileSlide === mobileDays.length - 1}
                    onClick={() => carouselApi?.scrollNext()}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <Carousel
          key={mobileDays[0]?.day.date ?? 'timeline-mobile'}
          setApi={setCarouselApi}
          opts={{ align: 'start', containScroll: 'trimSnaps', startIndex: initialMobileSlide }}
          className="w-full"
        >
          <CarouselContent className="-ml-0">
            {mobileDays.map(({ day, weekLabel }) => (
              <CarouselItem key={day.date} className="basis-full pl-0">
                <MobileDayTimelineCard
                  day={day}
                  weekLabel={weekLabel}
                  nightStartHour={nightStartHour}
                  nightEndHour={nightEndHour}
                  activeOverlays={activeOverlays}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {mobileDays.length > 1 ? (
          <div className="flex justify-center gap-1.5" aria-hidden="true">
            {mobileDays.map((item, index) => (
              <span
                key={item.day.date}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  index === currentMobileSlide ? 'w-5 bg-primary' : 'w-1.5 bg-border',
                )}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="max-h-[36rem] overflow-auto" data-testid="timeline-desktop-grid">
      <div className="min-w-max">
        <div className="sticky top-0 z-30 flex border-b border-border bg-background">
          <div
            className="sticky left-0 z-40 shrink-0 border-r border-border bg-background"
            style={{ width: `${DAY_LABEL_WIDTH}px`, minWidth: `${DAY_LABEL_WIDTH}px` }}
          />
          <div className="flex min-w-0 flex-1" style={{ minWidth: `${timelineMinWidth}px` }}>
            {TIMELINE_HOURS.map((hour) => (
              <div
                key={hour}
                className={cn(
                  'flex h-12 items-center justify-center border-l border-border text-xs text-muted-foreground',
                  showNightIndication && isNightHour(hour, nightStartHour, nightEndHour) && 'bg-baby-night/30',
                )}
                style={{ width: `${hourColumnPercent}%`, minWidth: `${HOUR_COLUMN_MIN_WIDTH}px` }}
              >
                {formatHourLabel(hour % 24)}
              </div>
            ))}
          </div>
          <div
            className="sticky right-0 z-40 shrink-0 border-l border-border bg-background"
            style={{ width: `${WEEK_LABEL_WIDTH}px`, minWidth: `${WEEK_LABEL_WIDTH}px` }}
          />
        </div>

        <div>
          {weekGroups.map((group) => (
            <div key={`${group.weekLabel ?? 'no-week'}-${group.startIndex}`} className="flex border-b border-border">
              <div className="min-w-0 flex-1">
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
                        {TIMELINE_HOURS.map((hour) => (
                          <div
                            key={hour}
                            className={cn(
                              'absolute bottom-0 top-0 border-l border-border/50',
                              showNightIndication && isNightHour(hour, nightStartHour, nightEndHour) && 'bg-baby-night/30',
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
                                nightIndicator={showNightIndication}
                                nap={nap}
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
          ))}
        </div>
      </div>
    </div>
  );
}
