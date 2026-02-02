import { useState, useCallback, useMemo } from 'react';
import { subDays, subWeeks, subMonths } from 'date-fns';
import { DateRange } from '@/types/baby-log';

export function useDateRange(birthDate: string | null) {
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    startDate: subDays(new Date(), 7),
    endDate: new Date(),
    preset: 'week',
  }));

  const setPreset = useCallback((preset: DateRange['preset']) => {
    const endDate = new Date();
    let startDate: Date;

    switch (preset) {
      case 'week':
        startDate = subDays(endDate, 7);
        break;
      case '2weeks':
        startDate = subWeeks(endDate, 2);
        break;
      case 'month':
        startDate = subMonths(endDate, 1);
        break;
      case 'all':
        startDate = birthDate ? new Date(birthDate) : subMonths(endDate, 3);
        break;
      default:
        startDate = dateRange.startDate;
    }

    setDateRange({ startDate, endDate, preset });
  }, [birthDate, dateRange.startDate]);

  const setCustomRange = useCallback((startDate: Date, endDate: Date) => {
    setDateRange({ startDate, endDate, preset: 'custom' });
  }, []);

  const presetOptions = useMemo(() => [
    { value: 'week' as const, label: 'Last 7 days' },
    { value: '2weeks' as const, label: 'Last 2 weeks' },
    { value: 'month' as const, label: 'Last month' },
    { value: 'all' as const, label: 'All data' },
  ], []);

  return {
    dateRange,
    setPreset,
    setCustomRange,
    presetOptions,
  };
}
