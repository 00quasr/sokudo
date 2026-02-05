/**
 * @vitest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  RaceProgressTrack,
  type RaceProgressTrackProps,
} from '../RaceProgressTrack';
import type { ParticipantState } from '@/lib/ws/race-server';

function createParticipant(
  overrides: Partial<ParticipantState> = {}
): ParticipantState {
  return {
    userId: 1,
    userName: 'Alice',
    progress: 0,
    currentWpm: 0,
    currentChallengeIndex: 0,
    wpm: null,
    accuracy: null,
    finishedAt: null,
    rank: null,
    ...overrides,
  };
}

function renderTrack(overrides: Partial<RaceProgressTrackProps> = {}) {
  const props: RaceProgressTrackProps = {
    participants: [],
    raceStatus: 'in_progress',
    ...overrides,
  };
  return render(<RaceProgressTrack {...props} />);
}

describe('RaceProgressTrack', () => {
  describe('rendering', () => {
    it('should render the component with heading', () => {
      renderTrack();
      expect(screen.getByText('Race Track')).toBeTruthy();
      expect(screen.getByTestId('race-progress-track')).toBeTruthy();
    });

    it('should show empty state when no participants', () => {
      renderTrack({ participants: [] });
      expect(
        screen.getByText('Waiting for players to join...')
      ).toBeTruthy();
    });

    it('should render a lane for each participant', () => {
      const participants = [
        createParticipant({ userId: 1, userName: 'Alice' }),
        createParticipant({ userId: 2, userName: 'Bob' }),
        createParticipant({ userId: 3, userName: 'Charlie' }),
      ];
      renderTrack({ participants });

      expect(screen.getByTestId('race-lane-1')).toBeTruthy();
      expect(screen.getByTestId('race-lane-2')).toBeTruthy();
      expect(screen.getByTestId('race-lane-3')).toBeTruthy();
    });

    it('should display participant names', () => {
      const participants = [
        createParticipant({ userId: 1, userName: 'Alice' }),
        createParticipant({ userId: 2, userName: 'Bob' }),
      ];
      renderTrack({ participants });

      expect(screen.getByText('Alice')).toBeTruthy();
      expect(screen.getByText('Bob')).toBeTruthy();
    });

    it('should show user avatar with first letter', () => {
      const participants = [
        createParticipant({ userId: 1, userName: 'Alice' }),
      ];
      const { container } = renderTrack({ participants });

      const avatars = container.querySelectorAll('.rounded-full.text-white');
      expect(avatars.length).toBeGreaterThanOrEqual(1);
      expect(avatars[0].textContent).toBe('A');
    });

    it('should apply custom className', () => {
      renderTrack({ className: 'custom-class' });
      const track = screen.getByTestId('race-progress-track');
      expect(track.className).toContain('custom-class');
    });
  });

  describe('current user highlighting', () => {
    it('should highlight current user lane', () => {
      const participants = [
        createParticipant({ userId: 1, userName: 'Alice' }),
        createParticipant({ userId: 2, userName: 'Bob' }),
      ];
      renderTrack({ participants, currentUserId: 1 });

      const lane = screen.getByTestId('race-lane-1');
      expect(lane.className).toContain('border-blue-300');
    });

    it('should show (you) label for current user', () => {
      const participants = [
        createParticipant({ userId: 1, userName: 'Alice' }),
      ];
      renderTrack({ participants, currentUserId: 1 });

      expect(screen.getByText('(you)')).toBeTruthy();
    });

    it('should not show (you) label for other users', () => {
      const participants = [
        createParticipant({ userId: 1, userName: 'Alice' }),
        createParticipant({ userId: 2, userName: 'Bob' }),
      ];
      renderTrack({ participants, currentUserId: 1 });

      const bobLane = screen.getByTestId('race-lane-2');
      expect(within(bobLane).queryByText('(you)')).toBeNull();
    });

    it('should not highlight other users lanes', () => {
      const participants = [
        createParticipant({ userId: 1, userName: 'Alice' }),
        createParticipant({ userId: 2, userName: 'Bob' }),
      ];
      renderTrack({ participants, currentUserId: 1 });

      const lane = screen.getByTestId('race-lane-2');
      expect(lane.className).not.toContain('border-blue-300');
    });
  });

  describe('progress bars', () => {
    it('should render progress bars with correct width', () => {
      const participants = [
        createParticipant({ userId: 1, userName: 'Alice', progress: 50 }),
        createParticipant({ userId: 2, userName: 'Bob', progress: 75 }),
      ];
      renderTrack({ participants });

      const bar1 = screen.getByTestId('progress-bar-1');
      const bar2 = screen.getByTestId('progress-bar-2');
      expect(bar1.style.width).toBe('50%');
      expect(bar2.style.width).toBe('75%');
    });

    it('should clamp progress to 0-100 range', () => {
      const participants = [
        createParticipant({ userId: 1, userName: 'Alice', progress: -10 }),
        createParticipant({ userId: 2, userName: 'Bob', progress: 150 }),
      ];
      renderTrack({ participants });

      const bar1 = screen.getByTestId('progress-bar-1');
      const bar2 = screen.getByTestId('progress-bar-2');
      expect(bar1.style.width).toBe('0%');
      expect(bar2.style.width).toBe('100%');
    });

    it('should show 0% progress for waiting participants', () => {
      const participants = [
        createParticipant({ userId: 1, userName: 'Alice', progress: 0 }),
      ];
      renderTrack({ participants });

      const bar = screen.getByTestId('progress-bar-1');
      expect(bar.style.width).toBe('0%');
    });

    it('should show 100% progress for finished participants', () => {
      const participants = [
        createParticipant({
          userId: 1,
          userName: 'Alice',
          progress: 100,
          finishedAt: '2024-01-01T00:00:00Z',
          rank: 1,
          wpm: 80,
          accuracy: 98,
        }),
      ];
      renderTrack({ participants });

      const bar = screen.getByTestId('progress-bar-1');
      expect(bar.style.width).toBe('100%');
    });

    it('should have aria attributes on progress bars', () => {
      const participants = [
        createParticipant({ userId: 1, userName: 'Alice', progress: 42 }),
      ];
      renderTrack({ participants });

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar.getAttribute('aria-valuenow')).toBe('42');
      expect(progressbar.getAttribute('aria-valuemin')).toBe('0');
      expect(progressbar.getAttribute('aria-valuemax')).toBe('100');
      expect(progressbar.getAttribute('aria-label')).toBe('Alice progress');
    });
  });

  describe('stats display during race', () => {
    it('should show current WPM during active race', () => {
      const participants = [
        createParticipant({
          userId: 1,
          userName: 'Alice',
          progress: 50,
          currentWpm: 65,
        }),
      ];
      renderTrack({ participants, raceStatus: 'in_progress' });

      expect(screen.getByTestId('wpm-1').textContent).toContain('65');
      expect(screen.getByTestId('wpm-1').textContent).toContain('WPM');
    });

    it('should show progress percentage during active race', () => {
      const participants = [
        createParticipant({
          userId: 1,
          userName: 'Alice',
          progress: 42,
        }),
      ];
      renderTrack({ participants, raceStatus: 'in_progress' });

      expect(screen.getByTestId('progress-pct-1').textContent).toBe('42%');
    });

    it('should not show WPM when currentWpm is 0', () => {
      const participants = [
        createParticipant({
          userId: 1,
          userName: 'Alice',
          progress: 0,
          currentWpm: 0,
        }),
      ];
      renderTrack({ participants, raceStatus: 'in_progress' });

      expect(screen.queryByTestId('wpm-1')).toBeNull();
    });
  });

  describe('finished state', () => {
    it('should show final WPM for finished participants', () => {
      const participants = [
        createParticipant({
          userId: 1,
          userName: 'Alice',
          progress: 100,
          currentWpm: 80,
          wpm: 80,
          accuracy: 98,
          finishedAt: '2024-01-01T00:00:00Z',
          rank: 1,
        }),
      ];
      renderTrack({ participants, raceStatus: 'finished' });

      expect(screen.getByTestId('wpm-1').textContent).toContain('80');
    });

    it('should show accuracy for finished participants', () => {
      const participants = [
        createParticipant({
          userId: 1,
          userName: 'Alice',
          progress: 100,
          currentWpm: 80,
          wpm: 80,
          accuracy: 98,
          finishedAt: '2024-01-01T00:00:00Z',
          rank: 1,
        }),
      ];
      renderTrack({ participants, raceStatus: 'finished' });

      expect(screen.getByTestId('accuracy-1').textContent).toBe('98%');
    });

    it('should show rank for finished participants', () => {
      const participants = [
        createParticipant({
          userId: 1,
          userName: 'Alice',
          progress: 100,
          currentWpm: 80,
          wpm: 80,
          accuracy: 98,
          finishedAt: '2024-01-01T00:00:00Z',
          rank: 1,
        }),
      ];
      renderTrack({ participants, raceStatus: 'finished' });

      expect(screen.getByTestId('rank-1').textContent).toBe('#1');
    });

    it('should show crown icon for 1st place', () => {
      const participants = [
        createParticipant({
          userId: 1,
          userName: 'Alice',
          progress: 100,
          currentWpm: 80,
          wpm: 80,
          accuracy: 98,
          finishedAt: '2024-01-01T00:00:00Z',
          rank: 1,
        }),
      ];
      renderTrack({ participants, raceStatus: 'finished' });

      expect(screen.getByTestId('rank-icon-1')).toBeTruthy();
    });
  });

  describe('sorting', () => {
    it('should sort finished participants by rank', () => {
      const participants = [
        createParticipant({
          userId: 2,
          userName: 'Bob',
          progress: 100,
          wpm: 70,
          accuracy: 95,
          finishedAt: '2024-01-01T00:00:02Z',
          rank: 2,
          currentWpm: 70,
        }),
        createParticipant({
          userId: 1,
          userName: 'Alice',
          progress: 100,
          wpm: 80,
          accuracy: 98,
          finishedAt: '2024-01-01T00:00:01Z',
          rank: 1,
          currentWpm: 80,
        }),
      ];
      renderTrack({ participants, raceStatus: 'finished' });

      const lanes = screen.getByTestId('race-lanes');
      const laneElements = lanes.querySelectorAll('[data-testid^="race-lane-"]');
      expect(laneElements[0].getAttribute('data-testid')).toBe('race-lane-1');
      expect(laneElements[1].getAttribute('data-testid')).toBe('race-lane-2');
    });

    it('should sort unfinished participants by progress descending', () => {
      const participants = [
        createParticipant({
          userId: 1,
          userName: 'Alice',
          progress: 30,
        }),
        createParticipant({
          userId: 2,
          userName: 'Bob',
          progress: 70,
        }),
      ];
      renderTrack({ participants, raceStatus: 'in_progress' });

      const lanes = screen.getByTestId('race-lanes');
      const laneElements = lanes.querySelectorAll('[data-testid^="race-lane-"]');
      expect(laneElements[0].getAttribute('data-testid')).toBe('race-lane-2');
      expect(laneElements[1].getAttribute('data-testid')).toBe('race-lane-1');
    });

    it('should show finished participants before unfinished ones', () => {
      const participants = [
        createParticipant({
          userId: 1,
          userName: 'Alice',
          progress: 70,
        }),
        createParticipant({
          userId: 2,
          userName: 'Bob',
          progress: 100,
          wpm: 80,
          accuracy: 98,
          finishedAt: '2024-01-01T00:00:00Z',
          rank: 1,
          currentWpm: 80,
        }),
      ];
      renderTrack({ participants, raceStatus: 'in_progress' });

      const lanes = screen.getByTestId('race-lanes');
      const laneElements = lanes.querySelectorAll('[data-testid^="race-lane-"]');
      expect(laneElements[0].getAttribute('data-testid')).toBe('race-lane-2');
      expect(laneElements[1].getAttribute('data-testid')).toBe('race-lane-1');
    });
  });

  describe('race status labels', () => {
    it('should show LIVE label during in_progress', () => {
      renderTrack({
        participants: [createParticipant()],
        raceStatus: 'in_progress',
      });
      expect(screen.getByText('LIVE')).toBeTruthy();
    });

    it('should show LIVE label during countdown', () => {
      renderTrack({
        participants: [createParticipant()],
        raceStatus: 'countdown',
      });
      expect(screen.getByText('LIVE')).toBeTruthy();
    });

    it('should show FINISHED label when race is done', () => {
      renderTrack({
        participants: [createParticipant()],
        raceStatus: 'finished',
      });
      expect(screen.getByText('FINISHED')).toBeTruthy();
    });

    it('should not show LIVE or FINISHED during waiting', () => {
      renderTrack({
        participants: [createParticipant()],
        raceStatus: 'waiting',
      });
      expect(screen.queryByText('LIVE')).toBeNull();
      expect(screen.queryByText('FINISHED')).toBeNull();
    });
  });

  describe('progress updates', () => {
    it('should update progress bar width when props change', () => {
      const participants = [
        createParticipant({ userId: 1, userName: 'Alice', progress: 25 }),
      ];
      const { rerender } = render(
        <RaceProgressTrack
          participants={participants}
          raceStatus="in_progress"
        />
      );

      expect(screen.getByTestId('progress-bar-1').style.width).toBe('25%');

      const updated = [
        createParticipant({ userId: 1, userName: 'Alice', progress: 75 }),
      ];
      rerender(
        <RaceProgressTrack
          participants={updated}
          raceStatus="in_progress"
        />
      );

      expect(screen.getByTestId('progress-bar-1').style.width).toBe('75%');
    });

    it('should handle multiple participants at different progress levels', () => {
      const participants = [
        createParticipant({
          userId: 1,
          userName: 'Alice',
          progress: 80,
          currentWpm: 90,
        }),
        createParticipant({
          userId: 2,
          userName: 'Bob',
          progress: 45,
          currentWpm: 60,
        }),
        createParticipant({
          userId: 3,
          userName: 'Charlie',
          progress: 20,
          currentWpm: 40,
        }),
      ];
      renderTrack({ participants, raceStatus: 'in_progress' });

      expect(screen.getByTestId('progress-bar-1').style.width).toBe('80%');
      expect(screen.getByTestId('progress-bar-2').style.width).toBe('45%');
      expect(screen.getByTestId('progress-bar-3').style.width).toBe('20%');
    });
  });
});
