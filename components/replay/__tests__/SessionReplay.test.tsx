/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SessionReplay, SessionReplayData, KeystrokeLogEntry, mapSyntaxType, formatTime } from '../SessionReplay';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const createKeystrokeLog = (
  timestamp: number,
  expected: string,
  actual: string,
  isCorrect: boolean = expected === actual,
  latencyMs: number = 100
): KeystrokeLogEntry => ({
  id: Math.random(),
  timestamp,
  expected,
  actual,
  isCorrect,
  latencyMs,
});

const createSessionData = (
  content: string = 'git commit',
  keystrokeLogs: KeystrokeLogEntry[] = []
): SessionReplayData => {
  // Generate default keystroke logs if not provided
  if (keystrokeLogs.length === 0) {
    let timestamp = 0;
    for (const char of content) {
      timestamp += 100;
      keystrokeLogs.push(createKeystrokeLog(timestamp, char, char, true, 100));
    }
  }

  const durationMs = keystrokeLogs.length > 0
    ? keystrokeLogs[keystrokeLogs.length - 1].timestamp + 100
    : 1000;

  return {
    id: 1,
    wpm: 60,
    rawWpm: 65,
    accuracy: 95,
    keystrokes: content.length,
    errors: Math.floor(content.length * 0.05),
    durationMs,
    completedAt: new Date(),
    challenge: {
      id: 1,
      content,
      difficulty: 'beginner',
      syntaxType: 'git',
      category: {
        id: 1,
        name: 'Git Basics',
        slug: 'git-basics',
      },
    },
    keystrokeLogs,
  };
};

