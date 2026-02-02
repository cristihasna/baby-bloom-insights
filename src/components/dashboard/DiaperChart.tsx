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
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { DaySummary } from '@/types/baby-log';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DiaperChartProps {
  data: DaySummary[];
}

export function DiaperChart({ data }: DiaperChartProps) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      date: format(parseISO(d.date), 'MMM d'),
      wet: d.wetDiaperChanges,
      dirty: d.dirtyDiaperChanges,
    }));
  }, [data]);

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">Diaper Changes</CardTitle>
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
            <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.75rem',
              }}
            />
            <Legend />
            <Bar
              dataKey="wet"
              name="Wet"
              fill="hsl(var(--baby-wet))"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="dirty"
              name="Dirty"
              fill="hsl(var(--baby-dirty))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
