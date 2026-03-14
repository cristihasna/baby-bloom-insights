import { useMemo } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import { format, parseISO } from 'date-fns';
import { DaySummary } from '@/types/baby-log';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NapDurationChartProps {
  data: DaySummary[];
}

type SleepSegmentChartPoint = {
  date: string;
  count: number;
  averageDuration: number;
  maxDuration: number;
};

interface SleepSegmentDurationChartProps {
  data: SleepSegmentChartPoint[];
  title: string;
  averageLabel: string;
  maxLabel: string;
  countLabel: string;
  durationColor: string;
  maxColor: string;
  countColor: string;
}

function formatMinutesToHoursAndMinutes(minutes: number) {
  const safeMinutes = Number.isFinite(minutes) ? Math.max(0, minutes) : 0;
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function formatDurationAxisTick(minutes: number) {
  if (minutes === 0) {
    return '0m';
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}

function SleepSegmentTooltip({
  active,
  payload,
  label,
  averageLabel,
  maxLabel,
  countLabel,
  durationColor,
  maxColor,
  countColor,
}: TooltipProps<number, string> & {
  averageLabel: string;
  maxLabel: string;
  countLabel: string;
  durationColor: string;
  maxColor: string;
  countColor: string;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0]?.payload as SleepSegmentChartPoint | undefined;

  if (!point) {
    return null;
  }

  return (
    <div
      className="rounded-xl border bg-card p-3 shadow-sm"
      style={{ borderColor: 'hsl(var(--border))' }}
    >
      <p className="mb-2 font-medium text-foreground">{point.date ?? String(label)}</p>
      <p className="text-sm" style={{ color: durationColor }}>
        {averageLabel} : {formatMinutesToHoursAndMinutes(point.averageDuration)}
      </p>
      <p className="text-sm" style={{ color: maxColor }}>
        {maxLabel} : {formatMinutesToHoursAndMinutes(point.maxDuration)}
      </p>
      <p className="text-sm" style={{ color: countColor }}>
        {countLabel} : {point.count}
      </p>
    </div>
  );
}

function SleepSegmentDurationChart({
  data,
  title,
  averageLabel,
  maxLabel,
  countLabel,
  durationColor,
  maxColor,
  countColor,
}: SleepSegmentDurationChartProps) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              className="fill-muted-foreground"
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="duration"
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              tickFormatter={formatDurationAxisTick}
            />
            <YAxis
              yAxisId="count"
              orientation="right"
              allowDecimals={false}
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              content={(
                <SleepSegmentTooltip
                  averageLabel={averageLabel}
                  maxLabel={maxLabel}
                  countLabel={countLabel}
                  durationColor={durationColor}
                  maxColor={maxColor}
                  countColor={countColor}
                />
              )}
            />
            <Legend />
            <Bar
              yAxisId="count"
              dataKey="count"
              name={countLabel}
              fill={countColor}
              fillOpacity={0.15}
            />
            <Line
              yAxisId="duration"
              type="monotone"
              dataKey="averageDuration"
              name={averageLabel}
              stroke={durationColor}
              strokeWidth={2}
              dot={{ fill: durationColor, strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="duration"
              type="monotone"
              dataKey="maxDuration"
              name={maxLabel}
              stroke={maxColor}
              strokeDasharray="2 4"
              strokeWidth={2}
              dot={{ fill: maxColor, strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function NapDurationChart({ data }: NapDurationChartProps) {
  const { dayNapData, nightSleepData } = useMemo(() => {
    const getMaxDuration = (durations: number[]) => (durations.length > 0 ? Math.max(...durations) : 0);

    return {
      dayNapData: data.map((day) => {
        const dayNapDurations = day.naps
          .filter((nap) => !nap.isNightSleep)
          .map((nap) => nap.durationMinutes);

        return {
          date: format(parseISO(day.date), 'MMM d'),
          count: dayNapDurations.length,
          averageDuration: day.averageDaySleepDuration,
          maxDuration: getMaxDuration(dayNapDurations),
        };
      }),
      nightSleepData: data.map((day) => {
        const nightSleepDurations = day.naps
          .filter((nap) => nap.isNightSleep)
          .map((nap) => nap.durationMinutes);

        return {
          date: format(parseISO(day.date), 'MMM d'),
          count: nightSleepDurations.length,
          averageDuration: day.averageNightSleepDuration,
          maxDuration: getMaxDuration(nightSleepDurations),
        };
      }),
    };
  }, [data]);

  return (
    <div className="grid gap-6">
      <SleepSegmentDurationChart
        data={dayNapData}
        title="Day Naps"
        averageLabel="Average Nap Length"
        maxLabel="Longest Nap"
        countLabel="Nap Count"
        durationColor="hsl(var(--baby-feeding))"
        maxColor="hsl(var(--baby-dirty))"
        countColor="hsl(var(--baby-feeding))"
      />
      <SleepSegmentDurationChart
        data={nightSleepData}
        title="Night Sleep Segments"
        averageLabel="Average Segment Length"
        maxLabel="Longest Segment"
        countLabel="Segment Count"
        durationColor="hsl(var(--baby-sleep))"
        maxColor="hsl(var(--baby-dirty))"
        countColor="hsl(var(--baby-sleep))"
      />
    </div>
  );
}