describe('SessionReplay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('should render the component with session data', () => {
      const session = createSessionData('git commit');
      render(<SessionReplay session={session} />);

      expect(screen.getByText('Git Basics')).toBeTruthy();
      expect(screen.getByText(/Session Replay/)).toBeTruthy();
    });

    it('should show final WPM and accuracy', () => {
      const session = createSessionData();
      render(<SessionReplay session={session} />);

      expect(screen.getByText('60 WPM')).toBeTruthy();
      expect(screen.getByText('95%')).toBeTruthy();
    });

    it('should render back link to history', () => {
      const session = createSessionData();
      render(<SessionReplay session={session} />);

      const backLink = screen.getByText('Back to History');
      expect(backLink).toBeTruthy();
      const anchor = backLink.closest('a');
      expect(anchor).toBeTruthy();
      expect(anchor?.getAttribute('href')).toBe('/dashboard/history');
    });

    it('should render playback controls', () => {
      const session = createSessionData();
      render(<SessionReplay session={session} />);

      expect(screen.getByTitle('Play (Space)')).toBeTruthy();
      expect(screen.getByTitle('Reset (R)')).toBeTruthy();
      expect(screen.getByTitle('Skip Back 2s (←)')).toBeTruthy();
      expect(screen.getByTitle('Skip Forward 2s (→)')).toBeTruthy();
      expect(screen.getByTitle('Change Speed (S)')).toBeTruthy();
    });

    it('should show initial time as 0', () => {
      const session = createSessionData();
      render(<SessionReplay session={session} />);

      // Initial time should be 0.0s
      expect(screen.getByText('0.0s')).toBeTruthy();
    });

    it('should render seek bar', () => {
      const session = createSessionData();
      render(<SessionReplay session={session} />);

      expect(screen.getByTestId('replay-seek-bar')).toBeTruthy();
    });

    it('should render keyboard hints including E for errors', () => {
      const session = createSessionData('ab', [
        createKeystrokeLog(100, 'a', 'x', false),
        createKeystrokeLog(200, 'b', 'b', true),
      ]);
      const { container } = render(<SessionReplay session={session} />);

      // E key hint for toggling error summary
      const kbds = container.querySelectorAll('kbd');
      const eKbd = Array.from(kbds).find((kbd) => kbd.textContent === 'E');
      expect(eKbd).toBeTruthy();
    });
  });

  describe('error timeline', () => {
    it('should render error timeline when errors exist', () => {
      const logs = [
        createKeystrokeLog(100, 'a', 'x', false),
        createKeystrokeLog(200, 'b', 'b', true),
      ];
      const session = createSessionData('ab', logs);
      render(<SessionReplay session={session} />);

      expect(screen.getByTestId('error-timeline')).toBeTruthy();
    });

    it('should not render error timeline when no errors', () => {
      const logs = [
        createKeystrokeLog(100, 'a', 'a', true),
        createKeystrokeLog(200, 'b', 'b', true),
      ];
      const session = createSessionData('ab', logs);
      render(<SessionReplay session={session} />);

      expect(screen.queryByTestId('error-timeline')).toBeNull();
    });
  });

  describe('error summary', () => {
    it('should show error count button when errors exist', () => {
      const logs = [
        createKeystrokeLog(100, 'a', 'x', false),
        createKeystrokeLog(200, 'b', 'b', true),
      ];
      const session = createSessionData('ab', logs);
      render(<SessionReplay session={session} />);

      expect(screen.getByTestId('toggle-error-summary')).toBeTruthy();
      expect(screen.getByText('1 error')).toBeTruthy();
    });

    it('should show plural errors for multiple errors', () => {
      const logs = [
        createKeystrokeLog(100, 'a', 'x', false),
        createKeystrokeLog(200, 'b', 'y', false),
      ];
      const session = createSessionData('ab', logs);
      render(<SessionReplay session={session} />);

      expect(screen.getByText('2 errors')).toBeTruthy();
    });

    it('should not show error button when no errors', () => {
      const logs = [
        createKeystrokeLog(100, 'a', 'a', true),
        createKeystrokeLog(200, 'b', 'b', true),
      ];
      const session = createSessionData('ab', logs);
      render(<SessionReplay session={session} />);

      expect(screen.queryByTestId('toggle-error-summary')).toBeNull();
    });

    it('should toggle error summary panel on button click', () => {
      const logs = [
        createKeystrokeLog(100, 'a', 'x', false),
        createKeystrokeLog(200, 'b', 'b', true),
      ];
      const session = createSessionData('ab', logs);
      render(<SessionReplay session={session} />);

      // Initially hidden
      expect(screen.queryByTestId('error-summary')).toBeNull();

      // Click to show
      fireEvent.click(screen.getByTestId('toggle-error-summary'));
      expect(screen.getByTestId('error-summary')).toBeTruthy();

      // Click to hide
      fireEvent.click(screen.getByTestId('toggle-error-summary'));
      expect(screen.queryByTestId('error-summary')).toBeNull();
    });

    it('should toggle error summary panel with E key', () => {
      const logs = [
        createKeystrokeLog(100, 'a', 'x', false),
        createKeystrokeLog(200, 'b', 'b', true),
      ];
      const session = createSessionData('ab', logs);
      render(<SessionReplay session={session} />);

      // Initially hidden
      expect(screen.queryByTestId('error-summary')).toBeNull();

      // Press E to show
      fireEvent.keyDown(window, { key: 'e' });
      expect(screen.getByTestId('error-summary')).toBeTruthy();

      // Press E to hide
      fireEvent.keyDown(window, { key: 'e' });
      expect(screen.queryByTestId('error-summary')).toBeNull();
    });
  });

  describe('playback controls', () => {
    it('should toggle play/pause on button click', async () => {
      const session = createSessionData();
      render(<SessionReplay session={session} />);

      const playButton = screen.getByTitle('Play (Space)');
      expect(playButton).toBeTruthy();

      fireEvent.click(playButton);
      expect(screen.getByTitle('Pause (Space)')).toBeTruthy();

      fireEvent.click(screen.getByTitle('Pause (Space)'));
      expect(screen.getByTitle('Play (Space)')).toBeTruthy();
    });

    it('should reset playback on reset button click', async () => {
      const session = createSessionData();
      render(<SessionReplay session={session} />);

      // Start playing
      fireEvent.click(screen.getByTitle('Play (Space)'));

      // Advance time
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Reset
      fireEvent.click(screen.getByTitle('Reset (R)'));

      // Should be paused and at 0
      expect(screen.getByTitle('Play (Space)')).toBeTruthy();
      expect(screen.getByText('0.0s')).toBeTruthy();
    });

    it('should cycle through playback speeds', () => {
      const session = createSessionData();
      render(<SessionReplay session={session} />);

      const speedButton = screen.getByTitle('Change Speed (S)');

      expect(screen.getByText('1x')).toBeTruthy();

      fireEvent.click(speedButton);
      expect(screen.getByText('1.5x')).toBeTruthy();

      fireEvent.click(speedButton);
      expect(screen.getByText('2x')).toBeTruthy();

      fireEvent.click(speedButton);
      expect(screen.getByText('4x')).toBeTruthy();

      fireEvent.click(speedButton);
      expect(screen.getByText('0.5x')).toBeTruthy();

      fireEvent.click(speedButton);
      expect(screen.getByText('1x')).toBeTruthy();
    });
  });

  describe('keyboard shortcuts', () => {
    it('should toggle play/pause on space key', () => {
      const session = createSessionData();
      render(<SessionReplay session={session} />);

      expect(screen.getByTitle('Play (Space)')).toBeTruthy();

      fireEvent.keyDown(window, { key: ' ' });
      expect(screen.getByTitle('Pause (Space)')).toBeTruthy();

      fireEvent.keyDown(window, { key: ' ' });
      expect(screen.getByTitle('Play (Space)')).toBeTruthy();
    });

    it('should reset on R key', async () => {
      const session = createSessionData();
      render(<SessionReplay session={session} />);

      // Start playing and advance
      fireEvent.keyDown(window, { key: ' ' });
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Reset with R key
      fireEvent.keyDown(window, { key: 'r' });

      expect(screen.getByTitle('Play (Space)')).toBeTruthy();
      expect(screen.getByText('0.0s')).toBeTruthy();
    });

    it('should change speed on S key', () => {
      const session = createSessionData();
      render(<SessionReplay session={session} />);

      expect(screen.getByText('1x')).toBeTruthy();

      fireEvent.keyDown(window, { key: 's' });
      expect(screen.getByText('1.5x')).toBeTruthy();

      fireEvent.keyDown(window, { key: 'S' });
      expect(screen.getByText('2x')).toBeTruthy();
    });
  });

  describe('progress tracking', () => {
    it('should show cursor at initial position', () => {
      const session = createSessionData('test');
      const { container } = render(<SessionReplay session={session} />);

      // At time 0, cursor should be at position 0
      const cursor = container.querySelector('[data-testid="typing-cursor"]');
      expect(cursor).toBeTruthy();
    });

    it('should update cursor position as time progresses', async () => {
      const content = 'ab';
      const logs = [
        createKeystrokeLog(100, 'a', 'a'),
        createKeystrokeLog(200, 'b', 'b'),
      ];
      const session = createSessionData(content, logs);
      render(<SessionReplay session={session} />);

      // Start playback
      fireEvent.click(screen.getByTitle('Play (Space)'));

      // Advance past first keystroke
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // First character should now be typed (green)
      const firstChar = screen.getByTestId('char-0');
      expect(firstChar.className).toContain('text-green-500');
    });

    it('should show errors with correct highlighting', async () => {
      const content = 'ab';
      const logs = [
        createKeystrokeLog(100, 'a', 'x', false), // Error
        createKeystrokeLog(200, 'b', 'b', true),
      ];
      const session = createSessionData(content, logs);
      render(<SessionReplay session={session} />);

      // Start playback and advance past first keystroke
      fireEvent.click(screen.getByTitle('Play (Space)'));
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // First character should show as error (red)
      const firstChar = screen.getByTestId('char-0');
      expect(firstChar.className).toContain('text-red-500');
    });
  });

  describe('seeking', () => {
    it('should update position when using range slider', () => {
      const content = 'test';
      const logs = [
        createKeystrokeLog(250, 't', 't'),
        createKeystrokeLog(500, 'e', 'e'),
        createKeystrokeLog(750, 's', 's'),
        createKeystrokeLog(1000, 't', 't'),
      ];
      const session = createSessionData(content, logs);
      render(<SessionReplay session={session} />);

      const slider = screen.getByTestId('replay-seek-bar');

      // Seek to middle
      fireEvent.change(slider, { target: { value: '500' } });

      // Should show 2 characters typed
      const char0 = screen.getByTestId('char-0');
      const char1 = screen.getByTestId('char-1');
      expect(char0.className).toContain('text-green-500');
      expect(char1.className).toContain('text-green-500');
    });
  });

  describe('syntax highlighting', () => {
    it('should apply git syntax highlighting', () => {
      const session = createSessionData('git commit -m "test"');
      session.challenge.syntaxType = 'git';
      const { container } = render(<SessionReplay session={session} />);

      expect(container.querySelector('[data-testid="typing-area"]')).toBeTruthy();
    });

    it('should handle unknown syntax types gracefully', () => {
      const session = createSessionData('hello world');
      session.challenge.syntaxType = 'unknown';
      const { container } = render(<SessionReplay session={session} />);

      expect(container.querySelector('[data-testid="typing-area"]')).toBeTruthy();
    });
  });

  describe('completion state', () => {
    it('should hide cursor when playback is complete', async () => {
      const content = 'ab';
      const logs = [
        createKeystrokeLog(100, 'a', 'a'),
        createKeystrokeLog(200, 'b', 'b'),
      ];
      const session = createSessionData(content, logs);
      session.durationMs = 300;

      const { container } = render(<SessionReplay session={session} />);

      // Start playback
      fireEvent.click(screen.getByTitle('Play (Space)'));

      // Advance past end
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Cursor should be hidden
      const cursor = container.querySelector('[data-testid="typing-cursor"]');
      expect(cursor).toBeNull();
    });
  });

  describe('stats display', () => {
    it('should show WPM stat', () => {
      const session = createSessionData('test');
      render(<SessionReplay session={session} />);

      // Stats bar should show WPM
      expect(screen.getByTestId('stats-wpm')).toBeTruthy();
    });

    it('should show accuracy stat', () => {
      const session = createSessionData('test');
      render(<SessionReplay session={session} />);

      expect(screen.getByTestId('stats-accuracy')).toBeTruthy();
    });

    it('should show time stat', () => {
      const session = createSessionData('test');
      render(<SessionReplay session={session} />);

      expect(screen.getByTestId('stats-time')).toBeTruthy();
    });
  });
});

