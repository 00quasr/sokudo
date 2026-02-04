/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SpectatorView } from '../SpectatorView';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock SWR
vi.mock('swr', () => {
  const mutate = vi.fn();
  return {
    default: vi.fn(),
    mutate,
  };
});

// Mock spectator socket hook - capture onStateUpdate so we can trigger it
let capturedOnStateUpdate: ((state: unknown) => void) | undefined;
let mockConnected = true;

vi.mock('@/lib/ws/use-race-socket', () => ({
  useSpectatorSocket: (opts: { onStateUpdate?: (state: unknown) => void }) => {
    capturedOnStateUpdate = opts.onStateUpdate;
    return {
      connected: mockConnected,
      raceState: null,
    };
  },
}));

import useSWR from 'swr';

const mockUseSWR = useSWR as ReturnType<typeof vi.fn>;

const mockRace = {
  id: 1,
  status: 'in_progress',
  maxPlayers: 4,
  createdAt: new Date().toISOString(),
  startedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  challenge: {
    id: 1,
    content: 'git commit -m "initial commit"',
    difficulty: 'beginner',
    syntaxType: 'git',
  },
  category: {
    id: 1,
    name: 'Git Basics',
    slug: 'git-basics',
    icon: 'git-branch',
  },
  participants: [
    {
      id: 1,
      userId: 1,
      wpm: null,
      accuracy: null,
      finishedAt: null,
      rank: null,
      userName: 'Alice',
      userEmail: 'alice@test.com',
    },
    {
      id: 2,
      userId: 2,
      wpm: null,
      accuracy: null,
      finishedAt: null,
      rank: null,
      userName: 'Bob',
      userEmail: 'bob@test.com',
    },
  ],
};

describe('SpectatorView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnected = true;
    capturedOnStateUpdate = undefined;
  });

  it('should show loading state', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      mutate: vi.fn(),
    });

    render(<SpectatorView raceId="1" />);
    expect(screen.queryByText('Spectator Mode')).toBeNull();
  });

  it('should show error state when fetch fails', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: new Error('Failed'),
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<SpectatorView raceId="1" />);
    expect(screen.getByText(/Failed to load race details/)).toBeDefined();
  });

  it('should render spectator banner and race details', () => {
    mockUseSWR.mockReturnValue({
      data: mockRace,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<SpectatorView raceId="1" />);

    expect(screen.getByText('Spectator Mode')).toBeDefined();
    expect(screen.getByText('Race #1')).toBeDefined();
    expect(screen.getByText('In Progress')).toBeDefined();
    expect(screen.getByText('Watching')).toBeDefined();
    expect(screen.getByText('Git Basics')).toBeDefined();
    expect(screen.getByText('beginner')).toBeDefined();
    expect(screen.getByText('git commit -m "initial commit"')).toBeDefined();
  });

  it('should show the race progress track for in-progress races', () => {
    mockUseSWR.mockReturnValue({
      data: mockRace,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<SpectatorView raceId="1" />);

    expect(screen.getByTestId('race-progress-track')).toBeDefined();
  });

  it('should show spectator count when available via WebSocket', () => {
    mockUseSWR.mockReturnValue({
      data: mockRace,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<SpectatorView raceId="1" />);

    // Simulate WebSocket state update via the captured callback
    act(() => {
      capturedOnStateUpdate?.({
        type: 'race:state',
        raceId: 1,
        status: 'in_progress',
        participants: [
          {
            userId: 1,
            userName: 'Alice',
            progress: 50,
            currentWpm: 80,
            wpm: null,
            accuracy: null,
            finishedAt: null,
            rank: null,
          },
          {
            userId: 2,
            userName: 'Bob',
            progress: 30,
            currentWpm: 65,
            wpm: null,
            accuracy: null,
            finishedAt: null,
            rank: null,
          },
        ],
        spectatorCount: 3,
      });
    });

    expect(screen.getByText('3 watching')).toBeDefined();
  });

  it('should render results when race is finished', () => {
    const finishedRace = {
      ...mockRace,
      status: 'finished',
      participants: [
        {
          ...mockRace.participants[0],
          wpm: 85,
          accuracy: 97,
          finishedAt: new Date().toISOString(),
          rank: 1,
        },
        {
          ...mockRace.participants[1],
          wpm: 72,
          accuracy: 94,
          finishedAt: new Date().toISOString(),
          rank: 2,
        },
      ],
    };

    mockUseSWR.mockReturnValue({
      data: finishedRace,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<SpectatorView raceId="1" />);

    expect(screen.getByText('Finished')).toBeDefined();
    expect(screen.getByTestId('race-results')).toBeDefined();
  });

  it('should have back to lobby button', () => {
    mockUseSWR.mockReturnValue({
      data: mockRace,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<SpectatorView raceId="1" />);

    expect(screen.getByText('Back to Lobby')).toBeDefined();
  });

  it('should have data-testid spectator-view', () => {
    mockUseSWR.mockReturnValue({
      data: mockRace,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<SpectatorView raceId="1" />);

    expect(screen.getByTestId('spectator-view')).toBeDefined();
  });

  it('should not show action buttons (no start, leave, or typing controls)', () => {
    mockUseSWR.mockReturnValue({
      data: mockRace,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<SpectatorView raceId="1" />);

    expect(screen.queryByText('Start Race')).toBeNull();
    expect(screen.queryByText('Leave Race')).toBeNull();
  });
});
