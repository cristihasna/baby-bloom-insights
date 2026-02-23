import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { DaySummary } from '@/types/baby-log';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SleepChartProps {
  data: DaySummary[];
}

export function SleepChart({ data }: SleepChartProps) {
  const formatMinutesToHourAndMinutes = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };
  const chartData = useMemo(() => {
    return data.map((d) => ({
      date: format(parseISO(d.date), 'MMM d'),
      dayHours: d.totalDaySleepTime,
      nightHours: d.totalNightSleepTime24h,
      totalHours: d.totalSleepTime24h,
    }));
  }, [data]);

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">Day vs Night Sleep</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              className="fill-muted-foreground"
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" tickFormatter={(v) => `${v}h`} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.75rem',
              }}
              formatter={(value: number, name: string) => [
                `${formatMinutesToHourAndMinutes(value)}`,
                name === 'dayHours' ? 'Day Sleep' : 'Night Sleep',
              ]}
            />
            <Legend formatter={(value) => (value === 'dayHours' ? 'Day Sleep' : 'Night Sleep')} />
            <Bar dataKey="dayHours" name="dayHours" stackId="a" fill="hsl(var(--baby-feeding))" radius={[0, 0, 0, 0]} />
            <Bar
              dataKey="nightHours"
              name="nightHours"
              stackId="a"
              fill="hsl(var(--baby-sleep))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function NapDurationChart({ data }: SleepChartProps) {
  const formatMinutesToHourAndMinutes = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };
  const chartData = useMemo(() => {
    return data.map((d) => ({
      date: format(parseISO(d.date), 'MMM d'),
      avgDayNapDuration: d.averageDaySleepDuration,
      avgNightSleepDuration: d.averageNightSleepDuration,
      maxNightSleepDuration: Math.max(...d.naps.filter((n) => n.isNightSleep).map((n) => n.durationMinutes)),
      maxDayNapDuration: Math.max(...d.naps.filter((n) => !n.isNightSleep).map((n) => n.durationMinutes)),
    }));
  }, [data]);

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">Sleep Duration & Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              className="fill-muted-foreground"
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              tickFormatter={(v) => `${v}m`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.75rem',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'maxDayNapDuration') return [`${formatMinutesToHourAndMinutes(value)}`, 'Max Day Sleep'];
                if (name === 'maxNightSleepDuration') return [`${formatMinutesToHourAndMinutes(value)}`, 'Max Night Sleep'];
                if (name === 'avgNightSleepDuration') return [`${formatMinutesToHourAndMinutes(value)}`, 'Avg Night Sleep'];
                if (name === 'avgDayNapDuration') return [`${formatMinutesToHourAndMinutes(value)}`, 'Avg Day Sleep'];
                if (name === 'daySessions') return [`${value} sessions`, 'Day Sessions'];
                if (name === 'nightSessions') return [`${value} sessions`, 'Night Sessions'];
                return [value, name];
              }}
            />
            <Legend
              formatter={(value) => {
                if (value === 'maxDayNapDuration') return 'Max Day Sleep';
                if (value === 'maxNightSleepDuration') return 'Max Night Sleep';
                if (value === 'avgNightSleepDuration') return 'Avg Night Sleep';
                if (value === 'avgDayNapDuration') return 'Avg Day Sleep';
                if (value === 'daySessions') return 'Day Sessions';
                if (value === 'nightSessions') return 'Night Sessions';
                return value;
              }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="maxDayNapDuration"
              name="maxDayNapDuration"
              stroke="hsl(var(--baby-mint))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--baby-mint))', strokeWidth: 0, r: 3 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="avgDayNapDuration"
              name="avgDayNapDuration"
              stroke="hsl(var(--baby-feeding))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--baby-feeding))', strokeWidth: 0, r: 3 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="avgNightSleepDuration"
              name="avgNightSleepDuration"
              stroke="hsl(var(--baby-sleep))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--baby-sleep))', strokeWidth: 0, r: 3 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="maxNightSleepDuration"
              name="maxNightSleepDuration"
              stroke="hsl(var(--baby-dirty))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--baby-dirty))', strokeWidth: 0, r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
