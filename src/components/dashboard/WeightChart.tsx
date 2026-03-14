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
import { differenceInDays, differenceInWeeks, format, parseISO } from 'date-fns';
import { DaySummary } from '@/types/baby-log';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AVERAGE_DAYS_PER_MONTH = 30.4375;

// WHO boys weight-for-age percentiles, published by CDC/WHO.
// Source: https://ftp.cdc.gov/pub/Health_Statistics/NCHS/growthcharts/WHO-Boys-Weight-for-age-Percentiles.csv
const WHO_BOYS_WEIGHT_REFERENCE_KG = [
  { month: 0, lower: 2.603994, median: 3.3464, upper: 4.214527 },
  { month: 1, lower: 3.566165, median: 4.4709, upper: 5.542933 },
  { month: 2, lower: 4.522344, median: 5.5675, upper: 6.798348 },
  { month: 3, lower: 5.240269, median: 6.3762, upper: 7.708329 },
  { month: 4, lower: 5.797135, median: 7.0023, upper: 8.412602 },
  { month: 5, lower: 6.244465, median: 7.5105, upper: 8.991445 },
  { month: 6, lower: 6.611702, median: 7.934, upper: 9.481939 },
  { month: 7, lower: 6.922131, median: 8.297, upper: 9.908738 },
  { month: 8, lower: 7.19127, median: 8.6151, upper: 10.28713 },
  { month: 9, lower: 7.431644, median: 8.9014, upper: 10.63055 },
  { month: 10, lower: 7.651572, median: 9.1649, upper: 10.94868 },
  { month: 11, lower: 7.857229, median: 9.4122, upper: 11.24845 },
  { month: 12, lower: 8.052577, median: 9.6479, upper: 11.53526 },
  { month: 13, lower: 8.239848, median: 9.8749, upper: 11.81281 },
  { month: 14, lower: 8.421033, median: 10.0953, upper: 12.08325 },
  { month: 15, lower: 8.597424, median: 10.3108, upper: 12.34891 },
  { month: 16, lower: 8.770274, median: 10.5228, upper: 12.61125 },
  { month: 17, lower: 8.939942, median: 10.7319, upper: 12.87128 },
  { month: 18, lower: 9.107002, median: 10.9385, upper: 13.12906 },
  { month: 19, lower: 9.27136, median: 11.143, upper: 13.38579 },
  { month: 20, lower: 9.434095, median: 11.3462, upper: 13.64181 },
  { month: 21, lower: 9.595435, median: 11.5486, upper: 13.89795 },
  { month: 22, lower: 9.755556, median: 11.7504, upper: 14.15453 },
  { month: 23, lower: 9.914417, median: 11.9514, upper: 14.41108 },
  { month: 24, lower: 10.07194, median: 12.1515, upper: 14.66753 },
];

function interpolateWhoReferenceAtAgeDays(ageDays: number) {
  const ageMonths = ageDays / AVERAGE_DAYS_PER_MONTH;

  if (ageMonths <= WHO_BOYS_WEIGHT_REFERENCE_KG[0].month) {
    return WHO_BOYS_WEIGHT_REFERENCE_KG[0];
  }

  const lastPoint = WHO_BOYS_WEIGHT_REFERENCE_KG[WHO_BOYS_WEIGHT_REFERENCE_KG.length - 1];
  if (ageMonths >= lastPoint.month) {
    return lastPoint;
  }

  const upperIndex = WHO_BOYS_WEIGHT_REFERENCE_KG.findIndex((point) => point.month >= ageMonths);
  const upperPoint = WHO_BOYS_WEIGHT_REFERENCE_KG[upperIndex];
  const lowerPoint = WHO_BOYS_WEIGHT_REFERENCE_KG[upperIndex - 1];
  const ratio = (ageMonths - lowerPoint.month) / (upperPoint.month - lowerPoint.month);

  return {
    month: ageMonths,
    lower: lowerPoint.lower + (upperPoint.lower - lowerPoint.lower) * ratio,
    median: lowerPoint.median + (upperPoint.median - lowerPoint.median) * ratio,
    upper: lowerPoint.upper + (upperPoint.upper - lowerPoint.upper) * ratio,
  };
}

interface WeightChartProps {
  data: DaySummary[];
  birthDate: string | null;
}

