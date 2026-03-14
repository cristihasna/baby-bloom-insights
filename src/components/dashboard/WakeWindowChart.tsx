import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import { differenceInDays, format, parseISO } from 'date-fns';
import { DaySummary } from '@/types/baby-log';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WakeWindowChartProps {
  data: DaySummary[];
  birthDate: string | null;
}

const DAY_WAKE_WINDOW_REFERENCE_MINUTES = [
  { maxAgeDays: 27, min: 30, max: 60 },
  { maxAgeDays: 83, min: 60, max: 90 },
  { maxAgeDays: 121, min: 75, max: 120 },
  { maxAgeDays: 213, min: 120, max: 180 },
  { maxAgeDays: 304, min: 150, max: 210 },
  { maxAgeDays: 426, min: 180, max: 240 },
  { maxAgeDays: 730, min: 240, max: 360 },
];

function formatMinutesToHoursAndMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h${remainingMinutes}m`;
}

function getTypicalDayWakeWindowRangeMinutes(ageDays: number) {
  return (
    DAY_WAKE_WINDOW_REFERENCE_MINUTES.find((range) => ageDays <= range.maxAgeDays) ??
    DAY_WAKE_WINDOW_REFERENCE_MINUTES[DAY_WAKE_WINDOW_REFERENCE_MINUTES.length - 1]
  );
}

function WakeWindowTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0]?.payload as
    | {
        date?: string;
        dayWakeWindow?: number;
        nightWakeWindow?: number;
        typicalDayWakeMin?: number;
        typicalDayWakeBand?: number;
      }
    | undefined;

  if (!point) {
    return null;
  }

  const typicalMax =
    point.typicalDayWakeMin !== undefined && point.typicalDayWakeBand !== undefined
      ? point.typicalDayWakeMin + point.typicalDayWakeBand
      : undefined;

  return (
    <div
      className="rounded-xl border bg-card p-3 shadow-sm"
      style={{ borderColor: 'hsl(var(--border))' }}
    >
      <p className="mb-2 font-medium text-foreground">{point.date ?? String(label)}</p>
      {typicalMax !== undefined ? (
        <p className="text-sm" style={{ color: 'hsl(var(--baby-sleep))' }}>
          Typical day wake window : {formatMinutesToHoursAndMinutes(point.typicalDayWakeMin!)}-
          {formatMinutesToHoursAndMinutes(typicalMax)}
        </p>
      ) : null}
      {point.dayWakeWindow !== undefined ? (
        <p className="text-sm" style={{ color: 'hsl(var(--baby-feeding))' }}>
          Day Wake Window : {formatMinutesToHoursAndMinutes(point.dayWakeWindow)}
        </p>
      ) : null}
      {point.nightWakeWindow !== undefined ? (
        <p className="text-sm" style={{ color: 'hsl(var(--baby-sleep))' }}>
          Night Wake Window : {formatMinutesToHoursAndMinutes(point.nightWakeWindow)}
        </p>
      ) : null}
    </div>
  );
}

export function WakeWindowChart({ data, birthDate }: WakeWindowChartProps) {
  const chartData = useMemo(() => {
    return data.map((d) => {
      const ageDays = birthDate
        ? Math.max(differenceInDays(parseISO(d.date), parseISO(birthDate)), 0)
        : null;
      const reference = ageDays !== null ? getTypicalDayWakeWindowRangeMinutes(ageDays) : null;

      return {
        date: format(parseISO(d.date), 'MMM d'),
        dayWakeWindow: d.averageDayWakeDuration,
        nightWakeWindow: d.averageNightWakeDuration,
        typicalDayWakeMin: reference?.min,
        typicalDayWakeBand: reference ? reference.max - reference.min : undefined,
      };
    });
  }, [birthDate, data]);

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">Average Wake Windows</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              className="fill-muted-foreground"
              interval="preserveStartEnd"
            />
            <YAxis
              allowDataOverflow
              domain={[0, 60 * 3]}
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              tickFormatter={formatMinutesToHoursAndMinutes}
            />
            {birthDate ? (
              <>
                <Area
                  type="monotone"
                  dataKey="typicalDayWakeMin"
                  stackId="wake-window-range"
                  stroke="none"
                  fill="transparent"
                  activeDot={false}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="typicalDayWakeBand"
                  name="typicalDayWakeBand"
                  stackId="wake-window-range"
                  stroke="none"
                  fill="hsl(var(--baby-sleep))"
                  fillOpacity={0.12}
                  activeDot={false}
                  isAnimationActive={false}
                />
              </>
            ) : null}
            <Tooltip content={<WakeWindowTooltip />} />
            <Legend
              formatter={(value) => {
                if (value === 'typicalDayWakeBand') return 'Typical day wake window range';
                if (value === 'dayWakeWindow') return 'Day Wake Window';
                if (value === 'nightWakeWindow') return 'Night Wake Window';
                return value;
              }}
            />
            <Line
              type="monotone"
              dataKey="dayWakeWindow"
              name="dayWakeWindow"
              stroke="hsl(var(--baby-feeding))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--baby-feeding))', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="nightWakeWindow"
              name="nightWakeWindow"
              stroke="hsl(var(--baby-sleep))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--baby-sleep))', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