describe('mapSyntaxType', () => {
  it('should map valid syntax types', () => {
    expect(mapSyntaxType('git')).toBe('git');
    expect(mapSyntaxType('shell')).toBe('shell');
    expect(mapSyntaxType('react')).toBe('react');
    expect(mapSyntaxType('typescript')).toBe('typescript');
    expect(mapSyntaxType('docker')).toBe('docker');
    expect(mapSyntaxType('sql')).toBe('sql');
    expect(mapSyntaxType('npm')).toBe('npm');
    expect(mapSyntaxType('yarn')).toBe('yarn');
    expect(mapSyntaxType('pnpm')).toBe('pnpm');
    expect(mapSyntaxType('plain')).toBe('plain');
  });

  it('should map aliases', () => {
    expect(mapSyntaxType('bash')).toBe('shell');
    expect(mapSyntaxType('terminal')).toBe('shell');
    expect(mapSyntaxType('ts')).toBe('typescript');
    expect(mapSyntaxType('js')).toBe('typescript');
    expect(mapSyntaxType('javascript')).toBe('typescript');
    expect(mapSyntaxType('jsx')).toBe('react');
    expect(mapSyntaxType('tsx')).toBe('react');
  });

  it('should be case insensitive', () => {
    expect(mapSyntaxType('GIT')).toBe('git');
    expect(mapSyntaxType('Shell')).toBe('shell');
    expect(mapSyntaxType('BASH')).toBe('shell');
  });

  it('should return plain for unknown types', () => {
    expect(mapSyntaxType('unknown')).toBe('plain');
    expect(mapSyntaxType('')).toBe('plain');
    expect(mapSyntaxType('python')).toBe('plain');
  });
});

describe('formatTime', () => {
  it('should format seconds with tenths', () => {
    expect(formatTime(0)).toBe('0.0s');
    expect(formatTime(1500)).toBe('1.5s');
    expect(formatTime(3200)).toBe('3.2s');
  });

  it('should format minutes and seconds', () => {
    expect(formatTime(60000)).toBe('1:00.0');
    expect(formatTime(65500)).toBe('1:05.5');
    expect(formatTime(125000)).toBe('2:05.0');
  });

  it('should handle large durations', () => {
    expect(formatTime(600000)).toBe('10:00.0');
  });
});
