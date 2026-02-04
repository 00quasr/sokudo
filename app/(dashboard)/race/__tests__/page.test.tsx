/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { RaceLobby } from '../race-lobby';
import { RaceCard } from '../race-card';
import { CreateRaceDialog } from '../create-race-dialog';

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
vi.mock('@/lib/ws/use-race-socket', () => ({
  useLobbySocket: () => ({ connected: false }),
  useRaceSocket: () => ({
    connected: false,
    raceState: null,
    sendStart: vi.fn(),
    sendLeave: vi.fn(),
    sendProgress: vi.fn(),
    sendFinish: vi.fn(),
  }),
}));

import useSWR from 'swr';
import { mutate } from 'swr';

const mockUseSWR = useSWR as ReturnType<typeof vi.fn>;

// Mock fetch for client components
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('RaceCard', () => {
  const mockRace = {
    id: 1,
    status: 'waiting',
    maxPlayers: 4,
    createdAt: new Date().toISOString(),
    startedAt: null,
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
    participantCount: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render race card with challenge preview', () => {
    render(<RaceCard race={mockRace} />);

    expect(screen.getByText('Git Basics')).toBeDefined();
    expect(screen.getByText('beginner')).toBeDefined();
    expect(screen.getByText('2/4')).toBeDefined();
    expect(screen.getByText('git')).toBeDefined();
    expect(screen.getByText('Join Race')).toBeDefined();
  });

  it('should show Full button when race is full', () => {
    const fullRace = { ...mockRace, participantCount: 4, maxPlayers: 4 };
    render(<RaceCard race={fullRace} />);

    const button = screen.getByRole('button');
    expect(button.textContent).toContain('Full');
    expect(button).toHaveProperty('disabled', true);
  });

  it('should call join API and navigate to race room when Join Race button is clicked', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Joined race' }),
    });

    render(<RaceCard race={mockRace} />);

    const button = screen.getByText('Join Race');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/races/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join' }),
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/race/1');
    });
  });

  it('should display error when join fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Race is full' }),
    });

    render(<RaceCard race={mockRace} />);

    const button = screen.getByText('Join Race');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Race is full')).toBeDefined();
    });
  });

  it('should truncate long challenge content', () => {
    const longContent = 'a'.repeat(100);
    const longContentRace = {
      ...mockRace,
      challenge: {
        ...mockRace.challenge,
        content: longContent,
      },
    };
    render(<RaceCard race={longContentRace} />);

    // Content should be truncated at 60 chars with ellipsis
    const truncated = longContent.slice(0, 60) + '...';
    expect(screen.getByText(truncated)).toBeDefined();
    expect(screen.getByText('Join Race')).toBeDefined();
  });
});

describe('RaceLobby', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    render(<RaceLobby />);
    // The loading spinner should be present
    expect(screen.getByText('0 races waiting for players')).toBeDefined();
  });

  it('should show empty state when no races exist', () => {
    mockUseSWR.mockReturnValue({
      data: { races: [] },
      error: undefined,
      isLoading: false,
    });

    render(<RaceLobby />);

    expect(screen.getByText('No active races')).toBeDefined();
    expect(
      screen.getByText(
        'Be the first to create a race and challenge other developers!'
      )
    ).toBeDefined();
  });

  it('should show error state', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: new Error('Failed'),
      isLoading: false,
    });

    render(<RaceLobby />);

    expect(
      screen.getByText('Failed to load races. Please try again.')
    ).toBeDefined();
  });

  it('should render race cards when races exist', () => {
    const mockRaces = [
      {
        id: 1,
        status: 'waiting',
        maxPlayers: 4,
        createdAt: new Date().toISOString(),
        startedAt: null,
        challenge: {
          id: 1,
          content: 'git status',
          difficulty: 'beginner',
          syntaxType: 'git',
        },
        category: {
          id: 1,
          name: 'Git Basics',
          slug: 'git-basics',
          icon: 'git-branch',
        },
        participantCount: 1,
      },
    ];

    mockUseSWR.mockReturnValue({
      data: { races: mockRaces },
      error: undefined,
      isLoading: false,
    });

    render(<RaceLobby />);

    expect(screen.getByText('1 race waiting for players')).toBeDefined();
    expect(screen.getByText('Git Basics')).toBeDefined();
  });

  it('should show Create Race button', () => {
    mockUseSWR.mockReturnValue({
      data: { races: [] },
      error: undefined,
      isLoading: false,
    });

    render(<RaceLobby />);

    // There are two Create Race buttons (one in action bar, one in empty state)
    const buttons = screen.getAllByText('Create Race');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});

describe('CreateRaceDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when closed', () => {
    render(
      <CreateRaceDialog
        open={false}
        onOpenChange={vi.fn()}
        onCreated={vi.fn()}
      />
    );

    expect(screen.queryByText('Create a Race')).toBeNull();
  });

  it('should render dialog when open', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ categories: [] }),
    });

    render(
      <CreateRaceDialog
        open={true}
        onOpenChange={vi.fn()}
        onCreated={vi.fn()}
      />
    );

    expect(screen.getByText('Create a Race')).toBeDefined();
    expect(screen.getByText('Cancel')).toBeDefined();
    expect(screen.getByText('Create Race')).toBeDefined();
  });

  it('should fetch categories when opened', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          categories: [
            { id: 1, name: 'Git Basics', slug: 'git-basics', challengeCount: 10 },
          ],
        }),
    });

    render(
      <CreateRaceDialog
        open={true}
        onOpenChange={vi.fn()}
        onCreated={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/categories?includeProgress=false'
      );
    });
  });

  it('should call onOpenChange when Cancel is clicked', () => {
    const onOpenChange = vi.fn();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ categories: [] }),
    });

    render(
      <CreateRaceDialog
        open={true}
        onOpenChange={onOpenChange}
        onCreated={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