export function WeightChart({ data, birthDate }: WeightChartProps) {
  const chartData = useMemo(() => {
    const weightEntries = data
      .filter((d) => d.weight !== undefined)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        date: d.date,
        dateValue: parseISO(d.date).getTime(),
        weight: d.weight! / 1000, // Convert to kg
        ageDays: birthDate ? Math.max(differenceInDays(parseISO(d.date), parseISO(birthDate)), 0) : null,
        week: birthDate
          ? `Week ${differenceInWeeks(parseISO(d.date), parseISO(birthDate)) + 1}`
          : d.date,
        seriesType: 'actual' as const,
      }));

    if (!birthDate) {
      return weightEntries;
    }

    const minAgeDays = Math.min(...weightEntries.map((entry) => entry.ageDays ?? 0));
    const maxAgeDays = Math.max(...weightEntries.map((entry) => entry.ageDays ?? 0));
    const referenceAgeDays = WHO_BOYS_WEIGHT_REFERENCE_KG
      .map((point) => point.month * AVERAGE_DAYS_PER_MONTH)
      .filter((ageDays) => ageDays > minAgeDays && ageDays < maxAgeDays);

    const agePositions = Array.from(
      new Set([
        minAgeDays,
        maxAgeDays,
        ...referenceAgeDays,
        ...weightEntries.map((entry) => entry.ageDays ?? 0),
      ]),
    ).sort((a, b) => a - b);

    const weightEntryByAge = new Map(weightEntries.map((entry) => [entry.ageDays ?? 0, entry]));

    const mergedEntries = agePositions.map((ageDays) => {
      const weightEntry = weightEntryByAge.get(ageDays);
      const reference = interpolateWhoReferenceAtAgeDays(ageDays);

      return {
        date: weightEntry?.date ?? null,
        dateValue: weightEntry?.dateValue ?? null,
        weight: weightEntry?.weight,
        ageDays,
        week: weightEntry?.week ?? `Week ${Math.floor(ageDays / 7) + 1}`,
        referenceWeight: reference.median,
        referenceLower: reference.lower,
        referenceUpper: reference.upper,
        referenceBand: reference.upper - reference.lower,
      };
    });

    return mergedEntries.sort((a, b) => {
      const left = a.ageDays ?? a.dateValue ?? 0;
      const right = b.ageDays ?? b.dateValue ?? 0;
      return left - right;
    });
  }, [data, birthDate]);

  const isAgeBasedAxis = birthDate !== null;

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
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              type="number"
              dataKey={isAgeBasedAxis ? 'ageDays' : 'dateValue'}
              domain={['dataMin', 'dataMax']}
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              allowDuplicatedCategory={false}
              tickFormatter={(value: number) =>
                isAgeBasedAxis
                  ? `Week ${Math.floor(value / 7) + 1}`
                  : format(new Date(value), 'MMM d')
              }
              interval="preserveStartEnd"
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
              labelFormatter={(value, payload) => {
                const point = payload?.[0]?.payload as
                  | { date: string | null; week: string; ageDays: number | null }
                  | undefined;

                if (!point) return String(value);

                if (point.ageDays !== null && point.date) {
                  return `${point.week} • ${format(parseISO(point.date), 'MMM d, yyyy')}`;
                }

                if (point.ageDays !== null) {
                  return point.week;
                }

                return point.date ? format(parseISO(point.date), 'MMM d, yyyy') : String(value);
              }}
              formatter={(value: number, name: string) => {
                if (name === 'referenceWeight') return [`${value.toFixed(2)} kg`, 'WHO median (boys)'];
                if (name === 'referenceLower') return [`${value.toFixed(2)} kg`, 'WHO lower bound'];
                if (name === 'referenceUpper') return [`${value.toFixed(2)} kg`, 'WHO upper bound'];
                if (name === 'weight') return [`${value.toFixed(2)} kg`, 'Actual weight'];
                if (name === 'referenceBand') return [];
              }}
            />
            <Legend
              formatter={(value) => {
                if (value === 'weight') return 'Actual weight';
                if (value === 'referenceBand') return 'WHO range (5th-95th)';
                if (value === 'referenceWeight') return 'WHO median (boys)';
                return value;
              }}
            />
            <Area
              type="monotone"
              dataKey="referenceLower"
              stackId="who-band"
              stroke="none"
              fill="transparent"
              activeDot={false}
            />
            <Area
              type="monotone"
              dataKey="referenceBand"
              name="referenceBand"
              stackId="who-band"
              stroke="none"
              fill="hsl(var(--baby-sleep))"
              fillOpacity={0.14}
              activeDot={false}
            />
            <Line
              type="monotone"
              dataKey="weight"
              name="weight"
              stroke="hsl(var(--baby-mint))"
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--baby-mint))', strokeWidth: 0, r: 4 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="referenceWeight"
              name="referenceWeight"
              stroke="hsl(var(--baby-sleep))"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
