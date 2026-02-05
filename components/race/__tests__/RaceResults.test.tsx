/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RaceResults, type RaceResultsProps } from '../RaceResults';
import type { ParticipantState } from '@/lib/ws/race-server';

function makeParticipant(overrides: Partial<ParticipantState> = {}): ParticipantState {
  return {
    userId: 1,
    userName: 'Alice',
    progress: 100,
    currentWpm: 0,
    currentChallengeIndex: 0,
    wpm: 80,
    accuracy: 95,
    finishedAt: '2026-01-15T12:01:00Z',
    rank: 1,
    ...overrides,
  };
}

const raceStartedAt = '2026-01-15T12:00:00Z';

function createFinishedRace(): ParticipantState[] {
  return [
    makeParticipant({ userId: 1, userName: 'Alice', wpm: 95, accuracy: 98, rank: 1, finishedAt: '2026-01-15T12:00:30Z' }),
    makeParticipant({ userId: 2, userName: 'Bob', wpm: 82, accuracy: 94, rank: 2, finishedAt: '2026-01-15T12:00:35Z' }),
    makeParticipant({ userId: 3, userName: 'Charlie', wpm: 70, accuracy: 90, rank: 3, finishedAt: '2026-01-15T12:00:40Z' }),
  ];
}

describe('RaceResults', () => {
  describe('rendering', () => {
    it('should not render when no participants', () => {
      const { container } = render(
        <RaceResults participants={[]} raceStartedAt={raceStartedAt} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render results title', () => {
      const participants = createFinishedRace();
      render(<RaceResults participants={participants} raceStartedAt={raceStartedAt} />);
      expect(screen.getByTestId('results-title')).toBeTruthy();
      expect(screen.getByText('Race Results')).toBeTruthy();
    });

    it('should show finished player count', () => {
      const participants = createFinishedRace();
      render(<RaceResults participants={participants} raceStartedAt={raceStartedAt} />);
      expect(screen.getByText('3 of 3 players finished')).toBeTruthy();
    });

    it('should show singular player text for 1 player', () => {
      const participants = [makeParticipant()];
      render(<RaceResults participants={participants} raceStartedAt={raceStartedAt} />);
      expect(screen.getByText('1 of 1 player finished')).toBeTruthy();
    });
  });

  describe('podium', () => {
    it('should render podium for top 3', () => {
      const participants = createFinishedRace();
      render(<RaceResults participants={participants} raceStartedAt={raceStartedAt} />);
      expect(screen.getByTestId('podium')).toBeTruthy();
      expect(screen.getByTestId('podium-1')).toBeTruthy();
      expect(screen.getByTestId('podium-2')).toBeTruthy();
      expect(screen.getByTestId('podium-3')).toBeTruthy();
    });

    it('should render podium for 2 players', () => {
      const participants = [
        makeParticipant({ userId: 1, userName: 'Alice', rank: 1, wpm: 90 }),
        makeParticipant({ userId: 2, userName: 'Bob', rank: 2, wpm: 75 }),
      ];
      render(<RaceResults participants={participants} raceStartedAt={raceStartedAt} />);
      expect(screen.getByTestId('podium')).toBeTruthy();
      expect(screen.getByTestId('podium-1')).toBeTruthy();
      expect(screen.getByTestId('podium-2')).toBeTruthy();
    });

    it('should render podium for 1 player', () => {
      const participants = [makeParticipant({ userId: 1, userName: 'Alice', rank: 1, wpm: 90 })];
      render(<RaceResults participants={participants} raceStartedAt={raceStartedAt} />);
      expect(screen.getByTestId('podium')).toBeTruthy();
      expect(screen.getByTestId('podium-1')).toBeTruthy();
    });

    it('should show WPM on podium', () => {
      const participants = [makeParticipant({ userId: 1, userName: 'Alice', rank: 1, wpm: 95 })];
      render(<RaceResults participants={participants} raceStartedAt={raceStartedAt} />);
      // WPM appears on both podium and in the rankings table
      const wpmElements = screen.getAllByText('95 WPM');
      expect(wpmElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('rankings table', () => {
    it('should render rankings table', () => {
      const participants = createFinishedRace();
      render(<RaceResults participants={participants} raceStartedAt={raceStartedAt} />);
      expect(screen.getByTestId('rankings-table')).toBeTruthy();
    });

    it('should show a row for each participant', () => {
      const participants = createFinishedRace();
      render(<RaceResults participants={participants} raceStartedAt={raceStartedAt} />);
      expect(screen.getByTestId('result-row-1')).toBeTruthy();
      expect(screen.getByTestId('result-row-2')).toBeTruthy();
      expect(screen.getByTestId('result-row-3')).toBeTruthy();
    });

    it('should display rank numbers', () => {
      const participants = createFinishedRace();
      render(<RaceResults participants={participants} raceStartedAt={raceStartedAt} />);
      expect(screen.getByTestId('rank-1').textContent).toBe('#1');
      expect(screen.getByTestId('rank-2').textContent).toBe('#2');
      expect(screen.getByTestId('rank-3').textContent).toBe('#3');
    });

    it('should display WPM values', () => {
      const participants = createFinishedRace();
      render(<RaceResults participants={participants} raceStartedAt={raceStartedAt} />);
      expect(screen.getByTestId('wpm-value-1').textContent).toBe('95 WPM');
      expect(screen.getByTestId('wpm-value-2').textContent).toBe('82 WPM');
      expect(screen.getByTestId('wpm-value-3').textContent).toBe('70 WPM');
    });

    it('should display accuracy values', () => {
      const participants = createFinishedRace();
      render(<RaceResults participants={participants} raceStartedAt={raceStartedAt} />);
      expect(screen.getByTestId('accuracy-value-1').textContent).toBe('98%');
      expect(screen.getByTestId('accuracy-value-2').textContent).toBe('94%');
      expect(screen.getByTestId('accuracy-value-3').textContent).toBe('90%');
    });

    it('should display WPM comparison bars', () => {
      const participants = createFinishedRace();
      render(<RaceResults participants={participants} raceStartedAt={raceStartedAt} />);
      const bar1 = screen.getByTestId('wpm-bar-1');
      const bar2 = screen.getByTestId('wpm-bar-2');
      const bar3 = screen.getByTestId('wpm-bar-3');

      // First place should have 100% bar width
      expect(bar1.style.width).toBe('100%');
      // Others should be proportionally smaller
      expect(parseFloat(bar2.style.width)).toBeLessThan(100);
      expect(parseFloat(bar3.style.width)).toBeLessThan(parseFloat(bar2.style.width));
    });
  });

  describe('time display', () => {
    it('should show time taken for finished participants', () => {
      const participants = [
        makeParticipant({ userId: 1, userName: 'Alice', rank: 1, finishedAt: '2026-01-15T12:00:30Z' }),
      ];
      render(<RaceResults participants={participants} raceStartedAt={raceStartedAt} />);
      expect(screen.getByTestId('time-value-1').textContent).toBe('30s');
    });

    it('should format time with minutes and seconds', () => {
      const participants = [
        makeParticipant({ userId: 1, userName: 'Alice', rank: 1, finishedAt: '2026-01-15T12:01:30Z' }),
      ];
      render(<RaceResults participants={participants} raceStartedAt={raceStartedAt} />);
      expect(screen.getByTestId('time-value-1').textContent).toBe('1m 30s');
    });

    it('should not show time when raceStartedAt is missing', () => {
      const participants = [
        makeParticipant({ userId: 1, userName: 'Alice', rank: 1, finishedAt: '2026-01-15T12:00:30Z' }),
      ];
      render(<RaceResults participants={participants} />);
      expect(screen.queryByTestId('time-value-1')).toBeNull();
    });
  });

  describe('DNF (did not finish)', () => {
    it('should show DNF label for unfinished participants', () => {
      const participants = [
        makeParticipant({ userId: 1, userName: 'Alice', rank: 1 }),
        makeParticipant({
          userId: 2,
          userName: 'Bob',
          wpm: null,
          accuracy: null,
          finishedAt: null,
          rank: null,
          progress: 50,
        }),
      ];
      render(<RaceResults participants={participants} raceStartedAt={raceStartedAt} />);
      expect(screen.getByTestId('dnf-2')).toBeTruthy();
      expect(screen.getByText('Did not finish')).toBeTruthy();
    });

    it('should show DNF count in header', () => {
      const participants = [
        makeParticipant({ userId: 1, userName: 'Alice', rank: 1 }),
        makeParticipant({
          userId: 2,
          userName: 'Bob',
          finishedAt: null,
          rank: null,
          wpm: null,
          accuracy: null,
          progress: 60,
        }),
      ];
      render(<RaceResults participants={participants} raceStartedAt={raceStartedAt} />);
      expect(screen.getByText('1 of 2 players finished')).toBeTruthy();
    });

    it('should place DNF participants after ranked ones', () => {
      const participants = [
        makeParticipant({
          userId: 2,
          userName: 'Bob',
          finishedAt: null,
          rank: null,
          wpm: null,
          accuracy: null,
          progress: 60,
        }),
        makeParticipant({ userId: 1, userName: 'Alice', rank: 1, wpm: 80 }),
      ];
      render(<RaceResults participants={participants} raceStartedAt={raceStartedAt} />);

      const rows = screen.getByTestId('rankings-table').querySelectorAll('[data-testid^="result-row-"]');
      // Alice (rank 1) should be first, Bob (DNF) should be second
      expect(rows[0].getAttribute('data-testid')).toBe('result-row-1');
      expect(rows[1].getAttribute('data-testid')).toBe('result-row-2');
    });
  });

  describe('current user highlighting', () => {
    it('should highlight current user in rankings', () => {
      const participants = createFinishedRace();
      const { container } = render(
        <RaceResults participants={participants} currentUserId={2} raceStartedAt={raceStartedAt} />
      );

      const row = screen.getByTestId('result-row-2');
      expect(row.className).toContain('bg-blue-50');
    });

    it('should show (you) label for current user', () => {
      const participants = createFinishedRace();
      render(
        <RaceResults participants={participants} currentUserId={1} raceStartedAt={raceStartedAt} />
      );

      // Should show (you) in both podium and table
      const youLabels = screen.getAllByText('(you)');
      expect(youLabels.length).toBeGreaterThanOrEqual(1);
    });

    it('should not highlight other users', () => {
      const participants = createFinishedRace();
      render(
        <RaceResults participants={participants} currentUserId={1} raceStartedAt={raceStartedAt} />
      );

      const row2 = screen.getByTestId('result-row-2');
      expect(row2.className).not.toContain('bg-blue-50');
    });
  });

  describe('edge cases', () => {
    it('should handle participants with same WPM', () => {
      const participants = [
        makeParticipant({ userId: 1, userName: 'Alice', rank: 1, wpm: 80 }),
        makeParticipant({ userId: 2, userName: 'Bob', rank: 2, wpm: 80 }),
      ];
      render(<RaceResults participants={participants} raceStartedAt={raceStartedAt} />);
      const bar1 = screen.getByTestId('wpm-bar-1');
      const bar2 = screen.getByTestId('wpm-bar-2');
      expect(bar1.style.width).toBe('100%');
      expect(bar2.style.width).toBe('100%');
    });

    it('should handle participant with 0 WPM', () => {
      const participants = [
        makeParticipant({ userId: 1, userName: 'Alice', rank: 1, wpm: 80 }),
        makeParticipant({ userId: 2, userName: 'Bob', rank: 2, wpm: 0 }),
      ];
      render(<RaceResults participants={participants} raceStartedAt={raceStartedAt} />);
      expect(screen.getByTestId('wpm-value-2').textContent).toBe('0 WPM');
    });

    it('should handle more than 3 participants', () => {
      const participants = [
        makeParticipant({ userId: 1, userName: 'Alice', rank: 1, wpm: 95 }),
        makeParticipant({ userId: 2, userName: 'Bob', rank: 2, wpm: 85 }),
        makeParticipant({ userId: 3, userName: 'Charlie', rank: 3, wpm: 75 }),
        makeParticipant({ userId: 4, userName: 'Diana', rank: 4, wpm: 65, finishedAt: '2026-01-15T12:00:45Z' }),
      ];
      render(<RaceResults participants={participants} raceStartedAt={raceStartedAt} />);
      expect(screen.getByTestId('result-row-4')).toBeTruthy();
      expect(screen.getByTestId('rank-4').textContent).toBe('#4');
    });

    it('should handle all DNF participants', () => {
      const participants = [
        makeParticipant({ userId: 1, userName: 'Alice', finishedAt: null, rank: null, wpm: null, accuracy: null, progress: 50 }),
        makeParticipant({ userId: 2, userName: 'Bob', finishedAt: null, rank: null, wpm: null, accuracy: null, progress: 30 }),
      ];
      render(<RaceResults participants={participants} raceStartedAt={raceStartedAt} />);
      expect(screen.getByText('0 of 2 players finished')).toBeTruthy();
    });
  });
});
