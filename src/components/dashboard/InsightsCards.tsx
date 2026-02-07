import { useMemo } from 'react';
import { differenceInMinutes, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DaySummary } from '@/types/baby-log';
import { Clock, Baby, Moon, AlertCircle } from 'lucide-react';

interface InsightsCardsProps {
  data: DaySummary[];
}

export function InsightsCards({ data }: InsightsCardsProps) {
  const insights = useMemo(() => {
    if (data.length === 0) return null;

    const avgFeedingsPerDay =
      data.reduce((sum, d) => sum + d.feedingSessions, 0) / data.length;

    const avgNightWakeUps =
      data.reduce((sum, d) => sum + d.totalNightWakeUps, 0) / data.length;

    // Calculate average wake window (time between naps)
    const avgWakeWindow = data.reduce((sum, d) => {
      if (d.naps.length < 2) return sum;
      const dayNaps = d.naps
        .filter((n) => {
          const hour = parseISO(n.startTime).getHours();
          return hour >= 7 && hour < 19;
        })
        .sort(
          (a, b) =>
            parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime()
        );

      if (dayNaps.length < 2) return sum;

      let totalWakeTime = 0;
      for (let i = 1; i < dayNaps.length; i++) {
        const prevEnd = dayNaps[i - 1].endTime;
        const currStart = dayNaps[i].startTime;
        totalWakeTime += differenceInMinutes(parseISO(currStart), parseISO(prevEnd));
      }
      return sum + totalWakeTime / (dayNaps.length - 1);
    }, 0) / data.length;

    const avgTotalSleep =
      data.reduce((sum, d) => sum + d.totalSleepTime, 0) / data.length;

    return {
      avgFeedingsPerDay: avgFeedingsPerDay.toFixed(1),
      avgNightWakeUps: avgNightWakeUps.toFixed(1),
      avgWakeWindow: Math.round(avgWakeWindow),
      avgTotalSleep: (avgTotalSleep / 60).toFixed(1),
    };
  }, [data]);

  if (!insights) {
    return null;
  }

  const cards = [
    {
      title: 'Avg Wake Window',
      value: `${insights.avgWakeWindow} min`,
      icon: Clock,
      description: 'Time between naps',
      color: 'text-baby-mint',
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
      value: `${insights.avgTotalSleep}h`,
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
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
