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
  const chartData = useMemo(() => {
    return data.map((d) => ({
      date: format(parseISO(d.date), 'MMM d'),
      dayHours: +(d.totalDaySleepTime / 60).toFixed(1),
      nightHours: +(d.totalNightSleepTime / 60).toFixed(1),
      totalHours: +((d.totalDaySleepTime + d.totalNightSleepTime) / 60).toFixed(1),
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
                `${value} hours`,
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
  const chartData = useMemo(() => {
    return data.map((d) => ({
      date: format(parseISO(d.date), 'MMM d'),
      avgDayNapDuration: d.averageDaySleepDuration,
      avgNightSleepDuration: d.averageNightSleepDuration,
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
                if (name === 'avgNapDuration') return [`${value} minutes`, 'Avg Day Sleep'];
                if (name === 'avgNightSleepDuration') return [`${value} minutes`, 'Avg Night Sleep'];
                if (name === 'daySessions') return [`${value} sessions`, 'Day Sessions'];
                if (name === 'nightSessions') return [`${value} sessions`, 'Night Sessions'];
                return [value, name];
              }}
            />
            <Legend
              formatter={(value) => {
                if (value === 'avgNapDuration') return 'Avg Day Sleep';
                if (value === 'avgNightSleepDuration') return 'Avg Night Sleep';
                if (value === 'daySessions') return 'Day Sessions';
                if (value === 'nightSessions') return 'Night Sessions';
                return value;
              }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="avgDayNapDuration"
              name="avgNapDuration"
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
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
