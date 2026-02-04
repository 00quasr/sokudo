/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/queries', () => ({
  getRaceHistory: vi.fn(),
}));

import { getRaceHistory } from '@/lib/db/queries';
import RacesPage from '../page';

const now = new Date();

function makeParticipation({
  id = 1,
  raceId = 1,
  userId = 10,
  wpm = 85,
  accuracy = 97,
  rank = 1,
  finishedAt = new Date(now.getTime() - 60000).toISOString(),
  createdAt = new Date(now.getTime() - 120000).toISOString(),
  categoryName = 'Git Commands',
  difficulty = 'intermediate',
  opponents = [] as Array<{
    id: number;
    userId: number;
    wpm: number | null;
    accuracy: number | null;
    rank: number | null;
    finishedAt: string | null;
    username: string | null;
    name: string | null;
    email: string;
  }>,
}: {
  id?: number;
  raceId?: number;
  userId?: number;
  wpm?: number | null;
  accuracy?: number | null;
  rank?: number | null;
  finishedAt?: string | null;
  createdAt?: string;
  categoryName?: string;
  difficulty?: string;
  opponents?: Array<{
    id: number;
    userId: number;
    wpm: number | null;
    accuracy: number | null;
    rank: number | null;
    finishedAt: string | null;
    username: string | null;
    name: string | null;
    email: string;
  }>;
} = {}) {
  const allParticipants = [
    {
      id,
      raceId,
      userId,
      wpm,
      accuracy,
      rank,
      finishedAt,
      createdAt,
      user: {
        id: userId,
        name: 'Test User',
        email: 'test@test.com',
        username: 'testuser',
      },
    },
    ...opponents.map((o) => ({
      id: o.id,
      raceId,
      userId: o.userId,
      wpm: o.wpm,
      accuracy: o.accuracy,
      rank: o.rank,
      finishedAt: o.finishedAt,
      createdAt,
      user: {
        id: o.userId,
        name: o.name,
        email: o.email,
        username: o.username,
      },
    })),
  ];

  return {
    id,
    raceId,
    userId,
    wpm,
    accuracy,
    rank,
    finishedAt,
    createdAt,
    race: {
      id: raceId,
      status: 'finished',
      challengeId: 1,
      startedAt: new Date(now.getTime() - 120000).toISOString(),
      maxPlayers: 4,
      createdAt,
      updatedAt: createdAt,
      challenge: {
        id: 1,
        categoryId: 1,
        content: 'git add .',
        difficulty,
        syntaxType: 'bash',
        hint: null,
        avgWpm: 60,
        timesCompleted: 10,
        category: {
          id: 1,
          name: categoryName,
          slug: 'git-commands',
          difficulty: 'intermediate',
          isPremium: false,
          displayOrder: 1,
        },
      },
      participants: allParticipants,
    },
  };
}

