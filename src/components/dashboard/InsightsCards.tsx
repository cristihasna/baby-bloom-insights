import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DaySummary } from '@/types/baby-log';
import { Clock, Baby, Moon, AlertCircle } from 'lucide-react';

interface InsightsCardsProps {
  data: DaySummary[];
}

export function InsightsCards({ data }: InsightsCardsProps) {
  const formatToHourAndMinute = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours > 0 ? `${hours}h ` : ''}${mins}m`;
  };

  const insights = useMemo(() => {
    if (data.length === 0) return null;

    const avgFeedingsPerDay = data.reduce((sum, d) => sum + d.feedingSessions, 0) / data.length;

    const totalDiaperChanges = data.reduce((sum, d) => sum + d.totalDiaperChanges, 0);
    const maxNightSleepSessionsMap = data.reduce(
      (map, d) =>
        map.set(d.date, Math.max(...d.naps.filter((nap) => nap.isNightSleep).map((nap) => nap.durationMinutes), 0)),
      new Map<string, number>(),
    );
    const longestNightSleepSession = Array.from(maxNightSleepSessionsMap.entries()).sort((a, b) => b[1] - a[1])[0];

    const avgNightWakeUps = data.reduce((sum, d) => sum + d.totalNightWakeUps, 0) / data.length;

    const avgWakeWindow = data.reduce((sum, d) => sum + d.averageDayWakeDuration, 0) / data.length;

    const avgTotalSleep = data.reduce((sum, d) => sum + d.totalSleepTime24h, 0) / data.length;

    return {
      avgFeedingsPerDay: avgFeedingsPerDay.toFixed(0),
      avgNightWakeUps: avgNightWakeUps.toFixed(0),
      avgWakeWindow,
      longestNightSleepSession,
      totalDiaperChanges,
      avgTotalSleep,
    };
  }, [data]);

  if (!insights) {
    return null;
  }

  const cards = [
    {
      title: 'Avg Wake Window',
      value: formatToHourAndMinute(insights.avgWakeWindow),
      icon: Clock,
      description: 'Time between naps',
      color: 'text-baby-mint',
    },
    {
      title: 'Longest Night Sleep',
      value: formatToHourAndMinute(insights.longestNightSleepSession[1]),
      icon: Clock,
      description: `On night of ${insights.longestNightSleepSession[0]}`,
      color: 'text-baby-night',
    },
    {
      title: 'Avg Daily Feedings',
      value: insights.avgFeedingsPerDay,
      icon: Baby,
      description: 'Feeding sessions per day',
      color: 'text-baby-feeding',
    },
    {
      title: 'Avg Total Sleep',
      value: formatToHourAndMinute(insights.avgTotalSleep),
      icon: Moon,
      description: 'Hours per day',
      color: 'text-baby-sleep',
    },
    {
      title: 'Night Wake-ups',
      value: insights.avgNightWakeUps,
      icon: AlertCircle,
      description: 'Average per night',
      color: 'text-baby-dirty',
    },
    {
      title: 'Total diaper changes',
      value: insights.totalDiaperChanges,
      icon: AlertCircle,
      description: 'Total for the period',
      color: 'text-baby-dirty',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <card.icon className={`h-4 w-4 ${card.color}`} />
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
