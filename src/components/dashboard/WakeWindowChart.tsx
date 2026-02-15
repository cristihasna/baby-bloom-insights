import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { DaySummary } from '@/types/baby-log';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WakeWindowChartProps {
  data: DaySummary[];
}

export function WakeWindowChart({ data }: WakeWindowChartProps) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      date: format(parseISO(d.date), 'MMM d'),
      dayWakeWindow: d.averageDayWakeDuration,
      nightWakeWindow: d.averageNightWakeDuration,
    }));
  }, [data]);

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">Average Wake Windows</CardTitle>
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
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              tickFormatter={(v) => `${v}m`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.75rem',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'dayWakeWindow') return [`${value} minutes`, 'Day Wake Window'];
                if (name === 'nightWakeWindow') return [`${value} minutes`, 'Night Wake Window'];
                return [value, name];
              }}
            />
            <Legend
              formatter={(value) => {
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
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
