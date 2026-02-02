import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { differenceInWeeks, parseISO } from 'date-fns';
import { DaySummary } from '@/types/baby-log';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WeightChartProps {
  data: DaySummary[];
  birthDate: string | null;
}

export function WeightChart({ data, birthDate }: WeightChartProps) {
  const chartData = useMemo(() => {
    return data
      .filter((d) => d.weight !== undefined)
      .map((d) => ({
        date: d.date,
        weight: d.weight! / 1000, // Convert to kg
        week: birthDate
          ? `Week ${differenceInWeeks(parseISO(d.date), parseISO(birthDate)) + 1}`
          : d.date,
      }));
  }, [data, birthDate]);

  if (chartData.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Weight Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No weight data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">Weight Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              tickFormatter={(value) => `${value}kg`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.75rem',
              }}
              formatter={(value: number) => [`${value.toFixed(2)} kg`, 'Weight']}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="hsl(var(--baby-mint))"
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--baby-mint))', strokeWidth: 0, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
