import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { DaySummary } from '@/types/baby-log';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FeedingChartProps {
  data: DaySummary[];
}

export function FeedingChart({ data }: FeedingChartProps) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      date: format(parseISO(d.date), 'MMM d'),
      sessions: d.feedingSessions,
      duration: Math.round(d.totalFeedingTime / d.feedingSessions) || 0,
    }));
  }, [data]);

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">Feeding Frequency</CardTitle>
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
            <YAxis
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.75rem',
              }}
              formatter={(value: number, name: string) => [
                name === 'sessions' ? `${value} sessions` : `${value} min avg`,
                name === 'sessions' ? 'Feedings' : 'Duration',
              ]}
            />
            <Bar
              dataKey="sessions"
              fill="hsl(var(--baby-feeding))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
