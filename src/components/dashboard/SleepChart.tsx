import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
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

interface SleepChartProps {
  data: DaySummary[];
  birthDate: string | null;
}

function getRecommendedSleepRangeMinutes(ageDays: number) {
  if (ageDays <= 90) {
    return { min: 14 * 60, max: 17 * 60 };
  }

  if (ageDays <= 365) {
    return { min: 12 * 60, max: 16 * 60 };
  }

  return { min: 11 * 60, max: 14 * 60 };
}

export function SleepChart({ data, birthDate }: SleepChartProps) {
  const formatMinutesToHourAndMinutes = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const formatMinutesToHours = (minutes: number) => {
    const hours = minutes / 60;
    return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
  };

  const SleepTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const point = payload[0]?.payload as
      | {
          date?: string;
          dayHours?: number;
          nightHours?: number;
          totalHours?: number;
          recommendedMin?: number;
          recommendedBand?: number;
        }
      | undefined;

    if (!point) {
      return null;
    }

    const recommendedMax =
      point.recommendedMin !== undefined && point.recommendedBand !== undefined
        ? point.recommendedMin + point.recommendedBand
        : undefined;

    return (
      <div
        className="rounded-xl border bg-card p-3 shadow-sm"
        style={{ borderColor: 'hsl(var(--border))' }}
      >
        <p className="mb-2 font-medium text-foreground">
          {point.date ?? String(label)}
          {recommendedMax !== undefined
            ? ` • Recommended ${formatMinutesToHours(point.recommendedMin!)}-${formatMinutesToHours(recommendedMax)}`
            : ''}
        </p>
        {point.totalHours !== undefined ? (
          <p className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>
            Total Sleep : {formatMinutesToHourAndMinutes(point.totalHours)}
          </p>
        ) : null}
        {point.dayHours !== undefined ? (
          <p className="text-sm" style={{ color: 'hsl(var(--baby-feeding))' }}>
            Day Sleep : {formatMinutesToHourAndMinutes(point.dayHours)}
          </p>
        ) : null}
        {point.nightHours !== undefined ? (
          <p className="text-sm" style={{ color: 'hsl(var(--baby-sleep))' }}>
            Night Sleep : {formatMinutesToHourAndMinutes(point.nightHours)}
          </p>
        ) : null}
      </div>
    );
  };

  const chartData = useMemo(() => {
    return data.map((d) => {
      const ageDays = birthDate ? Math.max(differenceInDays(parseISO(d.date), parseISO(birthDate)), 0) : null;
      const reference = ageDays !== null ? getRecommendedSleepRangeMinutes(ageDays) : null;

      return {
        date: format(parseISO(d.date), 'MMM d'),
        dayHours: d.totalDaySleepTime,
        nightHours: d.totalNightSleepTime24h,
        totalHours: d.totalSleepTime24h,
        recommendedMin: reference?.min,
        recommendedBand: reference ? reference.max - reference.min : undefined,
      };
    });
  }, [birthDate, data]);

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">Day vs Night Sleep</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              className="fill-muted-foreground"
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              tickFormatter={(v) => formatMinutesToHours(v)}
            />
            {birthDate ? (
              <>
                <Area
                  type="monotone"
                  dataKey="recommendedMin"
                  stackId="sleep-range"
                  stroke="none"
                  fill="transparent"
                  activeDot={false}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="recommendedBand"
                  name="recommendedBand"
                  stackId="sleep-range"
                  stroke="none"
                  fill="hsl(var(--baby-sleep))"
                  fillOpacity={0.12}
                  activeDot={false}
                  isAnimationActive={false}
                />
              </>
            ) : null}
            <Tooltip
              content={<SleepTooltip />}
            />
            <Legend
              formatter={(value) => {
                if (value === 'recommendedBand') return 'Recommended sleep range';
                if (value === 'dayHours') return 'Day Sleep';
                if (value === 'nightHours') return 'Night Sleep';
                return value;
              }}
            />
            <Bar dataKey="dayHours" name="dayHours" stackId="sleep" fill="hsl(var(--baby-feeding))" radius={[0, 0, 0, 0]} />
            <Bar
              dataKey="nightHours"
              name="nightHours"
              stackId="sleep"
              fill="hsl(var(--baby-sleep))"
              radius={[4, 4, 0, 0]}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
