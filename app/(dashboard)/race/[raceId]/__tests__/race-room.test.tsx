/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { RaceRoom } from '../race-room';

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

// Mock WebSocket hooks
const mockSendStart = vi.fn();
const mockSendLeave = vi.fn();
const mockSendProgress = vi.fn();
const mockSendFinish = vi.fn();

vi.mock('@/lib/ws/use-race-socket', () => ({
  useRaceSocket: () => ({
    connected: false,
    raceState: null,
    sendStart: mockSendStart,
    sendLeave: mockSendLeave,
    sendProgress: mockSendProgress,
    sendFinish: mockSendFinish,
  }),
}));

import useSWR from 'swr';

const mockUseSWR = useSWR as ReturnType<typeof vi.fn>;

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockRace = {
  id: 1,
  status: 'waiting',
  maxPlayers: 4,
  createdAt: new Date().toISOString(),
  startedAt: null,
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
      userName: null,
      userEmail: 'bob@test.com',
    },
  ],
};

describe('RaceRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      mutate: vi.fn(),
    });

    render(<RaceRoom raceId="1" />);
    // Loading spinner should be present (no text content visible)
    expect(screen.queryByText('Race #1')).toBeNull();
  });

  it('should show error state when fetch fails', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: new Error('Failed'),
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<RaceRoom raceId="1" />);
    expect(screen.getByText(/Failed to load race details/)).toBeDefined();
  });

  it('should render race details when data is loaded', () => {
    mockUseSWR.mockReturnValue({
      data: mockRace,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<RaceRoom raceId="1" />);

    expect(screen.getByText('Race #1')).toBeDefined();
    expect(screen.getByText('Waiting')).toBeDefined();
    expect(screen.getByText('Git Basics')).toBeDefined();
    expect(screen.getByText('beginner')).toBeDefined();
    expect(screen.getByText('git')).toBeDefined();
    expect(screen.getByText('git commit -m "initial commit"')).toBeDefined();
  });

  it('should render participants', () => {
    mockUseSWR.mockReturnValue({
      data: mockRace,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<RaceRoom raceId="1" />);

    expect(screen.getByText('Alice')).toBeDefined();
    expect(screen.getByText('bob')).toBeDefined();
    expect(screen.getByText('Players (2/4)')).toBeDefined();
  });

  it('should show empty slots for waiting race', () => {
    mockUseSWR.mockReturnValue({
      data: mockRace,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<RaceRoom raceId="1" />);

    const waitingSlots = screen.getAllByText('Waiting for player...');
    expect(waitingSlots.length).toBe(2); // 4 max - 2 participants = 2 empty slots
  });

  it('should show Leave Race and Start Race buttons when waiting', () => {
    mockUseSWR.mockReturnValue({
      data: mockRace,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<RaceRoom raceId="1" />);

    expect(screen.getByText('Leave Race')).toBeDefined();
    expect(screen.getByText('Start Race')).toBeDefined();
  });

  it('should disable Start Race when less than 2 participants', () => {
    const singlePlayerRace = {
      ...mockRace,
      participants: [mockRace.participants[0]],
    };

    mockUseSWR.mockReturnValue({
      data: singlePlayerRace,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<RaceRoom raceId="1" />);

    const startButton = screen.getByText('Start Race').closest('button');
    expect(startButton).toHaveProperty('disabled', true);
  });

  it('should call leave API and navigate to lobby', async () => {
    const mutateFn = vi.fn();
    mockUseSWR.mockReturnValue({
      data: mockRace,
      error: undefined,
      isLoading: false,
      mutate: mutateFn,
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Left race' }),
    });

    render(<RaceRoom raceId="1" />);

    fireEvent.click(screen.getByText('Leave Race'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/races/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'leave' }),
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/race');
    });
  });

  it('should call start API when Start Race is clicked', async () => {
    const mutateFn = vi.fn();
    mockUseSWR.mockReturnValue({
      data: mockRace,
      error: undefined,
      isLoading: false,
      mutate: mutateFn,
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Race started' }),
    });

    render(<RaceRoom raceId="1" />);

    fireEvent.click(screen.getByText('Start Race'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/races/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
    });
  });

  it('should show error when action fails', async () => {
    mockUseSWR.mockReturnValue({
      data: mockRace,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Cannot start race' }),
    });

    render(<RaceRoom raceId="1" />);

    fireEvent.click(screen.getByText('Start Race'));

    await waitFor(() => {
      expect(screen.getByText('Cannot start race')).toBeDefined();
    });
  });

  it('should show in-progress state', () => {
    const inProgressRace = {
      ...mockRace,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
    };

    mockUseSWR.mockReturnValue({
      data: inProgressRace,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<RaceRoom raceId="1" />);

    expect(screen.getByText('In Progress')).toBeDefined();
    expect(screen.getByText('Race in progress...')).toBeDefined();
    // Participants should show "Typing..." indicator
    const typingIndicators = screen.getAllByText('Typing...');
    expect(typingIndicators.length).toBe(2);
  });

  it('should show finished state with results', () => {
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

    render(<RaceRoom raceId="1" />);

    expect(screen.getByText('Finished')).toBeDefined();
    // Ranks appear in both the participant list and the progress track
    expect(screen.getAllByText('#1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('85 WPM').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('97%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('#2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('72 WPM').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('94%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Back to Lobby')).toBeDefined();
  });

  it('should navigate to lobby when back button is clicked', () => {
    mockUseSWR.mockReturnValue({
      data: mockRace,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<RaceRoom raceId="1" />);

    fireEvent.click(screen.getByText('Back to lobby'));
    expect(mockPush).toHaveBeenCalledWith('/race');
  });

  it('should show 2/4 participant count in header', () => {
    mockUseSWR.mockReturnValue({
      data: mockRace,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<RaceRoom raceId="1" />);

    expect(screen.getByText('2/4')).toBeDefined();
  });
});
