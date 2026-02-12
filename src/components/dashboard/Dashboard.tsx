import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Baby, LogOut } from 'lucide-react';
import { useAuth } from '@/auth/use-auth';
import { useSettings } from '@/hooks/use-settings';
import { useDateRange } from '@/hooks/use-date-range';
import { fetchLogs } from '@/lib/api';
import { OverlayType } from '@/types/baby-log';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SettingsPanel } from './SettingsPanel';
import { DateRangeSelector } from './DateRangeSelector';
import { DailyTimeline } from './DailyTimeline';
import { OverlayToggle } from './OverlayToggle';
import { WeightChart } from './WeightChart';
import { DiaperChart } from './DiaperChart';
import { SleepChart, NapDurationChart } from './SleepChart';
import { InsightsCards } from './InsightsCards';
import { NightWakeUpsChart } from './NightWakeUpsChart';
import { FeedingChart } from './FeedingChart';

export function Dashboard() {
  const { apiToken, signOut } = useAuth();
  const { settings, updateSettings } = useSettings();
  const { dateRange, setPreset, setCustomRange, presetOptions } = useDateRange(
    settings.birthDate
  );
  const [activeOverlays, setActiveOverlays] = useState<OverlayType[]>([
    'naps',
    'feedings',
    'comments',
  ]);

  const toggleOverlay = (overlay: OverlayType) => {
    setActiveOverlays((prev) =>
      prev.includes(overlay)
        ? prev.filter((o) => o !== overlay)
        : [...prev, overlay]
    );
  };

  const from = useMemo(
    () => format(dateRange.startDate, 'yyyy-MM-dd'),
    [dateRange.startDate]
  );
  const to = useMemo(
    () => format(dateRange.endDate, 'yyyy-MM-dd'),
    [dateRange.endDate]
  );

  const logsQuery = useQuery({
    queryKey: ['logs', from, to],
    queryFn: async () => {
      if (!apiToken) throw new Error('Missing API token.');
      return fetchLogs({
        from,
        to,
        accessToken: apiToken,
      });
    },
    enabled: Boolean(apiToken),
    retry: false,
  });

  const data = logsQuery.data ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Baby className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-semibold">Baby Log Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <SettingsPanel settings={settings} onUpdateSettings={updateSettings} />
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {logsQuery.isLoading && (
          <Card className="rounded-2xl">
            <CardContent className="py-6">
              <p className="text-sm text-muted-foreground text-center">
                Loading authenticated logs...
              </p>
            </CardContent>
          </Card>
        )}

        {logsQuery.isError && (
          <Card className="rounded-2xl border-destructive/30">
            <CardContent className="py-6 space-y-4">
              <p className="text-sm text-destructive text-center">
                Failed to load logs from API. Check authentication and endpoint settings.
              </p>
              <div className="flex justify-center">
                <Button type="button" variant="outline" onClick={() => logsQuery.refetch()}>
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!logsQuery.isLoading && !logsQuery.isError && data.length === 0 && (
          <Card className="rounded-2xl">
            <CardContent className="py-6">
              <p className="text-sm text-muted-foreground text-center">
                No logs were returned for this date range.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Date Range & Overlay Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <DateRangeSelector
            dateRange={dateRange}
            presetOptions={presetOptions}
            onPresetChange={setPreset}
            onCustomRangeChange={setCustomRange}
          />
          <OverlayToggle activeOverlays={activeOverlays} onToggle={toggleOverlay} />
        </div>

        {/* Birth date prompt */}
        {!settings.birthDate && (
          <Card className="rounded-2xl bg-primary/5 border-primary/20">
            <CardContent className="py-4">
              <p className="text-sm text-center">
                💡 Set your baby's birth date in{' '}
                <span className="font-medium">Settings</span> to see age in weeks on
                charts
              </p>
            </CardContent>
          </Card>
        )}

        {/* Insights Cards */}
        <InsightsCards data={data} />

        {/* Daily Timeline */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Daily Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyTimeline
              data={data}
              birthDate={settings.birthDate}
              nightStartHour={settings.nightStartHour}
              nightEndHour={settings.nightEndHour}
              activeOverlays={activeOverlays}
            />
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <SleepChart data={data} />
          <NapDurationChart data={data} />
          <DiaperChart data={data} />
          <FeedingChart data={data} />
          <WeightChart data={data} birthDate={settings.birthDate} />
          <NightWakeUpsChart data={data} />
        </div>
      </main>
    </div>
  );
}
