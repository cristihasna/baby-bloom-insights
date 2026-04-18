import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DailyTimeline } from './DailyTimeline';
import { DaySummary, OverlayType } from '@/types/baby-log';

function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });

  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: width < 768,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function createDay(date: string, overrides: Partial<DaySummary> = {}): DaySummary {
  return {
    date,
    totalSleepTime24h: 420,
    totalNightSleepTime24h: 240,
    totalFeedingTime24h: 90,
    totalDaySleepTime: 180,
    wetDiaperChanges: 2,
    dirtyDiaperChanges: 1,
    mixedDiaperChanges: 1,
    totalDiaperChanges: 4,
    napSessions: 2,
    averageDaySleepDuration: 90,
    averageDayWakeDuration: 120,
    averageNightWakeDuration: 45,
    averageNightSleepDuration: 180,
    averageInBetweenFeedsDuration: 150,
    feedingSessions: 3,
    totalNightWakeUps: 1,
    feedings: [],
    naps: [],
    comments: [],
    diaperChanges: [],
    ...overrides,
  };
}

function renderTimeline(data: DaySummary[], activeOverlays: OverlayType[]) {
  return render(
    <DailyTimeline
      data={data}
      birthDate="2024-04-01"
      nightStartHour={19}
      nightEndHour={7}
      activeOverlays={activeOverlays}
    />,
  );
}

describe('DailyTimeline', () => {
  beforeEach(() => {
    setViewport(1024);
  });

  it('renders the desktop matrix on tablet and desktop widths', async () => {
    renderTimeline([createDay('2024-04-07')], ['naps']);

    expect(await screen.findByTestId('timeline-desktop-grid')).toBeInTheDocument();
    expect(screen.queryByTestId('timeline-mobile-cards')).not.toBeInTheDocument();
    expect(screen.getByText('00:00')).toBeInTheDocument();
  });

  it('renders mobile day cards with week badges only when the week changes', async () => {
    setViewport(375);

    renderTimeline(
      [createDay('2024-04-07'), createDay('2024-04-08'), createDay('2024-04-09')],
      ['naps'],
    );

    expect(await screen.findByTestId('timeline-mobile-carousel')).toBeInTheDocument();
    expect(screen.queryByTestId('timeline-desktop-grid')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('timeline-mobile-card')).toHaveLength(3);
    expect(screen.getAllByText('Week 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Week 2').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Previous day')).toBeInTheDocument();
    expect(screen.getByLabelText('Next day')).toBeInTheDocument();
    expect(screen.getByText('Tue, Apr 9')).toBeInTheDocument();
    expect(screen.getByText('3 of 3')).toBeInTheDocument();
  });

  it('hides inactive overlay rows and markers in mobile mode', async () => {
    setViewport(375);

    renderTimeline(
      [
        createDay('2024-04-08', {
          naps: [
            {
              start: '2024-04-08T02:00:00',
              end: '2024-04-08T03:00:00',
              durationMinutes: 60,
              isNightSleep: false,
              rawMessages: ['Nap started', 'Nap ended'],
            },
          ],
          feedings: [
            {
              start: '2024-04-08T04:00:00',
              end: '2024-04-08T04:30:00',
              durationMinutes: 30,
              rawMessages: ['Feeding started', 'Feeding ended'],
            },
          ],
          comments: [{ time: '2024-04-08T05:00:00', message: 'Calm morning.' }],
        }),
      ],
      ['naps', 'comments'],
    );

    expect(await screen.findByTestId('timeline-mobile-carousel')).toBeInTheDocument();
    expect(screen.getByLabelText('Day Sleep Apr 8, 02:00 to Apr 8, 03:00')).toBeInTheDocument();
    expect(screen.getByLabelText('Comment at Apr 8, 05:00')).toBeInTheDocument();
    expect(screen.queryByLabelText('Feeding Apr 8, 04:00 to Apr 8, 04:30')).not.toBeInTheDocument();
    expect(screen.queryByText('Day sleep')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Toggle events for Apr 8'));

    expect(screen.getByText('Day sleep')).toBeInTheDocument();
    expect(screen.getByText('Comment')).toBeInTheDocument();
    expect(screen.queryByText('Feeding')).not.toBeInTheDocument();
  });

  it('sorts the mobile event list chronologically', async () => {
    setViewport(375);

    renderTimeline(
      [
        createDay('2024-04-08', {
          naps: [
            {
              start: '2024-04-08T02:00:00',
              end: '2024-04-08T03:00:00',
              durationMinutes: 60,
              isNightSleep: false,
              rawMessages: ['Nap started', 'Nap ended'],
            },
          ],
          feedings: [
            {
              start: '2024-04-08T04:00:00',
              end: '2024-04-08T04:20:00',
              durationMinutes: 20,
              rawMessages: ['Feeding started', 'Feeding ended'],
            },
          ],
          comments: [{ time: '2024-04-08T01:00:00', message: 'Early note' }],
          diaperChanges: [{ time: '2024-04-08T05:00:00', type: 'WET', rawMessage: 'Wet diaper' }],
        }),
      ],
      ['naps', 'feedings', 'wetDiapers', 'comments'],
    );

    await screen.findByTestId('timeline-mobile-carousel');
    fireEvent.click(screen.getByLabelText('Toggle events for Apr 8'));
    const rows = screen.getAllByTestId('mobile-event-row');
    const titles = rows.map((row) => {
      const text = within(row).getByText(/Comment|Day sleep|Feeding|Wet diaper/);
      return text.textContent;
    });

    expect(titles).toEqual(['Comment', 'Day sleep', 'Feeding', 'Wet diaper']);
  });

  it('shows clipped midnight-spanning sessions correctly in the mobile event list', async () => {
    setViewport(375);

    renderTimeline(
      [
        createDay('2024-04-08', {
          naps: [
            {
              start: '2024-04-08T23:00:00',
              end: '2024-04-09T02:00:00',
              durationMinutes: 180,
              isNightSleep: true,
              rawMessages: ['Night sleep started', 'Night sleep ended'],
            },
          ],
        }),
      ],
      ['naps', 'nightIndicator'],
    );

    await screen.findByTestId('timeline-mobile-carousel');
    expect(screen.queryByTestId('mobile-event-row')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Toggle events for Apr 8'));
    const row = screen.getByTestId('mobile-event-row');

    await waitFor(() => {
      expect(within(row).getByText('Night sleep')).toBeInTheDocument();
    });
    expect(within(row).getByText('23:00-00:00')).toBeInTheDocument();
    expect(within(row).getByText('Continues after midnight')).toBeInTheDocument();
  });

  it('keeps the mobile event list collapsed by default', async () => {
    setViewport(375);

    renderTimeline(
      [
        createDay('2024-04-08', {
          comments: [{ time: '2024-04-08T01:00:00', message: 'Early note' }],
        }),
      ],
      ['comments'],
    );

    await screen.findByTestId('timeline-mobile-carousel');
    expect(screen.getByText('1 visible event')).toBeInTheDocument();
    expect(screen.queryByTestId('mobile-event-row')).not.toBeInTheDocument();
  });
});