describe('RacesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the page title', async () => {
    vi.mocked(getRaceHistory).mockResolvedValue([]);

    const page = await RacesPage();
    render(page);

    expect(screen.getByText('Race History')).toBeTruthy();
  });

  it('should render the page description', async () => {
    vi.mocked(getRaceHistory).mockResolvedValue([]);

    const page = await RacesPage();
    render(page);

    expect(
      screen.getByText('Review your past race results and performance')
    ).toBeTruthy();
  });

  it('should show empty state when no races', async () => {
    vi.mocked(getRaceHistory).mockResolvedValue([]);

    const page = await RacesPage();
    render(page);

    expect(screen.getByText('No races yet')).toBeTruthy();
    expect(
      screen.getByText(/Join a race to compete against other typists/)
    ).toBeTruthy();
  });

  it('should display a race with stats', async () => {
    vi.mocked(getRaceHistory).mockResolvedValue([
      makeParticipation({ wpm: 85, accuracy: 97, rank: 1 }),
    ]);

    const page = await RacesPage();
    render(page);

    expect(screen.getByText('Git Commands')).toBeTruthy();
    expect(screen.getByText('intermediate')).toBeTruthy();
    expect(screen.getByText('85')).toBeTruthy();
    expect(screen.getByText('97%')).toBeTruthy();
  });

  it('should display rank badge for 1st place', async () => {
    vi.mocked(getRaceHistory).mockResolvedValue([
      makeParticipation({ rank: 1 }),
    ]);

    const page = await RacesPage();
    render(page);

    expect(screen.getByText('1st')).toBeTruthy();
  });

  it('should display rank badge for 2nd place', async () => {
    vi.mocked(getRaceHistory).mockResolvedValue([
      makeParticipation({ rank: 2 }),
    ]);

    const page = await RacesPage();
    render(page);

    expect(screen.getByText('2nd')).toBeTruthy();
  });

  it('should display rank badge for 3rd place', async () => {
    vi.mocked(getRaceHistory).mockResolvedValue([
      makeParticipation({ rank: 3 }),
    ]);

    const page = await RacesPage();
    render(page);

    expect(screen.getByText('3rd')).toBeTruthy();
  });

  it('should display DNF for unfinished races', async () => {
    vi.mocked(getRaceHistory).mockResolvedValue([
      makeParticipation({
        wpm: null,
        accuracy: null,
        rank: null,
        finishedAt: null,
      }),
    ]);

    const page = await RacesPage();
    render(page);

    expect(screen.getByText('DNF')).toBeTruthy();
    expect(screen.getByText('Did not finish')).toBeTruthy();
  });

  it('should display opponent info', async () => {
    vi.mocked(getRaceHistory).mockResolvedValue([
      makeParticipation({
        opponents: [
          {
            id: 2,
            userId: 20,
            wpm: 72,
            accuracy: 93,
            rank: 2,
            finishedAt: new Date(now.getTime() - 30000).toISOString(),
            username: 'rival',
            name: 'Rival User',
            email: 'rival@test.com',
          },
        ],
      }),
    ]);

    const page = await RacesPage();
    render(page);

    expect(screen.getByText('Opponents:')).toBeTruthy();
    expect(screen.getByText(/rival/)).toBeTruthy();
    expect(screen.getByText('72 WPM')).toBeTruthy();
  });

  it('should display participant count', async () => {
    vi.mocked(getRaceHistory).mockResolvedValue([
      makeParticipation({
        opponents: [
          {
            id: 2,
            userId: 20,
            wpm: 72,
            accuracy: 93,
            rank: 2,
            finishedAt: new Date(now.getTime() - 30000).toISOString(),
            username: 'rival',
            name: 'Rival User',
            email: 'rival@test.com',
          },
        ],
      }),
    ]);

    const page = await RacesPage();
    render(page);

    expect(screen.getByText('2/2 finished')).toBeTruthy();
  });

  it('should handle multiple races', async () => {
    vi.mocked(getRaceHistory).mockResolvedValue([
      makeParticipation({
        id: 1,
        raceId: 1,
        categoryName: 'Git Commands',
        rank: 1,
      }),
      makeParticipation({
        id: 2,
        raceId: 2,
        categoryName: 'Docker Basics',
        rank: 3,
      }),
    ]);

    const page = await RacesPage();
    render(page);

    expect(screen.getByText('Git Commands')).toBeTruthy();
    expect(screen.getByText('Docker Basics')).toBeTruthy();
    expect(screen.getByText('1st')).toBeTruthy();
    expect(screen.getByText('3rd')).toBeTruthy();
  });

  it('should show opponent email prefix when no username or name', async () => {
    vi.mocked(getRaceHistory).mockResolvedValue([
      makeParticipation({
        opponents: [
          {
            id: 2,
            userId: 20,
            wpm: 60,
            accuracy: 90,
            rank: 2,
            finishedAt: new Date(now.getTime() - 30000).toISOString(),
            username: null,
            name: null,
            email: 'anon@example.com',
          },
        ],
      }),
    ]);

    const page = await RacesPage();
    render(page);

    expect(screen.getByText(/anon/)).toBeTruthy();
  });
});
